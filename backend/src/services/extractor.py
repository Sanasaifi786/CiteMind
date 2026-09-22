"""
Document Ingestion & Text Extraction Service for CiteMind.

This service is responsible for loading academic PDFs and extracting text 
page-by-page while strictly preserving source and page metadata.
"""

from pathlib import Path
from typing import List
import pymupdf
from pydantic import BaseModel, Field


class DocumentPage(BaseModel):
    """
    Represents the extracted text from a single page of an academic document.
    
    Why Pydantic?
    In AI engineering, passing raw dictionaries (`{"page": 1, ...}`) causes silent bugs.
    Pydantic guarantees strict type validation, autocomplete, and seamless serialization.
    """
    source: str = Field(..., description="Name or path of the source document")
    page_number: int = Field(..., description="1-indexed physical page number (for citations)")
    content: str = Field(..., description="Cleaned textual content of the page")
    char_count: int = Field(..., description="Number of characters in the content")


class PDFExtractionError(Exception):
    """Custom exception raised when PDF extraction fails."""
    pass


def extract_text_from_pdf(file_path: str | Path) -> List[DocumentPage]:
    """
    Extracts text page-by-page from an academic PDF file.

    Args:
        file_path: Absolute or relative path to the target PDF file.

    Returns:
        List[DocumentPage]: A list containing page objects with metadata and content.

    Raises:
        FileNotFoundError: If the PDF does not exist at the given path.
        PDFExtractionError: If the document is corrupted or invalid.
    """
    path = Path(file_path)

    # 1. Defensive programming: Verify file existence before opening
    if not path.exists():
        raise FileNotFoundError(f"PDF file not found at path: {path.resolve()}")

    if path.suffix.lower() != ".pdf":
        raise PDFExtractionError(f"Unsupported file format: '{path.suffix}'. Expected a '.pdf' file.")

    extracted_pages: List[DocumentPage] = []

    try:
        # 2. Open the document using PyMuPDF's C-bindings (extremely fast)
        doc = pymupdf.open(path)

        # 3. Iterate page-by-page to keep page numbers coupled to their text
        for page_idx in range(len(doc)):
            page = doc[page_idx]

            # Extract text using layout-aware plain text extraction
            raw_text = page.get_text("text")

            # Clean whitespace: strip leading/trailing, normalize blank lines
            cleaned_text = raw_text.strip()

            # 4. Check for scanned / non-OCR pages
            # In academic notes, students often scan handwritten pages.
            # If text is empty, we still track the page to alert downstream processes.
            page_obj = DocumentPage(
                source=path.name,
                page_number=page_idx + 1,  # Note: Humans read 1-indexed pages (Page 1, not Page 0)
                content=cleaned_text,
                char_count=len(cleaned_text),
            )
            extracted_pages.append(page_obj)

        doc.close()

    except Exception as e:
        if isinstance(e, FileNotFoundError) or isinstance(e, PDFExtractionError):
            raise e
        raise PDFExtractionError(f"Failed to extract text from {path.name}: {str(e)}") from e

    return extracted_pages


if __name__ == "__main__":
    # Quick self-test demonstration
    print("PDF Extractor service loaded successfully.")
