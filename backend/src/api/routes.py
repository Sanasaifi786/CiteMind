"""
CiteMind REST API Endpoints.

This module exposes the FastAPI endpoints, starting with:
  1. GET  /api/health - System and index health status
  2. POST /api/upload - PDF document upload, extraction, chunking, and indexing
"""

from pathlib import Path
import shutil
import time
from typing import List
from fastapi import APIRouter, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field

from services.extractor import extract_text_from_pdf
from services.chunker import chunk_document_pages
from services.embedder import get_embedding_service
from services.vector_store import get_vector_store
from services.llm import get_llm_service
from services.rag_pipeline import RAGPipeline, RAGResponse

router = APIRouter()

# Data directory paths (anchored to backend/data regardless of current working directory)
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
UPLOAD_DIR = BACKEND_DIR / "data" / "uploads"
VECTOR_STORE_DIR = BACKEND_DIR / "data" / "vector_store"


# Pydantic Response Schemas

class HealthResponse(BaseModel):
    """System health and diagnostic status."""
    status: str = Field(..., description="API operational status")
    total_vectors_indexed: int = Field(..., description="Number of chunks currently in FAISS")
    embedding_dimension: int = Field(..., description="Embedding vector dimension")
    llm_configured: bool = Field(..., description="Whether a valid GROQ_API_KEY is active")


class UploadResponse(BaseModel):
    """Response returned upon successful PDF ingestion."""
    filename: str = Field(..., description="Name of the processed PDF")
    pages_extracted: int = Field(..., description="Number of pages extracted")
    chunks_indexed: int = Field(..., description="Number of text chunks created and added")
    total_vectors_in_store: int = Field(..., description="Cumulative vector count in FAISS")
    upload_time_ms: float = Field(..., description="Processing time in milliseconds")
    message: str = Field(..., description="Human-readable success message")


# Endpoint 1: Health & Diagnostics

@router.get("/health", response_model=HealthResponse, tags=["Diagnostics"])
def health_check():
    """
    Returns system health and diagnostic information.
    Used by frontend monitoring and deployment liveness probes.
    """
    vstore = get_vector_store(VECTOR_STORE_DIR)
    embedder = get_embedding_service()
    llm = get_llm_service()

    return HealthResponse(
        status="healthy",
        total_vectors_indexed=vstore.size,
        embedding_dimension=embedder.dimension,
        llm_configured=llm.is_configured
    )


# Endpoint 2: Document Upload & Ingestion

@router.post("/upload", response_model=UploadResponse, status_code=status.HTTP_201_CREATED, tags=["Ingestion"])
async def upload_document(file: UploadFile = File(...)):
    """
    Upload an academic PDF to ingest into the CiteMind vector store.

    Step-by-step pipeline:
      1. Validates that the uploaded file is a PDF.
      2. Persists the binary file to disk in `data/uploads/`.
      3. Extracts pages and preserves 1-indexed metadata using PyMuPDF.
      4. Chunks each page using page-isolated sliding windows.
      5. Embeds chunks into 384-dimensional dense vectors.
      6. Indexes vectors in FAISS and persists index to disk.
    """
    start_time = time.perf_counter()

    # 1. Defensive validation: Check file extension
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type: '{file.filename}'. Only '.pdf' files are supported."
        )

    # 2. Ensure upload directory exists and save PDF
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    file_path = UPLOAD_DIR / file.filename

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save uploaded file: {str(e)}"
        )
    finally:
        await file.close()

    try:
        # 3. Extract text page-by-page
        pages = extract_text_from_pdf(file_path)
        if not pages:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"The uploaded PDF '{file.filename}' contains no readable pages."
            )

        # 4. Chunk pages with overlap
        chunks = chunk_document_pages(pages, chunk_size=300, overlap=60)
        if not chunks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No text chunks could be generated from '{file.filename}'. It may be a scanned image."
            )

        # 5. Generate semantic embeddings
        embedder = get_embedding_service()
        embeddings = embedder.embed_chunks(chunks)

        # 6. Add to FAISS Vector Store and persist to disk
        vstore = get_vector_store(VECTOR_STORE_DIR)
        vstore.add(chunks, embeddings)
        vstore.save(VECTOR_STORE_DIR)

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        return UploadResponse(
            filename=file.filename,
            pages_extracted=len(pages),
            chunks_indexed=len(chunks),
            total_vectors_in_store=vstore.size,
            upload_time_ms=round(elapsed_ms, 2),
            message=f"Successfully extracted {len(pages)} pages and indexed {len(chunks)} chunks from '{file.filename}'."
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing PDF '{file.filename}': {str(e)}"
        )


