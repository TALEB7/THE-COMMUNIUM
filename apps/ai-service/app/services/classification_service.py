"""
NLP Listing Classification — zero-shot category matching + keyword tag extraction.

Strategy
────────
• Category classification: encode the listing text AND each category label
  with the same sentence-transformer, then pick the label whose embedding
  has the highest cosine similarity to the listing embedding.
  This is zero-shot — no labelled training data required.

• Tag extraction: lightweight TF-IDF-inspired noun-phrase extractor using
  only the Python standard library (no spaCy / NLTK download needed at
  startup).  Works on French, Arabic, and English via the multilingual model.

• Urgency scoring: heuristic keyword scan for urgency signals in the text.
"""
import logging
import re
import math
from collections import Counter
from typing import List, Optional, Tuple

import numpy as np

from app.services.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)

# Urgency signal words (French + English + Arabic transliteration)
_URGENCY_HIGH = {
    "urgent", "urgente", "immédiatement", "immediately", "asap",
    "aujourd'hui", "today", "rapidement", "vite", "flash",
    "عاجل", "سريع",
}
_URGENCY_MEDIUM = {
    "bientôt", "soon", "cette semaine", "this week", "prochainement",
    "قريب",
}

# French stopwords (minimal set for tag filtering)
_STOPWORDS = {
    "le", "la", "les", "un", "une", "des", "du", "de", "et", "en",
    "pour", "sur", "dans", "avec", "par", "au", "aux", "ce", "se",
    "que", "qui", "est", "son", "sa", "ses", "à", "je", "tu", "il",
    "elle", "nous", "vous", "ils", "elles", "on", "ne", "pas", "plus",
    "très", "bien", "or", "the", "a", "an", "of", "in", "to", "is",
    "and", "for", "with", "at", "by", "this", "that", "it",
}


def _cosine(a: np.ndarray, b: np.ndarray) -> float:
    dot = float(np.dot(a, b))
    # Vectors are already L2-normalised by the model
    return dot


def _tokenize(text: str) -> List[str]:
    """Lowercase, strip punctuation, split on whitespace."""
    text = text.lower()
    text = re.sub(r"[^\w\s\u0600-\u06FF]", " ", text)  # keep Arabic chars
    return [t for t in text.split() if len(t) >= 3 and t not in _STOPWORDS]


def _extract_tags(title: str, description: str, top_n: int = 6) -> List[str]:
    """
    Simple TF-IDF-inspired tag extraction.
    Combines title (higher weight) and description tokens, scores by TF,
    returns top-n unique tokens.
    """
    title_tokens = _tokenize(title) * 3     # boost title terms
    desc_tokens  = _tokenize(description)
    all_tokens   = title_tokens + desc_tokens

    if not all_tokens:
        return []

    freq = Counter(all_tokens)
    total = sum(freq.values())

    # TF score — normalise by document length
    tf_scores = {tok: count / total for tok, count in freq.items()}

    ranked = sorted(tf_scores, key=tf_scores.get, reverse=True)
    # Deduplicate preserving order
    seen, tags = set(), []
    for tok in ranked:
        if tok not in seen:
            seen.add(tok)
            tags.append(tok)
        if len(tags) >= top_n:
            break
    return tags


def _detect_urgency(text: str) -> str:
    lower = text.lower()
    words = set(lower.split())
    if words & _URGENCY_HIGH:
        return "HIGH"
    if words & _URGENCY_MEDIUM:
        return "MEDIUM"
    return "LOW"


def classify_listing(
    title: str,
    description: str,
    available_categories: List[str],
) -> dict:
    """
    Returns:
        predicted_category (str): best-matching category name
        confidence (float): cosine similarity to that category [0, 1]
        suggested_tags (List[str]): up to 6 extracted keywords
        urgency (str): LOW | MEDIUM | HIGH
    """
    if not available_categories:
        return {
            "predicted_category": "",
            "confidence": 0.0,
            "suggested_tags": _extract_tags(title, description),
            "urgency": _detect_urgency(f"{title} {description}"),
        }

    svc = EmbeddingService.get_instance()

    # Encode listing text (title weighted 3×)
    listing_text = f"{title}. {title}. {title}. {description}"
    listing_vec = np.array(
        svc.model.encode(listing_text, normalize_embeddings=True),
        dtype=np.float32,
    )

    # Encode each category label
    category_vecs = np.array(
        svc.model.encode(available_categories, normalize_embeddings=True),
        dtype=np.float32,
    )  # shape: (n_categories, dim)

    # Cosine similarities (vectors are unit-norm)
    similarities = category_vecs @ listing_vec   # shape: (n_categories,)

    best_idx = int(np.argmax(similarities))
    best_score = float(similarities[best_idx])

    predicted_category = available_categories[best_idx]
    # Scale to a more interpretable confidence (cos sim in multilingual models
    # is typically 0.3–0.95 for related content)
    confidence = round(min(max(best_score, 0.0), 1.0), 4)

    tags = _extract_tags(title, description)
    urgency = _detect_urgency(f"{title} {description}")

    logger.info(
        "Classification: '%s' → '%s' (conf=%.3f, tags=%s, urgency=%s)",
        title[:40], predicted_category, confidence, tags, urgency,
    )
    return {
        "predicted_category": predicted_category,
        "confidence": confidence,
        "suggested_tags": tags,
        "urgency": urgency,
    }
