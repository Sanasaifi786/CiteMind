"""
CiteMind REST API Endpoints.

This module exposes the FastAPI endpoints, starting with:
  1. GET  /api/health - System and index health status
  2. POST /api/upload - PDF document upload, extraction, chunking, and indexing
"""

from pathlib import Path
import shutil
import time
from typing import List, Optional
from fastapi import APIRouter, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from services.extractor import extract_text_from_pdf
from services.chunker import chunk_document_pages
from services.embedder import get_embedding_service
from services.vector_store import get_vector_store
from services.llm import get_llm_service
from services.rag_pipeline import RAGPipeline, RAGResponse
from services.history_db import get_history_db

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
        default=5,
        ge=1,
        le=12,
        description="Maximum relevant context chunks to retrieve"
    )
    min_score: float = Field(
        default=0.22,
        ge=0.0,
        le=1.0,
        description="Minimum cosine similarity threshold to reject noise"
    )
    session_id: Optional[str] = Field(
        default=None,
        description="Active chat session ID to save messages into"
    )
    document_name: Optional[str] = Field(
        default=None,
        description="Target document to scope question to, or None for all documents"
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
      6. Queries the LLM (Groq Llama / open-weights).
      7. Returns the answer with structured page citations and latency telemetry.
      8. Automatically records question and answer into persistent SQLite chat history.
    """
    vstore = get_vector_store(VECTOR_STORE_DIR)

    if vstore.size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No documents have been indexed yet. Please upload an academic PDF via /api/upload first."
        )

    history_db = get_history_db()
    active_session_id = request.session_id
    if not active_session_id or not history_db.get_session(active_session_id):
        # Auto-create session titled with the question
        title_snippet = request.question.strip()
        if len(title_snippet) > 42:
            title_snippet = title_snippet[:39] + "..."
        sub = request.document_name or "General"
        sess = history_db.create_session(
            title=title_snippet,
            subject=sub,
            document_name=request.document_name
        )
        active_session_id = sess["id"]

    # Record user question in persistent SQLite
    history_db.add_message(
        session_id=active_session_id,
        sender="user",
        text=request.question
    )

    rag = RAGPipeline(
        vector_store=vstore,
        default_min_score=request.min_score,
        default_top_k=request.top_k
    )

    rag_response = rag.ask(
        query=request.question,
        top_k=request.top_k,
        min_score=request.min_score,
        document_name=request.document_name
    )
    rag_response.session_id = active_session_id

    # Record AI answer & verified citations in persistent SQLite
    history_db.add_message(
        session_id=active_session_id,
        sender="ai",
        text=rag_response.answer,
        has_sufficient_context=rag_response.has_sufficient_context,
        citations=[c.model_dump() for c in rag_response.citations],
        total_time_ms=rag_response.total_time_ms
    )

    return rag_response



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


@router.get("/documents/{filename}/file", tags=["Document Library"])
def get_document_file(filename: str):
    """
    Streams the raw PDF file directly to the browser for interactive viewing
    in the Source Panel, supporting native browser PDF features like #page=X.
    """
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        # Fallback to sample_docs if file is a seed document
        sample_path = BACKEND_DIR / "sample_docs" / filename
        if sample_path.exists():
            file_path = sample_path
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document file '{filename}' not found."
            )

    return FileResponse(
        path=str(file_path),
        media_type="application/pdf",
        filename=filename,
        headers={"Content-Disposition": f'inline; filename="{filename}"'}
    )


@router.delete("/documents/{filename}", tags=["Document Library"])
def delete_document(filename: str):
    """
    Deletes an uploaded document from disk and purges its vector embeddings
    from the FAISS index so it is no longer retrieved in answers.
    """
    vstore = get_vector_store(VECTOR_STORE_DIR)
    
    # 1. Remove physical file from UPLOAD_DIR if it exists
    file_path = UPLOAD_DIR / filename
    if file_path.exists():
        try:
            file_path.unlink()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Could not delete physical file: {e}"
            )

    # 2. Filter out deleted document from vector store metadata
    remaining_chunks = [c for c in vstore.metadata if c.source != filename]
    
    if len(remaining_chunks) != len(vstore.metadata):
        if len(remaining_chunks) == 0:
            vstore.reset()
        else:
            embedder = get_embedding_service()
            new_embeddings = embedder.embed_chunks(remaining_chunks)
            vstore.reset()
            vstore.add(remaining_chunks, new_embeddings)
        vstore.save(VECTOR_STORE_DIR)

    return {
        "message": f"Document '{filename}' successfully deleted and removed from vector store.",
        "remaining_vectors": vstore.size
    }


# Endpoint 5: Chat History & Session Management

class CreateSessionRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    subject: str = Field(default="General")
    document_name: Optional[str] = Field(default=None)


@router.get("/history", tags=["Chat History"])
def get_chat_history(document: Optional[str] = None):
    """Returns chat sessions, optionally filtered by document_name."""
    history_db = get_history_db()
    if document:
        sessions = history_db.get_sessions_by_document(document)
    else:
        sessions = history_db.get_all_sessions()
    return {"sessions": sessions, "total_sessions": len(sessions)}


@router.get("/history/{session_id}", tags=["Chat History"])
def get_session_details(session_id: str):
    """Returns metadata and full chronological message thread for a session."""
    history_db = get_history_db()
    session = history_db.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    messages = history_db.get_session_messages(session_id)
    return {
        "session": session,
        "messages": messages
    }


@router.post("/history/session", tags=["Chat History"])
def create_chat_session(payload: CreateSessionRequest):
    """Creates a new empty chat session."""
    history_db = get_history_db()
    session = history_db.create_session(title=payload.title, subject=payload.subject)
    return session


@router.delete("/history/{session_id}", tags=["Chat History"])
def delete_chat_session(session_id: str):
    """Deletes a chat session and all its messages."""
    history_db = get_history_db()
    success = history_db.delete_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    return {"message": f"Session '{session_id}' successfully deleted."}



