"""
End-to-End RAG (Retrieval-Augmented Generation) Pipeline for CiteMind.

This service orchestrates the complete RAG loop:
  1. Accepts user query
  2. Retrieves relevant chunks with threshold filtering (retriever.py)
  3. Constructs an anti-hallucination grounded prompt (prompt engineering)
  4. Calls the LLM (llm.py) to generate a factual answer
  5. Packages verified page citations into structured JSON for frontend display
"""

import time
from typing import List, Optional
from pydantic import BaseModel, Field

from services.vector_store import FaissVectorStore
from services.embedder import EmbeddingService, get_embedding_service
from services.retriever import RetrievalEngine, RetrievedChunk, RetrievalResponse
from services.llm import LLMService, get_llm_service


class Citation(BaseModel):
    """
    Structured citation reference pointing to the exact source document and page.
    """
    source: str = Field(..., description="Document filename")
    page_number: int = Field(..., description="1-indexed physical page number")
    snippet: str = Field(..., description="Exemplar quote or excerpt from the page")
    score: float = Field(..., description="Cosine similarity score")


class RAGResponse(BaseModel):
    """
    The final output schema returned to API clients and the React frontend.
    """
    query: str = Field(..., description="Original user question")
    answer: str = Field(..., description="LLM-generated answer grounded in context")
    citations: List[Citation] = Field(default_factory=list, description="List of source citations used")
    has_sufficient_context: bool = Field(..., description="False if query had no relevant context")
    retrieval_time_ms: float = Field(..., description="Retrieval latency in milliseconds")
    generation_time_ms: float = Field(..., description="LLM generation latency in milliseconds")
    total_time_ms: float = Field(..., description="Total pipeline latency in milliseconds")



SYSTEM_PROMPT = """You are CiteMind, an expert academic tutor and research assistant.
Your mission is to provide accurate, factual answers to student questions based STRICTLY on the provided document excerpts.

CRITICAL RULES:
1. STRICT GROUNDING: Answer using ONLY the facts explicitly mentioned in the "Context Blocks" below.
2. NO HALLUCINATIONS: If the context does not contain enough information to answer the question, state:
   "Based on the provided documents, I could not find information to answer this question."
   Do NOT use external pre-training knowledge or speculate.
3. CITATION MANDATE: Every claim, definition, or key fact you state MUST include a citation tag pointing to its source and page in brackets, formatted exactly like:
   [Source: filename, Page: X]
4. CONCISE & ACADEMIC: Keep explanations clear, structured, and easy for students to study.
"""


class RAGPipeline:
    """
    The central coordinator tying Ingestion, Retrieval, Prompting, and Generation together.
    """

    def __init__(
        self,
        vector_store: FaissVectorStore,
        embedding_service: Optional[EmbeddingService] = None,
        llm_service: Optional[LLMService] = None,
        default_min_score: float = 0.35,
        default_top_k: int = 3
    ):
        self.vector_store = vector_store
        self.embedding_service = embedding_service or get_embedding_service()
        self.llm_service = llm_service or get_llm_service()
        self.retrieval_engine = RetrievalEngine(
            vector_store=self.vector_store,
            embedding_service=self.embedding_service,
            default_min_score=default_min_score
        )
        self.default_top_k = default_top_k

    def ask(
        self,
        query: str,
        top_k: Optional[int] = None,
        min_score: Optional[float] = None
    ) -> RAGResponse:
        """
        Executes the end-to-end question answering flow.

        Args:
            query: The user's natural language question.
            top_k: Max chunks to retrieve (defaults to self.default_top_k).
            min_score: Similarity threshold override.

        Returns:
            RAGResponse: Complete answer with structured page citations.
        """
        overall_start = time.perf_counter()
        effective_k = top_k or self.default_top_k

        # ── Step 1: Semantic Retrieval ──
        retrieval: RetrievalResponse = self.retrieval_engine.retrieve(
            query=query,
            top_k=effective_k,
            min_score=min_score
        )

        # ── Step 2: Handle Edge Case - Irrelevant or Empty Query ──
        # If no chunks passed the similarity threshold, we abort before calling the LLM!
        # This saves API costs and completely eliminates hallucination on out-of-domain questions.
        if not retrieval.has_relevant_context:
            total_ms = (time.perf_counter() - overall_start) * 1000.0
            return RAGResponse(
                query=query,
                answer=(
                    "I could not find any relevant information in your uploaded documents "
                    "to answer this question. Please verify your query or upload the corresponding lecture notes."
                ),
                citations=[],
                has_sufficient_context=False,
                retrieval_time_ms=retrieval.retrieval_time_ms,
                generation_time_ms=0.0,
                total_time_ms=round(total_ms, 2)
            )

        # ── Step 3: Prompt Construction (Context Stuffing) ──
        user_prompt = self._build_prompt(query, retrieval.formatted_context)

        # ── Step 4: LLM Generation ──
        gen_start = time.perf_counter()
        raw_answer = self.llm_service.generate(
            prompt=user_prompt,
            system_prompt=SYSTEM_PROMPT,
            temperature=0.1
        )
        gen_ms = (time.perf_counter() - gen_start) * 1000.0

        # ── Step 5: Format Structured Citations ──
        structured_citations = [
            Citation(
                source=c.source,
                page_number=c.page_number,
                snippet=c.content[:160] + "..." if len(c.content) > 160 else c.content,
                score=c.score
            )
            for c in retrieval.chunks
        ]

        total_ms = (time.perf_counter() - overall_start) * 1000.0

        return RAGResponse(
            query=query,
            answer=raw_answer.strip(),
            citations=structured_citations,
            has_sufficient_context=True,
            retrieval_time_ms=retrieval.retrieval_time_ms,
            generation_time_ms=round(gen_ms, 2),
            total_time_ms=round(total_ms, 2)
        )

    def _build_prompt(self, query: str, formatted_context: str) -> str:
        """
        Assembles the grounded prompt containing retrieved academic context and user question.
        """
        return (
            f"Here are the relevant excerpts extracted from the student's academic documents:\n\n"
            f"{formatted_context}\n\n"
            f"Student Question: {query}\n\n"
            f"Answer the question clearly following all grounding and citation rules:"
        )


if __name__ == "__main__":
    print("RAG Pipeline service loaded successfully.")
