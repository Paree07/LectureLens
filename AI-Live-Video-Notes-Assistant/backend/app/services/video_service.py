import os
import shutil
from typing import Optional, Dict, Any

import requests


UPLOAD_FOLDER = "uploads"


# =========================================================
# SAVE UPLOADED VIDEO
# =========================================================

def save_uploaded_video(file):
    """
    Save an uploaded video file locally.
    Existing upload functionality preserved.
    """

    os.makedirs(
        UPLOAD_FOLDER,
        exist_ok=True,
    )

    file_path = os.path.join(
        UPLOAD_FOLDER,
        file.filename,
    )

    with open(
        file_path,
        "wb",
    ) as buffer:
        shutil.copyfileobj(
            file.file,
            buffer,
        )

    return file_path


# =========================================================
# YOUTUBE METADATA
# =========================================================

def get_video_metadata(
    url: str,
) -> Optional[Dict[str, Any]]:
    """
    Fetch lightweight YouTube metadata using
    YouTube's oEmbed endpoint.

    This avoids yt-dlp for metadata extraction,
    which is more likely to be blocked on cloud servers.
    """

    if not url:
        print(
            "Metadata Error:",
            "URL is missing",
        )
        return None

    try:
        print(
            "Fetching YouTube metadata..."
        )

        response = requests.get(
            "https://www.youtube.com/oembed",
            params={
                "url": url,
                "format": "json",
            },
            timeout=15,
        )

        print(
            "YouTube oEmbed status:",
            response.status_code,
        )

        response.raise_for_status()

        data = response.json()

        metadata = {
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
            ),
            "provider": data.get(
                "provider_name",
                "YouTube",
            ),
            "provider_url": data.get(
                "provider_url",
            ),
            "type": data.get(
                "type",
                "video",
            ),
            "width": data.get(
                "width",
            ),
            "height": data.get(
                "height",
            ),
        }

        print(
            "YouTube metadata fetched successfully."
        )

        print(
            "Title:",
            metadata.get("title"),
        )

        return metadata

    except requests.RequestException as e:
        print(
            "YouTube Metadata Request Error:",
            type(e).__name__,
            str(e),
        )

        return None

    except ValueError as e:
        print(
            "YouTube Metadata JSON Error:",
            type(e).__name__,
            str(e),
        )

        return None

    except Exception as e:
        print(
            "YouTube Metadata Error:",
            type(e).__name__,
            str(e),
        )

        return None