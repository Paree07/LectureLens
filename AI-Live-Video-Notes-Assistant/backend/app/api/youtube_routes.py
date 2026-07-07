from fastapi import APIRouter
from pydantic import BaseModel
import requests
import re

from app.services.transcript_service import get_transcript


router = APIRouter()


# =========================================================
# REQUEST MODEL
# =========================================================

class YouTubeRequest(BaseModel):
    url: str


# =========================================================
# EXTRACT YOUTUBE VIDEO ID
# =========================================================

def extract_video_id(url: str):
    if not url:
        return None

    patterns = [
        r"(?:youtube\.com/watch\?v=)([A-Za-z0-9_-]{11})",
        r"(?:youtu\.be/)([A-Za-z0-9_-]{11})",
        r"(?:youtube\.com/embed/)([A-Za-z0-9_-]{11})",
        r"(?:youtube\.com/shorts/)([A-Za-z0-9_-]{11})",
    ]

    for pattern in patterns:
        match = re.search(pattern, url)

        if match:
            return match.group(1)

    return None


# =========================================================
# YOUTUBE METADATA
# =========================================================

@router.post("/youtube/metadata")
def youtube_metadata(request: YouTubeRequest):
    """
    Fetch YouTube metadata directly using
    YouTube oEmbed.

    No dependency on youtube_service.py.
    """

    video_id = extract_video_id(request.url)

    if not video_id:
        return {
            "success": False,
            "error": "invalid_youtube_url",
            "message": "Invalid YouTube URL.",
        }

    try:
        print("Fetching metadata for:", request.url)

        response = requests.get(
            "https://www.youtube.com/oembed",
            params={
                "url": request.url,
                "format": "json",
            },
            timeout=15,
        )

        print(
            "YouTube oEmbed status:",
            response.status_code,
        )

        if response.ok:
            data = response.json()

            return {
                "success": True,
                "id": video_id,
                "title": data.get(
                    "title",
                    "YouTube Video",
                ),
                "author": data.get(
                    "author_name",
                    "YouTube",
                ),
                "author_url": data.get(
                    "author_url",
                ),
                "thumbnail": data.get(
                    "thumbnail_url",
                    f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
                ),
                "provider": data.get(
                    "provider_name",
                    "YouTube",
                ),
                "url": request.url,
            }

        print(
            "oEmbed failed:",
            response.status_code,
            response.text[:300],
        )

        # Fallback metadata
        return {
            "success": True,
            "id": video_id,
            "title": "YouTube Video",
            "author": "YouTube",
            "thumbnail": (
                f"https://img.youtube.com/vi/"
                f"{video_id}/hqdefault.jpg"
            ),
            "url": request.url,
        }

    except Exception as e:
        print(
            "YouTube Metadata Error:",
            type(e).__name__,
            str(e),
        )

        # Important:
        # Metadata should still not crash the app.
        return {
            "success": True,
            "id": video_id,
            "title": "YouTube Video",
            "author": "YouTube",
            "thumbnail": (
                f"https://img.youtube.com/vi/"
                f"{video_id}/hqdefault.jpg"
            ),
            "url": request.url,
        }


# =========================================================
# YOUTUBE TRANSCRIPT
# =========================================================

@router.post("/youtube/transcript")
def youtube_transcript(request: YouTubeRequest):
    """
    Fetch YouTube transcript.
    """

    result = get_transcript(request.url)

    return result