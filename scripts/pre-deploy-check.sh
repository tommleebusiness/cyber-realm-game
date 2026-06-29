#!/bin/bash
set -e
echo "=== Pre-deploy Check ==="

# Check file exists
if [ ! -f index.html ]; then
  echo "FAIL: index.html not found"
  exit 1
fi

echo "OK: index.html exists"

# Rule: never use classList or dataset
if grep -q 'classList\|dataset' index.html; then
  echo "FAIL: Forbidden classList/dataset usage detected"
  exit 1
fi
echo "OK: No classList/dataset usage"

# Check tap function exists (health check requirement)
if ! grep -q 'function tap' index.html; then
  echo "FAIL: tap function not found"
  exit 1
fi
echo "OK: tap function exists"

# Check basic HTML structure
if ! grep -q '<!DOCTYPE html>' index.html; then
  echo "FAIL: Missing DOCTYPE"
  exit 1
fi
if ! grep -q '</html>' index.html; then
  echo "FAIL: Missing closing html tag"
  exit 1
fi
echo "OK: HTML structure valid"

echo ""
echo "=== All checks passed ==="
