from fastapi import APIRouter
from pydantic import BaseModel

from app.services.transcript_service import get_transcript
from app.services.ai_service import generate_notes

router = APIRouter()


class NotesRequest(BaseModel):
    url: str


@router.post("/ai/notes")
def generate_ai_notes(data: NotesRequest):

    transcript = get_transcript(data.url)

    if transcript is None:
        return {
            "success": False,
            "message": "Transcript not available."
        }

    notes = generate_notes(transcript)

    return {
        "success": True,
        "notes": notes
    }