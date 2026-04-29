"""
Dynamic Price Suggestion — statistical engine.

Two-tier strategy:
  1. If comparable_prices is non-empty (≥3 data points): IQR-filtered
     percentile model with condition adjustment.
  2. Fallback (cold start / no comparables): condition-only heuristic that
     returns a wide confidence band.

Design notes
────────────
• We never hard-code category-specific prices — those belong in the DB.
• Condition multipliers are empirically derived from second-hand market
  research; they can be overridden by the caller.
• The method field lets the caller display "estimated" vs "data-driven"
  to the end user.
"""
import logging
import statistics
from typing import List, Optional, Tuple

logger = logging.getLogger(__name__)

# Condition multipliers relative to "GOOD" baseline (= 1.0)
CONDITION_MULTIPLIERS = {
    "NEW":       1.30,
    "LIKE_NEW":  1.15,
    "GOOD":      1.00,
    "FAIR":      0.78,
    "POOR":      0.55,
}

# Minimum number of data points to trust the statistical path
_MIN_SAMPLES = 3


def _iqr_filter(prices: List[float]) -> List[float]:
    """Remove outliers beyond 1.5 × IQR from Q1/Q3."""
    sorted_p = sorted(prices)
    n = len(sorted_p)
    q1 = sorted_p[n // 4]
    q3 = sorted_p[(3 * n) // 4]
    iqr = q3 - q1
    lo = q1 - 1.5 * iqr
    hi = q3 + 1.5 * iqr
    filtered = [p for p in sorted_p if lo <= p <= hi]
    return filtered if filtered else sorted_p   # safety: never return empty


def _percentile(data: List[float], pct: float) -> float:
    """Linear interpolation percentile (no numpy dependency)."""
    sorted_d = sorted(data)
    n = len(sorted_d)
    if n == 1:
        return sorted_d[0]
    idx = (pct / 100) * (n - 1)
    lo_i = int(idx)
    hi_i = min(lo_i + 1, n - 1)
    frac = idx - lo_i
    return sorted_d[lo_i] * (1 - frac) + sorted_d[hi_i] * frac


def suggest_price(
    condition: str,
    comparable_prices: List[float],
) -> dict:
    """
    Returns a dict with keys: min_price, max_price, recommended_price,
    confidence, method.
    """
    condition = condition.upper()
    multiplier = CONDITION_MULTIPLIERS.get(condition, 1.0)

    # ── Path A: statistical (≥ MIN_SAMPLES comparables) ────────────
    if len(comparable_prices) >= _MIN_SAMPLES:
        clean = _iqr_filter(comparable_prices)

        p20 = _percentile(clean, 20)
        p50 = _percentile(clean, 50)
        p80 = _percentile(clean, 80)

        # Apply condition adjustment to the market range
        min_price  = round(p20 * multiplier, 2)
        recommended = round(p50 * multiplier, 2)
        max_price  = round(p80 * multiplier, 2)

        # Confidence: more data → higher confidence, capped at 0.95
        n = len(clean)
        confidence = round(min(0.95, 0.50 + 0.05 * n), 2)

        # Coefficient of variation as a quality signal
        if len(clean) >= 2:
            cv = statistics.stdev(clean) / (statistics.mean(clean) + 1e-9)
            if cv > 0.5:   # high dispersion → lower confidence
                confidence = round(confidence * 0.8, 2)

        logger.info(
            "Price suggestion (statistical): p20=%.2f p50=%.2f p80=%.2f "
            "condition=%s multiplier=%.2f confidence=%.2f",
            p20, p50, p80, condition, multiplier, confidence,
        )
        return {
            "min_price": max(min_price, 1.0),
            "max_price": max(max_price, min_price + 1),
            "recommended_price": max(recommended, 1.0),
            "confidence": confidence,
            "method": "statistical",
        }

    # ── Path B: heuristic fallback (cold start) ─────────────────────
    # Use the single provided price if any, otherwise return a relative band
    base = comparable_prices[0] if comparable_prices else None

    if base and base > 0:
        adjusted = base * multiplier
        min_price  = round(adjusted * 0.75, 2)
        recommended = round(adjusted, 2)
        max_price  = round(adjusted * 1.25, 2)
        confidence = 0.35
        method = "heuristic_single"
    else:
        # Truly cold — return a structurally valid but low-confidence result
        min_price  = 1.0
        recommended = 1.0
        max_price  = 1.0
        confidence = 0.10
        method = "heuristic_cold"

    logger.info(
        "Price suggestion (heuristic/%s): condition=%s confidence=%.2f",
        method, condition, confidence,
    )
    return {
        "min_price": min_price,
        "max_price": max_price,
        "recommended_price": recommended,
        "confidence": confidence,
        "method": method,
    }
