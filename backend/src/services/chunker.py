"""
Text Chunking Service for CiteMind.

This service splits extracted document pages into overlapping chunks,
preserving critical source and page metadata for downstream vector search 
and citation generation.
"""

from typing import List
from pydantic import BaseModel, Field
from services.extractor import DocumentPage


class TextChunk(BaseModel):
    """
    Represents an atomic chunk of text ready for embedding and vector indexing.
    
    Attributes:
        chunk_id: Unique identifier (e.g., 'notes.pdf_p1_c0').
        source: Name or path of the originating document.
        page_number: 1-indexed page where this chunk originated.
        chunk_index: Order index of this chunk within the document/session.
        content: The actual text string inside this chunk.
        char_count: Character count of the chunk content.
    """
    chunk_id: str = Field(..., description="Deterministic unique identifier for the chunk")
    source: str = Field(..., description="Originating document file name")
    page_number: int = Field(..., description="1-indexed physical page number")
    chunk_index: int = Field(..., description="Sequential index of this chunk")
    content: str = Field(..., description="Text content within the chunk")
    char_count: int = Field(..., description="Number of characters in the chunk")


def chunk_document_pages(
    pages: List[DocumentPage],
    chunk_size: int = 500,
    overlap: int = 100,
    min_chunk_size: int = 50,
) -> List[TextChunk]:
    """
    Splits a list of DocumentPage objects into overlapping chunks page-by-page.

    Why page-by-page chunking?
    In academic RAG, citation precision is paramount. If a chunk spans across 
    Page 1 and Page 2, attributing a quote to a specific page becomes ambiguous. 
    By chunking within each page, we preserve exact 1:1 page traceability.

    Args:
        pages: List of DocumentPage objects from the extractor.
        chunk_size: Maximum character length of each chunk (default ~500 chars / ~100-125 tokens).
        overlap: Character overlap between consecutive chunks (default ~100 chars).
        min_chunk_size: Minimum characters required to keep a trailing chunk (filters out noise).

    Returns:
        List[TextChunk]: List of structured chunks with metadata.
    """
    if overlap >= chunk_size:
        raise ValueError(
            f"Overlap ({overlap}) must be strictly less than chunk_size ({chunk_size}) "
            "to prevent infinite loops."
        )

    all_chunks: List[TextChunk] = []
    global_chunk_index = 0

    for page in pages:
        text = page.content.strip()

        # If page has no readable text (e.g. empty or scanned), skip chunking
        if not text:
            continue

        # If page text is smaller than our chunk size, keep it as a single chunk
        if len(text) <= chunk_size:
            if len(text) >= min_chunk_size:
                chunk_id = f"{page.source}_p{page.page_number}_c{global_chunk_index}"
                all_chunks.append(
                    TextChunk(
                        chunk_id=chunk_id,
                        source=page.source,
                        page_number=page.page_number,
                        chunk_index=global_chunk_index,
                        content=text,
                        char_count=len(text),
                    )
                )
                global_chunk_index += 1
            continue

        # Sliding window chunking with overlap
        step = chunk_size - overlap
        start = 0

        while start < len(text):
            end = start + chunk_size
            chunk_text = text[start:end].strip()

            # Only retain chunks that meet the minimum size threshold
            if len(chunk_text) >= min_chunk_size:
                chunk_id = f"{page.source}_p{page.page_number}_c{global_chunk_index}"
                all_chunks.append(
                    TextChunk(
                        chunk_id=chunk_id,
                        source=page.source,
                        page_number=page.page_number,
                        chunk_index=global_chunk_index,
                        content=chunk_text,
                        char_count=len(chunk_text),
                    )
                )
                global_chunk_index += 1

            start += step

    return all_chunks


def report_chunk_stats(chunks: List[TextChunk]) -> dict:
    """
    Generates summary statistics on the chunking output for quality monitoring.

    Args:
        chunks: List of generated TextChunk objects.

    Returns:
        dict: Summary stats (total, avg size, min, max, sources, pages_covered).
    """
    if not chunks:
        return {"total_chunks": 0}

    sizes = [c.char_count for c in chunks]

    stats = {
        "total_chunks": len(chunks),
        "avg_char_count": round(sum(sizes) / len(sizes), 1),
        "min_char_count": min(sizes),
        "max_char_count": max(sizes),
        "sources": list(set(c.source for c in chunks)),
        "pages_covered": sorted(set(c.page_number for c in chunks)),
    }
    return stats


# Quick Self-Test

if __name__ == "__main__":
    print("Chunker service loaded successfully.")
