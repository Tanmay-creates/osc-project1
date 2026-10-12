import sqlite3
from typing import Generator
from app.config import settings


def get_connection(db_path: str = settings.DATABASE_PATH) -> sqlite3.Connection:
    """Create a new SQLite database connection configured with dictionary row access."""
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def get_db() -> Generator[sqlite3.Connection, None, None]:
    """FastAPI dependency for managing database connections per request."""
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()


def init_db(db_path: str = settings.DATABASE_PATH) -> None:
    """Initialize database tables and run automatic migrations."""
    conn = get_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            completed INTEGER NOT NULL DEFAULT 0,
            priority TEXT NOT NULL DEFAULT 'Medium',
            due_date TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT
        )
    """)
    # Check if due_date column exists in existing database
    cursor.execute("PRAGMA table_info(tasks)")
    columns = [col[1] for col in cursor.fetchall()]
    if "due_date" not in columns:
        cursor.execute("ALTER TABLE tasks ADD COLUMN due_date TEXT")
    conn.commit()
    conn.close()
