"""
Semantic Retrieval Engine for CiteMind.

This service coordinates between user search queries, embedding generation,
vector search in FAISS, similarity threshold filtering, and LLM context formatting.
"""

from typing import List, Optional
import time
from pydantic import BaseModel, Field
from services.chunker import TextChunk
from services.embedder import EmbeddingService, get_embedding_service
from services.vector_store import FaissVectorStore


class RetrievedChunk(BaseModel):
    """
    Represents a single chunk retrieved from the vector store with citation metadata.
    """
    chunk_id: str = Field(..., description="Unique chunk ID")
    source: str = Field(..., description="Originating document file name")
    page_number: int = Field(..., description="1-indexed page number for citation")
    content: str = Field(..., description="Text content of the chunk")
    score: float = Field(..., description="Cosine similarity score (0.0 to 1.0)")
    citation: str = Field(..., description="Human-readable citation label, e.g. 'notes.pdf (Page 2)'")


class RetrievalResponse(BaseModel):
    """
    Standardized response from the retrieval engine, packaged for the LLM prompt.
    """
    query: str = Field(..., description="The user's original query")
    chunks: List[RetrievedChunk] = Field(default_factory=list, description="Top relevant chunks passing threshold")
    total_found: int = Field(..., description="Number of chunks retrieved")
    has_relevant_context: bool = Field(..., description="True if at least one chunk exceeded the threshold")
    formatted_context: str = Field(..., description="Structured text block ready for LLM prompt injection")
    retrieval_time_ms: float = Field(..., description="Time taken to retrieve and score in milliseconds")


class RetrievalEngine:
    """
    Coordinates semantic retrieval, similarity filtering, and prompt context building.
    """

    def __init__(
        self,
        vector_store: FaissVectorStore,
        embedding_service: Optional[EmbeddingService] = None,
        default_min_score: float = 0.35
    ):
        """
        Initializes the retrieval engine.

        Args:
            vector_store: The populated FaissVectorStore instance.
            embedding_service: EmbeddingService instance (defaults to global singleton).
            default_min_score: Minimum cosine similarity threshold to reject noise.
        """
        self.vector_store = vector_store
        self.embedding_service = embedding_service or get_embedding_service()
        self.default_min_score = default_min_score

    def retrieve(
        self,
        query: str,
        top_k: int = 3,
        min_score: Optional[float] = None
    ) -> RetrievalResponse:
        """
        Executes semantic retrieval for a user question.

        Pipeline:
          1. Clean & validate query.
          2. Embed query text into 384-dimensional dense vector.
          3. Query FAISS index for nearest neighbors.
          4. Filter out chunks falling below similarity threshold (reject noise).
          5. Assemble prompt-ready context with page citations.

        Args:
            query: The user's question or search phrase.
            top_k: Maximum number of chunks to retrieve (default: 3).
            min_score: Minimum cosine similarity threshold (overrides default).

        Returns:
            RetrievalResponse: Structured retrieval results.
        """
        start_time = time.perf_counter()
        threshold = min_score if min_score is not None else self.default_min_score

        cleaned_query = query.strip()
        if not cleaned_query:
            return RetrievalResponse(
                query=query,
                chunks=[],
                total_found=0,
                has_relevant_context=False,
                formatted_context="",
                retrieval_time_ms=0.0
            )

        if self.vector_store.size == 0:
            return RetrievalResponse(
                query=cleaned_query,
                chunks=[],
                total_found=0,
                has_relevant_context=False,
                formatted_context="No documents have been indexed yet.",
                retrieval_time_ms=0.0
            )

        # 1. Embed query
        query_vector = self.embedding_service.embed_text(cleaned_query)

        # 2. Search FAISS index
        raw_results = self.vector_store.search(query_vector, top_k=top_k)

        # 3. Filter by similarity threshold & package
        retrieved_chunks: List[RetrievedChunk] = []
        for chunk, score in raw_results:
            if score >= threshold:
                citation_label = f"{chunk.source} (Page {chunk.page_number})"
                retrieved_chunks.append(
                    RetrievedChunk(
                        chunk_id=chunk.chunk_id,
                        source=chunk.source,
                        page_number=chunk.page_number,
                        content=chunk.content,
                        score=round(score, 4),
                        citation=citation_label
                    )
                )

        # 4. Build formatted context for LLM prompt
        formatted_context = self._format_context_for_prompt(retrieved_chunks)

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        return RetrievalResponse(
            query=cleaned_query,
            chunks=retrieved_chunks,
            total_found=len(retrieved_chunks),
            has_relevant_context=len(retrieved_chunks) > 0,
            formatted_context=formatted_context,
            retrieval_time_ms=round(elapsed_ms, 2)
        )

    def _format_context_for_prompt(self, chunks: List[RetrievedChunk]) -> str:
        """
        Formats retrieved chunks into a standardized, numbered context block.

        Why this format?
        In Week 2, our LLM system prompt will instruct the model:
        'Answer using only the provided context. Cite the source and page in brackets.'
        Having clear [Source: ... Page: ...] headers makes it trivial for the LLM
        to accurately ground its answers and write exact citations.
        """
        if not chunks:
            return "No relevant context found in the uploaded documents."

        context_blocks = []
        for i, chunk in enumerate(chunks, 1):
            block = (
                f"--- Context Block {i} ---\n"
                f"Source: {chunk.source} | Page: {chunk.page_number}\n"
                f"Content:\n{chunk.content}"
            )
            context_blocks.append(block)

        return "\n\n".join(context_blocks)


if __name__ == "__main__":
    print("Retrieval Engine service loaded successfully.")
