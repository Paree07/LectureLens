from fastapi import APIRouter
from pydantic import BaseModel

from app.services.transcript_service import get_transcript
from app.services.ai_service import generate_notes


router = APIRouter()


# =========================================================
# REQUEST MODEL
# =========================================================

class NotesRequest(BaseModel):
    url: str


# =========================================================
# GENERATE AI NOTES
# =========================================================

@router.post("/ai/notes")
def generate_ai_notes(data: NotesRequest):
    """
    Fetch transcript first, then generate AI notes.

    Compatible with the new structured response
    returned by get_transcript().
    """

    try:
        print("=" * 50)
        print("AI Notes request received")
        print("URL:", data.url)
        print("=" * 50)

        # -----------------------------------------
        # FETCH TRANSCRIPT
        # -----------------------------------------

        transcript_result = get_transcript(data.url)

        print(
            "Transcript result success:",
            transcript_result.get("success")
            if isinstance(transcript_result, dict)
            else "invalid_result"
        )

        # -----------------------------------------
        # VALIDATE TRANSCRIPT RESPONSE
        # -----------------------------------------

        if not isinstance(transcript_result, dict):
            return {
                "success": False,
                "error": "invalid_transcript_response",
                "message": (
                    "Transcript service returned "
                    "an invalid response."
                ),
            }

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
        # EXTRACT ACTUAL TRANSCRIPT STRING
        # -----------------------------------------

        transcript = transcript_result.get(
            "transcript"
        )

        if not transcript:
            return {
                "success": False,
                "error": "empty_transcript",
                "message": (
                    "Transcript was empty, so AI notes "
                    "could not be generated."
                ),
            }

        if not isinstance(transcript, str):
            return {
                "success": False,
                "error": "invalid_transcript_type",
                "message": (
                    "Transcript must be text before "
                    "AI notes can be generated."
                ),
            }

        print(
            "Transcript characters:",
            len(transcript)
        )

        # -----------------------------------------
        # GENERATE NOTES
        # -----------------------------------------

        notes = generate_notes(
            transcript
        )

        if not notes:
            return {
                "success": False,
                "error": "empty_ai_notes",
                "message": (
                    "AI service returned empty notes."
                ),
            }

        print("=" * 50)
        print("AI notes generated successfully")
        print("=" * 50)

        # -----------------------------------------
        # SUCCESS RESPONSE
        # -----------------------------------------

        return {
            "success": True,
            "notes": notes,
        }

    except Exception as e:
        print("=" * 50)
        print(
            "AI Notes Route Error:",
            type(e).__name__,
            str(e),
        )
        print("=" * 50)

        return {
            "success": False,
            "error": type(e).__name__,
            "message": (
                "Could not generate AI notes."
            ),
        }