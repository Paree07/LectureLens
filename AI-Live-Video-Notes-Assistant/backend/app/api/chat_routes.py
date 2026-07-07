from fastapi import APIRouter
from pydantic import BaseModel

from app.services.transcript_service import get_transcript
from app.services.ai_service import generate_notes
from app.services.chat_service import ask_question


router = APIRouter()


# =========================================================
# REQUEST MODEL
# =========================================================

class ChatRequest(BaseModel):
    url: str
    question: str


# =========================================================
# AI CHAT
# =========================================================

@router.post("/ai/chat")
def ai_chat(data: ChatRequest):
    """
    Answer a question about a YouTube lecture.

    Flow:
    1. Fetch transcript
    2. Extract transcript text
    3. Generate notes
    4. Ask question using lecture notes
    """

    try:
        print("=" * 50)
        print("AI Chat request received")
        print("URL:", data.url)
        print("Question:", data.question)
        print("=" * 50)

        # -----------------------------------------
        # VALIDATE QUESTION
        # -----------------------------------------

        if not data.question or not data.question.strip():
            return {
                "success": False,
                "error": "empty_question",
                "message": "Question cannot be empty.",
            }

        # -----------------------------------------
        # FETCH TRANSCRIPT
        # -----------------------------------------

        transcript_result = get_transcript(
            data.url
        )

        # -----------------------------------------
        # VALIDATE TRANSCRIPT RESPONSE
        # -----------------------------------------

        if not isinstance(
            transcript_result,
            dict
        ):
            return {
                "success": False,
                "error": "invalid_transcript_response",
                "message": (
                    "Transcript service returned "
                    "an invalid response."
                ),
            }

        print(
            "Transcript success:",
            transcript_result.get("success")
        )

        # -----------------------------------------
        # HANDLE TRANSCRIPT FAILURE
        # -----------------------------------------

        if not transcript_result.get("success"):
            return {
                "success": False,
                "error": transcript_result.get(
                    "error",
                    "transcript_unavailable",
                ),
                "message": transcript_result.get(
                    "message",
                    "Transcript not available.",
                ),
            }

        # -----------------------------------------
        # EXTRACT ACTUAL TRANSCRIPT TEXT
        # -----------------------------------------

        transcript = transcript_result.get(
            "transcript"
        )

        if not transcript:
            return {
                "success": False,
                "error": "empty_transcript",
                "message": (
                    "Transcript is empty. "
                    "AI Chat cannot answer questions."
                ),
            }

        if not isinstance(
            transcript,
            str
        ):
            return {
                "success": False,
                "error": "invalid_transcript_type",
                "message": (
                    "Transcript must be text."
                ),
            }

        print(
            "Transcript characters:",
            len(transcript)
        )

        # -----------------------------------------
        # GENERATE AI NOTES
        # -----------------------------------------

        notes = generate_notes(
            transcript
        )

        if not notes:
            return {
                "success": False,
                "error": "notes_generation_failed",
                "message": (
                    "Could not generate lecture context "
                    "for AI Chat."
                ),
            }

        print(
            "Lecture notes generated for chat"
        )

        # -----------------------------------------
        # ASK QUESTION
        # -----------------------------------------

        answer = ask_question(
            notes,
            data.question.strip()
        )

        if not answer:
            return {
                "success": False,
                "error": "empty_answer",
                "message": (
                    "AI Chat returned an empty answer."
                ),
            }

        print("=" * 50)
        print("AI Chat answer generated successfully")
        print("=" * 50)

        # -----------------------------------------
        # SUCCESS RESPONSE
        # -----------------------------------------

        return {
            "success": True,
            "answer": answer,
        }

    except Exception as e:
        print("=" * 50)
        print(
            "AI Chat Route Error:",
            type(e).__name__,
            str(e),
        )
        print("=" * 50)

        return {
            "success": False,
            "error": type(e).__name__,
            "message": "Could not generate AI Chat answer.",
        }