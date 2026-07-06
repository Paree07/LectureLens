from fastapi import APIRouter
from pydantic import BaseModel

from app.services.transcript_service import get_transcript
from app.services.ai_service import generate_notes
from app.services.flashcard_service import generate_flashcards

router = APIRouter()


class YouTubeRequest(BaseModel):
    url: str


@router.post("/ai/flashcards")
def ai_flashcards(data: YouTubeRequest):

    transcript = get_transcript(data.url)

    notes = generate_notes(transcript)

    flashcards = generate_flashcards(notes)

    return {
        "success": True,
        "flashcards": flashcards["flashcards"]
    }