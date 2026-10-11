# TaskFlow Full-Stack Application

A modern, high-performance task management application consisting of a React + Vite frontend and a Python FastAPI backend.

---

## Architecture Overview

```text
osc-project1/
├── TaskFlow-React-Frontend/     # React 18 + Vite frontend with Lucide icons
│   ├── src/
│   │   ├── App.jsx             # Main dashboard UI & API integration
│   │   ├── index.css           # Modern CSS design system
│   │   └── main.jsx
│   ├── .env                    # Configured with VITE_API_URL=http://127.0.0.1:8000
│   └── package.json
│
└── TaskFlow-FastAPI-Backend/    # FastAPI + SQLite backend
    ├── app/
    │   ├── main.py             # FastAPI app with CORS & lifespan hooks
    │   ├── config.py           # Configuration & settings
    │   ├── crud.py             # SQLite database operations
    │   ├── database.py         # DB connection & table management
    │   ├── models.py           # Domain dataclasses
    │   ├── schemas.py          # Pydantic v2 schemas
    │   └── routes/
    │       └── tasks.py        # /tasks endpoints (GET, POST, PATCH, PUT, DELETE)
    ├── tests/
    │   └── test_tasks.py       # Automated test suite (12 tests)
    ├── requirements.txt        # Python dependencies
    └── run.py                  # Server entrypoint
```

---

## Quickstart

### 1. Start the FastAPI Backend

```bash
cd TaskFlow-FastAPI-Backend

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

# Run the backend
python run.py
```

The API will be available at:
- **Server**: `http://127.0.0.1:8000`
- **Swagger Documentation**: `http://127.0.0.1:8000/docs`

### 2. Start the React Frontend

In a separate terminal:

```bash
cd TaskFlow-React-Frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser. The application will connect directly to the FastAPI backend!

---

## API Endpoints

- `GET /tasks` - Retrieve tasks (supports `completed`, `priority`, `search` filtering)
- `POST /tasks` - Create a new task
- `GET /tasks/{id}` - Fetch single task by ID
- `PATCH /tasks/{id}` - Partially update task (e.g. toggle completion)
- `PUT /tasks/{id}` - Full update of task fields
- `DELETE /tasks/{id}` - Delete task (returns `204 No Content`)
- `GET /health` - Health check endpoint
- `GET /docs` - Interactive OpenAPI Swagger UI