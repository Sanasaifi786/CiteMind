# 📚 CiteMind — RAG-Powered Academic Research & Study Assistant

[![Live Frontend](https://img.shields.io/badge/Frontend-Vercel-black?style=for-the-badge&logo=vercel)](https://cite-mind-omega.vercel.app/)
[![Backend API](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render)](https://citemind-yhfg.onrender.com/api/health)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev)
[![FAISS](https://img.shields.io/badge/Vector_DB-FAISS-00599C?style=for-the-badge)](https://github.com/facebookresearch/faiss)
[![Groq](https://img.shields.io/badge/LLM-Groq_Cloud-F55036?style=for-the-badge)](https://groq.com)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

> **CiteMind** is an end-to-end Retrieval-Augmented Generation (RAG) platform tailored for academic study. It transforms lecture notes, research textbooks, and slides into an interactive, verifiable AI tutor that provides answers with **exact, 1-indexed page citations** and a live split-screen PDF preview.

---

## 🌐 Live Deployments

- **🚀 Web Application (Frontend):** [https://cite-mind-omega.vercel.app/](https://cite-mind-omega.vercel.app/)
- **⚡ REST API Documentation (Swagger):** [https://citemind-yhfg.onrender.com/docs](https://citemind-yhfg.onrender.com/docs)
- **🩺 API Health Endpoint:** [https://citemind-yhfg.onrender.com/api/health](https://citemind-yhfg.onrender.com/api/health)

---

## 💡 The Problem & The CiteMind Solution

| The Typical AI Problem | The CiteMind Solution |
| :--- | :--- |
| **Hallucinations:** Generic LLMs invent facts, formulas, and references when answering questions on complex textbooks. | **Strict Grounding:** The RAG pipeline retrieves relevant text chunks directly from the student's uploaded material, instructing the LLM to ground its reasoning exclusively on verified evidence. |
| **Black-Box Answers:** Chatbots state answers without showing students where the knowledge originated. | **Verified Page Citations:** Every answer links directly to its source document and exact 1-indexed page number (e.g., `[Source: operating_systems.pdf, Page: 4]`). |
| **Context Switching:** Students have to constantly flip back and forth between a PDF reader and an AI chat window. | **Split-Screen Source Inspector:** Clicking any citation badge automatically opens a live PDF reader iframe jumping directly to that exact page. |

---

## 🌟 Key Features

### 1. Page-Preserving Multi-Stage PDF Ingestion
- **Extraction:** Powered by PyMuPDF (`fitz`), preserving page boundaries and font layouts.
- **Sliding-Window Chunking:** 300-word chunks with a 60-word overlap to ensure semantic continuity across sentence breaks.
- **Real-Time Visual Stepper:** UI gives dynamic visual feedback across 4 pipeline stages (*Extract ➔ Chunk ➔ Embed ➔ Indexed*).

### 2. High-Performance Dense Vector Search
- **Embeddings:** Local `sentence-transformers/all-MiniLM-L6-v2` generating 384-dimensional dense vectors.
- **Vector Index:** Native C++ **FAISS** (`IndexFlatIP`) utilizing inner-product dot operations on normalized vectors to compute cosine similarities in milliseconds.
- **Document Scoping:** Supports querying across the entire library or restricting search to a specific document.

### 3. ChatGPT-Style Academic Q&A Workspace
- **Rich Markdown Formatting:** Powered by `react-markdown` with syntax highlighting, step-by-step mathematical reasoning, bold headers, and structured tables.
- **Interactive Quick-Starters:** Dynamic prompt suggestions tailored to newly uploaded documents.
- **One-Click Clipboard Copy:** Instant answer copying with visual toast feedback.

### 4. Dual-Mode Source Inspector
- **Chunk Excerpt Mode:** Inspect the raw text fragments and cosine similarity confidence scores matched by the vector store.
- **Live PDF Stream Mode:** An embedded binary stream (`GET /api/documents/{filename}/file#page={N}`) that dynamically navigates to the cited page.

### 5. Multi-Model LLM Resilience
- Integrated with **Groq Cloud** using an automatic multi-model failover strategy:
  1. `openai/gpt-oss-120b` (Primary high-reasoning engine)
  2. `openai/gpt-oss-20b` (Ultra-low latency fallback)
  3. `qwen/qwen3.8-27b` (High-density factual fallback)

### 6. Full Chat Session Persistence
- Built-in SQLite database storing conversation sessions, message histories, verified citation payloads, and query response latencies.
- Legacy mock data purged; only real user interactions are preserved.

---

## 🏗️ Architecture & Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DOCUMENT INGESTION FLOW                           │
└─────────────────────────────────────────────────────────────────────────────┘
  Academic PDF ──▶ PyMuPDF Extractor ──▶ Sliding-Window Chunker (300w / 60w)
                         │
                         ▼
             SentenceTransformer (all-MiniLM-L6-v2) ──▶ 384-d Vectors
                         │
                         ▼
             FAISS Vector Store (IndexFlatIP) + Pickle Metadata
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           QUERY & ANSWERING FLOW                            │
└─────────────────────────────────────────────────────────────────────────────┘
  User Question ──▶ Query Vectorizer (384-d)
                          │
                          ▼
             FAISS Cosine Similarity Search (Candidate K = 16, Top K = 5)
                          │
                          ▼
             Context Assembly + Page Citation Anchoring
                          │
                          ▼
             Groq LLM Engine (Llama 3.3 / GPT-OSS Tutor Prompt)
                          │
                          ▼
  ChatGPT-Style Answer + Citation Badges + Live PDF Viewer Jump (#page=N)
```

---

## 🛠️ Tech Stack & Directory Structure

```
CiteMind/
├── .env.example                     # Environment template for local and cloud deployment
├── docker-compose.yml               # Unified multi-container Docker Compose configuration
├── main.py                          # Root fail-safe entrypoint for cloud providers
│
├── backend/                         # FastAPI RAG Backend
│   ├── Dockerfile                   # Python 3.12-slim production container
│   ├── requirements.txt             # Backend dependencies (FastAPI, PyMuPDF, FAISS, Groq)
│   ├── main.py                      # Backend launcher with dynamic $PORT binding
│   ├── src/
│   │   ├── main.py                  # FastAPI app factory, CORS, and router registration
│   │   ├── api/
│   │   │   └── routes.py            # REST endpoints (/upload, /ask, /documents, /history)
│   │   └── services/
│   │       ├── extractor.py         # PyMuPDF page-preserving text extraction
│   │       ├── chunker.py           # Sliding-window document chunking
│   │       ├── embedder.py          # SentenceTransformer singleton (all-MiniLM-L6-v2)
│   │       ├── vector_store.py      # FAISS IndexFlatIP index and metadata manager
│   │       ├── retriever.py         # Cosine candidate filtering and document scoping
│   │       ├── rag_pipeline.py      # System prompt, context builder, and grounded answering
│   │       ├── llm.py               # Groq client with multi-model automatic failover
│   │       └── history_db.py        # SQLite persistent chat sessions and messages
│   └── data/                        # Local data directory (ignored by git)
│       ├── uploads/                 # Stored PDF binaries
│       ├── vector_store/            # index.faiss & metadata.pkl
│       └── citemind.db              # SQLite chat database
│
└── frontend/                        # React 19 + Vite Frontend
    ├── Dockerfile                   # Multi-stage build with Nginx SPA routing
    ├── vercel.json                  # Single Page Application (SPA) routing rewrites
    ├── package.json                 # Dependencies (React 19, Lucide, ReactMarkdown)
    ├── vite.config.js               # Vite build configuration
    └── src/
        ├── App.jsx                  # React Router client navigation
        ├── services/
        │   └── api.js               # Axios/Fetch API client connected to backend
        ├── pages/
        │   ├── LandingPage.jsx      # Hero, live mockup, comparison table, FAQ, footer
        │   ├── AuthPage.jsx         # 50/50 split authentication layout
        │   ├── LibraryPage.jsx      # Drag-and-drop dropzone with 4-stage stepper
        │   ├── AskPage.jsx          # Conversational workspace with markdown & citations
        │   ├── HistoryPage.jsx      # Chronologically grouped sessions with resume action
        │   └── SettingsPage.jsx     # Preferences, answer length, cache management
        └── components/
            ├── landing/             # Navbar, Hero, FeatureGrid, Comparison, Footer
            └── workspace/           # Sidebar, SourcePanel (live PDF stream & excerpts)
```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System health, indexed vector count, and Groq status. |
| `POST` | `/api/upload` | Multipart PDF upload, text extraction, chunking, and FAISS indexing. |
| `POST` | `/api/ask` | Natural language grounded Q&A with document scoping and citations. |
| `GET` | `/api/documents` | List of all indexed documents with page and chunk metrics. |
| `GET` | `/api/documents/{filename}/file` | Binary PDF streaming endpoint with byte-range support for viewer iframes. |
| `DELETE`| `/api/documents/{filename}` | Deletes a document and its corresponding vectors from the index. |
| `GET` | `/api/history` | Retrieves persistent chat sessions (supports `?document=` scoping). |
| `POST` | `/api/history/session` | Creates a new chat session thread. |
| `DELETE`| `/api/history/{session_id}` | Deletes a conversation thread and cascading messages. |

---

## 🚀 Local Development Setup

### Prerequisites
- **Python:** 3.10+ (Recommended: 3.12)
- **Node.js:** 18+ (Recommended: 20+)
- **Groq API Key:** Free key available at [console.groq.com/keys](https://console.groq.com/keys)

### 1. Clone the Repository
```bash
git clone https://github.com/Sanasaifi786/CiteMind.git
cd CiteMind
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv .venv

# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and paste your GROQ_API_KEY=gsk_...

# Start FastAPI backend
python main.py
# Server will start on http://127.0.0.1:8000 (Docs: http://127.0.0.1:8000/docs)
```

### 3. Frontend Setup
Open a new terminal:
```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
# Frontend will start on http://localhost:5173
```

---

## 🐳 Running with Docker Compose

You can spin up both the backend API and frontend Nginx server with a single command:

```bash
# In the project root, create your environment file
cp .env.example .env
# Add your GROQ_API_KEY in .env

# Build and start all containers
docker compose up --build
```
- Frontend: `http://localhost`
- Backend API: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`

---

## ☁️ Deployment Guide

### Frontend (Vercel)
1. Import repository on [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Framework Preset: `Vite`.
4. Add Environment Variable:
   - `VITE_API_URL` = `https://your-backend.onrender.com/api`
5. Click **Deploy**.

### Backend (Render)
1. Create a new **Web Service** on [Render](https://render.com).
2. Root Directory: `backend`.
3. Runtime: `Python 3`.
4. Build Command: `pip install -r requirements.txt`.
5. Start Command: `python main.py`.
6. Add Environment Variables:
   - `GROQ_API_KEY` = `gsk_...`
   - `DEFAULT_LLM_MODEL` = `openai/gpt-oss-120b`
7. Click **Deploy Web Service**.

---

## 🛡️ License

This project is licensed under the **MIT License** — feel free to use it for learning, research, or commercial applications.
