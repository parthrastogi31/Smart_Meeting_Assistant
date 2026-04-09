from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from ai_service import ai_service, MeetingResponse
import uuid
import datetime
import os

app = FastAPI(title="Smart Meeting Assistant API")

# Allow CORS for Chrome Extension / Dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory database for demo purposes
# In a real app, use SQLite/PostgreSQL
meetings_db = {}

class TranscriptRequest(BaseModel):
    transcript: str
    meeting_title: str = "Untitled Meeting"

class MeetingRecord(BaseModel):
    id: str
    title: str
    date: str
    transcript: str
    analysis: MeetingResponse

@app.post("/api/meetings/capture", response_model=MeetingRecord)
async def capture_meeting(request: TranscriptRequest):
    if not request.transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript cannot be empty")
    
    # Process transcript with Gemini
    analysis = ai_service.process_transcript(request.transcript)
    
    # Save to "database"
    meeting_id = str(uuid.uuid4())
    record = MeetingRecord(
        id=meeting_id,
        title=request.meeting_title,
        date=datetime.datetime.now().isoformat(),
        transcript=request.transcript,
        analysis=analysis
    )
    meetings_db[meeting_id] = record
    
    return record

@app.get("/api/meetings", response_model=list[MeetingRecord])
async def list_meetings():
    # Return meetings sorted by date (newest first)
    return sorted(list(meetings_db.values()), key=lambda x: x.date, reverse=True)

@app.get("/api/meetings/{meeting_id}", response_model=MeetingRecord)
async def get_meeting(meeting_id: str):
    if meeting_id not in meetings_db:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meetings_db[meeting_id]

# Serve the frontend dashboard
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend_dashboard"))
app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="dashboard")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
