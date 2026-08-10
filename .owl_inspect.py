import json, io, sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

issues = json.load(open('.owl_tmp_issues.json'))
labels = json.load(open('.owl_tmp_labels.json'))

print("=== Issues (open, no label filter):", len(issues), "===")
for i in issues:
    names = [l['name'] for l in i.get('labels', [])]
    print(f"#{i['number']} title={i['title']!r} labels={names}")

print()
print("=== Labels:", len(labels), "===")
for l in labels:
    print("  ", repr(l['name']))