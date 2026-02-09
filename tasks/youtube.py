"""YouTube task handler."""

import webbrowser
import urllib.parse
from .base import TaskHandler, TaskResult


class YouTubeTask(TaskHandler):
    """Handler for YouTube video playback tasks."""

    task_type = "youtube"

    def execute(self, params: str) -> TaskResult:
        """
        Open YouTube search or video.

        Args:
            params: Search query or video URL

        Returns:
            TaskResult with success status
        """
        try:
            # Check if it's already a URL
            if params.startswith(('http://', 'https://', 'www.')):
                url = params if params.startswith('http') else f'https://{params}'
            else:
                # Create YouTube search URL
                query = urllib.parse.quote(params)
                url = f"https://www.youtube.com/results?search_query={query}"

            webbrowser.open(url)

            return TaskResult(
                success=True,
                message=f"Opened YouTube: {params}",
                url=url,
                task_type=self.task_type
            )

        except Exception as e:
            return TaskResult(
                success=False,
                message=f"Failed to open YouTube: {str(e)}",
                task_type=self.task_type
            )
