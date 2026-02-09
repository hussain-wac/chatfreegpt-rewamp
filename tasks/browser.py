"""Browser and search task handlers."""

import webbrowser
import urllib.parse
from .base import TaskHandler, TaskResult


class BrowserTask(TaskHandler):
    """Handler for opening URLs in browser."""

    task_type = "open"

    def execute(self, params: str) -> TaskResult:
        """
        Open a URL in the default browser.

        Args:
            params: URL to open

        Returns:
            TaskResult with success status
        """
        try:
            url = params.strip()

            # Add https:// if no protocol specified
            if not url.startswith(('http://', 'https://')):
                url = f'https://{url}'

            webbrowser.open(url)

            return TaskResult(
                success=True,
                message=f"Opened: {url}",
                url=url,
                task_type=self.task_type
            )

        except Exception as e:
            return TaskResult(
                success=False,
                message=f"Failed to open URL: {str(e)}",
                task_type=self.task_type
            )


class SearchTask(TaskHandler):
    """Handler for web search tasks."""

    task_type = "search"

    def __init__(self, search_engine: str = "google"):
        """
        Initialize search task handler.

        Args:
            search_engine: "google" or "duckduckgo"
        """
        self.search_engine = search_engine

    def execute(self, params: str) -> TaskResult:
        """
        Perform a web search.

        Args:
            params: Search query

        Returns:
            TaskResult with success status
        """
        try:
            query = urllib.parse.quote(params.strip())

            if self.search_engine == "duckduckgo":
                url = f"https://duckduckgo.com/?q={query}"
            else:
                url = f"https://www.google.com/search?q={query}"

            webbrowser.open(url)

            return TaskResult(
                success=True,
                message=f"Searching for: {params}",
                url=url,
                task_type=self.task_type
            )

        except Exception as e:
            return TaskResult(
                success=False,
                message=f"Failed to search: {str(e)}",
                task_type=self.task_type
            )
