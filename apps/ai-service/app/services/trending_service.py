"""
Demand / Trending Categories — time-series scoring engine.

Algorithm
─────────
For each category, we compute a *trend score* that combines:

  1. Recency-weighted volume  — views/searches in the window, with
     exponential decay giving more weight to recent days.
  2. Growth rate              — comparison of current window vs. previous
     window of the same length (momentum signal).
  3. Listing supply index     — normalised listing count; high demand
     with low supply indicates a "hot" category.

The final trend_score ∈ [0, 1] is a min-max normalised composite.
growth_rate is returned as a raw percentage so the caller can display
"+42 %" badges on the front end.
"""
import logging
import math
from collections import defaultdict
from datetime import datetime, timedelta
from typing import List, Dict

logger = logging.getLogger(__name__)

_DECAY_LAMBDA = 0.15   # exponential decay rate per day (higher = faster decay)


def _exp_weight(age_days: float) -> float:
    """Exponential decay weight for a data point that is age_days old."""
    return math.exp(-_DECAY_LAMBDA * age_days)


def _parse_date(date_str: str) -> datetime:
    for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%SZ"):
        try:
            return datetime.strptime(date_str[:19], fmt[:len(date_str[:19])])
        except ValueError:
            continue
    raise ValueError(f"Unrecognised date format: {date_str}")


def compute_trending(
    data_points: List[dict],
    top_k: int = 10,
    window_days: int = 7,
) -> List[dict]:
    """
    Parameters
    ----------
    data_points : list of dicts with keys:
        category, date (ISO), view_count, search_count, listing_count
    window_days : size of the "current" window to analyse
    top_k       : how many categories to return

    Returns
    -------
    List of dicts: category, trend_score, growth_rate, avg_daily_views
    """
    if not data_points:
        return []

    now = max(_parse_date(dp["date"]) for dp in data_points)
    current_cutoff = now - timedelta(days=window_days)
    previous_cutoff = current_cutoff - timedelta(days=window_days)

    # Group data points by category
    by_category: Dict[str, List[dict]] = defaultdict(list)
    for dp in data_points:
        by_category[dp["category"]].append(dp)

    scores = []

    for category, points in by_category.items():
        current_pts  = [p for p in points if _parse_date(p["date"]) > current_cutoff]
        previous_pts = [p for p in points if previous_cutoff < _parse_date(p["date"]) <= current_cutoff]

        if not current_pts:
            continue

        # ── 1. Recency-weighted volume ────────────────────────────────
        weighted_volume = 0.0
        for p in current_pts:
            age = (now - _parse_date(p["date"])).days
            w = _exp_weight(age)
            weighted_volume += w * (p.get("view_count", 0) + p.get("search_count", 0))

        avg_daily_views = (
            sum(p.get("view_count", 0) for p in current_pts) / len(current_pts)
        )

        # ── 2. Growth rate ────────────────────────────────────────────
        current_total  = sum(p.get("view_count", 0) + p.get("search_count", 0) for p in current_pts)
        previous_total = sum(p.get("view_count", 0) + p.get("search_count", 0) for p in previous_pts)

        if previous_total > 0:
            growth_rate = (current_total - previous_total) / previous_total * 100
        elif current_total > 0:
            growth_rate = 100.0   # brand-new activity
        else:
            growth_rate = 0.0

        # ── 3. Supply deficit index ───────────────────────────────────
        # More demand than supply → hot market
        avg_listings = (
            sum(p.get("listing_count", 0) for p in current_pts) / len(current_pts)
            if current_pts else 1
        )
        demand_supply_ratio = weighted_volume / max(avg_listings, 1)

        scores.append({
            "category": category,
            "_volume": weighted_volume,
            "_growth": growth_rate,
            "_ds_ratio": demand_supply_ratio,
            "growth_rate": round(growth_rate, 2),
            "avg_daily_views": round(avg_daily_views, 2),
        })

    if not scores:
        return []

    # ── Min-max normalise the three signals ──────────────────────────
    def _norm(key: str) -> None:
        vals = [s[key] for s in scores]
        lo, hi = min(vals), max(vals)
        for s in scores:
            s[key] = (s[key] - lo) / (hi - lo) if hi != lo else 0.5

    _norm("_volume")
    _norm("_growth")
    _norm("_ds_ratio")

    for s in scores:
        s["trend_score"] = round(
            0.45 * s["_volume"]
            + 0.35 * s["_growth"]
            + 0.20 * s["_ds_ratio"],
            4,
        )

    # Sort and return top-k
    top = sorted(scores, key=lambda x: x["trend_score"], reverse=True)[:top_k]

    return [
        {
            "category":       s["category"],
            "trend_score":    s["trend_score"],
            "growth_rate":    s["growth_rate"],
            "avg_daily_views": s["avg_daily_views"],
        }
        for s in top
    ]
