from fastapi import APIRouter
from pydantic import BaseModel

from app.services.transcript_service import get_transcript

# IMPORTANT:
# Agar tumhare metadata service ka import path/name different hai,
# to apna existing metadata import same rehne dena.
try:
    from app.services.youtube_service import get_video_metadata
except ImportError:
    get_video_metadata = None


router = APIRouter()


# =========================================================
# REQUEST MODELS
# =========================================================

class YouTubeRequest(BaseModel):
    url: str


# =========================================================
# YOUTUBE METADATA
# =========================================================

@router.post("/youtube/metadata")
def youtube_metadata(request: YouTubeRequest):
    """
    Fetch YouTube video metadata.
    """

    if get_video_metadata is None:
        return {
            "success": False,
            "error": "metadata_service_unavailable",
            "message": "Metadata service is unavailable.",
        }

    try:
        metadata = get_video_metadata(request.url)

        if not metadata:
            return {
                "success": False,
                "error": "metadata_not_found",
                "message": "Could not fetch video metadata.",
            }

        # If service already returns a dictionary,
        # preserve all existing fields.
        if isinstance(metadata, dict):
            return {
                "success": True,
                **metadata,
            }

        return {
            "success": True,
            "data": metadata,
        }

    except Exception as e:
        print(
            "YouTube Metadata Error:",
            type(e).__name__,
            str(e),
        )

        return {
            "success": False,
            "error": type(e).__name__,
            "message": "Could not fetch YouTube metadata.",
        }


# =========================================================
# YOUTUBE TRANSCRIPT
# =========================================================

@router.post("/youtube/transcript")
def youtube_transcript(request: YouTubeRequest):
    """
    Fetch YouTube transcript.

    Always returns HTTP 200 with structured success/error data.
    This prevents frontend fetch failures caused by fake 404s.
    """

    result = get_transcript(request.url)

    return result