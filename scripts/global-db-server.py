#!/usr/bin/env python3
"""
Cyber Realm — Global Database Server
Uses GitHub Gist as a simple global database.
Runs locally, syncs user data to/from GitHub Gist.

Requirements: pip install flask flask-cors requests
Run: python global-db-server.py
"""

import os
import json
import hashlib
import requests
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Config
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
GIST_ID = os.environ.get("GIST_ID", "")  # Will be created on first run
DB_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "global-db.json")

def load_db():
    """Load database from local file"""
    os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
    if os.path.exists(DB_FILE):
        with open(DB_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"users": {}, "leaderboard": [], "version": 1}

def save_db(db):
    """Save database to local file"""
    os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(db, f, ensure_ascii=False, indent=2)

def sync_to_gist(db):
    """Sync database to GitHub Gist"""
    if not GITHUB_TOKEN or not GIST_ID:
        return False
    try:
        url = f"https://api.github.com/gists/{GIST_ID}"
        headers = {
            "Authorization": f"token {GITHUB_TOKEN}",
            "Accept": "application/vnd.github.v3+json"
        }
        data = {
            "files": {
                "cyber-realm-db.json": {
                    "content": json.dumps(db, ensure_ascii=False, indent=2)
                }
            }
        }
        resp = requests.patch(url, headers=headers, json=data, timeout=10)
        return resp.status_code == 200
    except Exception as e:
        print(f"Gist sync error: {e}")
        return False

def sync_from_gist():
    """Load database from GitHub Gist"""
    if not GITHUB_TOKEN or not GIST_ID:
        return None
    try:
        url = f"https://api.github.com/gists/{GIST_ID}"
        headers = {
            "Authorization": f"token {GITHUB_TOKEN}",
            "Accept": "application/vnd.github.v3+json"
        }
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            content = data.get("files", {}).get("cyber-realm-db.json", {}).get("content", "{}")
            return json.loads(content)
    except Exception as e:
        print(f"Gist load error: {e}")
    return None

def create_gist():
    """Create a new GitHub Gist for the database"""
    if not GITHUB_TOKEN:
        return None
    try:
        url = "https://api.github.com/gists"
        headers = {
            "Authorization": f"token {GITHUB_TOKEN}",
            "Accept": "application/vnd.github.v3+json"
        }
        data = {
            "description": "Cyber Realm Idle — Global Database",
            "public": False,
            "files": {
                "cyber-realm-db.json": {
                    "content": json.dumps({"users": {}, "leaderboard": [], "version": 1}, indent=2)
                }
            }
        }
        resp = requests.post(url, headers=headers, json=data, timeout=10)
        if resp.status_code == 201:
            return resp.json().get("id")
    except Exception as e:
        print(f"Gist create error: {e}")
    return None

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "time": datetime.utcnow().isoformat()})

@app.route("/api/register", methods=["POST"])
def register():
    data = request.json
    username = data.get("username", "").strip()
    password = data.get("password", "")
    
    if not username or not password or len(username) < 3 or len(password) < 4:
        return jsonify({"error": "Invalid input"}), 400
    
    db = load_db()
    
    if username in db["users"]:
        return jsonify({"error": "Username taken"}), 409
    
    pw_hash = hashlib.sha256(password.encode()).hexdigest()
    now = datetime.utcnow().isoformat()
    
    db["users"][username] = {
        "username": username,
        "password_hash": pw_hash,
        "created_at": now,
        "last_login": now,
        "stats": {
            "credits": 0, "total_credits": 0, "taps": 0,
            "realm_level": 1, "bosses_killed": 0, "prestige_count": 0,
            "combo_max": 0, "luck": 1.0, "gm": 1.0, "tap_power": 1.0, "cps": 0
        },
        "achievements": [],
        "upgrades": {},
        "quests_completed": [],
        "version": 1
    }
    
    save_db(db)
    sync_to_gist(db)
    
    return jsonify({"ok": True, "message": "Registered", "user_id": username})

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username", "").strip()
    password = data.get("password", "")
    
    db = load_db()
    
    user = db["users"].get(username)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    pw_hash = hashlib.sha256(password.encode()).hexdigest()
    if user["password_hash"] != pw_hash:
        return jsonify({"error": "Invalid password"}), 401
    
    user["last_login"] = datetime.utcnow().isoformat()
    save_db(db)
    
    return jsonify({"ok": True, "user_id": username, "user": user})

@app.route("/api/save", methods=["POST"])
def save():
    data = request.json
    user_id = data.get("user_id", "")
    stats = data.get("stats", {})
    achievements = data.get("achievements", [])
    upgrades = data.get("upgrades", {})
    quests = data.get("quests_completed", [])
    
    db = load_db()
    
    if user_id not in db["users"]:
        return jsonify({"error": "User not found"}), 404
    
    user = db["users"][user_id]
    user["stats"].update(stats)
    user["achievements"] = achievements
    user["upgrades"] = upgrades
    user["quests_completed"] = quests
    user["last_login"] = datetime.utcnow().isoformat()
    
    save_db(db)
    sync_to_gist(db)
    
    return jsonify({"ok": True})

@app.route("/api/leaderboard", methods=["GET"])
def leaderboard():
    sort = request.args.get("sort", "total_credits")
    db = load_db()
    
    players = []
    for username, user in db["users"].items():
        s = user.get("stats", {})
        players.append({
            "name": username,
            "credits": s.get("total_credits", 0),
            "taps": s.get("taps", 0),
            "level": s.get("realm_level", 1),
            "bosses": s.get("bosses_killed", 0),
            "prestige": s.get("prestige_count", 0),
            "combo": s.get("combo_max", 0),
            "luck": s.get("luck", 1.0),
            "gm": s.get("gm", 1.0),
            "cps": s.get("cps", 0)
        })
    
    valid_sorts = {
        "credits": "credits", "taps": "taps", "level": "level",
        "bosses": "bosses", "prestige": "prestige", "combo": "combo"
    }
    sort_key = valid_sorts.get(sort, "credits")
    players.sort(key=lambda x: x.get(sort_key, 0), reverse=True)
    
    return jsonify({"players": players[:100], "sort": sort})

@app.route("/api/user/<username>", methods=["GET"])
def get_user(username):
    db = load_db()
    user = db["users"].get(username)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user})

@app.route("/api/sync", methods=["POST"])
def sync():
    """Force sync from Gist"""
    db = sync_from_gist()
    if db:
        save_db(db)
        return jsonify({"ok": True, "message": "Synced from Gist"})
    return jsonify({"error": "Sync failed"}), 500

if __name__ == "__main__":
    # Try to create gist if not exists
    if GITHUB_TOKEN and not GIST_ID:
        gist_id = create_gist()
        if gist_id:
            print(f"Created Gist: {gist_id}")
            print(f"Set GIST_ID={gist_id} in environment")
    
    print(f"Starting server on port 8765...")
    print(f"Gist ID: {GIST_ID or 'Not set'}")
    app.run(host="127.0.0.1", port=8765, debug=False)
