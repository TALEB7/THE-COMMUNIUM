import logging
from fastapi import APIRouter, HTTPException

from app.models.schemas import ReviewAnomalyRequest, ReviewAnomalyResponse
from app.services.fraud_detection_service import detect_review_anomalies

router = APIRouter(prefix="/fraud", tags=["fraud"])
logger = logging.getLogger(__name__)


@router.post("/reviews", response_model=ReviewAnomalyResponse)
async def detect_review_fraud(req: ReviewAnomalyRequest):
    """
    Multi-signal fake review detector.

    Checks for:
    - Temporal burst (many reviews in 24 h)
    - Suspiciously uniform rating distribution
    - Near-duplicate review texts (embedding cosine > 0.92)
    - Same reviewer posting multiple times on the same listing

    Each review dict should contain:
      text, rating, reviewer_id, created_at (ISO string), listing_id
    """
    try:
        result = detect_review_anomalies(req.reviews, req.listing_id)
        return ReviewAnomalyResponse(**result)
    except Exception as e:
        logger.error("Fraud detection failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
