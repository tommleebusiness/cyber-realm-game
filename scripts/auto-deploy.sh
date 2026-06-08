#!/usr/bin/env bash
# auto-deploy.sh — проверяет изменения и деплоит игру
# Запускается кроном каждые 10 минут

cd /c/Users/Komp/.openclaw/workspace/cyber-realm-game

# Check if there are uncommitted changes
if git diff --quiet && git diff --cached --quiet; then
    echo "No changes to deploy"
    exit 0
fi

echo "Changes detected, running pre-deploy checks..."

# Run pre-deploy check
if ! bash scripts/pre-deploy-check.sh 2>&1; then
    echo "PRE-DEPLOY CHECK FAILED! Not deploying."
    exit 1
fi

echo "Pre-deploy check passed. Committing and pushing..."

# Commit and push
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
git add -A
git commit -m "auto-deploy: ${TIMESTAMP}" 2>&1 || true

if git push 2>&1; then
    echo "Deployed successfully!"
    
    # Send notification to Telegram
    curl -s --max-time 15 --proxy http://127.0.0.1:12334 \
        "https://api.telegram.org/bot8603295219:AAFj5cgwzp69Wo9dVM0hfPxJ2UDQYlxKr7A/sendMessage?chat_id=7819200201&text=Game+deployed%21+Changes+committed+and+pushed+to+GitHub.+Pages+will+update+in+1-3+min." > /dev/null 2>&1
    
    # Update leaderboard.json
    python3 scripts/db.py 2>&1 || true
    
    echo "Done!"
else
    echo "Push failed (network issue). Will retry later."
    exit 1
fi
