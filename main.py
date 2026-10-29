import importlib.util
import os
import sys
from pathlib import Path

# Unbuffered output so Render logs display prints in real time
os.environ["PYTHONUNBUFFERED"] = "1"
port = int(os.environ.get("PORT", 10000))
print(f"[CiteMind Root] Booting server on port {port}...", flush=True)

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
SRC_DIR = BACKEND_DIR / "src"

for p in [str(ROOT_DIR), str(BACKEND_DIR), str(SRC_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    spec = importlib.util.spec_from_file_location("citemind_src_main", str(SRC_DIR / "main.py"))
    module = importlib.util.module_from_spec(spec)
    sys.modules["citemind_src_main"] = module
    spec.loader.exec_module(module)
    app = module.app
    print("[CiteMind Root] Application loaded successfully.", flush=True)
except Exception as e:
    print(f"[CiteMind Root] Import error: {e}", flush=True)
    raise

if __name__ == "__main__":
    import uvicorn
    print(f"[CiteMind Root] Starting Uvicorn listener on 0.0.0.0:{port}...", flush=True)
    uvicorn.run(app, host="0.0.0.0", port=port)
