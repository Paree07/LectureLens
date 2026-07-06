from fastapi import APIRouter
from pydantic import BaseModel

from app.services.transcript_service import get_transcript
from app.services.ai_service import generate_notes
from app.services.chat_service import ask_question

router = APIRouter()


class ChatRequest(BaseModel):
    url: str
    question: str


@router.post("/ai/chat")
def ai_chat(data: ChatRequest):

    transcript = get_transcript(data.url)

    notes = generate_notes(transcript)

    answer = ask_question(notes, data.question)

    return {
        "success": True,
        "answer": answer
    }