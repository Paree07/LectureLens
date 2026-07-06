import re
from typing import Optional

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

        print("Loading Whisper tiny model...")

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

def get_transcript(url: str) -> Optional[str]:
    """
    Fetch transcript from YouTube.
    """

    video_id = extract_video_id(url)

    if not video_id:
        print("Transcript Error: Invalid YouTube URL")
        return None

    try:
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
                text_parts.append(text)

        full_text = " ".join(text_parts).strip()

        if not full_text:
            print("Transcript Error: Transcript is empty")
            return None

        print(
            "YouTube transcript fetched successfully:",
            len(full_text),
            "characters",
        )

        return full_text

    except Exception as e:
        print(
            "YouTube Transcript Error:",
            type(e).__name__,
            str(e),
        )

        return None


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
        # Get cached Whisper model
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

            # Faster than beam_size=5
            beam_size=1,

            # Ignore silence
            vad_filter=False,

            # Faster processing
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