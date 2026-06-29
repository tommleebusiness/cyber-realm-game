#!/bin/bash
# Game Health Check for Cyber Realm Idle
# Exit 0 = HEALTHY, Exit 1 = BROKEN

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo "=== Cyber Realm Game Health Check ==="

# 1. Check index.html exists
if [ ! -f index.html ]; then
  echo "FAIL: index.html not found"
  exit 1
fi
echo "OK: index.html exists"

# 2. Check JS syntax
if ! node scripts/validate.js > /dev/null 2>&1; then
  echo "FAIL: JS syntax validation failed"
  node scripts/validate.js
  exit 1
fi
echo "OK: JS syntax valid"

# 3. Check pre-deploy rules
if ! bash scripts/pre-deploy-check.sh > /dev/null 2>&1; then
  echo "FAIL: Pre-deploy checks failed"
  bash scripts/pre-deploy-check.sh
  exit 1
fi
echo "OK: Pre-deploy checks passed"

# 4. Compare with live version
LIVE_SIZE=$(curl -s https://tommleebusiness.github.io/cyber-realm-game/ | wc -c)
LOCAL_SIZE=$(wc -c < index.html)
echo "OK: Live size=${LIVE_SIZE}, Local size=${LOCAL_SIZE}"

echo ""
echo "=== HEALTHY ==="
exit 0
