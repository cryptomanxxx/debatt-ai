# auto_fix_test.py
# Deliberately broken script for testing the auto-fix pipeline.
# The syntax error below should be detected and fixed by Claude Code via auto-fix.yml.

import json

def hamta_data()
    data = {"status": "ok", "version": 1}
    return json.dumps(data)

result = hamta_data()
print(result)
