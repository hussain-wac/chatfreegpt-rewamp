"""YouTube task handler."""

import urllib.parse
import urllib.request
import re
from .base import TaskHandler, TaskResult


def find_first_video(query: str) -> dict | None:
    """Search YouTube and return the first video result's ID and URL."""
    try:
        encoded = urllib.parse.quote(query)
        url = f"https://www.youtube.com/results?search_query={encoded}"
        req = urllib.request.Request(
            url, headers={"User-Agent": "Mozilla/5.0"}
        )
        resp = urllib.request.urlopen(req, timeout=8)
        html = resp.read().decode("utf-8")
        match = re.search(r'/watch\?v=([a-zA-Z0-9_-]{11})', html)
        if match:
            video_id = match.group(1)
            return {
                "videoId": video_id,
                "videoUrl": f"https://www.youtube.com/watch?v={video_id}",
            }
    except Exception:
        pass
    return None


class YouTubeTask(TaskHandler):
    """Handler for YouTube video playback tasks."""

    task_type = "youtube"

    def execute(self, params: str) -> TaskResult:
        """
        Search YouTube and return the first matching video URL.

        Args:
            params: Search query or video URL

        Returns:
            TaskResult with the video URL for the frontend to open
        """
        try:
            if params.startswith(('http://', 'https://', 'www.')):
                url = params if params.startswith('http') else f'https://{params}'
            else:
                result = find_first_video(params)
                url = result["videoUrl"] if result else None
                if not url:
                    query = urllib.parse.quote(params)
                    url = f"https://www.youtube.com/results?search_query={query}"

            return TaskResult(
                success=True,
                message=f"Playing on YouTube: {params}",
                url=url,
                task_type=self.task_type
            )

        except Exception as e:
            return TaskResult(
                success=False,
                message=f"Failed to find YouTube video: {str(e)}",
                task_type=self.task_type
            )
