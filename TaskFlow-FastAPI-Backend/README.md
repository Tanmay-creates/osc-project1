# TaskFlow — FastAPI Backend

Fast, lightweight, and modern REST API backend for the **TaskFlow** task manager application, built with **Python 3**, **FastAPI**, and **SQLite**.

---

## Features

- **Full CRUD Endpoints**: Create, list, retrieve, update (partial and full), and delete tasks.
- **Frontend Compatible**: Pre-configured to match the React frontend's exact data structures, including `id`, `title`, `priority` (`High`, `Medium`, `Low`), `completed`, and timestamps.
- **Search & Filtering**: Filter by completion status (`?completed=true|false`), priority (`?priority=High`), and search titles (`?search=...`).
- **Interactive API Documentation**: Auto-generated Swagger UI (`/docs`) and ReDoc (`/redoc`).
- **Zero External DB Dependencies**: Uses Python's built-in SQLite engine with local file persistence (`tasks.db`), ensuring reliable cross-platform execution without extra setup.
- **CORS Configured**: Pre-configured CORS support for Vite frontend (`http://localhost:5173` and `http://127.0.0.1:5173`).
- **Automated Test Suite**: 100% test coverage with `pytest` covering all endpoints and edge cases.

---

## Directory Structure

```text
TaskFlow-FastAPI-Backend/
├── app/
│   ├── __init__.py
│   ├── config.py         # Application configuration & settings
│   ├── crud.py           # Database queries & business logic
│   ├── database.py       # SQLite connection manager & migrations
│   ├── main.py           # FastAPI app instance, CORS & lifespan hooks
│   ├── models.py         # Domain models
│   ├── schemas.py        # Pydantic v2 validation models
│   └── routes/
│       ├── __init__.py
│       └── tasks.py      # /tasks API route handlers
├── tests/
│   ├── __init__.py
│   └── test_tasks.py     # Automated test suite
├── .env.example
├── .gitignore
├── README.md
├── requirements.txt      # Python dependencies
├── run.py                # Server runner script
└── venv/                 # Virtual environment
```

---

## Getting Started

### 1. Prerequisites

- Python 3.10+ (tested and verified with Python 3.14)

### 2. Setup Virtual Environment & Install Dependencies

From the `TaskFlow-FastAPI-Backend` directory:

```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# Linux / macOS
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Run the Server

Using the runner script:

```bash
python run.py
```

Or directly via Uvicorn:

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The server will start at:
- **API Base URL**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **ReDoc Documentation**: `http://127.0.0.1:8000/redoc`

---

## API Endpoints Reference

| Method | Endpoint | Description | Request Body | Response Status |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/tasks` | List all tasks with optional filters | None | `200 OK` |
| `POST` | `/tasks` | Create a new task | `{ "title": "...", "priority": "Medium", "completed": false }` | `201 Created` |
| `GET` | `/tasks/{id}` | Get task details by ID | None | `200 OK` (or `404`) |
| `PATCH` | `/tasks/{id}` | Partially update task (e.g. toggle completion) | `{ "completed": true }` or `{ "priority": "High" }` | `200 OK` (or `404`) |
| `PUT` | `/tasks/{id}` | Replace / fully update task | `{ "title": "...", "priority": "High", "completed": true }` | `200 OK` (or `404`) |
| `DELETE` | `/tasks/{id}` | Delete task by ID | None | `204 No Content` (or `404`) |
| `GET` | `/health` | Health check endpoint | None | `200 OK` |
| `GET` | `/` | API status and root endpoint | None | `200 OK` |

### Query Parameters for `GET /tasks`:

- `completed`: Filter by boolean (`true` or `false`)
- `priority`: Filter by priority (`High`, `Medium`, `Low`)
- `search`: Search task titles containing text
- `skip`: Number of records to skip (default `0`)
- `limit`: Maximum number of records to return (default `100`)

---

## Connecting with the React Frontend

1. Ensure the backend is running at `http://127.0.0.1:8000`.
2. In `TaskFlow-React-Frontend`, create or verify `.env`:
   ```env
   VITE_API_URL=http://127.0.0.1:8000
   ```
3. Start or restart the frontend Vite server:
   ```bash
   cd TaskFlow-React-Frontend
   npm run dev
   ```
4. Open the frontend URL (e.g., `http://localhost:5173`). The frontend will automatically load tasks from the FastAPI backend and sync all additions, toggles, and deletions in real time!

---

## Running the Tests

Run the full test suite with pytest:

```bash
pytest -v
```
