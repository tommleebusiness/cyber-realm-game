#!/usr/bin/env python3
"""Fix crafting panel HTML and leaderboard sync onclick bug"""
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Crafting panel broken string concatenation (line 952)
old1 = """p.innerHTML+='<div class="card"+cls+"" data-cidx=""+i+""><div class="h"><span class="nm">"+c.n+"</span><span class="lv">"+c.cost.gems+" гемов</span></div><div class="d">"+c.d+"</div><div class="c">"+costStr+"</div></div>';"""
new1 = """p.innerHTML+='<div class="card'+cls+'" data-cidx="'+i+'"><div class="h"><span class="nm">'+c.n+'</span><span class="lv">'+c.cost.gems+' гемов</span></div><div class="d">'+c.d+'</div><div class="c">'+costStr+'</div></div>';"""

if old1 in content:
    content = content.replace(old1, new1)
    print("Fix 1 APPLIED: Crafting panel HTML string concatenation")
else:
    print("Fix 1 NOT FOUND - checking escape variants...")
    # Try finding the line with grep-like approach
    for i, line in enumerate(content.split('\n')):
        if 'data-cidx' in line and 'innerHTML' in line:
            print(f"  Found on line {i+1}: {repr(line.strip())}")

# Fix 2: lb-sync onclick syntax error (line 1104)
old2 = """id("lb-sync").onclick(function(){syncLeaderboard(this)});"""
new2 = """id("lb-sync").onclick=function(){syncLeaderboard(this)};"""

if old2 in content:
    content = content.replace(old2, new2)
    print("Fix 2 APPLIED: Leaderboard sync onclick syntax")
else:
    print("Fix 2 NOT FOUND")
    for i, line in enumerate(content.split('\n')):
        if 'lb-sync' in line and 'onclick' in line:
            print(f"  Found on line {i+1}: {repr(line.strip())}")

# Fix 3: Version bump
old3 = 'var GAME_VERSION="9.5";'
new3 = 'var GAME_VERSION="9.6";'
if old3 in content:
    content = content.replace(old3, new3)
    print("Fix 3 APPLIED: Version 9.5 -> 9.6")
else:
    print("Fix 3 NOT FOUND")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("\nFile saved successfully.")
