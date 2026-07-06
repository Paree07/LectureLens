from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.youtube_service import get_youtube_metadata
from app.services.transcript_service import get_transcript


router = APIRouter()


class YouTubeRequest(BaseModel):
    url: str


@router.post("/youtube/metadata")
def youtube_metadata(request: YouTubeRequest):
    result = get_youtube_metadata(request.url)
    return result


@router.post("/youtube/transcript")
def youtube_transcript(request: YouTubeRequest):
    transcript = get_transcript(request.url)

    if not transcript:
        raise HTTPException(
            status_code=404,
            detail="Could not fetch transcript for this YouTube video."
        )

    return {
        "success": True,
        "transcript": transcript
    }