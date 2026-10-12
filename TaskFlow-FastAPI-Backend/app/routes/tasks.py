import sqlite3
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from app.database import get_db
from app import crud, schemas

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.get(
    "",
    response_model=List[schemas.TaskResponse],
    summary="List all tasks",
    description="Retrieve a list of tasks. Supports optional filtering by completion status, priority, and title search.",
)
def list_tasks(
    completed: Optional[bool] = Query(None, description="Filter by completion status (true/false)"),
    priority: Optional[schemas.PriorityEnum] = Query(None, description="Filter by priority (High, Medium, Low)"),
    search: Optional[str] = Query(None, description="Search term for task title"),
    skip: int = Query(0, ge=0, description="Number of tasks to skip (pagination)"),
    limit: int = Query(100, ge=1, le=500, description="Max number of tasks to return"),
    conn: sqlite3.Connection = Depends(get_db),
):
    priority_val = priority.value if priority else None
    return crud.get_tasks(
        conn=conn,
        skip=skip,
        limit=limit,
        completed=completed,
        priority=priority_val,
        search=search,
    )


@router.post(
    "",
    response_model=schemas.TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new task",
    description="Create a task with title, priority (default 'Medium'), and completion status (default false).",
)
def create_task(
    task_in: schemas.TaskCreate,
    conn: sqlite3.Connection = Depends(get_db),
):
    return crud.create_task(conn=conn, task_in=task_in)


@router.get(
    "/{task_id}",
    response_model=schemas.TaskResponse,
    summary="Get a task by ID",
    description="Retrieve full details for a single task given its ID.",
)
def get_task(
    task_id: str,
    conn: sqlite3.Connection = Depends(get_db),
):
    task = crud.get_task(conn=conn, task_id=task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID '{task_id}' not found.",
        )
    return task


@router.patch(
    "/{task_id}",
    response_model=schemas.TaskResponse,
    summary="Partially update a task",
    description="Update specific fields of a task, such as toggling completed status or changing priority.",
)
def update_task_partial(
    task_id: str,
    task_in: schemas.TaskUpdate,
    conn: sqlite3.Connection = Depends(get_db),
):
    updated = crud.update_task(conn=conn, task_id=task_id, task_in=task_in)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID '{task_id}' not found.",
        )
    return updated


@router.put(
    "/{task_id}",
    response_model=schemas.TaskResponse,
    summary="Fully update a task",
    description="Update all mutable fields of an existing task.",
)
def update_task_full(
    task_id: str,
    task_in: schemas.TaskCreate,
    conn: sqlite3.Connection = Depends(get_db),
):
    update_data = schemas.TaskUpdate(
        title=task_in.title,
        priority=task_in.priority,
        completed=task_in.completed,
        due_date=task_in.due_date,
    )
    updated = crud.update_task(conn=conn, task_id=task_id, task_in=update_data)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID '{task_id}' not found.",
        )
    return updated


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a task",
    description="Permanently delete a task by ID.",
)
def delete_task(
    task_id: str,
    conn: sqlite3.Connection = Depends(get_db),
):
    deleted = crud.delete_task(conn=conn, task_id=task_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID '{task_id}' not found.",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
