from dataclasses import dataclass
from typing import Optional


@dataclass
class Task:
    id: str
    title: str
    completed: bool
    priority: str
    created_at: str
    due_date: Optional[str] = None
    updated_at: Optional[str] = None
