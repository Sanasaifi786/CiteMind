/**
 * CiteMind Backend API Client
 * ---------------------------
 * Connects the React frontend to the FastAPI RAG backend at http://127.0.0.1:8000/api
 * 
 * Endpoints:
 * - POST /api/ask      -> Question answering with verified page citations
 * - POST /api/upload   -> Academic PDF ingestion into FAISS vector store
 * - GET  /api/documents-> Library overview and document statistics
 * - GET  /api/health   -> Health and diagnostic probe
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

/**
 * Ask a question against indexed documents via FastAPI
 * @param {string} question - Student's natural language question
 * @param {number} topK - Number of chunks to retrieve (default: 3)
 * @param {number} minScore - Cosine similarity threshold (default: 0.35)
 * @param {string} sessionId - Optional active chat session ID
 * @param {string} documentName - Optional document to scope question to
 */
export async function askQuestion(question, topK = 3, minScore = 0.35, sessionId = null, documentName = null) {
  try {
    const payload = {
      question,
      top_k: topK,
      min_score: minScore,
    };
    if (sessionId) {
      payload.session_id = sessionId;
    }
    if (documentName) {
      payload.document_name = documentName;
    }

    const response = await fetch(`${API_BASE_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Server error: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.error('API /ask request failed:', err.message);
    throw err;
  }
}


/**
 * Upload an academic PDF to the FastAPI ingestion pipeline
 * @param {File} file - PDF file object
 */
export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Upload failed: ${response.status}`);
  }

  return await response.json();
}

/**
 * Fetch all indexed documents from FastAPI
 */
export async function fetchDocumentLibrary() {
  try {
    const response = await fetch(`${API_BASE_URL}/documents`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (err) {
    console.warn('Could not fetch document library from backend:', err.message);
    return null;
  }
}

/**
 * Delete a document and purge its vectors from FAISS
 * @param {string} filename
 */
export async function deleteDocument(filename) {
  try {
    const response = await fetch(`${API_BASE_URL}/documents/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (err) {
    console.warn(`Could not delete document ${filename}:`, err.message);
    return { success: false, message: err.message };
  }
}

/**
 * Returns direct URL to stream the original PDF file, with optional page anchor
 * @param {string} filename
 * @param {number} pageNumber
 */
export function getDocumentFileUrl(filename, pageNumber = null) {
  const base = `${API_BASE_URL}/documents/${encodeURIComponent(filename)}/file`;
  return pageNumber ? `${base}#page=${pageNumber}` : base;
}


/**
 * Health and diagnostics check for backend FastAPI server
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (err) {
    console.warn('Backend /health unreachable:', err.message);
    return { status: 'offline', total_vectors_indexed: 0, embedding_dimension: 384, llm_configured: false };
  }
}

/**
 * Fetch chat sessions from SQLite database, optionally filtered by document
 * @param {string} documentName - Optional document filter
 */
export async function fetchChatHistory(documentName = null) {
  try {
    const url = documentName 
      ? `${API_BASE_URL}/history?document=${encodeURIComponent(documentName)}`
      : `${API_BASE_URL}/history`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (err) {
    console.warn('Could not fetch chat history from backend:', err.message);
    return null;
  }
}

/**
 * Fetch messages for a specific session from SQLite database
 * @param {string} sessionId
 */
export async function fetchSessionDetails(sessionId) {
  try {
    const response = await fetch(`${API_BASE_URL}/history/${sessionId}`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (err) {
    console.warn(`Could not fetch details for session ${sessionId}:`, err.message);
    return null;
  }
}

/**
 * Create a new chat session in SQLite database
 * @param {string} title
 * @param {string} subject
 */
export async function createChatSession(title, subject = 'General') {
  try {
    const response = await fetch(`${API_BASE_URL}/history/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, subject }),
    });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (err) {
    console.warn('Could not create chat session on backend:', err.message);
    return { id: `session_${Date.now()}`, title, subject, message_count: 0 };
  }
}

/**
 * Delete a chat session from SQLite database
 * @param {string} sessionId
 */
export async function deleteChatSession(sessionId) {
  try {
    const response = await fetch(`${API_BASE_URL}/history/${sessionId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } catch (err) {
    console.warn(`Could not delete session ${sessionId}:`, err.message);
    return { success: false };
  }
}


