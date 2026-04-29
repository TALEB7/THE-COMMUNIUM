import logging
import statistics
from fastapi import APIRouter, HTTPException

from app.models.schemas import SentimentRequest, SentimentResponse, SentimentResult
from app.services.sentiment_service import analyze_sentiment

router = APIRouter(prefix="/sentiment", tags=["sentiment"])
logger = logging.getLogger(__name__)


@router.post("/analyze", response_model=SentimentResponse)
async def analyze(req: SentimentRequest):
    """
    Batch sentiment analysis for review texts.

    Accepts up to 100 texts per request.  Returns per-text label (POSITIVE /
    NEGATIVE / NEUTRAL), confidence score, and VADER-compatible compound
    value, plus an aggregate average compound for the whole batch.

    Works on French, English, and Arabic without any extra model downloads.
    """
    if not req.texts:
        return SentimentResponse(results=[], avg_compound=0.0)
    if len(req.texts) > 100:
        raise HTTPException(status_code=422, detail="Maximum 100 texts per request")
    try:
        raw = analyze_sentiment(req.texts)
        results = [SentimentResult(**r) for r in raw]
        compounds = [r.compound for r in results]
        avg = round(statistics.mean(compounds), 4) if compounds else 0.0
        return SentimentResponse(results=results, avg_compound=avg)
    except Exception as e:
        logger.error("Sentiment analysis failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
