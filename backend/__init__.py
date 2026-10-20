import sys
from pathlib import Path

# Automatically ensure backend root is in sys.path when imported as a package
backend_dir = str(Path(__file__).resolve().parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
