import os
import sys
from pathlib import Path

# Ensure backend and backend/src are on python path regardless of where Render starts
ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
SRC_DIR = BACKEND_DIR / "src"

for p in [str(ROOT_DIR), str(BACKEND_DIR), str(SRC_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from src.main import app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    print(f"[CiteMind] Starting server on 0.0.0.0:{port}...", flush=True)
    uvicorn.run("src.main:app", host="0.0.0.0", port=port, reload=False)
