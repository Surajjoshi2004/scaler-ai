import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import Base, engine
import models
from routers import actions, meetings, transcripts

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MEDIA_DIR = Path(__file__).parent / "media"
MEDIA_DIR.mkdir(exist_ok=True)

Base.metadata.create_all(bind=engine)

app.include_router(meetings.router)
app.include_router(transcripts.router)
app.include_router(actions.router)

app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")


@app.get("/")
def health():
    """Return a lightweight status response for availability checks."""
    return {"status": "ok", "message": "Fireflies clone API"}
