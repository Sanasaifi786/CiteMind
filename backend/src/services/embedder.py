"""
Embedding Service for CiteMind.

This service converts textual chunks and user queries into high-dimensional
dense vector embeddings using SentenceTransformers (all-MiniLM-L6-v2).
"""

from typing import List, Union
import numpy as np
from sentence_transformers import SentenceTransformer
from services.chunker import TextChunk


class EmbeddingService:
    """
    Singleton service managing the SentenceTransformer model.

    Why a class/singleton?
    Loading deep learning weights into RAM takes 1-2 seconds.
    By loading the model once upon initialization, every subsequent
    query or chunk embedding runs in milliseconds without memory leaks.
    """

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initializes the embedding model.

        Args:
            model_name: HuggingFace model identifier.
                        'all-MiniLM-L6-v2' maps sentences to a 384-dimensional dense vector space.
        """
        self.model_name = model_name
        print(f"[EmbeddingService] Loading model: {model_name}...")
        self.model = SentenceTransformer(model_name)
        self.dimension = self.model.get_embedding_dimension()
        print(f"[EmbeddingService] Model loaded. Embedding dimension: {self.dimension}")

    def embed_text(self, text: str) -> np.ndarray:
        """
        Converts a single string (such as a user search query) into a normalized vector.

        Args:
            text: Query or sentence to embed.

        Returns:
            np.ndarray: 1D array of shape (dimension,) with float32 values.
        """
        if not text or not text.strip():
            raise ValueError("Cannot generate embedding for empty text.")

        # normalize_embeddings=True ensures the vector length ||v|| = 1.
        # This allows cosine similarity to be computed via a fast dot product!
        embedding = self.model.encode(
            text,
            convert_to_numpy=True,
            normalize_embeddings=True
        )
        return embedding.astype(np.float32)

    def embed_chunks(
        self,
        chunks: List[TextChunk],
        batch_size: int = 32
    ) -> np.ndarray:
        """
        Batch-embeds a list of TextChunk objects.

        Why batching?
        Deep learning models process tensors in parallel matrix multiplications.
        Passing 32 texts at once is 5x-10x faster than looping one-by-one.

        Args:
            chunks: List of TextChunk objects.
            batch_size: Number of texts processed in parallel per step.

        Returns:
            np.ndarray: 2D array of shape (len(chunks), dimension) with float32 values.
        """
        if not chunks:
            return np.empty((0, self.dimension), dtype=np.float32)

        texts = [c.content for c in chunks]

        embeddings = self.model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=False,
            convert_to_numpy=True,
            normalize_embeddings=True
        )
        return embeddings.astype(np.float32)


_embedder_instance: Union[EmbeddingService, None] = None


def get_embedding_service() -> EmbeddingService:
    """Provides a shared global instance of the EmbeddingService."""
    global _embedder_instance
    if _embedder_instance is None:
        _embedder_instance = EmbeddingService()
    return _embedder_instance


if __name__ == "__main__":
    # Quick self-test
    svc = get_embedding_service()
    v1 = svc.embed_text("Operating systems manage processes.")
    print("Vector generated successfully! Shape:", v1.shape)
