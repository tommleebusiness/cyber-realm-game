import json
with open('leaderboard.json', 'r') as f:
    data = json.load(f)
print(len(data['players']))