from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

router = APIRouter(prefix="/meetings/{meeting_id}/transcript", tags=["transcripts"])


class TranscriptSegmentInput(BaseModel):
    speaker: str
    timestamp: Optional[datetime] = None
    text: Optional[str] = None


@router.get("", response_model=List[schemas.TranscriptSegment])
def get_transcript(meeting_id: int, db: Session = Depends(get_db)):
    """Return an existing meeting's transcript in chronological order."""
    meeting = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()

    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    segments = (
        db.query(models.TranscriptSegment)
        .filter(models.TranscriptSegment.meeting_id == meeting_id)
        .order_by(models.TranscriptSegment.timestamp.asc())
        .all()
    )
    return segments


@router.post("", response_model=schemas.TranscriptSegment, status_code=201)
def add_transcript_segment(
    meeting_id: int,
    payload: TranscriptSegmentInput,
    db: Session = Depends(get_db),
):
    """Append one transcript segment to an existing meeting."""
    meeting = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()

    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    segment = models.TranscriptSegment(
        meeting_id=meeting_id,
        speaker=payload.speaker,
        timestamp=payload.timestamp,
        text=payload.text,
    )
    db.add(segment)
    db.commit()
    db.refresh(segment)
    return segment
