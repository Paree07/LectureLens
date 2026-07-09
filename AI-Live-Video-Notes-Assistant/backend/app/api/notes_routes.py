from fastapi import APIRouter
from pydantic import BaseModel

from app.services.transcript_service import get_transcript
from app.services.ai_service import generate_notes


router = APIRouter()


# =========================================================
# REQUEST MODEL
# =========================================================

class NotesRequest(BaseModel):
    url: str | None = None
    transcript: str | None = None


# =========================================================
# GENERATE AI NOTES
# =========================================================

@router.post("/ai/notes")
def generate_ai_notes(data: NotesRequest):
    """
    Generate AI notes.

    Preferred flow:
    - Frontend sends already-fetched transcript
    - Backend generates notes directly

    Fallback flow:
    - If transcript is not provided
    - Backend fetches transcript using URL
    """

    try:
        print("=" * 60)
        print("AI Notes request received")
        print("URL:", data.url)
        print(
            "Transcript provided by frontend:",
            bool(data.transcript)
        )
        print("=" * 60)

        transcript = None

        # =====================================================
        # METHOD 1: USE TRANSCRIPT SENT BY FRONTEND
        # =====================================================

        if (
            data.transcript
            and isinstance(data.transcript, str)
            and data.transcript.strip()
        ):
            transcript = data.transcript.strip()

            print(
                "SUCCESS: Using transcript sent by frontend."
            )
            print(
                "Transcript characters:",
                len(transcript)
            )

        # =====================================================
        # METHOD 2: FALLBACK TO URL TRANSCRIPT FETCH
        # =====================================================

        elif data.url:
            print(
                "No transcript provided by frontend."
            )
            print(
                "Falling back to transcript service..."
            )

            transcript_result = get_transcript(data.url)

            print(
                "Transcript result success:",
                transcript_result.get("success")
                if isinstance(transcript_result, dict)
                else "invalid_result"
            )

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

            transcript = transcript_result.get("transcript")

        # =====================================================
        # NO TRANSCRIPT AND NO URL
        # =====================================================

        else:
            return {
                "success": False,
                "error": "missing_input",
                "message": (
                    "Either transcript or URL is required."
                ),
            }

        # =====================================================
        # VALIDATE FINAL TRANSCRIPT
        # =====================================================

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

        transcript = transcript.strip()

        if not transcript:
            return {
                "success": False,
                "error": "empty_transcript",
                "message": (
                    "Transcript contained no usable text."
                ),
            }

        print(
            "Final transcript characters:",
            len(transcript)
        )

        # =====================================================
        # GENERATE AI NOTES
        # =====================================================

        print("Generating AI notes...")

        notes = generate_notes(transcript)

        if not notes:
            return {
                "success": False,
                "error": "empty_ai_notes",
                "message": (
                    "AI service returned empty notes."
                ),
            }

        print("=" * 60)
        print("AI notes generated successfully")
        print("=" * 60)

        return {
            "success": True,
            "notes": notes,
        }

    except Exception as e:
        print("=" * 60)
        print(
            "AI Notes Route Error:",
            type(e).__name__,
            str(e),
        )
        print("=" * 60)

        return {
            "success": False,
            "error": type(e).__name__,
            "message": (
                f"Could not generate AI notes: {str(e)}"
            ),
        }
