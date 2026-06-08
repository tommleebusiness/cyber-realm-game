#!/usr/bin/env python3
"""
Cyber Realm — User Database Manager
SQLite-based persistent storage for users, achievements, and analytics.
"""

import os
import json
import sqlite3
import hashlib
from datetime import datetime
from pathlib import Path

DB_PATH = Path(r"C:\Users\Komp\.openclaw\workspace\cyber-realm-game\data\users.db")

def get_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL,
            last_login TEXT NOT NULL,
            total_credits INTEGER DEFAULT 0,
            total_taps INTEGER DEFAULT 0,
            realm_level INTEGER DEFAULT 1,
            bosses_killed INTEGER DEFAULT 0,
            prestige_count INTEGER DEFAULT 0,
            combo_max INTEGER DEFAULT 0,
            luck REAL DEFAULT 1.0,
            gm REAL DEFAULT 1.0,
            tap_power REAL DEFAULT 1.0,
            cps REAL DEFAULT 0.0,
            play_time_seconds INTEGER DEFAULT 0,
            sessions_count INTEGER DEFAULT 1,
            version INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            achievement_id TEXT NOT NULL,
            achievement_name TEXT NOT NULL,
            unlocked_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(user_id, achievement_id)
        );

        CREATE TABLE IF NOT EXISTS upgrades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            upgrade_id INTEGER NOT NULL,
            upgrade_name TEXT NOT NULL,
            level INTEGER DEFAULT 0,
            purchased_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(user_id, upgrade_id)
        );

        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            username TEXT,
            message TEXT NOT NULL,
            is_dev_chat INTEGER DEFAULT 0,
            sentiment TEXT DEFAULT 'neutral',
            category TEXT DEFAULT 'general',
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS wishlist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            username TEXT,
            wish TEXT NOT NULL,
            category TEXT DEFAULT 'general',
            priority INTEGER DEFAULT 0,
            status TEXT DEFAULT 'pending',
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS game_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            started_at TEXT NOT NULL,
            ended_at TEXT,
            taps INTEGER DEFAULT 0,
            credits_earned INTEGER DEFAULT 0,
            bosses_killed INTEGER DEFAULT 0,
            max_combo INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS leaderboard_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            snapshot_at TEXT NOT NULL,
            rankings TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
        CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_messages(user_id);
        CREATE INDEX IF NOT EXISTS idx_wishlist_status ON wishlist(status);
        CREATE INDEX IF NOT EXISTS idx_leaderboard_time ON leaderboard_history(snapshot_at);
    """)
    conn.commit()
    conn.close()
    print(f"Database initialized at {DB_PATH}")

def hash_password(pw):
    return hashlib.sha256(pw.encode()).hexdigest()

def register_user(username, password):
    conn = get_db()
    now = datetime.utcnow().isoformat()
    pw_hash = hash_password(password)
    try:
        conn.execute(
            "INSERT INTO users (username, password_hash, created_at, last_login) VALUES (?,?,?,?)",
            (username, pw_hash, now, now)
        )
        conn.commit()
        print(f"User '{username}' registered")
        return True
    except sqlite3.IntegrityError:
        print(f"User '{username}' already exists")
        return False
    finally:
        conn.close()

def authenticate_user(username, password):
    conn = get_db()
    pw_hash = hash_password(password)
    row = conn.execute(
        "SELECT id FROM users WHERE username=? AND password_hash=?",
        (username, pw_hash)
    ).fetchone()
    conn.close()
    return row["id"] if row else None

def update_user_stats(user_id, stats):
    conn = get_db()
    now = datetime.utcnow().isoformat()
    conn.execute("""
        UPDATE users SET
            total_credits=?, total_taps=?, realm_level=?,
            bosses_killed=?, prestige_count=?, combo_max=?,
            luck=?, gm=?, tap_power=?, cps=?,
            last_login=?, sessions_count=sessions_count+1
        WHERE id=?
    """, (
        stats.get("credits", 0), stats.get("taps", 0), stats.get("realm_level", 1),
        stats.get("bosses_killed", 0), stats.get("prestige", 0), stats.get("combo_max", 0),
        stats.get("luck", 1.0), stats.get("gm", 1.0), stats.get("tap_power", 1.0), stats.get("cps", 0.0),
        now, user_id
    ))
    conn.commit()
    conn.close()

def add_achievement(user_id, ach_id, ach_name):
    conn = get_db()
    now = datetime.utcnow().isoformat()
    try:
        conn.execute(
            "INSERT INTO achievements (user_id, achievement_id, achievement_name, unlocked_at) VALUES (?,?,?,?)",
            (user_id, ach_id, ach_name, now)
        )
        conn.commit()
    except sqlite3.IntegrityError:
        pass  # Already unlocked
    finally:
        conn.close()

def add_chat_message(username, message, is_dev_chat=False):
    conn = get_db()
    now = datetime.utcnow().isoformat()
    # Simple sentiment analysis
    sentiment = "neutral"
    msg_lower = message.lower()
    if any(w in msg_lower for w in ["круто", "класс", "супер", "отлично", "love", "great", "awesome", "good"]):
        sentiment = "positive"
    elif any(w in msg_lower for w in ["плохо", "баг", "ошибка", "сломал", "bad", "bug", "broken", "fix"]):
        sentiment = "negative"

    # Category detection
    category = "general"
    if any(w in msg_lower for w in ["босс", "boss", "враг", "enemy"]):
        category = "bosses"
    elif any(w in msg_lower for w in ["улучш", "upgrade", "апгрейд"]):
        category = "upgrades"
    elif any(w in msg_lower for w in ["эффект", "анимац", "визуал", "effect", "animation"]):
        category = "effects"
    elif any(w in msg_lower for w in ["чат", "owl", "общение", "chat"]):
        category = "chat"
    elif any(w in msg_lower for w in ["донат", "поддержк", "donate"]):
        category = "donations"

    conn.execute(
        "INSERT INTO chat_messages (username, message, is_dev_chat, sentiment, category, created_at) VALUES (?,?,?,?,?,?)",
        (username, message, 1 if is_dev_chat else 0, sentiment, category, now)
    )
    conn.commit()
    conn.close()

    # Auto-extract wishes from negative/positive messages
    if sentiment == "negative" or any(w in msg_lower for w in ["хочу", "добавь", "сделай", "want", "please", "нужно"]):
        add_wishlist(username, message, category)

def add_wishlist(username, wish, category="general"):
    conn = get_db()
    now = datetime.utcnow().isoformat()
    # Calculate priority based on category
    priority = 1
    if category in ["bosses", "upgrades", "effects"]:
        priority = 2
    if "dev" in category or "разработч" in wish.lower():
        priority = 3

    conn.execute(
        "INSERT INTO wishlist (username, wish, category, priority, status, created_at) VALUES (?,?,?,?,?,?)",
        (username, wish, category, priority, "pending", now)
    )
    conn.commit()
    conn.close()

def get_leaderboard(limit=50, sort_by="total_credits"):
    conn = get_db()
    valid_sorts = {
        "total_credits": "total_credits",
        "total_taps": "total_taps",
        "realm_level": "realm_level",
        "bosses_killed": "bosses_killed",
        "prestige_count": "prestige_count",
        "combo_max": "combo_max"
    }
    sort_col = valid_sorts.get(sort_by, "total_credits")

    rows = conn.execute(
        f"SELECT username, total_credits, total_taps, realm_level, bosses_killed, "
        f"prestige_count, combo_max, luck, gm, cps, last_login "
        f"FROM users ORDER BY {sort_col} DESC LIMIT ?",
        (limit,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_user_achievements(username):
    conn = get_db()
    rows = conn.execute(
        "SELECT a.achievement_id, a.achievement_name, a.unlocked_at "
        "FROM achievements a JOIN users u ON a.user_id=u.id "
        "WHERE u.username=? ORDER BY a.unlocked_at DESC",
        (username,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_wishlist(status="pending", limit=20):
    conn = get_db()
    rows = conn.execute(
        "SELECT username, wish, category, priority, status, created_at "
        "FROM wishlist WHERE status=? ORDER BY priority DESC, created_at DESC LIMIT ?",
        (status, limit)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_analytics():
    conn = get_db()
    total_users = conn.execute("SELECT COUNT(*) as c FROM users").fetchone()["c"]
    total_achievements = conn.execute("SELECT COUNT(*) as c FROM achievements").fetchone()["c"]
    total_messages = conn.execute("SELECT COUNT(*) as c FROM chat_messages").fetchone()["c"]
    pending_wishes = conn.execute("SELECT COUNT(*) as c FROM wishlist WHERE status='pending'").fetchone()["c"]

    top_credits = conn.execute("SELECT MAX(total_credits) as v FROM users").fetchone()["v"] or 0
    top_taps = conn.execute("SELECT MAX(total_taps) as v FROM users").fetchone()["v"] or 0
    top_bosses = conn.execute("SELECT MAX(bosses_killed) as v FROM users").fetchone()["v"] or 0

    # Sentiment breakdown
    sentiments = conn.execute(
        "SELECT sentiment, COUNT(*) as c FROM chat_messages GROUP BY sentiment"
    ).fetchall()

    # Category breakdown
    categories = conn.execute(
        "SELECT category, COUNT(*) as c FROM wishlist GROUP BY category ORDER BY c DESC"
    ).fetchall()

    conn.close()
    return {
        "total_users": total_users,
        "total_achievements": total_achievements,
        "total_messages": total_messages,
        "pending_wishes": pending_wishes,
        "top_credits": top_credits,
        "top_taps": top_taps,
        "top_bosses": top_bosses,
        "sentiments": {r["sentiment"]: r["c"] for r in sentiments},
        "wish_categories": {r["category"]: r["c"] for r in categories}
    }

def export_leaderboard_json():
    """Export leaderboard as JSON for the game"""
    lb = get_leaderboard(100, "total_credits")
    data = {
        "updated": datetime.utcnow().isoformat(),
        "players": [
            {
                "name": p["username"],
                "credits": p["total_credits"],
                "taps": p["total_taps"],
                "level": p["realm_level"],
                "bosses": p["bosses_killed"],
                "prestige": p["prestige_count"],
                "combo": p["combo_max"],
                "luck": round(p["luck"], 1),
                "gm": round(p["gm"], 1),
                "cps": round(p["cps"], 1)
            }
            for p in lb
        ]
    }
    output_path = Path(r"C:\Users\Komp\.openclaw\workspace\cyber-realm-game\leaderboard.json")
    output_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return data

if __name__ == "__main__":
    init_db()
    print("DB ready!")
