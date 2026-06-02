#!/bin/bash
set -euo pipefail

APPROVED_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}/ai-bus/approved"

if [ ! -d "$APPROVED_DIR" ]; then
  exit 0
fi

PENDING=$(find "$APPROVED_DIR" -name "*.md" -type f | sort 2>/dev/null)

if [ -z "$PENDING" ]; then
  exit 0
fi

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║       AI-BUS: GODKÄNDA FÖRSLAG VÄNTAR                   ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Följande filer i ai-bus/approved/ ska implementeras:"
echo ""
while IFS= read -r file; do
  title=$(grep -m1 "^title:" "$file" 2>/dev/null | sed 's/title:[[:space:]]*//' | tr -d '"' || echo "")
  severity=$(grep -m1 "^severity:" "$file" 2>/dev/null | sed 's/severity:[[:space:]]*//' || echo "?")
  risk=$(grep -m1 "^risk:" "$file" 2>/dev/null | sed 's/risk:[[:space:]]*//' || echo "?")
  echo "  • $(basename "$file")"
  echo "    Titel: $title"
  echo "    Severity: $severity  |  Risk: $risk"
  echo ""
done <<< "$PENDING"
echo "Implementera dessa enligt agents/claude-review.md innan annat arbete."
echo ""
