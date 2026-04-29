"""
Price Anomaly Detection — Z-score + Modified Z-score (MAD-based).

Why two methods?
────────────────
Standard Z-score is sensitive to outliers — if 3 listings are at 100 DH
and one is at 10 000 DH, the mean and stdev are pulled toward the outlier,
making the 100 DH items look suspicious when they're actually the majority.

Modified Z-score uses the Median Absolute Deviation (MAD) — a robust
estimator that is not affected by outliers:

    MAD = median(|xi - median(X)|)
    modified_z = 0.6745 × (price - median) / MAD

The constant 0.6745 = 1 / Φ⁻¹(0.75) makes MAD equivalent to stdev
for a normal distribution, so the same threshold (3.5) applies.

We flag as anomaly when EITHER method fires:
  |z| > 2.5       (≈ top/bottom 1.2% under normality)
  |modified_z| > 3.5  (Iglewicz & Hoaglin, 1993 — canonical threshold)

Reference: Iglewicz, B. & Hoaglin, D. (1993).
           "Volume 16: How to Detect and Handle Outliers"
"""
import logging
import statistics
from typing import List

logger = logging.getLogger(__name__)

_MIN_SAMPLES     = 5      # below this we can't trust the statistics
_Z_THRESHOLD     = 2.5
_MODZ_THRESHOLD  = 3.5
_CONFIDENCE_CAP  = 50     # at 50+ samples, confidence = 1.0


def detect_price_anomaly(price: float, comparable_prices: List[float]) -> dict:
    """
    Parameters
    ----------
    price              : the listing price to evaluate
    comparable_prices  : active listings in the same category (excluding the target)

    Returns
    -------
    is_anomaly        (bool)
    z_score           (float)   standard Z-score
    modified_z_score  (float)   MAD-based Z-score
    market_median     (float)
    market_mean       (float)
    direction         (str)     NORMAL | TOO_LOW | TOO_HIGH
    confidence        (float)   [0, 1] — reliability of the estimate
    """
    n = len(comparable_prices)

    if n < _MIN_SAMPLES:
        return {
            "is_anomaly":       False,
            "z_score":          0.0,
            "modified_z_score": 0.0,
            "market_median":    price,
            "market_mean":      price,
            "direction":        "NORMAL",
            "confidence":       round(n / _MIN_SAMPLES, 2),
        }

    mean   = statistics.mean(comparable_prices)
    stdev  = statistics.stdev(comparable_prices)
    median = statistics.median(comparable_prices)
    mad    = statistics.median([abs(p - median) for p in comparable_prices])

    z_score     = (price - mean)   / (stdev + 1e-9)
    modified_z  = 0.6745 * (price - median) / (mad + 1e-9)

    is_anomaly  = abs(modified_z) > _MODZ_THRESHOLD or abs(z_score) > _Z_THRESHOLD
    direction   = ("TOO_LOW" if price < median else "TOO_HIGH") if is_anomaly else "NORMAL"
    confidence  = round(min(n / _CONFIDENCE_CAP, 1.0), 2)

    logger.info(
        "Price anomaly check: price=%.2f median=%.2f mean=%.2f "
        "z=%.4f modz=%.4f anomaly=%s direction=%s n=%d",
        price, median, mean, z_score, modified_z, is_anomaly, direction, n,
    )

    return {
        "is_anomaly":       is_anomaly,
        "z_score":          round(z_score, 4),
        "modified_z_score": round(modified_z, 4),
        "market_median":    round(median, 2),
        "market_mean":      round(mean, 2),
        "direction":        direction,
        "confidence":       confidence,
    }
