import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import Base, engine
import models
from routers import actions, meetings, transcripts

app = FastAPI()

allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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
