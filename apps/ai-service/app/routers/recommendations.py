import logging
from fastapi import APIRouter, HTTPException

from app.models.schemas import RecommendationRequest, RecommendationResponse, RecommendationItem
from app.services.recommendation_service import recommend_for_user

router = APIRouter(prefix="/recommendations", tags=["recommendations"])
logger = logging.getLogger(__name__)


@router.post("/listings", response_model=RecommendationResponse)
async def get_listing_recommendations(req: RecommendationRequest):
    """
    Personalized listing recommendations using Maximal Marginal Relevance (MMR).

    The caller (NestJS) must:
    1. Compute the user's taste vector (centroid of their favorited/viewed listing embeddings)
    2. Pass all candidate listing embeddings (active listings the user hasn't seen)

    MMR balances relevance (similarity to the user's taste) and diversity
    (avoiding redundant results). diversity_lambda=0.3 means 70% relevance,
    30% diversity — tunable per use case.
    """
    if not req.candidates:
        return RecommendationResponse(recommendations=[])
    if len(req.candidates) > 2000:
        raise HTTPException(status_code=422, detail="Maximum 2000 candidates per request")
    try:
        raw = recommend_for_user(
            user_embedding=req.user_embedding,
            candidates=[c.model_dump() for c in req.candidates],
            top_k=req.top_k,
            diversity_lambda=req.diversity_lambda,
        )
        return RecommendationResponse(
            recommendations=[RecommendationItem(**r) for r in raw]
        )
    except Exception as e:
        logger.error("Recommendation failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
