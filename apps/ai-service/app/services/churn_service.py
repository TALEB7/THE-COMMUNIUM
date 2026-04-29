"""
Churn Prediction — RFM-based statistical scoring model.

Framework: Recency–Frequency–Monetary (RFM) adapted for a community platform.
─────────────────────────────────────────────────────────────────────────────
R  Recency    — days since last activity (high → at risk)
F  Frequency  — number of actions in the last 30 days (low → at risk)
M  Monetary   — platform value signals: listings, sessions, Tks spent
   + tenure   — account age bonus (long-term users churn less)

Scoring
───────
Each dimension is scored 1–5 (5 = healthy, 1 = at risk).
The raw churn score is a weighted inverse of the RFM score:
    churn_score = 1 - normalised_rfm

Risk segments:
    HIGH   → churn_score ≥ 0.65
    MEDIUM → 0.35 ≤ churn_score < 0.65
    LOW    → churn_score < 0.35

Recommended actions are derived from the weakest dimension so that
re-engagement campaigns can be targeted precisely.
"""
import logging
import math
from typing import List

logger = logging.getLogger(__name__)


def _compute_clv(
    monthly_revenue: float,
    churn_score: float,
    annual_discount_rate: float = 0.10,
) -> float:
    """
    Customer Lifetime Value using a DCF (Discounted Cash Flow) model.

    Formula (BG/NBD-inspired simplified version):
        monthly_churn    = 1 - (1 - churn_score)^(1/12)
        retention_rate   = 1 - monthly_churn
        monthly_discount = (1 + annual_discount_rate)^(1/12) - 1
        CLV = monthly_revenue × retention_rate / (1 - retention_rate + monthly_discount)

    Intuition:
        A user with churn_score=0.9 (HIGH risk) will likely leave next month →
        CLV ≈ 1 month of revenue.
        A user with churn_score=0.1 (LOW risk) stays for years →
        CLV ≈ many months of revenue, discounted to present value.

    Reference: Fader, Hardie & Lee (2005) — "RFM and CLV: Using Iso-value Curves
               for Customer Base Analysis"
    """
    if monthly_revenue <= 0 or churn_score >= 1.0:
        return 0.0

    monthly_churn    = 1.0 - (1.0 - min(churn_score, 0.999)) ** (1.0 / 12.0)
    retention_rate   = 1.0 - monthly_churn
    monthly_discount = (1.0 + annual_discount_rate) ** (1.0 / 12.0) - 1.0
    denom            = 1.0 - retention_rate + monthly_discount

    clv = monthly_revenue * retention_rate / max(denom, 1e-9)
    return round(max(clv, 0.0), 2)

# Weights (must sum to 1.0)
_W = {"recency": 0.40, "frequency": 0.30, "monetary": 0.20, "tenure": 0.10}

# Benchmarks (tunable from observed platform data)
_RECENCY_THRESHOLDS = [3, 7, 14, 30]   # days — boundaries for scores 5→1
_FREQ_THRESHOLDS    = [20, 10, 5, 2]   # actions in 30d — boundaries for 5→1
_MONETARY_MAX       = 10               # max "monetary" events to consider (cap)
_TENURE_MAX_DAYS    = 365              # account age at which tenure bonus is max


def _recency_score(days_since_last: float) -> int:
    for threshold, score in zip(_RECENCY_THRESHOLDS, [5, 4, 3, 2]):
        if days_since_last <= threshold:
            return score
    return 1


def _frequency_score(action_count_30d: int) -> int:
    for threshold, score in zip(_FREQ_THRESHOLDS, [5, 4, 3, 2]):
        if action_count_30d >= threshold:
            return score
    return 1


def _monetary_score(
    listing_count: int,
    session_count: int,
    tks_spent: float,
) -> int:
    """Combine platform engagement signals into a 1–5 score."""
    events = listing_count + session_count + math.log1p(tks_spent / 10)
    capped = min(events, _MONETARY_MAX)
    # Map [0, _MONETARY_MAX] → [1, 5]
    return max(1, round(1 + (capped / _MONETARY_MAX) * 4))


def _tenure_score(account_age_days: int) -> int:
    ratio = min(account_age_days / _TENURE_MAX_DAYS, 1.0)
    return max(1, round(1 + ratio * 4))


def _recommended_actions(r: int, f: int, m: int) -> List[str]:
    """Return 1–3 targeted re-engagement suggestions based on weakest signal."""
    actions = []
    if r <= 2:
        actions.append("send_re_engagement_email")
        actions.append("push_notification_new_content")
    if f <= 2:
        actions.append("suggest_forum_or_event")
        actions.append("highlight_new_listings")
    if m <= 2:
        actions.append("offer_tks_bonus")
        actions.append("promote_mentor_session")
    return list(dict.fromkeys(actions))[:3]   # deduplicate, cap at 3


def score_users(users: List[dict]) -> List[dict]:
    """
    Parameters (each user dict):
        user_id              : str
        days_since_last      : float  — days since last activity
        action_count_30d     : int    — actions in the past 30 days
        listing_count        : int
        session_count        : int    — mentorship sessions
        tks_spent            : float  — tokens spent lifetime
        account_age_days     : int
        membership_active    : bool
        monthly_tks_spent    : float  — avg monthly Tks spend (for CLV)
        membership_revenue   : float  — monthly membership value in currency (for CLV)

    Returns list of dicts with: user_id, churn_score, risk_level,
    rfm_recency, rfm_frequency, rfm_monetary, recommended_actions,
    clv_estimate, clv_tier
    """
    results = []
    for u in users:
        r = _recency_score(u.get("days_since_last", 999))
        f = _frequency_score(u.get("action_count_30d", 0))
        m = _monetary_score(
            u.get("listing_count", 0),
            u.get("session_count", 0),
            u.get("tks_spent", 0.0),
        )
        t = _tenure_score(u.get("account_age_days", 0))

        # Membership bonus: active membership reduces churn risk
        membership_bonus = 0.5 if u.get("membership_active", False) else 0.0

        # Weighted RFM score [1, 5] + tenure + membership bonus
        rfm_raw = (
            _W["recency"]   * r
            + _W["frequency"] * f
            + _W["monetary"]  * m
            + _W["tenure"]    * t
        ) + membership_bonus

        # Normalise to [0, 1]: max possible = 5 + 0.5 bonus
        rfm_normalised = rfm_raw / 5.5
        churn_score = round(1.0 - rfm_normalised, 4)
        churn_score = max(0.0, min(1.0, churn_score))

        if churn_score >= 0.65:
            risk_level = "HIGH"
        elif churn_score >= 0.35:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        actions = _recommended_actions(r, f, m)

        logger.debug(
            "Churn user=%s R=%d F=%d M=%d T=%d score=%.4f risk=%s",
            u.get("user_id", "?"), r, f, m, t, churn_score, risk_level,
        )

        # CLV calculation
        monthly_revenue = u.get("monthly_tks_spent", 0.0) + u.get("membership_revenue", 0.0)
        clv_estimate = _compute_clv(monthly_revenue, churn_score)
        if clv_estimate >= 100:
            clv_tier = "HIGH"
        elif clv_estimate >= 20:
            clv_tier = "MEDIUM"
        else:
            clv_tier = "LOW"

        results.append({
            "user_id":             u.get("user_id"),
            "churn_score":         churn_score,
            "risk_level":          risk_level,
            "rfm_recency":         r,
            "rfm_frequency":       f,
            "rfm_monetary":        m,
            "recommended_actions": actions,
            "clv_estimate":        clv_estimate,
            "clv_tier":            clv_tier,
        })

    return results
