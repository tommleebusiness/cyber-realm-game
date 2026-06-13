import json
import re
import urllib.request
import os
from datetime import datetime

# Get token from environment
token = os.environ.get('GH_TOKEN')
if not token:
    token = os.environ.get('GITHUB_TOKEN')
if not token:
    print('ERROR: No GitHub token found in environment', file=sys.stderr)
    exit(1)

# Fetch issues from GitHub API
url = "https://api.github.com/repos/tommleebusiness/cyber-realm-game/issues?state=open&per_page=100"
req = urllib.request.Request(url)
req.add_header('Authorization', f'token {token}')
req.add_header('Accept', 'application/vnd.github.v3+json')

try:
    with urllib.request.urlopen(req) as response:
        data = response.read()
        issues = json.loads(data)
except Exception as e:
    print(f'ERROR: Failed to fetch issues from GitHub API: {e}', file=sys.stderr)
    exit(1)

# Filter issues with title starting with 🏆
filtered_issues = [issue for issue in issues if issue.get('title', '').startswith('🏆')]

players = []
for issue in filtered_issues:
    title = issue.get('title', '')
    body = issue.get('body', '')

    # Remove 🏆 prefix from title
    name = title.replace('🏆', '').strip()

    patterns = {
        'credits': r'\\*\\*Кредиты\\*\\*:\\s*(\\d+)',
        'level': r'\\*\\*Рейм level\\*\\*:\\s*(\\d+)',
        'bosses': r'\\*\\*Боссы count\\*\\*:\\s*(\\d+)',
        'prestige': r'\\*\\*Престиж count\\*\\*:\\s*(\\d+)',
        'achievements': r'\\*\\*Достижения count\\*\\*:\\s*(\\d+)'
    }

    credits = None
    level = None
    bosses = None
    prestige = None
    achievements = None

    for key, pattern in patterns.items():
        match = re.search(pattern, body)
        if match:
            try:
                value = int(match.group(1))
            except:
                value = None
            if key == 'credits':
                credits = value
            elif key == 'level':
                level = value
            elif key == 'bosses':
                bosses = value
            elif key == 'prestige':
                prestige = value
            elif key == 'achievements':
                achievements = value

    if credits is not None:
        players.append({
            'name': name,
            'credits': credits,
            'level': level if level is not None else 0,
            'bosses': bosses if bosses is not None else 0,
            'prestige': prestige if prestige is not None else 0,
            'achievements': achievements if achievements is not None else 0
        })

# Sort by credits descending
players.sort(key=lambda x: x['credits'], reverse=True)

# Keep top 50
top_players = players[:50]

# Prepare the output
output = {
    'updated': datetime.utcnow().isoformat() + 'Z',
    'players': top_players
}

# Write to file
with open('leaderboard.json', 'w') as f:
    json.dump(output, f, indent=2)

print(f'SUCCESS: Updated leaderboard with {len(top_players)} players')