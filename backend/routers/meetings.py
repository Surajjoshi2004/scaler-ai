import uuid
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session, selectinload

import models
import schemas
from database import get_db

router = APIRouter(prefix="/meetings", tags=["meetings"])

MEDIA_DIR = Path(__file__).resolve().parent.parent / "media"
ALLOWED_MEDIA_EXTENSIONS = {".mp4", ".webm", ".mov", ".m4v", ".mp3", ".m4a", ".wav", ".ogg"}


class ParticipantInput(BaseModel):
    name: str
    email: Optional[str] = None


class MeetingUpdateWithParticipants(schemas.MeetingUpdate):
    participants: Optional[List[ParticipantInput]] = None


@router.get("", response_model=List[schemas.MeetingResponse])
def list_meetings(
    search: Optional[str] = None,
    sort: str = "newest",
    db: Session = Depends(get_db),
):
    """List meetings, optionally filtering by title and ordering by date."""
    query = db.query(models.Meeting)

    if search:
        query = query.filter(models.Meeting.title.contains(search))

    if sort == "oldest":
        query = query.order_by(models.Meeting.date.asc())
    else:
        query = query.order_by(models.Meeting.date.desc())

    return query.all()


@router.post("", response_model=schemas.MeetingResponse, status_code=201)
def create_meeting(payload: schemas.MeetingCreate, db: Session = Depends(get_db)):
    """Create and return a meeting without any related records."""
    meeting = models.Meeting(
        title=payload.title,
        date=payload.date,
        duration=payload.duration,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


@router.post("/{meeting_id}/media", response_model=schemas.MeetingResponse)
def upload_meeting_media(
    meeting_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Attach a video or audio file to an existing meeting and persist its URL."""
    meeting = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()

    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    extension = Path(file.filename or "").suffix.lower()
    if extension not in ALLOWED_MEDIA_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {sorted(ALLOWED_MEDIA_EXTENSIONS)}",
        )

    MEDIA_DIR.mkdir(exist_ok=True)
    filename = f"{uuid.uuid4().hex}{extension}"
    destination = MEDIA_DIR / filename

    with destination.open("wb") as buffer:
        while chunk := file.file.read(1024 * 1024):
            buffer.write(chunk)

    meeting.media_url = f"/media/{filename}"
    db.commit()
    db.refresh(meeting)
    return meeting


@router.get("/{meeting_id}")
def get_meeting(meeting_id: int, db: Session = Depends(get_db)):
    """Return one meeting with its participants, transcript, summary, and actions."""
    meeting = (
        db.query(models.Meeting)
        .options(
            selectinload(models.Meeting.participants),
            selectinload(models.Meeting.transcript_segments),
            selectinload(models.Meeting.summary),
            selectinload(models.Meeting.action_items),
        )
        .filter(models.Meeting.id == meeting_id)
        .first()
    )

    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    return {
        **schemas.MeetingResponse.model_validate(meeting).model_dump(),
        "participants": [
            schemas.Participant.model_validate(p).model_dump()
            for p in meeting.participants
        ],
        "transcript": [
            schemas.TranscriptSegment.model_validate(s).model_dump()
            for s in meeting.transcript_segments
        ],
        "summary": (
            schemas.Summary.model_validate(meeting.summary).model_dump()
            if meeting.summary
            else None
        ),
        "action_items": [
            schemas.ActionItemResponse.model_validate(a).model_dump()
            for a in meeting.action_items
        ],
    }


@router.get("/{meeting_id}/summary", response_model=Optional[schemas.Summary])
def get_meeting_summary(meeting_id: int, db: Session = Depends(get_db)):
    """Return the summary associated with an existing meeting, if present."""
    meeting = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()

    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    summary = (
        db.query(models.Summary)
        .filter(models.Summary.meeting_id == meeting_id)
        .first()
    )
    return summary


@router.put("/{meeting_id}", response_model=schemas.MeetingResponse)
def update_meeting(
    meeting_id: int,
    payload: MeetingUpdateWithParticipants,
    db: Session = Depends(get_db),
):
    """Update meeting fields and replace participants when they are supplied."""
    meeting = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()

    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    if payload.title is not None:
        meeting.title = payload.title
    if payload.date is not None:
        meeting.date = payload.date
    if payload.duration is not None:
        meeting.duration = payload.duration

    if payload.participants is not None:
        meeting.participants = [
            models.Participant(name=p.name, email=p.email)
            for p in payload.participants
        ]
    db.commit()
    db.refresh(meeting)
    return meeting


@router.delete("/{meeting_id}")
def delete_meeting(meeting_id: int, db: Session = Depends(get_db)):
    """Permanently remove a meeting by ID."""
    meeting = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()

    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    db.delete(meeting)
    db.commit()
    return {"message": "Meeting deleted"}
