from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

Base.metadata.create_all(bind=engine)

app.include_router(meetings.router)
app.include_router(transcripts.router)
app.include_router(actions.router)


@app.get("/")
def health():
    return {"status": "ok", "message": "Fireflies clone API"}
