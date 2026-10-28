"""
CiteMind Persistent Chat History & Session Database Service.

Uses SQLite to persist conversation threads, user questions, AI answers,
verified citations, and latency telemetry across sessions.
"""

from datetime import datetime, timezone
import json
from pathlib import Path
import sqlite3
from typing import Any, Dict, List, Optional
import uuid

# SQLite database file path anchored in backend/data/citemind.db
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
DB_PATH = BACKEND_DIR / "data" / "citemind.db"


class HistoryDB:
    """
    Manages persistent SQLite connection and operations for chat history.
    """

    def __init__(self, db_path: Path = DB_PATH):
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_schema()
        self._seed_initial_data_if_empty()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        return conn

    def _init_schema(self):
        """Creates sessions and messages tables with index performance optimizations."""
        with self._get_connection() as conn:
            cursor = conn.cursor()

            # Chat Sessions table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS chat_sessions (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                subject TEXT NOT NULL,
                document_name TEXT DEFAULT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                message_count INTEGER DEFAULT 0
            );
            """)

            # Migration check for document_name column on existing databases
            cursor.execute("PRAGMA table_info(chat_sessions);")
            cols = [row[1] for row in cursor.fetchall()]
            if "document_name" not in cols:
                cursor.execute("ALTER TABLE chat_sessions ADD COLUMN document_name TEXT DEFAULT NULL;")

            # Chat Messages table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS chat_messages (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                sender TEXT NOT NULL,
                text TEXT NOT NULL,
                has_sufficient_context INTEGER DEFAULT 1,
                citations_json TEXT DEFAULT '[]',
                total_time_ms REAL DEFAULT 0.0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
            );
            """)

            cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_session ON chat_messages(session_id);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_sessions_updated ON chat_sessions(updated_at DESC);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_sessions_doc ON chat_sessions(document_name);")
            
            # Clean up any legacy dummy DBMS session_1 from database
            cursor.execute("DELETE FROM chat_messages WHERE session_id = 'session_1';")
            cursor.execute("DELETE FROM chat_sessions WHERE id = 'session_1';")
            
            conn.commit()

    def _seed_initial_data_if_empty(self):
        """Clean slate: No fake mock data. Chat threads are generated strictly from user interactions."""
        pass

    def get_all_sessions(self) -> List[Dict[str, Any]]:
        """Returns all chat sessions ordered by most recently updated."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, title, subject, document_name, created_at, updated_at, message_count
                FROM chat_sessions
                ORDER BY updated_at DESC;
            """)
            rows = cursor.fetchall()
            return [dict(row) for row in rows]

    def get_sessions_by_document(self, document_name: str) -> List[Dict[str, Any]]:
        """Retrieves sessions associated with a specific uploaded document."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, title, subject, document_name, created_at, updated_at, message_count
                FROM chat_sessions
                WHERE document_name = ?
                ORDER BY updated_at DESC;
            """, (document_name,))
            rows = cursor.fetchall()
            return [dict(row) for row in rows]

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves session metadata by ID."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM chat_sessions WHERE id = ?;", (session_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def create_session(
        self,
        title: str,
        subject: str = "General",
        document_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """Creates a new chat session tied optionally to an academic document."""
        session_id = f"session_{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc).isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO chat_sessions (id, title, subject, document_name, created_at, updated_at, message_count)
                VALUES (?, ?, ?, ?, ?, ?, 0);
            """, (session_id, title, subject, document_name, now, now))
            conn.commit()
            return {
                "id": session_id,
                "title": title,
                "subject": subject,
                "document_name": document_name,
                "created_at": now,
                "updated_at": now,
                "message_count": 0
            }

    def add_message(
        self,
        session_id: str,
        sender: str,
        text: str,
        has_sufficient_context: bool = True,
        citations: Optional[List[Dict[str, Any]]] = None,
        total_time_ms: float = 0.0
    ) -> Dict[str, Any]:
        """Appends a message to a session and updates the session's updated_at timestamp."""
        msg_id = f"msg_{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc).isoformat()
        citations_json = json.dumps(citations or [])

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO chat_messages (id, session_id, sender, text, has_sufficient_context, citations_json, total_time_ms, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?);
            """, (msg_id, session_id, sender, text, 1 if has_sufficient_context else 0, citations_json, total_time_ms, now))

            # Update session's updated_at and increment message_count
            cursor.execute("""
                UPDATE chat_sessions
                SET updated_at = ?, message_count = message_count + 1
                WHERE id = ?;
            """, (now, session_id))

            conn.commit()

            return {
                "id": msg_id,
                "session_id": session_id,
                "sender": sender,
                "text": text,
                "has_sufficient_context": has_sufficient_context,
                "citations": citations or [],
                "total_time_ms": total_time_ms,
                "created_at": now
            }

    def get_session_messages(self, session_id: str) -> List[Dict[str, Any]]:
        """Retrieves all messages for a given session in chronological order."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, session_id, sender, text, has_sufficient_context, citations_json, total_time_ms, created_at
                FROM chat_messages
                WHERE session_id = ?
                ORDER BY created_at ASC;
            """, (session_id,))
            rows = cursor.fetchall()
            
            messages = []
            for r in rows:
                cites = []
                try:
                    cites = json.loads(r["citations_json"])
                except Exception:
                    pass

                messages.append({
                    "id": r["id"],
                    "session_id": r["session_id"],
                    "sender": r["sender"],
                    "text": r["text"],
                    "has_sufficient_context": bool(r["has_sufficient_context"]),
                    "citations": cites,
                    "total_time_ms": r["total_time_ms"],
                    "created_at": r["created_at"]
                })
            return messages

    def delete_session(self, session_id: str) -> bool:
        """Deletes a chat session and all cascading messages."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM chat_messages WHERE session_id = ?;", (session_id,))
            cursor.execute("DELETE FROM chat_sessions WHERE id = ?;", (session_id,))
            conn.commit()
            return cursor.rowcount > 0


# Global singleton instance
_history_db_instance: Optional[HistoryDB] = None

def get_history_db() -> HistoryDB:
    global _history_db_instance
    if _history_db_instance is None:
        _history_db_instance = HistoryDB()
    return _history_db_instance
