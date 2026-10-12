import os
import sqlite3
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import get_db, init_db

TEST_DB_PATH = "test_tasks.db"


def override_get_db():
    conn = sqlite3.connect(TEST_DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_and_teardown_db():
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except OSError:
            pass
    init_db(TEST_DB_PATH)
    yield
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except OSError:
            pass


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "endpoints" in data


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_create_task(client):
    payload = {
        "title": "Design user dashboard",
        "priority": "High",
        "completed": False,
        "due_date": "2026-10-15",
    }
    response = client.post("/tasks", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Design user dashboard"
    assert data["priority"] == "High"
    assert data["completed"] is False
    assert data["due_date"] == "2026-10-15"
    assert "id" in data
    assert "created_at" in data


def test_create_task_default_values(client):
    payload = {"title": "Quick reminder"}
    response = client.post("/tasks", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Quick reminder"
    assert data["priority"] == "Medium"
    assert data["completed"] is False
    assert data["due_date"] is None


def test_list_tasks(client):
    client.post("/tasks", json={"title": "Task 1", "priority": "Low", "completed": False, "due_date": "2026-10-12"})
    client.post("/tasks", json={"title": "Task 2", "priority": "High", "completed": True})

    response = client.get("/tasks")
    assert response.status_code == 200
    tasks = response.json()
    assert isinstance(tasks, list)
    assert len(tasks) == 2


def test_get_task_by_id(client):
    created = client.post("/tasks", json={"title": "Specific Task", "due_date": "2026-10-20"}).json()
    task_id = created["id"]

    response = client.get(f"/tasks/{task_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == task_id
    assert data["title"] == "Specific Task"
    assert data["due_date"] == "2026-10-20"


def test_get_nonexistent_task(client):
    response = client.get("/tasks/non-existent-id")
    assert response.status_code == 404
    assert response.json()["detail"] == "Task with ID 'non-existent-id' not found."


def test_patch_task_toggle_completion(client):
    created = client.post("/tasks", json={"title": "Toggle me", "completed": False}).json()
    task_id = created["id"]

    patch_response = client.patch(f"/tasks/{task_id}", json={"completed": True})
    assert patch_response.status_code == 200
    updated = patch_response.json()
    assert updated["completed"] is True
    assert updated["title"] == "Toggle me"

    # Toggle back to False
    patch_response2 = client.patch(f"/tasks/{task_id}", json={"completed": False})
    assert patch_response2.status_code == 200
    assert patch_response2.json()["completed"] is False


def test_patch_task_due_date_and_priority(client):
    created = client.post("/tasks", json={"title": "Priority Task", "priority": "Low"}).json()
    task_id = created["id"]

    patch_response = client.patch(f"/tasks/{task_id}", json={"priority": "High", "due_date": "2026-10-25"})
    assert patch_response.status_code == 200
    data = patch_response.json()
    assert data["priority"] == "High"
    assert data["due_date"] == "2026-10-25"


def test_put_task_full_update(client):
    created = client.post("/tasks", json={"title": "Old title", "priority": "Low", "completed": False}).json()
    task_id = created["id"]

    put_response = client.put(f"/tasks/{task_id}", json={"title": "New title", "priority": "High", "completed": True, "due_date": "2026-11-01"})
    assert put_response.status_code == 200
    updated = put_response.json()
    assert updated["title"] == "New title"
    assert updated["priority"] == "High"
    assert updated["completed"] is True
    assert updated["due_date"] == "2026-11-01"


def test_delete_task(client):
    created = client.post("/tasks", json={"title": "To be deleted"}).json()
    task_id = created["id"]

    delete_response = client.delete(f"/tasks/{task_id}")
    assert delete_response.status_code == 204

    # Fetching deleted task returns 404
    get_response = client.get(f"/tasks/{task_id}")
    assert get_response.status_code == 404


def test_filter_and_search(client):
    client.post("/tasks", json={"title": "Buy groceries", "priority": "Low", "completed": False})
    client.post("/tasks", json={"title": "Pay utility bills", "priority": "High", "completed": True})
    client.post("/tasks", json={"title": "Buy concert tickets", "priority": "Medium", "completed": True})

    # Filter completed
    done_response = client.get("/tasks?completed=true")
    assert len(done_response.json()) == 2

    # Filter open
    open_response = client.get("/tasks?completed=false")
    assert len(open_response.json()) == 1
    assert open_response.json()[0]["title"] == "Buy groceries"

    # Search query
    search_response = client.get("/tasks?search=Buy")
    assert len(search_response.json()) == 2

    # Filter by priority
    priority_response = client.get("/tasks?priority=High")
    assert len(priority_response.json()) == 1
    assert priority_response.json()[0]["title"] == "Pay utility bills"
