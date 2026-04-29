import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException

from app.models.schemas import EtaRequest, EtaResponse
from app.services.eta_service import predict_eta

router = APIRouter(prefix="/eta", tags=["eta"])
logger = logging.getLogger(__name__)


@router.post("/predict", response_model=EtaResponse)
async def predict_delivery_eta(req: EtaRequest):
    """
    Predict delivery / fulfilment ETA for a marketplace listing.

    Inputs are the features a seller/platform has at listing-creation time:
    category, city, condition, seller activity history, and current time.

    The model applies a feature-engineered regression (city tier ×
    category speed × condition × seller experience × time-of-day)
    calibrated to Moroccan logistics patterns.

    Returns:
      - eta_minutes  — canonical prediction in minutes
      - eta_hours    — human-readable float
      - eta_days     — ceiled days (for UI badges)
      - confidence   — model confidence [0–1]
      - breakdown    — per-factor explanation
    """
    try:
        now = datetime.utcnow()
        hour       = req.hour_of_day if req.hour_of_day is not None else now.hour
        dow        = req.day_of_week  if req.day_of_week  is not None else now.weekday()

        result = predict_eta(
            category_name        = req.category_name,
            seller_city          = req.seller_city,
            buyer_city           = req.buyer_city,
            condition            = req.condition,
            seller_listing_count = req.seller_listing_count,
            hour_of_day          = hour,
            day_of_week          = dow,
        )
        return EtaResponse(**result)
    except Exception as e:
        logger.error("ETA prediction failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
