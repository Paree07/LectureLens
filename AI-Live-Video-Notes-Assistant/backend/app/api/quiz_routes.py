from fastapi import APIRouter
from pydantic import BaseModel

from app.services.transcript_service import get_transcript
from app.services.ai_service import generate_notes
from app.services.quiz_service import generate_quiz

router = APIRouter()


class YouTubeRequest(BaseModel):
    url: str


@router.post("/ai/quiz")
def ai_quiz(data: YouTubeRequest):

    transcript = get_transcript(data.url)

    notes = generate_notes(transcript)

    quiz = generate_quiz(notes)

    return {
        "success": True,
        "quiz": quiz["quiz"]
    }