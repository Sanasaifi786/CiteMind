"""
Vector Storage & Indexing Service for CiteMind using FAISS.

This service indexes high-dimensional dense embeddings for ultra-fast
nearest-neighbor similarity search and binds each vector to its originating 
TextChunk metadata (source document, page number, text content).
"""

from pathlib import Path
import pickle
from typing import List, Tuple
import faiss
import numpy as np
from services.chunker import TextChunk


class FaissVectorStore:
    """
    In-memory and disk-persistent FAISS Vector Database.

    Core AI Concept:
    FAISS (Facebook AI Similarity Search) is an ultra-fast C++ library for vector search.
    However, FAISS only stores arrays of floating-point numbers. It has zero knowledge
    of strings, page numbers, or file names.
    
    To build an academic citation engine, CiteMind pairs:
      1. FAISS Index  -> Stores 384-dimensional vectors at positions [0, 1, 2, ... N-1]
      2. Metadata List -> Stores TextChunk objects at matching positions [0, 1, 2, ... N-1]
    """

    def __init__(self, dimension: int = 384):
        """
        Initializes an empty FAISS index.

        Args:
            dimension: Dimensionality of input vectors (384 for all-MiniLM-L6-v2).
        """
        self.dimension = dimension
        
        # Why IndexFlatIP (Inner Product)?
        # Our embeddings are normalized (length = 1.0) in embedder.py.
        # For normalized vectors, the Inner Product (Dot Product) equals Cosine Similarity!
        # Higher score = more semantically similar (range: -1.0 to 1.0).
        self.index = faiss.IndexFlatIP(self.dimension)
        
        # Parallel list holding metadata for each corresponding vector in self.index
        self.metadata: List[TextChunk] = []

    @property
    def size(self) -> int:
        """Returns total number of vectors indexed."""
        return self.index.ntotal

    def add(self, chunks: List[TextChunk], embeddings: np.ndarray) -> None:
        """
        Adds vectors to the FAISS index and stores chunk metadata in matching order.

        Args:
            chunks: List of TextChunk objects from chunker.py.
            embeddings: 2D numpy array of shape (len(chunks), dimension).

        Raises:
            ValueError: If chunks count does not match embeddings row count.
        """
        if not chunks:
            return

        if len(chunks) != embeddings.shape[0]:
            raise ValueError(
                f"Mismatch: Received {len(chunks)} chunks but {embeddings.shape[0]} embeddings."
            )

        if embeddings.shape[1] != self.dimension:
            raise ValueError(
                f"Vector dimension mismatch: expected {self.dimension}, got {embeddings.shape[1]}."
            )

        # FAISS strictly requires float32 (will crash on float64)
        vectors_f32 = np.ascontiguousarray(embeddings, dtype=np.float32)

        # Add vectors to C++ FAISS index
        self.index.add(vectors_f32)

        # Store metadata in matching positional index
        self.metadata.extend(chunks)

        print(f"[VectorStore] Added {len(chunks)} vectors. Total indexed: {self.size}")

    def search(
        self,
        query_vector: np.ndarray,
        top_k: int = 3
    ) -> List[Tuple[TextChunk, float]]:
        """
        Searches for the top-k most semantically similar chunks to a query vector.

        Args:
            query_vector: 1D or 2D numpy array containing the query embedding.
            top_k: Number of most relevant results to return.

        Returns:
            List[Tuple[TextChunk, float]]: Pairs of (TextChunk, cosine_similarity_score)
                                           sorted from highest similarity to lowest.
        """
        if self.size == 0:
            return []

        # Ensure query vector is 2D array of shape (1, dimension) and float32
        if query_vector.ndim == 1:
            query_vector = np.expand_dims(query_vector, axis=0)

        query_f32 = np.ascontiguousarray(query_vector, dtype=np.float32)

        # Cap top_k to the total number of items in the index
        effective_k = min(top_k, self.size)

        # FAISS search returns:
        # - distances: 2D array of Inner Product similarity scores (shape: (1, k))
        # - indices: 2D array of integer positions in the index (shape: (1, k))
        scores, indices = self.index.search(query_f32, effective_k)

        results: List[Tuple[TextChunk, float]] = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:
                # -1 is returned by FAISS if fewer than k vectors exist
                continue
            chunk = self.metadata[idx]
            results.append((chunk, float(score)))

        return results

    def save(self, storage_dir: str | Path) -> None:
        """
        Persists both the FAISS binary index and metadata pickle file to disk.

        Args:
            storage_dir: Target directory path where files will be written.
        """
        target_dir = Path(storage_dir)
        target_dir.mkdir(parents=True, exist_ok=True)

        index_file = target_dir / "index.faiss"
        meta_file = target_dir / "metadata.pkl"

        # 1. Save FAISS binary index
        faiss.write_index(self.index, str(index_file))

        # 2. Save Python metadata list
        with open(meta_file, "wb") as f:
            pickle.dump(self.metadata, f)

        print(f"[VectorStore] Successfully saved {self.size} vectors to {target_dir.resolve()}")

    def load(self, storage_dir: str | Path) -> None:
        """
        Loads the FAISS index and metadata from disk into memory.

        Args:
            storage_dir: Directory containing index.faiss and metadata.pkl.
        """
        target_dir = Path(storage_dir)
        index_file = target_dir / "index.faiss"
        meta_file = target_dir / "metadata.pkl"

        if not index_file.exists() or not meta_file.exists():
            raise FileNotFoundError(
                f"Missing index or metadata in {target_dir.resolve()}."
            )

        # 1. Load FAISS binary index
        self.index = faiss.read_index(str(index_file))
        self.dimension = self.index.d

        # 2. Load Python metadata list
        with open(meta_file, "rb") as f:
            self.metadata = pickle.load(f)

        print(f"[VectorStore] Successfully loaded {self.size} vectors from {target_dir.resolve()}")


# ─────────────────────────────────────────────
# Global Vector Store Instance (Lazy Loader)
# ─────────────────────────────────────────────
_vector_store_instance: "FaissVectorStore | None" = None


def get_vector_store(storage_dir: str | Path = "data/vector_store") -> FaissVectorStore:
    """
    Returns the shared global instance of FaissVectorStore.
    If an existing index is saved on disk, it loads it automatically.
    """
    global _vector_store_instance
    if _vector_store_instance is None:
        target_path = Path(storage_dir)
        store = FaissVectorStore()
        if (target_path / "index.faiss").exists() and (target_path / "metadata.pkl").exists():
            try:
                store.load(target_path)
            except Exception as e:
                print(f"[VectorStore] Warning: Could not load saved index: {e}")
        _vector_store_instance = store
    return _vector_store_instance


if __name__ == "__main__":
    print("Vector Store service loaded successfully.")

