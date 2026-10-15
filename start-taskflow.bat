
@echo off
title TaskFlow Launcher

start "TaskFlow Frontend" cmd /k "cd /d C:\Users\Vedant\Desktop\project\osc-project1\TaskFlow-React-Frontend && npm run dev"

start "TaskFlow Backend" cmd /k "cd /d C:\Users\Vedant\Desktop\project\osc-project1\TaskFlow-FastAPI-Backend && venv\Scripts\python.exe run.py"

echo TaskFlow startup commands launched.
