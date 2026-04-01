import sqlite3
import json
from datetime import datetime

DB_PATH = "hireloop.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Seeker Logs
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS agent_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            action_type TEXT,
            payload TEXT,
            timestamp TEXT
        )
    ''')
    conn.commit()
    conn.close()

def log_agent_activity(user_id: str, action: str, result: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO agent_logs (user_id, action_type, payload, timestamp)
        VALUES (?, ?, ?, ?)
    ''', (user_id, action, result, datetime.now().isoformat()))
    conn.commit()
    conn.close()

def get_recent_logs(user_id: str, limit: int = 5):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT action_type, payload, timestamp FROM agent_logs 
        WHERE user_id = ? ORDER BY id DESC LIMIT ?
    ''', (user_id, limit))
    rows = cursor.fetchall()
    conn.close()
    
    return [
        {"action": row[0], "result": row[1], "timestamp": row[2]} 
        for row in rows
    ]

# Initialize on load
init_db()
