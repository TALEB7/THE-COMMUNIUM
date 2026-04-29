from fastapi import APIRouter
from app.models.schemas import SimilarListingsRequest, SimilarListingsResponse, SimilarItem
from app.services.similarity_service import find_top_k_similar

router = APIRouter(prefix="/similarity", tags=["similarity"])


@router.post("/listings", response_model=SimilarListingsResponse)
async def find_similar_listings(req: SimilarListingsRequest):
    candidates = [
        {"id": c.listing_id, "embedding": c.embedding}
        for c in req.candidate_embeddings
    ]
    results = find_top_k_similar(
        query_embedding=req.query_embedding,
        candidates=candidates,
        top_k=req.top_k,
        exclude_id=req.listing_id,
    )
    return SimilarListingsResponse(
        listing_id=req.listing_id,
        similar=[SimilarItem(id=r["id"], score=r["score"]) for r in results],
    )
