import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException

from app.models.schemas import TrendingRequest, TrendingResponse, TrendingCategory
from app.services.trending_service import compute_trending

router = APIRouter(prefix="/trending", tags=["trending"])
logger = logging.getLogger(__name__)


@router.post("/categories", response_model=TrendingResponse)
async def get_trending_categories(req: TrendingRequest):
    """
    Compute trending categories from aggregated activity data.

    The caller (NestJS) should pre-aggregate UserActivity rows into
    per-category daily view/search/listing counts before calling this
    endpoint.  The service applies exponential time-decay, growth-rate
    momentum, and a demand-supply index to produce a final trend score.
    """
    try:
        raw = [dp.model_dump() for dp in req.data_points]
        results = compute_trending(raw, top_k=req.top_k, window_days=req.window_days)
        return TrendingResponse(
            trending=[TrendingCategory(**r) for r in results],
            computed_at=datetime.utcnow().isoformat() + "Z",
        )
    except Exception as e:
        logger.error("Trending computation failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
