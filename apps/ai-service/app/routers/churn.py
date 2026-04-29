import logging
from fastapi import APIRouter, HTTPException

from app.models.schemas import ChurnPredictionRequest, ChurnPredictionResponse, ChurnUserResult
from app.services.churn_service import score_users

router = APIRouter(prefix="/churn", tags=["churn"])
logger = logging.getLogger(__name__)


@router.post("/predict", response_model=ChurnPredictionResponse)
async def predict_churn(req: ChurnPredictionRequest):
    """
    RFM-based churn prediction for a batch of users.

    The caller (NestJS) should pre-aggregate per-user activity metrics
    from UserActivity + TksTransaction + Membership tables before calling
    this endpoint.

    Returns a risk level (HIGH / MEDIUM / LOW) and targeted re-engagement
    action recommendations for each user, plus aggregate risk counts.
    """
    if not req.users:
        return ChurnPredictionResponse(
            predictions=[], high_risk_count=0, medium_risk_count=0, low_risk_count=0
        )
    if len(req.users) > 500:
        raise HTTPException(status_code=422, detail="Maximum 500 users per batch")
    try:
        raw = score_users([u.model_dump() for u in req.users])
        predictions = [ChurnUserResult(**r) for r in raw]
        return ChurnPredictionResponse(
            predictions=predictions,
            high_risk_count=sum(1 for p in predictions if p.risk_level == "HIGH"),
            medium_risk_count=sum(1 for p in predictions if p.risk_level == "MEDIUM"),
            low_risk_count=sum(1 for p in predictions if p.risk_level == "LOW"),
        )
    except Exception as e:
        logger.error("Churn prediction failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
