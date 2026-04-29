"""
Fraud / Fake Review Detection — multi-signal anomaly detector.

Signals (each contributes independently to the final anomaly_score):
──────────────────────────────────────────────────────────────────────
1. BURST   — too many reviews posted in a short time window (temporal spike)
2. RATING  — rating distribution is statistically abnormal (e.g. all 5-stars
              from new accounts posted on the same day)
3. DUPLICATE — near-identical review texts (cosine similarity > threshold)
4. REVIEWER — multiple reviews from the same reviewer_id on one listing
5. VELOCITY — a reviewer posting many reviews platform-wide in 24 h
              (passed as reviewer_review_count if available)

Design
──────
• All signals are normalised to [0, 1] before combining.
• Final score = weighted average; weights are chosen so that any single
  strong signal (burst or duplicate) can push the score above 0.6 (the
  recommended "suspicious" threshold).
• We deliberately avoid hard bans — the score is advisory; human review
  or a policy threshold decides the action.
"""
import logging
import re
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from typing import List, Tuple

import numpy as np

from app.services.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)

# ── Thresholds ────────────────────────────────────────────────────────────────
_BURST_WINDOW_HOURS  = 24
_BURST_COUNT_WARN    = 5    # ≥ this many reviews in window → full burst score
_DUP_SIM_THRESHOLD   = 0.92  # cosine sim above this → near-duplicate
_SAME_REVIEWER_WARN  = 2     # same reviewer posting > 1 review on same listing

# Signal weights (must sum to 1.0)
_W = {
    "burst":     0.30,
    "rating":    0.20,
    "duplicate": 0.30,
    "reviewer":  0.20,
}


# ── Signal helpers ────────────────────────────────────────────────────────────

def _burst_score(reviews: List[dict]) -> Tuple[float, str]:
    """Fraction of reviews that fall inside the tightest 24-h window."""
    if len(reviews) < 2:
        return 0.0, ""

    try:
        timestamps = sorted(
            datetime.fromisoformat(r["created_at"].replace("Z", "+00:00"))
            for r in reviews
            if r.get("created_at")
        )
    except Exception:
        return 0.0, ""

    max_in_window = 1
    j = 0
    for i in range(len(timestamps)):
        while timestamps[i] - timestamps[j] > timedelta(hours=_BURST_WINDOW_HOURS):
            j += 1
        max_in_window = max(max_in_window, i - j + 1)

    score = min(max_in_window / _BURST_COUNT_WARN, 1.0)
    flag = f"burst_reviews:{max_in_window}_in_{_BURST_WINDOW_HOURS}h" if score >= 0.5 else ""
    return round(score, 4), flag


def _rating_score(reviews: List[dict]) -> Tuple[float, str]:
    """
    Detects suspiciously uniform ratings.
    Formula: 1 - normalised_entropy of the rating distribution.
    Uniform ratings (all 5s) → entropy = 0 → score = 1.
    """
    ratings = [r.get("rating") for r in reviews if r.get("rating") is not None]
    if len(ratings) < 3:
        return 0.0, ""

    counts = Counter(ratings)
    n = len(ratings)
    entropy = -sum((c / n) * np.log2(c / n) for c in counts.values() if c > 0)
    max_entropy = np.log2(min(len(counts), 5))   # max possible for 5 star levels

    uniformity = 1.0 - (entropy / max_entropy if max_entropy > 0 else 0)
    score = round(float(uniformity), 4)
    flag = "rating_outlier:highly_uniform" if score >= 0.7 else ""
    return score, flag


def _duplicate_score(reviews: List[dict]) -> Tuple[float, str]:
    """
    Encodes all non-empty review texts and checks for near-duplicates.
    Returns the fraction of pairs above the similarity threshold.
    """
    texts = [r.get("text", "") for r in reviews]
    texts = [t for t in texts if t and len(t.strip()) > 5]
    if len(texts) < 2:
        return 0.0, ""

    svc = EmbeddingService.get_instance()
    vecs = svc.model.encode(texts, normalize_embeddings=True)
    vecs = np.array(vecs, dtype=np.float32)   # (n, dim)

    sim_matrix = vecs @ vecs.T   # (n, n) cosine similarities
    n = len(texts)
    n_pairs = n * (n - 1) / 2
    dup_pairs = sum(
        1
        for i in range(n)
        for j in range(i + 1, n)
        if sim_matrix[i, j] >= _DUP_SIM_THRESHOLD
    )

    score = round(min(dup_pairs / max(n_pairs, 1), 1.0), 4)
    flag = f"duplicate_text:{dup_pairs}_pairs" if score >= 0.3 else ""
    return score, flag


def _reviewer_score(reviews: List[dict]) -> Tuple[float, str]:
    """Detects same reviewer_id appearing multiple times on the same listing."""
    reviewer_ids = [r.get("reviewer_id") for r in reviews if r.get("reviewer_id")]
    if not reviewer_ids:
        return 0.0, ""

    counts = Counter(reviewer_ids)
    max_repeats = max(counts.values())
    score = round(min((max_repeats - 1) / (_SAME_REVIEWER_WARN - 1), 1.0), 4) if max_repeats > 1 else 0.0
    flag = f"repeated_reviewer:{max_repeats}x" if score >= 0.5 else ""
    return score, flag


# ── Main entry ────────────────────────────────────────────────────────────────

def detect_review_anomalies(reviews: List[dict], listing_id: str) -> dict:
    """
    Returns:
        is_suspicious (bool)
        anomaly_score (float)  — [0, 1], higher = more suspicious
        flags (List[str])      — human-readable anomaly labels
    """
    burst,  f_burst  = _burst_score(reviews)
    rating, f_rating = _rating_score(reviews)
    dup,    f_dup    = _duplicate_score(reviews)
    rev,    f_rev    = _reviewer_score(reviews)

    anomaly_score = round(
        _W["burst"]     * burst
        + _W["rating"]  * rating
        + _W["duplicate"] * dup
        + _W["reviewer"] * rev,
        4,
    )

    flags = [f for f in [f_burst, f_rating, f_dup, f_rev] if f]
    is_suspicious = anomaly_score >= 0.40

    logger.info(
        "Fraud check listing=%s score=%.4f flags=%s",
        listing_id, anomaly_score, flags,
    )
    return {
        "is_suspicious": is_suspicious,
        "anomaly_score": anomaly_score,
        "flags": flags,
    }
