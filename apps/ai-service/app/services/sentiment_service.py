"""
Sentiment Analysis — multilingual lexicon + embedding hybrid.

Two-tier approach:
  1. Lexicon pass: a curated French/English/Arabic word list maps tokens to
     polarity scores in [-1, +1].  Fast, interpretable, zero latency.
  2. Embedding fallback: for texts where the lexicon fires on <2 tokens
     (e.g. very short reviews, Arabic-heavy text), we use the cosine
     distance between the review embedding and "positive" / "negative"
     anchor embeddings to determine polarity.

Output per text:
  label    — POSITIVE | NEGATIVE | NEUTRAL
  score    — confidence in that label [0, 1]
  compound — aggregate polarity [-1, 1]  (VADER-compatible)
"""
import logging
import re
import statistics
from typing import List, Dict, Tuple

import numpy as np

from app.services.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)

# ── Lexicons (French-first, English, Arabic) ──────────────────────────────────
# Format: token → polarity score  (positive > 0, negative < 0)
_LEXICON: Dict[str, float] = {
    # Positive — French
    "excellent": 0.9, "parfait": 0.85, "super": 0.75, "génial": 0.8,
    "très bien": 0.7, "bien": 0.5, "bon": 0.5, "bonne": 0.5,
    "rapide": 0.4, "sérieux": 0.45, "professionnel": 0.6,
    "conforme": 0.55, "satisfait": 0.65, "recommande": 0.7,
    "merci": 0.2, "top": 0.75, "nickel": 0.8, "impeccable": 0.85,
    "agréable": 0.5, "fiable": 0.6, "honnête": 0.55,
    # Positive — English
    "great": 0.8, "good": 0.5, "excellent": 0.9, "perfect": 0.9,
    "amazing": 0.85, "fast": 0.4, "reliable": 0.6, "recommended": 0.7,
    "happy": 0.65, "satisfied": 0.65, "honest": 0.55,
    # Positive — Arabic
    "ممتاز": 0.9, "رائع": 0.85, "جيد": 0.5, "شكرا": 0.2,
    "موثوق": 0.6, "سريع": 0.4, "مرضي": 0.65,
    # Negative — French
    "mauvais": -0.7, "nul": -0.8, "terrible": -0.85, "décevant": -0.7,
    "déçu": -0.65, "problème": -0.4, "retard": -0.35, "lent": -0.3,
    "cassé": -0.6, "faux": -0.7, "arnaque": -0.9, "escroquerie": -0.95,
    "menteur": -0.8, "incompétent": -0.75, "dangereux": -0.8,
    "pas conforme": -0.65, "pas reçu": -0.5, "inutile": -0.55,
    # Negative — English
    "bad": -0.7, "terrible": -0.85, "awful": -0.8, "disappointing": -0.65,
    "broken": -0.6, "fake": -0.7, "scam": -0.95, "fraud": -0.9,
    "slow": -0.3, "useless": -0.55, "liar": -0.8,
    # Negative — Arabic
    "سيء": -0.7, "رهيب": -0.85, "احتيال": -0.9, "كذب": -0.8,
    "بطيء": -0.3, "مكسور": -0.6, "مزيف": -0.7,
}

# Negation words flip the sign of the next scored token
_NEGATIONS = {"pas", "non", "jamais", "aucun", "not", "never", "no", "لا", "ليس"}

# Intensifiers amplify the absolute value
_INTENSIFIERS = {
    "très": 1.4, "trop": 1.3, "vraiment": 1.3, "extrêmement": 1.5,
    "super": 1.2, "absolument": 1.4,
    "very": 1.4, "extremely": 1.5, "really": 1.3, "totally": 1.4,
    "جداً": 1.4,
}

# Anchor sentences for the embedding fallback
_POS_ANCHOR = "Excellent produit, très satisfait, je recommande vivement"
_NEG_ANCHOR = "Très déçu, mauvaise qualité, arnaque, ne pas acheter"

_THRESHOLD_COMPOUND = 0.05   # |compound| below this → NEUTRAL


def _lexicon_score(text: str) -> Tuple[float, int]:
    """
    Returns (compound, n_hits) where compound ∈ [-1, 1].
    n_hits counts how many lexicon tokens fired.
    """
    text_lower = text.lower()
    tokens = re.split(r"\s+", text_lower)
    scores = []
    negate = False
    amplify = 1.0

    for i, tok in enumerate(tokens):
        # Check intensifiers
        if tok in _INTENSIFIERS:
            amplify = _INTENSIFIERS[tok]
            continue
        # Check negations
        if tok in _NEGATIONS:
            negate = True
            continue
        # Check multi-word expressions first (2-gram)
        bigram = f"{tokens[i-1]} {tok}" if i > 0 else ""
        val = _LEXICON.get(bigram) or _LEXICON.get(tok)
        if val is not None:
            val *= amplify
            if negate:
                val = -val
            scores.append(val)
            negate = False
            amplify = 1.0
        else:
            negate = False
            amplify = 1.0

    if not scores:
        return 0.0, 0

    # VADER-style normalisation: sum / sqrt(sum^2 + alpha)
    raw_sum = sum(scores)
    alpha = 15
    compound = raw_sum / (raw_sum ** 2 + alpha) ** 0.5
    return round(float(compound), 4), len(scores)


def _embedding_score(text: str) -> float:
    """
    Fallback: cosine similarity to positive anchor minus cosine to negative anchor.
    Returns a compound-like float in approximately [-1, 1].
    """
    svc = EmbeddingService.get_instance()
    vecs = svc.model.encode([text, _POS_ANCHOR, _NEG_ANCHOR], normalize_embeddings=True)
    review_vec, pos_vec, neg_vec = vecs[0], vecs[1], vecs[2]
    pos_sim = float(np.dot(review_vec, pos_vec))
    neg_sim = float(np.dot(review_vec, neg_vec))
    return round(pos_sim - neg_sim, 4)


def analyze_sentiment(texts: List[str]) -> List[dict]:
    results = []
    for text in texts:
        compound, n_hits = _lexicon_score(text)

        if n_hits < 2:
            # Lexicon didn't fire — use embedding fallback
            compound = _embedding_score(text)
            method = "embedding"
        else:
            method = "lexicon"

        # Label + confidence
        if compound >= _THRESHOLD_COMPOUND:
            label = "POSITIVE"
            score = round(min((compound + 1) / 2, 1.0), 4)
        elif compound <= -_THRESHOLD_COMPOUND:
            label = "NEGATIVE"
            score = round(min((-compound + 1) / 2, 1.0), 4)
        else:
            label = "NEUTRAL"
            score = round(1.0 - abs(compound) / _THRESHOLD_COMPOUND * 0.5, 4)

        logger.debug("Sentiment '%s...' → %s %.4f (method=%s)", text[:30], label, compound, method)
        results.append({"text": text, "label": label, "score": score, "compound": compound})

    return results
