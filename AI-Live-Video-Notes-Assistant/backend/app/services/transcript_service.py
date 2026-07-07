import os
import re
import shutil
import tempfile
from typing import Optional, Dict, Any

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.proxies import WebshareProxyConfig
from youtube_transcript_api._errors import (
    RequestBlocked,
    IpBlocked,
    VideoUnavailable,
    TranscriptsDisabled,
    NoTranscriptFound,
)


# =========================================================
# PROXY CONFIG (set these as environment variables on your
# hosting provider's dashboard, e.g. Render/Railway "Environment" tab)
# =========================================================

WEBSHARE_USERNAME = os.environ.get("WEBSHARE_PROXY_USERNAME")
WEBSHARE_PASSWORD = os.environ.get("WEBSHARE_PROXY_PASSWORD")
YTDLP_PROXY_URL = os.environ.get("YTDLP_PROXY_URL")  # e.g. "http://user:pass@p.webshare.io:80"


def get_ytt_api():
    """
    Build a YouTubeTranscriptApi instance.
    Uses Webshare rotating residential proxy if credentials
    are configured, otherwise falls back to a direct connection
    (which will likely be blocked on cloud hosts).
    """
    if WEBSHARE_USERNAME and WEBSHARE_PASSWORD:
        return YouTubeTranscriptApi(
            proxy_config=WebshareProxyConfig(
                proxy_username=WEBSHARE_USERNAME,
                proxy_password=WEBSHARE_PASSWORD,
            )
        )
    return YouTubeTranscriptApi()


# =========================================================
# GLOBAL WHISPER MODEL CACHE
# =========================================================

_whisper_model = None


