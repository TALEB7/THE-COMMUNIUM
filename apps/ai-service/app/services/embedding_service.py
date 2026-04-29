import logging
from sentence_transformers import SentenceTransformer
from app.config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    _instance = None

    def __init__(self):
        logger.info(f"Loading model: {settings.model_name}")
        self.model = SentenceTransformer(settings.model_name)
        self.model_name = settings.model_name
        logger.info("Model loaded successfully")

    @classmethod
    def get_instance(cls) -> "EmbeddingService":
        if cls._instance is None:
            cls._instance = EmbeddingService()
        return cls._instance

    def encode_listing(
        self, title: str, description: str, tags: list, category: str = ""
    ) -> list:
        parts = [title, description]
        if category:
            parts.append(category)
        if tags:
            parts.append(" ".join(tags))
        text = ". ".join(filter(None, parts))
        vector = self.model.encode(text, normalize_embeddings=True)
        return vector.tolist()

    def encode_mentor(
        self, headline: str, bio: str, expertise: list, industries: list
    ) -> list:
        parts = []
        if headline:
            parts.append(headline)
        if bio:
            parts.append(bio)
        if expertise:
            parts.append("Expertises: " + ", ".join(expertise))
        if industries:
            parts.append("Industries: " + ", ".join(industries))
        text = ". ".join(filter(None, parts)) or "mentor"
        vector = self.model.encode(text, normalize_embeddings=True)
        return vector.tolist()
