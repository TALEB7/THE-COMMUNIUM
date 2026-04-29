import numpy as np
from typing import List


def cosine_similarity(a: List[float], b: List[float]) -> float:
    """Cosine similarity between two pre-normalized vectors."""
    va = np.array(a, dtype=np.float32)
    vb = np.array(b, dtype=np.float32)
    return float(np.dot(va, vb))


def find_top_k_similar(
    query_embedding: List[float],
    candidates: List[dict],
    top_k: int = 5,
    exclude_id: str = None,
) -> List[dict]:
    """
    Returns top_k candidates sorted by cosine similarity descending.
    Each candidate: {"id": str, "embedding": List[float]}
    Returns: [{"id": str, "score": float}]
    """
    scored = []
    for candidate in candidates:
        if exclude_id and candidate["id"] == exclude_id:
            continue
        score = cosine_similarity(query_embedding, candidate["embedding"])
        scored.append({"id": candidate["id"], "score": round(score, 4)})

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:top_k]
