from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

router = APIRouter(tags=["actions"])


class ActionItemInput(BaseModel):
    title: str
    assignee: Optional[str] = None
    completed: Optional[bool] = None


@router.get("/meetings/{meeting_id}/actions", response_model=List[schemas.ActionItemResponse])
def list_action_items(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()

    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    items = (
        db.query(models.ActionItem)
        .filter(models.ActionItem.meeting_id == meeting_id)
        .all()
    )
    return items


@router.post("/meetings/{meeting_id}/actions", response_model=schemas.ActionItemResponse, status_code=201)
def create_action_item(
    meeting_id: int,
    payload: ActionItemInput,
    db: Session = Depends(get_db),
):
    meeting = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()

    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    item = models.ActionItem(
        meeting_id=meeting_id,
        title=payload.title,
        assignee=payload.assignee,
        completed=payload.completed if payload.completed is not None else False,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/actions/{action_id}", response_model=schemas.ActionItemResponse)
def update_action_item(
    action_id: int,
    payload: schemas.ActionItemUpdate,
    db: Session = Depends(get_db),
):
    item = db.query(models.ActionItem).filter(models.ActionItem.id == action_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Action item not found")

    if payload.title is not None:
        item.title = payload.title
    if payload.assignee is not None:
        item.assignee = payload.assignee
    if payload.completed is not None:
        item.completed = payload.completed

    db.commit()
    db.refresh(item)
    return item


@router.delete("/actions/{action_id}")
def delete_action_item(action_id: int, db: Session = Depends(get_db)):
    item = db.query(models.ActionItem).filter(models.ActionItem.id == action_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Action item not found")

    db.delete(item)
    db.commit()
    return {"message": "Action item deleted"}
