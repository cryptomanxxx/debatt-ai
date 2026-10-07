# Python-skripten ligger i python/ (✅149). Lägg mappen på sys.path så att
# testerna kan importera dem som förut (from supabase_utils import ...).
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "python"))
