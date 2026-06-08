#!/usr/bin/env bash
# game-health-check.sh — полная проверка работоспособности игры
# Проверяет: HTTP, JS синтаксис, наличие всех функций, ID элементов, сохранение

set -e
GAME_URL="https://tommleebusiness.github.io/cyber-realm-game/"
LOCAL_FILE="/c/Users/Komp/.openclaw/workspace/cyber-realm-game/index.html"
REPORT="/c/Users/Komp/.openclaw/workspace/cyber-realm-game/health-report.json"
ERRORS=0
WARNINGS=0

echo "=== Cyber Realm Health Check ==="
echo "Time: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

# 1. HTTP check
echo "[1/6] HTTP check..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$GAME_URL" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "  OK: HTTP $HTTP_CODE"
else
    echo "  FAIL: HTTP $HTTP_CODE"
    ERRORS=$((ERRORS+1))
fi

# 2. HTML structure check
echo "[2/6] HTML structure..."
HTML=$(curl -s --max-time 15 "$GAME_URL" 2>/dev/null || echo "")
if echo "$HTML" | grep -q '<!DOCTYPE html>'; then
    echo "  OK: DOCTYPE present"
else
    echo "  FAIL: No DOCTYPE"
    ERRORS=$((ERRORS+1))
fi

if echo "$HTML" | grep -q '</html>'; then
    echo "  OK: Closing </html> present"
else
    echo "  FAIL: Missing </html>"
    ERRORS=$((ERRORS+1))
fi

if echo "$HTML" | grep -q '</script>'; then
    echo "  OK: Closing </script> present"
else
    echo "  FAIL: Missing </script>"
    ERRORS=$((ERRORS+1))
fi

# 3. JS syntax check (extract and validate)
echo "[3/6] JavaScript syntax..."
JS_EXTRACTED=$(echo "$HTML" | sed -n '/<script>/,/<\/script>/p' | sed '1d;$d')
if [ -n "$JS_EXTRACTED" ]; then
    echo "$JS_EXTRACTED" > /tmp/game_check.js
    if node --check /tmp/game_check.js 2>/dev/null; then
        echo "  OK: JS syntax valid"
    else
        JS_ERROR=$(node --check /tmp/game_check.js 2>&1 || true)
        echo "  FAIL: JS syntax error: $JS_ERROR"
        ERRORS=$((ERRORS+1))
    fi
else
    echo "  FAIL: No JS found in page"
    ERRORS=$((ERRORS+1))
fi

# 4. Critical functions check
echo "[4/6] Critical functions..."
CRITICAL_FUNCS=("showScreen" "tap" "draw" "saveGame" "loadGame" "owlRespond" "renderLeaderboard" "chkAch" "fmt" "getCPS")
for func in "${CRITICAL_FUNCS[@]}"; do
    if echo "$HTML" | grep -q "function $func"; then
        echo "  OK: $func()"
    else
        echo "  FAIL: $func() missing!"
        ERRORS=$((ERRORS+1))
    fi
done

# 5. Critical IDs check
echo "[5/6] Critical DOM IDs..."
CRITICAL_IDS=("login-scr" "game-scr" "tpbtn" "rc" "rn" "rd" "re" "uname" "lout" "panel" "pc" "chat-scr" "chmsgs" "chat-in" "chat-send" "bfight" "ov" "prog-fi" "prog-t" "combo-display" "ach-popup")
for id in "${CRITICAL_IDS[@]}"; do
    if echo "$HTML" | grep -q "id=\"$id\""; then
        echo "  OK: #$id"
    else
        echo "  FAIL: #$id missing!"
        ERRORS=$((ERRORS+1))
    fi
done

# 6. Local file check
echo "[6/6] Local file..."
if [ -f "$LOCAL_FILE" ]; then
    LOCAL_LINES=$(wc -l < "$LOCAL_FILE")
    echo "  OK: Local file exists ($LOCAL_LINES lines)"
    # Check local JS too
    LOCAL_JS=$(sed -n '/<script>/,/<\/script>/p' "$LOCAL_FILE" | sed '1d;$d')
    echo "$LOCAL_JS" > /tmp/game_check_local.js
    if node --check /tmp/game_check_local.js 2>/dev/null; then
        echo "  OK: Local JS syntax valid"
    else
        echo "  WARN: Local JS syntax issue"
        WARNINGS=$((WARNINGS+1))
    fi
else
    echo "  WARN: Local file not found"
    WARNINGS=$((WARNINGS+1))
fi

# Summary
echo ""
echo "=== Summary ==="
echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"

if [ $ERRORS -eq 0 ]; then
    echo "STATUS: HEALTHY"
    exit 0
else
    echo "STATUS: BROKEN"
    exit 1
fi
