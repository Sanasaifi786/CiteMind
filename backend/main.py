import os
import sys
from pathlib import Path

# Unbuffered output so Render logs display prints in real time
os.environ["PYTHONUNBUFFERED"] = "1"
port = int(os.environ.get("PORT", 10000))
print(f"[CiteMind Backend] Booting server on port {port}...", flush=True)

# Forwarding entrypoint so running `python main.py` from backend/ works seamlessly
SRC_DIR = Path(__file__).resolve().parent / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

try:
    from src.main import app
    print("[CiteMind Backend] Application loaded successfully.", flush=True)
except Exception as e:
    print(f"[CiteMind Backend] Import error: {e}", flush=True)
    raise

if __name__ == "__main__":
    import uvicorn
    print(f"[CiteMind Backend] Starting Uvicorn listener on 0.0.0.0:{port}...", flush=True)
    uvicorn.run(app, host="0.0.0.0", port=port)
