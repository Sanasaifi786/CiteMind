import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure backend/src is on python path for clean imports
SRC_DIR = Path(__file__).resolve().parent
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from api.routes import router as api_router

app = FastAPI(
    title="CiteMind API",
    description="RAG-Based Academic Question Answering System with Verified Page Citations",
    version="1.0.0"
)

# Enable CORS for React frontend (Week 3)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Router under /api prefix
app.include_router(api_router, prefix="/api")


@app.get("/")
def read_root():
    return {
        "message": "Welcome to CiteMind API",
        "docs_url": "/docs",
        "health_url": "/api/health"
    }
