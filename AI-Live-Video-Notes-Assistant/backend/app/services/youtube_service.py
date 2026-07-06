import re
import requests


def extract_video_id(url: str):
    if not url:
        return None

    match = re.search(r"youtu\.be/([A-Za-z0-9_-]{11})", url)
    if match:
        return match.group(1)

    match = re.search(r"[?&]v=([A-Za-z0-9_-]{11})", url)
    if match:
        return match.group(1)

    match = re.search(r"youtube\.com/embed/([A-Za-z0-9_-]{11})", url)
    if match:
        return match.group(1)

    match = re.search(r"youtube\.com/shorts/([A-Za-z0-9_-]{11})", url)
    if match:
        return match.group(1)

    return None


def get_youtube_metadata(url: str):
    try:
        video_id = extract_video_id(url)

        if not video_id:
            return {
                "success": False,
                "error": "Invalid YouTube URL"
            }

        title = "YouTube Video"
        channel = "YouTube"

        try:
            response = requests.get(
                "https://www.youtube.com/oembed",
                params={
                    "url": f"https://www.youtube.com/watch?v={video_id}",
                    "format": "json"
                },
                timeout=10
            )

            if response.ok:
                data = response.json()
                title = data.get("title", title)
                channel = data.get("author_name", channel)

        except Exception as e:
            print("oEmbed warning:", e)

        return {
            "success": True,
            "video_id": video_id,
            "title": title,
            "channel": channel,
            "thumbnail": f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg",
            "webpage_url": f"https://www.youtube.com/watch?v={video_id}",
            "embed_url": f"https://www.youtube.com/embed/{video_id}"
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }