import json
import urllib.request
import os

token = os.environ.get('GH_TOKEN')
if not token:
    token = os.environ.get('GITHUB_TOKEN')
if not token:
    print('ERROR: No GitHub token found in environment')
    exit(1)

url = "https://api.github.com/repos/tommleebusiness/cyber-realm-game/issues?labels=leaderboard&state=all&per_page=100"
req = urllib.request.Request(url)
req.add_header('Authorization', f'token {token}')
req.add_header('Accept', 'application/vnd.github.v3+json')

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read())
        print(f'Issues with label leaderboard: {len(data)}')
        for issue in data:
            print(f"- #{issue['number']}: {issue['title']}")
except Exception as e:
    print(f'ERROR: {e}')