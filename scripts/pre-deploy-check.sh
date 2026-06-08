#!/usr/bin/env bash
# pre-deploy-check.sh — проверка перед каждым деплоем
# Гарантирует что мы не зальём сломанную игру

set -e
LOCAL_FILE="/c/Users/Komp/.openclaw/workspace/cyber-realm-game/index.html"

echo "=== Pre-Deploy Check ==="

# 1. JS syntax
echo "[1/4] JS syntax..."
JS=$(sed -n '/<script>/,/<\/script>/p' "$LOCAL_FILE" | sed '1d;$d')
echo "$JS" > /tmp/pre_deploy_check.js
if node --check /tmp/pre_deploy_check.js 2>/dev/null; then
    echo "  OK"
else
    echo "  FAIL: JS syntax error!"
    node --check /tmp/pre_deploy_check.js 2>&1
    exit 1
fi

# 2. Closing tags
echo "[2/4] Closing tags..."
if ! grep -q '</html>' "$LOCAL_FILE"; then
    echo "  FAIL: Missing </html>"
    exit 1
fi
if ! grep -q '</script>' "$LOCAL_FILE"; then
    echo "  FAIL: Missing </script>"
    exit 1
fi
echo "  OK"

# 3. Critical functions
echo "[3/4] Critical functions..."
for func in showScreen tap draw saveGame loadGame owlRespond renderLeaderboard; do
    if ! grep -q "function $func" "$LOCAL_FILE"; then
        echo "  FAIL: Missing function $func()"
        exit 1
    fi
done
echo "  OK"

# 4. Critical IDs in HTML
echo "[4/4] Critical IDs..."
for id in login-scr game-scr tpbtn rc rn rd re uname lout chat-scr chmsgs chat-in chat-send bfight; do
    if ! grep -q "id=\"$id\"" "$LOCAL_FILE"; then
        echo "  FAIL: Missing #$id"
        exit 1
    fi
done
echo "  OK"

echo ""
echo "All checks passed! Safe to deploy."
exit 0