def get_whisper_model():
    """
    Load Whisper model only once.
    Reuse the same model for future transcriptions.
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
    Extract YouTube video ID from common YouTube URLs.
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
# TRANSCRIBE AUDIO FILE WITH WHISPER
# =========================================================

def transcribe_audio_with_whisper(
    file_path: str,
    language: Optional[str] = None,
) -> Optional[str]:
    """
    Transcribe an audio/video file using faster-whisper.
    """

    try:
        model = get_whisper_model()

        print("Starting Whisper transcription...")
        print("File:", file_path)
        print("Language:", language or "auto")

        segments, info = model.transcribe(
            file_path,
            language=language,
            beam_size=1,
            vad_filter=True,
            condition_on_previous_text=False,
        )

        text_parts = []

        for segment in segments:
            text = getattr(segment, "text", "")

            if text:
                cleaned_text = text.strip()

                if cleaned_text:
                    text_parts.append(cleaned_text)

        full_text = " ".join(text_parts).strip()

        if not full_text:
            print("Whisper returned empty transcript.")
            return None

        detected_language = getattr(
            info,
            "language",
            "unknown",
        )

        print("Whisper transcription successful.")
        print("Detected language:", detected_language)
        print("Characters:", len(full_text))

        return full_text

    except Exception as e:
        print(
            "Whisper Transcription Error:",
            type(e).__name__,
            str(e),
        )

        return None


# =========================================================
# YOUTUBE AUDIO FALLBACK
# =========================================================

def get_transcript_with_whisper_fallback(
    url: str,
) -> Optional[str]:
    """
    Fallback method:

    1. Download best available audio with yt-dlp
    2. Transcribe downloaded audio using faster-whisper
    3. Delete temporary files
    """

    temp_dir = None

    try:
        import yt_dlp

        print("Trying yt-dlp + Whisper fallback...")

        temp_dir = tempfile.mkdtemp(
            prefix="lecturelens_"
        )

        output_template = os.path.join(
            temp_dir,
            "audio.%(ext)s",
        )

        ydl_options = {
            "format": "bestaudio/best",

            "outtmpl": output_template,

            "quiet": True,

            "no_warnings": True,

            "noplaylist": True,

            "retries": 2,

            "socket_timeout": 30,

            # Do not download excessively large media
            "max_filesize": 200 * 1024 * 1024,
        }

        if YTDLP_PROXY_URL:
            ydl_options["proxy"] = YTDLP_PROXY_URL
            print("Using proxy for yt-dlp download.")

        with yt_dlp.YoutubeDL(
            ydl_options
        ) as ydl:

            print("Downloading YouTube audio...")

            info = ydl.extract_info(
                url,
                download=True,
            )

            downloaded_file = ydl.prepare_filename(
                info
            )

        print(
            "yt-dlp reported file:",
            downloaded_file,
        )

        # Sometimes extension/path may differ.
        # Find actual downloaded file in temp folder.
        if not os.path.exists(downloaded_file):

            files = [
                os.path.join(temp_dir, name)
                for name in os.listdir(temp_dir)
                if os.path.isfile(
                    os.path.join(temp_dir, name)
                )
            ]

            if not files:
                print(
                    "Whisper fallback failed:",
                    "No downloaded audio file found.",
                )
                return None

            downloaded_file = files[0]

        print(
            "Audio downloaded successfully:",
            downloaded_file,
        )

        transcript = transcribe_audio_with_whisper(
            downloaded_file,
            language=None,
        )

        return transcript

    except Exception as e:
        print(
            "YouTube Whisper Fallback Error:",
            type(e).__name__,
            str(e),
        )

        return None

    finally:
        if temp_dir and os.path.exists(temp_dir):
            try:
                shutil.rmtree(
                    temp_dir,
                    ignore_errors=True,
                )

                print(
                    "Temporary YouTube files cleaned."
                )

            except Exception as cleanup_error:
                print(
                    "Cleanup Error:",
                    str(cleanup_error),
                )


# =========================================================
# YOUTUBE TRANSCRIPT
# =========================================================

def get_transcript(
    url: str,
) -> Dict[str, Any]:
    """
    Transcript strategy:

    1. Try YouTube transcript/captions API (via proxy if configured)
    2. If unavailable or cloud-blocked:
       try yt-dlp audio + Whisper
    3. Return structured response
    """

    video_id = extract_video_id(url)

    if not video_id:
        return {
            "success": False,
            "transcript": None,
            "error": "invalid_youtube_url",
            "message": "Invalid YouTube URL.",
        }

    # -----------------------------------------------------
    # METHOD 1: YOUTUBE TRANSCRIPT API
    # -----------------------------------------------------

    method_1_error_code = None

    try:
        print("Trying YouTube transcript API...")
        print("Video ID:", video_id)

        ytt_api = get_ytt_api()

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
            text = getattr(
                item,
                "text",
                None,
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

        if full_text:
            print(
                "YouTube transcript fetched successfully:",
                len(full_text),
                "characters",
            )

            return {
                "success": True,
                "transcript": full_text,
                "source": "youtube_captions",
                "error": None,
                "message": "Transcript fetched successfully.",
            }

        print(
            "YouTube captions returned empty text."
        )
        method_1_error_code = "empty_captions"

    except (RequestBlocked, IpBlocked) as e:
        print("YouTube blocked this server's IP:", str(e))
        method_1_error_code = "ip_blocked"

    except TranscriptsDisabled:
        print("Captions are disabled for this video.")
        method_1_error_code = "captions_disabled"

    except NoTranscriptFound:
        print("No transcript found in requested languages.")
        method_1_error_code = "no_transcript_found"

    except VideoUnavailable:
        print("Video is unavailable (private/deleted/region-locked).")
        method_1_error_code = "video_unavailable"

    except Exception as e:
        print(
            "YouTube Transcript API Error:",
            type(e).__name__,
            str(e),
        )
        method_1_error_code = "unknown_error"

    # -----------------------------------------------------
    # METHOD 2: YT-DLP + WHISPER FALLBACK
    # -----------------------------------------------------

    print(
        "Primary transcript method failed:",
        method_1_error_code,
    )

    print(
        "Trying audio + Whisper fallback..."
    )

    whisper_transcript = (
        get_transcript_with_whisper_fallback(
            url
        )
    )

    if whisper_transcript:
        return {
            "success": True,
            "transcript": whisper_transcript,
            "source": "whisper_fallback",
            "error": None,
            "message": (
                "Transcript generated from video audio "
                "using Whisper."
            ),
        }

    # -----------------------------------------------------
    # ALL METHODS FAILED
    # -----------------------------------------------------

    return {
        "success": False,
        "transcript": None,
        "error": method_1_error_code or "all_transcript_methods_failed",
        "message": (
            "Could not retrieve or generate a transcript. "
            "YouTube may be blocking the deployed cloud server."
        ),
    }


# =========================================================
# LANGUAGE MAPPING
# =========================================================

def get_whisper_language(
    language: str,
) -> Optional[str]:
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

    whisper_language = get_whisper_language(
        language
    )

    return transcribe_audio_with_whisper(
        file_path=file_path,
        language=whisper_language,
    )