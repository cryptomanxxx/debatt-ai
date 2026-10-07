"""
oligarki_snapshot.py — Tar ett omedelbart oligarki-snapshot.

Körs manuellt via GitHub Actions (workflow_dispatch) för att fylla
oligarki_historik när tabellen är tom eller data behövs direkt.
"""
import os, sys
from supabase_utils import ta_oligarki_snapshot

def main():
    sb_key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    if not sb_key:
        print("Saknar Supabase-nyckel.", file=sys.stderr)
        sys.exit(1)
    print("Tar oligarki-snapshot...")
    ta_oligarki_snapshot(sb_key)
    print("✓ Klart — oligarki_historik uppdaterad.")

if __name__ == "__main__":
    main()
