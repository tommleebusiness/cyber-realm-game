#!/usr/bin/env python3
"""
Cyber Realm — Game API Server
Lightweight HTTP server for user data, achievements, and leaderboard.
Runs on port 8765.
"""

import os
import sys
import json
import sqlite3
import hashlib
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path

DB_PATH = Path(r"C:\Users\Komp\.openclaw\workspace\cyber-realm-game\data\users.db")
PORT = 8765

def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def hash_pw(pw):
    return hashlib.sha256(pw.encode()).hexdigest()

class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # Suppress logs

    def send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def read_body(self):
        length = int(self.headers.get("Content-Length", 0))
        return json.loads(self.rfile.read(length)) if length > 0 else {}

    def do_OPTIONS(self):
        self.send_json({})

    def do_GET(self):
        path = self.path.split("?")[0]

        if path == "/api/health":
            self.send_json({"status": "ok", "time": datetime.utcnow().isoformat()})

        elif path == "/api/leaderboard":
            sort = self.path.split("sort=")[-1].split("&")[0] if "sort=" in self.path else "credits"
            conn = get_db()
            col = {"credits": "total_credits", "taps": "total_taps", "level": "realm_level",
                   "bosses": "bosses_killed", "prestige": "prestige_count", "combo": "combo_max"}.get(sort, "total_credits")
            rows = conn.execute(
                f"SELECT username, total_credits, total_taps, realm_level, bosses_killed, "
                f"prestige_count, combo_max, luck, gm, cps FROM users ORDER BY {col} DESC LIMIT 100"
            ).fetchall()
            conn.close()
            self.send_json({"players": [dict(r) for r in rows], "sort": sort})

        elif path == "/api/user":
            username = self.path.split("user=")[-1].split("&")[0] if "user=" in self.path else ""
            conn = get_db()
            user = conn.execute("SELECT * FROM users WHERE username=?", (username,)).fetchone()
            if user:
                achs = conn.execute(
                    "SELECT achievement_id, achievement_name, unlocked_at FROM achievements WHERE user_id=?",
                    (user["id"],)
                ).fetchall()
                self.send_json({"user": dict(user), "achievements": [dict(a) for a in achs]})
            else:
                self.send_json({"error": "User not found"}, 404)
            conn.close()

        elif path == "/api/analytics":
            conn = get_db()
            total = conn.execute("SELECT COUNT(*) as c FROM users").fetchone()["c"]
            wishes = conn.execute("SELECT category, COUNT(*) as c FROM wishlist WHERE status='pending' GROUP BY category ORDER BY c DESC").fetchall()
            sentiments = conn.execute("SELECT sentiment, COUNT(*) as c FROM chat_messages GROUP BY sentiment").fetchall()
            top_wishes = conn.execute("SELECT wish, category, priority FROM wishlist WHERE status='pending' ORDER BY priority DESC LIMIT 10").fetchall()
            conn.close()
            self.send_json({
                "total_users": total,
                "wish_categories": {r["category"]: r["c"] for r in wishes},
                "sentiments": {r["sentiment"]: r["c"] for r in sentiments},
                "top_wishes": [dict(w) for w in top_wishes]
            })

        elif path == "/api/wishes":
            conn = get_db()
            rows = conn.execute(
                "SELECT username, wish, category, priority, created_at FROM wishlist "
                "WHERE status='pending' ORDER BY priority DESC LIMIT 50"
            ).fetchall()
            conn.close()
            self.send_json({"wishes": [dict(r) for r in rows]})

        else:
            self.send_json({"error": "Not found"}, 404)

    def do_POST(self):
        path = self.path.split("?")[0]
        body = self.read_body()

        if path == "/api/register":
            username = body.get("username", "").strip()
            password = body.get("password", "")
            if not username or not password or len(username) < 3 or len(password) < 4:
                self.send_json({"error": "Invalid input"}, 400)
                return
            conn = get_db()
            now = datetime.utcnow().isoformat()
            try:
                conn.execute("INSERT INTO users (username, password_hash, created_at, last_login) VALUES (?,?,?,?)",
                           (username, hash_pw(password), now, now))
                conn.commit()
                self.send_json({"ok": True, "message": "Registered"})
            except sqlite3.IntegrityError:
                self.send_json({"error": "Username taken"}, 409)
            finally:
                conn.close()

        elif path == "/api/login":
            username = body.get("username", "")
            password = body.get("password", "")
            conn = get_db()
            row = conn.execute("SELECT id FROM users WHERE username=? AND password_hash=?",
                             (username, hash_pw(password))).fetchone()
            if row:
                conn.execute("UPDATE users SET last_login=?, sessions_count=sessions_count+1 WHERE id=?",
                           (datetime.utcnow().isoformat(), row["id"]))
                conn.commit()
                self.send_json({"ok": True, "user_id": row["id"]})
            else:
                self.send_json({"error": "Invalid credentials"}, 401)
            conn.close()

        elif path == "/api/save":
            user_id = body.get("user_id")
            stats = body.get("stats", {})
            if not user_id:
                self.send_json({"error": "No user_id"}, 400)
                return
            conn = get_db()
            conn.execute("""
                UPDATE users SET total_credits=?, total_taps=?, realm_level=?,
                bosses_killed=?, prestige_count=?, combo_max=?, luck=?, gm=?,
                tap_power=?, cps=?, last_login=?
                WHERE id=?
            """, (
                stats.get("credits", 0), stats.get("taps", 0), stats.get("realm_level", 1),
                stats.get("bosses_killed", 0), stats.get("prestige", 0), stats.get("combo_max", 0),
                stats.get("luck", 1.0), stats.get("gm", 1.0), stats.get("tap_power", 1.0),
                stats.get("cps", 0.0), datetime.utcnow().isoformat(), user_id
            ))
            conn.commit()
            conn.close()
            self.send_json({"ok": True})

        elif path == "/api/achievement":
            user_id = body.get("user_id")
            ach_id = body.get("achievement_id", "")
            ach_name = body.get("achievement_name", "")
            if not user_id or not ach_id:
                self.send_json({"error": "Missing data"}, 400)
                return
            conn = get_db()
            try:
                conn.execute("INSERT INTO achievements (user_id, achievement_id, achievement_name, unlocked_at) VALUES (?,?,?,?)",
                           (user_id, ach_id, ach_name, datetime.utcnow().isoformat()))
                conn.commit()
                self.send_json({"ok": True})
            except sqlite3.IntegrityError:
                self.send_json({"ok": True, "message": "Already unlocked"})
            finally:
                conn.close()

        elif path == "/api/chat":
            username = body.get("username", "anonymous")
            message = body.get("message", "")
            is_dev = body.get("is_dev_chat", False)
            if not message:
                self.send_json({"error": "No message"}, 400)
                return
            conn = get_db()
            now = datetime.utcnow().isoformat()
            sentiment = "neutral"
            msg_lower = message.lower()
            if any(w in msg_lower for w in ["круто", "класс", "супер", "отлично", "love", "great", "awesome"]):
                sentiment = "positive"
            elif any(w in msg_lower for w in ["плохо", "баг", "ошибка", "сломал", "bad", "bug", "broken"]):
                sentiment = "negative"
            category = "general"
            if any(w in msg_lower for w in ["босс", "boss"]): category = "bosses"
            elif any(w in msg_lower for w in ["улучш", "upgrade"]): category = "upgrades"
            elif any(w in msg_lower for w in ["эффект", "анимац", "effect"]): category = "effects"
            conn.execute("INSERT INTO chat_messages (username, message, is_dev_chat, sentiment, category, created_at) VALUES (?,?,?,?,?,?)",
                       (username, message, 1 if is_dev else 0, sentiment, category, now))
            conn.commit()
            conn.close()
            self.send_json({"ok": True})

        elif path == "/api/wish":
            username = body.get("username", "anonymous")
            wish = body.get("wish", "")
            category = body.get("category", "general")
            if not wish:
                self.send_json({"error": "No wish"}, 400)
                return
            conn = get_db()
            priority = 2 if category in ["bosses", "upgrades", "effects"] else 1
            conn.execute("INSERT INTO wishlist (username, wish, category, priority, status, created_at) VALUES (?,?,?,?,?,?)",
                       (username, wish, category, priority, "pending", datetime.utcnow().isoformat()))
            conn.commit()
            conn.close()
            self.send_json({"ok": True})

        else:
            self.send_json({"error": "Not found"}, 404)


def run():
    # Init DB if needed
    from db import init_db
    init_db()

    server = HTTPServer(("127.0.0.1", PORT), Handler)
    print(f"OWL API Server running on http://127.0.0.1:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped")
        server.server_close()

if __name__ == "__main__":
    run()
