import os
import sys
from pathlib import Path

# Forwarding entrypoint so running `uvicorn main:app --reload` or `python main.py` works seamlessly
SRC_DIR = Path(__file__).resolve().parent / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from src.main import app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    print(f"[CiteMind] Starting server on 0.0.0.0:{port}...", flush=True)
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
