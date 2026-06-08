#!/usr/bin/env bash
# notify.sh — отправить уведомление в Telegram
# Использует переменные окружения: TG_BOT_TOKEN, TG_CHAT_ID
# Или читает из /c/Users/Komp/.openclaw/workspace/.env

MSG="${1:-No message}"
WORKSPACE="/c/Users/Komp/.openclaw/workspace"

# Try to get token from .env files
TOKEN=""
CHAT_ID=""

for envf in "$WORKSPACE/.env" "$WORKSPACE/ouroboros/.env" "/c/Users/Komp/.openclaw/openclaw.json"; do
    if [ -f "$envf" ]; then
        T=$(grep -o 'BOT_TOKEN[^"]*"[^"]*"' "$envf" 2>/dev/null | head -1 | sed 's/.*"//')
        if [ -n "$T" ]; then TOKEN="$T"; fi
    fi
done

# Try openclaw.json for telegram config
if [ -z "$TOKEN" ] && [ -f "/c/Users/Komp/.openclaw/openclaw.json" ]; then
    TOKEN=$(python3 -c "import json; d=json.load(open('/c/Users/Komp/.openclaw/openclaw.json')); print(d.get('channels',{}).get('telegram',{}).get('botToken',''))" 2>/dev/null || echo "")
fi

if [ -z "$TOKEN" ]; then
    echo "WARN: No Telegram token found. Logging to file only."
    echo "$(date): $MSG" >> /tmp/game-notifications.log
    exit 0
fi

# Send message
curl -s -X POST "https://api.telegram.org/bot${TOKEN}/sendMessage" \
    -d "chat_id=${CHAT_ID:-7819200201}" \
    -d "text=🎮 Cyber Realm: ${MSG}" \
    -d "parse_mode=HTML" > /dev/null

echo "Notification sent: $MSG"
