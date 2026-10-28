CiteMind - RAG-Based Academic Question Answering System

Ship a working, resume-worthy RAG product AND build the AI-engineering foundation (embeddings, vector search, retrieval, prompt engineering)

1. High-Level Design (HLD)

1.1 Core idea
User uploads academic PDFs/notes → system extracts & chunks text → chunks are embedded and stored in a vector index → user asks a question → system retrieves the most relevant chunks → an LLM generates an answer grounded in those chunks, citing the source page.

1.2 System architecture
┌─────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   React     │ ───▶ │   FastAPI         │ ───▶ │  LLM API         │
│  (frontend) │ ◀─── │   (backend)       │ ◀─── │ (Groq/Gemini)    │
└─────────────┘      └────────┬──────────┘      └─────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
              ┌─────▼─────┐       ┌───────▼───────┐
              │  Vector    │       │  PostgreSQL /   │
              │  Store     │       │  SQLite         │
              │ (FAISS/    │       │ (users, docs,   │
              │  Chroma)   │       │  chat history)  │
              └────────────┘       └────────────────┘
1.3 Core modules
Document Ingestion — upload PDF/notes, extract text (PyMuPDF/pdfplumber)
Chunking Engine — split extracted text into overlapping chunks (~300–500 tokens)
Embedding Pipeline — convert each chunk into a vector (sentence-transformers)
Vector Store — index and store chunk vectors + metadata (source doc, page number)
Retrieval Engine — given a query, embed it and fetch top-k similar chunks
RAG Answer Generator — construct a prompt from retrieved chunks + question, call LLM, return grounded answer with citations
Auth & Multi-user — JWT login/signup, each user's documents scoped to them
Chat/QA Interface — React frontend: upload page + chat page showing answer + source page reference
(Stretch) Subject-wise folders, chat history persistence, highlight exact source text

2. Tech Stack — and what each piece teaches you

Layer	         Technology	                            What you're learning
Frontend	React + Axios (you already know this)	Wiring a chat UI to an AI backend
Backend	FastAPI	Async APIs, Pydantic models — directly from your roadmap
PDF/Text extraction	PyMuPDF (fitz) or pdfplumber	Real-world unstructured data handling
Chunking	Custom Python (recursive/token-based splitting)	Why chunk size/overlap affects retrieval quality
Embeddings	sentence-transformers (all-MiniLM-L6-v2)	What embeddings are, how semantic similarity works
Vector DB	FAISS (start here) → optionally ChromaDB	Core vector search — the "R" in RAG
LLM API	Groq (Llama 3.3, free & fast) or Gemini free tier	Prompt engineering, grounding, hallucination control
Auth	JWT (you already know this from other projects)	Reused skill, low new-learning cost here
Database	SQLite (dev) → PostgreSQL (prod)	Storing users, doc metadata, chat history
Deployment	Docker, Render/Railway (backend), Vercel (frontend)	Basic DevOps — containerizing an AI app

Why Groq for the LLM: it's free, very fast (good for demos), and uses open models (Llama 3.3) — so your mentor sees you can work with both proprietary and open-weight models.

Why start with FAISS, not a managed vector DB: FAISS forces you to actually understand indexing and similarity search instead of hiding it behind an API — which is the whole point of using this project to build foundations, not just ship features.

3. Day-by-Day Plan (30 Days)


Week 1 — Data Pipeline Foundations (Day 1–7)
Day	Task
1	Repo setup, folder structure, FastAPI skeleton, venv + requirements.txt, finalize this plan with mentor
2	Learn PyMuPDF/pdfplumber; extract text from sample academic PDFs
3	Implement chunking (fixed-size + overlap); test on real notes
4	Learn embeddings conceptually; generate embeddings with sentence-transformers
5	Learn FAISS basics; build a local index, store chunk embeddings + metadata
6	Build retrieval function: query → embed → top-k similarity search
7	Manually test retrieval quality; buffer day; write up Week 1 notes


Week 2 — RAG Core & LLM Integration (Day 8–14)
Day	Task
8	Set up Groq/Gemini API key; test a basic prompt→answer call
9	Learn prompt engineering for RAG (context stuffing, anti-hallucination instructions)
10	Build the full RAG pipeline: query → retrieve → build prompt → LLM → answer
11	Add source citation (doc name + page number) to every answer
12	Expose pipeline as FastAPI endpoints (/upload, /ask)
13	End-to-end backend testing via Postman/curl across multiple PDFs
14	Buffer day; write unit tests for retrieval + generation; document Week 2


Week 3 — Full-Stack Integration (Day 15–21)
Day	Task
15	Wireframe frontend: upload page + chat/QA page
16	Build React upload component, connect to /upload
17	Build chat interface (question box + answer + source display)
18	Implement JWT auth (signup/login)
19	Scope documents per user (each user's vector index/namespace)
20	UI/UX polish — loading states, error handling, empty states
21	Buffer day; full flow test: signup → upload → ask → grounded answer


Week 4 — Deployment, Docs, Demo (Day 22–30)
Day	Task
22	Dockerize backend; docker-compose if needed
23	Deploy backend (Render/Railway)
24	Deploy frontend (Vercel); connect to live backend; test in production
25	Edge case testing — huge PDFs, no-answer-found queries, malformed files
26	Write README + architecture diagram + setup instructions
27	Prepare presentation slides + demo script for mentor review
28	Rehearse/record demo
29	Buffer day for mentor feedback and last-minute fixes
30	Final submission — GitHub repo, report/PPT, live link


4. Learning Checkpoints (so this doubles as your AI foundation)

By the end of this project you should be able to explain, unprompted:

What an embedding is and why cosine similarity is used for retrieval
Why chunk size/overlap changes answer quality
Why RAG reduces hallucination vs a raw LLM call
The trade-offs between FAISS (library) and a managed vector DB
How to write a prompt that forces an LLM to say "I don't know" instead of making things up

These five things are exactly what get probed in AI engineering interviews — so treat explaining them cleanly (in your README and out loud) as part of the deliverable, not an afterthought.

backend run command = uvicorn main:app --reload

Backend endpoints to build: 
POST	/auth/signup	Create account	No
POST	/auth/login	Login, return JWT	No
POST	/auth/refresh	Refresh access token	Refresh token
GET	/auth/me	Current user profile	Yes
POST	/documents/upload	Upload a PDF, kicks off extraction/chunking/embedding	Yes
GET	/documents	List user's documents (with status)	Yes
GET	/documents/{doc_id}	Document metadata (pages, upload date, status)	Yes
GET	/documents/{doc_id}/status	Poll processing status (extracting/chunking/embedding/ready)	Yes
DELETE	/documents/{doc_id}	Delete a document + its vectors	Yes
POST	/folders	Create a subject/folder	Yes
GET	/folders	List folders	Yes
PUT	/folders/{folder_id}	Rename/move folder	Yes
DELETE	/folders/{folder_id}	Delete folder	Yes
POST	/chat/sessions	Start a new chat session (optionally scoped to a doc/folder)	Yes
GET	/chat/sessions	List past sessions	Yes
GET	/chat/sessions/{session_id}/messages	Get message history for a session	Yes
POST	/chat/ask	Core RAG endpoint — question in, grounded answer + citations out	Yes
DELETE	/chat/sessions/{session_id}	Delete a session