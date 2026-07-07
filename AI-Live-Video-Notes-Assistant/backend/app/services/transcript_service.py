import re
from typing import Optional, Dict, Any

from youtube_transcript_api import YouTubeTranscriptApi


# =========================================================
# GLOBAL WHISPER MODEL CACHE
# =========================================================

_whisper_model = None


def get_whisper_model():
    """
    Load Whisper model only once.
    Reuse the same model for future uploads.
    """
    global _whisper_model

    if _whisper_model is None:
        from faster_whisper import WhisperModel

        print("Loading Whisper base model...")

        _whisper_model = WhisperModel(
            "base",
            device="cpu",
            compute_type="int8",
        )

        print("Whisper model loaded successfully.")

    return _whisper_model


# =========================================================
# YOUTUBE VIDEO ID
# =========================================================

def extract_video_id(url: str) -> Optional[str]:
    """
    Extract YouTube video ID from supported YouTube URLs.
    """

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
# YOUTUBE TRANSCRIPT
# =========================================================

def get_transcript(url: str) -> Dict[str, Any]:
    """
    Try to fetch transcript from YouTube.

    Important:
    Railway/cloud IPs may be blocked by YouTube.
    In that case return a clean structured response
    instead of crashing or pretending the route is missing.
    """

    video_id = extract_video_id(url)

    if not video_id:
        return {
            "success": False,
            "transcript": None,
            "error": "invalid_youtube_url",
            "message": "Invalid YouTube URL.",
        }

    try:
        print("Trying YouTube transcript API...")
        print("Video ID:", video_id)

        ytt_api = YouTubeTranscriptApi()

        transcript = ytt_api.fetch(
            video_id,
            languages=[
                "en",
                "en-US",
                "en-GB",
                "hi",
            ],
        )

        text_parts = []

        for item in transcript:
            text = getattr(item, "text", None)

            if text:
                cleaned_text = text.strip()

                if cleaned_text:
                    text_parts.append(cleaned_text)

        full_text = " ".join(text_parts).strip()

        if not full_text:
            return {
                "success": False,
                "transcript": None,
                "error": "empty_transcript",
                "message": "YouTube returned an empty transcript.",
            }

        print(
            "YouTube transcript fetched successfully:",
            len(full_text),
            "characters",
        )

        return {
            "success": True,
            "transcript": full_text,
            "error": None,
            "message": "Transcript fetched successfully.",
        }

    except Exception as e:
        error_type = type(e).__name__
        error_message = str(e)

        print(
            "YouTube Transcript Error:",
            error_type,
            error_message,
        )

        lower_error = error_message.lower()

        # Detect common cloud/datacenter IP blocking
        if (
            "requestblocked" in error_type.lower()
            or "ipblocked" in error_type.lower()
            or "not a bot" in lower_error
            or "sign in to confirm" in lower_error
            or "blocked" in lower_error
        ):
            return {
                "success": False,
                "transcript": None,
                "error": "youtube_blocked_cloud_server",
                "message": (
                    "YouTube blocked transcript access from the cloud server. "
                    "The video can still play, but transcript-based AI features "
                    "are unavailable for this video."
                ),
            }

        if (
            "transcriptsdisabled" in error_type.lower()
            or "disabled" in lower_error
        ):
            return {
                "success": False,
                "transcript": None,
                "error": "transcripts_disabled",
                "message": "Transcripts are disabled for this YouTube video.",
            }

        if (
            "notranscriptfound" in error_type.lower()
            or "no transcript" in lower_error
        ):
            return {
                "success": False,
                "transcript": None,
                "error": "transcript_not_found",
                "message": "No supported transcript was found for this video.",
            }

        return {
            "success": False,
            "transcript": None,
            "error": error_type,
            "message": "Could not retrieve the YouTube transcript.",
        }


# =========================================================
# LANGUAGE MAPPING
# =========================================================

def get_whisper_language(language: str) -> Optional[str]:
    """
    Convert frontend language names
    into Whisper language codes.
    """

    normalized_language = (
        language or "English"
    ).strip().lower()

    language_map = {
        "english": "en",
        "hindi": "hi",

        # Auto detection is better for Hinglish
        "hinglish": None,

        "auto": None,
        "automatic": None,
    }

    return language_map.get(
        normalized_language,
        None,
    )


# =========================================================
# UPLOADED FILE TRANSCRIPTION
# =========================================================

def transcribe_uploaded_file(
    file_path: str,
    language: str = "English",
) -> Optional[str]:
    """
    Transcribe uploaded audio/video
    using faster-whisper.
    """

    if not file_path:
        print(
            "Upload Transcript Error:",
            "File path missing",
        )
        return None

    try:
        model = get_whisper_model()

        whisper_language = get_whisper_language(
            language
        )

        print(
            "Starting uploaded file transcription."
        )

        print(
            "Language:",
            whisper_language or "auto",
        )

        segments, info = model.transcribe(
            file_path,
            language=whisper_language,
            beam_size=1,
            vad_filter=False,
            condition_on_previous_text=False,
        )

        text_parts = []

        for segment in segments:
            text = getattr(
                segment,
                "text",
                "",
            )

            if text:
                cleaned_text = text.strip()

                if cleaned_text:
                    text_parts.append(
                        cleaned_text
                    )

        full_text = " ".join(
            text_parts
        ).strip()

        if not full_text:
            print(
                "Upload Transcript Error:",
                "Whisper returned empty transcript",
            )
            return None

        detected_language = getattr(
            info,
            "language",
            "unknown",
        )

        print(
            "Uploaded file transcribed successfully."
        )

        print(
            "Detected language:",
            detected_language,
        )

        print(
            "Characters:",
            len(full_text),
        )

        return full_text

    except ImportError as e:
        print(
            "Upload Transcript Error:",
            "faster-whisper is not installed.",
            str(e),
        )

        return None

    except Exception as e:
        print(
            "Upload Transcript Error:",
            type(e).__name__,
            str(e),
        )

        return None