import logging
from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    EmbedListingRequest,
    EmbedMentorRequest,
    EmbeddingResponse,
)
from app.services.embedding_service import EmbeddingService

router = APIRouter(prefix="/embeddings", tags=["embeddings"])
logger = logging.getLogger(__name__)


@router.post("/listing", response_model=EmbeddingResponse)
async def embed_listing(req: EmbedListingRequest):
    try:
        service = EmbeddingService.get_instance()
        vector = service.encode_listing(
            title=req.title,
            description=req.description,
            tags=req.tags,
            category=req.category or "",
        )
        return EmbeddingResponse(
            id=req.listing_id,
            embedding=vector,
            model=service.model_name,
            dimensions=len(vector),
        )
    except Exception as e:
        logger.error(f"Embedding error for listing {req.listing_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/mentor", response_model=EmbeddingResponse)
async def embed_mentor(req: EmbedMentorRequest):
    try:
        service = EmbeddingService.get_instance()
        vector = service.encode_mentor(
            headline=req.headline or "",
            bio=req.bio or "",
            expertise=req.expertise,
            industries=req.industries,
        )
        return EmbeddingResponse(
            id=req.mentor_profile_id,
            embedding=vector,
            model=service.model_name,
            dimensions=len(vector),
        )
    except Exception as e:
        logger.error(f"Embedding error for mentor {req.mentor_profile_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
