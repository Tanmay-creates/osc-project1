from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db, get_connection
from app.crud import seed_initial_tasks
from app.routes import tasks


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist and seed default tasks if empty
    init_db()
    conn = get_connection()
    try:
        seed_initial_tasks(conn)
    finally:
        conn.close()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend API for TaskFlow task management application. Built with FastAPI and SQLite.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for the React/Vite frontend (typically http://localhost:5173 or http://127.0.0.1:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(tasks.router)


@app.get("/", tags=["General"], summary="Root endpoint")
def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "docs_url": "/docs",
        "endpoints": {
            "list_tasks": "GET /tasks",
            "create_task": "POST /tasks",
            "get_task": "GET /tasks/{id}",
            "update_task": "PATCH /tasks/{id}",
            "delete_task": "DELETE /tasks/{id}",
        },
    }


@app.get("/health", tags=["General"], summary="Health check")
def health_check():
    return {"status": "healthy"}
