import logging
from fastapi import APIRouter, HTTPException

from app.models.schemas import MentorMatchRequest, MentorMatchResponse
from app.services.mentor_matching_service import rank_mentors

router = APIRouter(prefix="/mentors", tags=["mentors"])
logger = logging.getLogger(__name__)


@router.post("/match", response_model=MentorMatchResponse)
async def match_mentors(req: MentorMatchRequest):
    """
    Hybrid mentor ranking.

    Accepts a pre-computed mentee query embedding (built server-side from
    the mentee's interests/goals text) and a pool of mentor candidates with
    their embeddings + quality signals.

    Returns the top-k mentors sorted by a composite score that blends
    semantic similarity, rating, experience, and proven track record.
    """
    try:
        matches = rank_mentors(
            query_embedding=req.query_embedding,
            candidates=req.candidates,
            top_k=req.top_k,
            w_semantic=req.w_semantic,
            w_rating=req.w_rating,
            w_experience=req.w_experience,
            w_sessions=req.w_sessions,
        )
        return MentorMatchResponse(matches=matches)
    except Exception as e:
        logger.error("Mentor matching failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
