import logging
from fastapi import APIRouter, HTTPException

from app.models.schemas import ClassifyListingRequest, ClassifyListingResponse
from app.services.classification_service import classify_listing

router = APIRouter(prefix="/classify", tags=["classification"])
logger = logging.getLogger(__name__)


@router.post("/listing", response_model=ClassifyListingResponse)
async def classify_listing_endpoint(req: ClassifyListingRequest):
    """
    Zero-shot listing classification using the multilingual sentence-transformer.

    Pass the list of your category names in `available_categories` — the
    service picks the best semantic match and also extracts suggested tags
    and an urgency level from the listing text.

    No training data required; the quality improves automatically when you
    provide more specific / descriptive category names.
    """
    try:
        result = classify_listing(
            title=req.title,
            description=req.description,
            available_categories=req.available_categories,
        )
        return ClassifyListingResponse(**result)
    except Exception as e:
        logger.error("Classification failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
