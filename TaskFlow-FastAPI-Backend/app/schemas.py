from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class PriorityEnum(str, Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=180, description="Title of the task")
    priority: PriorityEnum = Field(default=PriorityEnum.MEDIUM, description="Task priority (High, Medium, Low)")
    completed: bool = Field(default=False, description="Whether the task is completed")
    due_date: Optional[str] = Field(None, description="Optional scheduled or due date (YYYY-MM-DD)")


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=180, description="Title of the task")
    priority: PriorityEnum = Field(default=PriorityEnum.MEDIUM, description="Task priority")
    completed: bool = Field(default=False, description="Completion status")
    due_date: Optional[str] = Field(None, description="Optional scheduled or due date (YYYY-MM-DD)")


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=180, description="Updated task title")
    priority: Optional[PriorityEnum] = Field(None, description="Updated priority")
    completed: Optional[bool] = Field(None, description="Updated completion status")
    due_date: Optional[str] = Field(None, description="Updated scheduled or due date (YYYY-MM-DD)")


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    completed: bool
    priority: str
    due_date: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None
