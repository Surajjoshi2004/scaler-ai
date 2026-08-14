from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class MeetingCreate(BaseModel):
    title: str
    date: datetime
    duration: Optional[int] = None


class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[datetime] = None
    duration: Optional[int] = None


class MeetingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    date: datetime
    duration: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class Participant(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    meeting_id: int
    name: str
    email: Optional[str] = None


class TranscriptSegment(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    meeting_id: int
    speaker: str
    timestamp: Optional[datetime] = None
    text: Optional[str] = None


class Summary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    meeting_id: int
    overview: Optional[str] = None


class ActionItemCreate(BaseModel):
    meeting_id: int
    title: str
    assignee: Optional[str] = None
    completed: Optional[bool] = None


class ActionItemUpdate(BaseModel):
    title: Optional[str] = None
    assignee: Optional[str] = None
    completed: Optional[bool] = None


class ActionItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    meeting_id: int
    title: str
    assignee: Optional[str] = None
    completed: bool = False