# Endpoint 3: Question Answering (RAG)

class AskRequest(BaseModel):
    """Input payload for academic question answering."""
    question: str = Field(
        ...,
        min_length=2,
        max_length=1000,
        description="The student's natural language question",
        examples=["What is virtual memory and how does paging work?"]
    )
    top_k: int = Field(
        default=3,
        ge=1,
        le=10,
        description="Maximum relevant context chunks to retrieve"
    )
    min_score: float = Field(
        default=0.35,
        ge=0.0,
        le=1.0,
        description="Minimum cosine similarity threshold to reject noise"
    )


@router.post("/ask", response_model=RAGResponse, tags=["Question Answering"])
def ask_question(request: AskRequest):
    """
    Ask a question against all indexed academic documents.

    Pipeline execution:
      1. Validates that the index is not empty.
      2. Embeds the user question into 384 dimensions.
      3. Performs FAISS similarity search.
      4. Discards noise below `min_score` (protects against hallucinations).
      5. Constructs a strictly grounded system prompt.
      6. Queries the LLM (Groq Llama 3.3).
      7. Returns the answer with structured page citations and latency telemetry.
    """
    vstore = get_vector_store(VECTOR_STORE_DIR)

    if vstore.size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No documents have been indexed yet. Please upload an academic PDF via /api/upload first."
        )

    rag = RAGPipeline(
        vector_store=vstore,
        default_min_score=request.min_score,
        default_top_k=request.top_k
    )

    return rag.ask(
        query=request.question,
        top_k=request.top_k,
        min_score=request.min_score
    )


# Endpoint 4: Document Library & Stats

class DocumentInfo(BaseModel):
    """Metadata summary of an indexed academic document."""
    filename: str = Field(..., description="Document file name")
    total_pages: int = Field(..., description="Distinct page count")
    total_chunks: int = Field(..., description="Indexed chunk count")
    file_size_kb: float = Field(..., description="File size on disk in kilobytes")


class DocumentLibraryResponse(BaseModel):
    """Overview of all documents currently indexed in the system."""
    total_documents: int = Field(..., description="Total unique documents")
    total_vectors: int = Field(..., description="Total vector chunks in FAISS")
    documents: List[DocumentInfo] = Field(default_factory=list, description="List of document summaries")


@router.get("/documents", response_model=DocumentLibraryResponse, tags=["Document Library"])
def list_documents():
    """
    Returns a library overview of all uploaded and indexed academic documents.
    Used by the frontend sidebar to display indexed notes and page counts.
    """
    vstore = get_vector_store(VECTOR_STORE_DIR)

    # Aggregate chunks by source document
    doc_map = {}
    for chunk in vstore.metadata:
        src = chunk.source
        if src not in doc_map:
            doc_map[src] = {
                "pages": set(),
                "chunk_count": 0
            }
        doc_map[src]["pages"].add(chunk.page_number)
        doc_map[src]["chunk_count"] += 1

    docs_list: List[DocumentInfo] = []
    for filename, info in doc_map.items():
        file_path = UPLOAD_DIR / filename
        size_kb = 0.0
        if file_path.exists():
            size_kb = round(file_path.stat().st_size / 1024.0, 2)

        docs_list.append(
            DocumentInfo(
                filename=filename,
                total_pages=len(info["pages"]),
                total_chunks=info["chunk_count"],
                file_size_kb=size_kb
            )
        )

    return DocumentLibraryResponse(
        total_documents=len(docs_list),
        total_vectors=vstore.size,
        documents=docs_list
    )


