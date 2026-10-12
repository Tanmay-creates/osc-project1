import sqlite3
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from app import schemas


def row_to_dict(row: Optional[sqlite3.Row]) -> Optional[dict]:
    if row is None:
        return None
    keys = row.keys()
    return {
        "id": row["id"],
        "title": row["title"],
        "completed": bool(row["completed"]),
        "priority": row["priority"],
        "due_date": row["due_date"] if "due_date" in keys else None,
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def get_current_iso_time() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_task(conn: sqlite3.Connection, task_id: str) -> Optional[dict]:
    """Retrieve a single task by its unique ID."""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
    row = cursor.fetchone()
    return row_to_dict(row)


def get_tasks(
    conn: sqlite3.Connection,
    skip: int = 0,
    limit: int = 100,
    completed: Optional[bool] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
) -> List[dict]:
    """Retrieve tasks with optional filtering, searching, and pagination."""
    cursor = conn.cursor()
    conditions = []
    params = []

    if completed is not None:
        conditions.append("completed = ?")
        params.append(1 if completed else 0)

    if priority is not None:
        conditions.append("priority = ?")
        params.append(priority)

    if search:
        conditions.append("LOWER(title) LIKE ?")
        params.append(f"%{search.lower()}%")

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    query = f"SELECT * FROM tasks {where_clause} ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, skip])

    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()
    return [row_to_dict(row) for row in rows]


def create_task(conn: sqlite3.Connection, task_in: schemas.TaskCreate) -> dict:
    """Create and persist a new task."""
    cursor = conn.cursor()
    task_id = str(uuid.uuid4())
    now = get_current_iso_time()
    priority_val = task_in.priority.value if hasattr(task_in.priority, "value") else str(task_in.priority)

    cursor.execute(
        """
        INSERT INTO tasks (id, title, completed, priority, due_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            task_id,
            task_in.title.strip(),
            1 if task_in.completed else 0,
            priority_val,
            task_in.due_date,
            now,
            now,
        ),
    )
    conn.commit()
    return get_task(conn, task_id)


def update_task(conn: sqlite3.Connection, task_id: str, task_in: schemas.TaskUpdate) -> Optional[dict]:
    """Update fields of an existing task."""
    existing = get_task(conn, task_id)
    if not existing:
        return None

    update_data = task_in.model_dump(exclude_unset=True)
    if not update_data:
        return existing

    assignments = []
    params = []

    for field, value in update_data.items():
        if field == "priority" and value is not None:
            assignments.append("priority = ?")
            params.append(value.value if hasattr(value, "value") else str(value))
        elif field == "title" and value is not None:
            assignments.append("title = ?")
            params.append(value.strip())
        elif field == "completed" and value is not None:
            assignments.append("completed = ?")
            params.append(1 if value else 0)
        elif field == "due_date":
            assignments.append("due_date = ?")
            params.append(value)

    if not assignments:
        return existing

    now = get_current_iso_time()
    assignments.append("updated_at = ?")
    params.append(now)

    params.append(task_id)
    query = f"UPDATE tasks SET {', '.join(assignments)} WHERE id = ?"

    cursor = conn.cursor()
    cursor.execute(query, tuple(params))
    conn.commit()

    return get_task(conn, task_id)


def delete_task(conn: sqlite3.Connection, task_id: str) -> bool:
    """Delete a task by ID. Returns True if deleted, False if not found."""
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    conn.commit()
    return cursor.rowcount > 0


def seed_initial_tasks(conn: sqlite3.Connection) -> None:
    """Seed sample starter tasks if the database table is empty."""
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as cnt FROM tasks")
    count = cursor.fetchone()["cnt"]

    if count == 0:
        now = get_current_iso_time()
        today_date = now[:10]
        starter_data = [
            {"id": "demo-1", "title": "Review project requirements", "completed": 0, "priority": "High", "due_date": today_date},
            {"id": "demo-2", "title": "Sketch the dashboard layout", "completed": 1, "priority": "Medium", "due_date": today_date},
            {"id": "demo-3", "title": "Set up React components", "completed": 0, "priority": "Medium", "due_date": None},
            {"id": "demo-4", "title": "Write down ideas for the demo", "completed": 0, "priority": "Low", "due_date": None},
        ]
        for item in starter_data:
            cursor.execute(
                """
                INSERT INTO tasks (id, title, completed, priority, due_date, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (item["id"], item["title"], item["completed"], item["priority"], item["due_date"], now, now),
            )
        conn.commit()
