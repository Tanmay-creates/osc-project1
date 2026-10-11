# TaskFlow — React Frontend

A responsive task manager UI built with React and Vite. It supports adding tasks, listing tasks, toggling them between Open and Done, deleting tasks, filtering by status, and searching by title.

## Requirements

- Node.js 18+ (recommended)
- npm

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## Demo mode (no backend needed)

By default, the app uses browser `localStorage`. Tasks remain after a page refresh in the same browser. This is only a frontend demo; it is not a shared database.

## Connect to FastAPI

1. Copy `.env.example` to `.env`.
2. Set `VITE_API_URL` to your FastAPI base URL, for example `http://127.0.0.1:8000`.
3. Restart Vite after changing environment variables.
4. The frontend expects these endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/tasks` | Return a JSON array of tasks |
| `POST` | `/tasks` | Create a task |
| `PATCH` | `/tasks/{id}` | Update task fields, including `completed` |
| `DELETE` | `/tasks/{id}` | Delete a task |

The task object should include `id`, `title`, and `completed`. The UI also supports an optional `priority` field (`High`, `Medium`, or `Low`). The `POST` body is `{ "title": "...", "priority": "Medium", "completed": false }`; the `PATCH` body is `{ "completed": true }`.

If your backend uses different endpoint names or a different response shape, update the API calls in `src/App.jsx` to match it. Your FastAPI server must enable CORS for the Vite frontend origin, typically `http://localhost:5173`.

## Build for production

```bash
npm run build
npm run preview
```

## Important security note

Do not put Supabase service-role keys, database passwords, or other secrets in this React frontend. Browser code is public. Keep database credentials in the FastAPI backend environment variables.
