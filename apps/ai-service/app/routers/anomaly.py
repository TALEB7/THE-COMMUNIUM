import logging
from fastapi import APIRouter, HTTPException

from app.models.schemas import PriceAnomalyRequest, PriceAnomalyResponse
from app.services.price_anomaly_service import detect_price_anomaly

router = APIRouter(prefix="/anomaly", tags=["anomaly"])
logger = logging.getLogger(__name__)


@router.post("/price", response_model=PriceAnomalyResponse)
async def check_price_anomaly(req: PriceAnomalyRequest):
    """
    Detect whether a listing price is a statistical anomaly for its category.

    Uses both standard Z-score and the more robust MAD-based modified Z-score.
    Requires at least 5 comparable prices for a reliable estimate — below that,
    `confidence` will be low and `is_anomaly` will always be False.

    Typical use: call this on listing creation to warn the seller if their
    price is far outside the market range.
    """
    try:
        result = detect_price_anomaly(req.price, req.comparable_prices)
        return PriceAnomalyResponse(**result)
    except Exception as e:
        logger.error("Price anomaly check failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
