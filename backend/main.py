import importlib.util
import os
import sys
from pathlib import Path

# Unbuffered output so Render logs display prints in real time
os.environ["PYTHONUNBUFFERED"] = "1"
port = int(os.environ.get("PORT", 10000))
print(f"[CiteMind Backend] Booting server on port {port}...", flush=True)

BACKEND_DIR = Path(__file__).resolve().parent
SRC_DIR = BACKEND_DIR / "src"

for p in [str(BACKEND_DIR), str(SRC_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    spec = importlib.util.spec_from_file_location("citemind_src_main", str(SRC_DIR / "main.py"))
    module = importlib.util.module_from_spec(spec)
    sys.modules["citemind_src_main"] = module
    spec.loader.exec_module(module)
    app = module.app
    print("[CiteMind Backend] Application loaded successfully.", flush=True)
except Exception as e:
    print(f"[CiteMind Backend] Import error: {e}", flush=True)
    raise

if __name__ == "__main__":
    import uvicorn
    print(f"[CiteMind Backend] Starting Uvicorn listener on 0.0.0.0:{port}...", flush=True)
    uvicorn.run(app, host="0.0.0.0", port=port)
