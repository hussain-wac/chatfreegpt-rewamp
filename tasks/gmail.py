"""Gmail task handler."""

import webbrowser
import urllib.parse
from .base import TaskHandler, TaskResult


class GmailTask(TaskHandler):
    """Handler for Gmail compose tasks."""

    task_type = "gmail"

    def execute(self, params: str) -> TaskResult:
        """
        Open Gmail compose window with pre-filled content.

        Args:
            params: Pipe-separated string: "to@email.com|subject|body"
                    or just "to@email.com" for simple compose

        Returns:
            TaskResult with success status
        """
        try:
            parts = params.split('|')

            to_email = parts[0].strip() if len(parts) > 0 else ""
            subject = parts[1].strip() if len(parts) > 1 else ""
            body = parts[2].strip() if len(parts) > 2 else ""

            # Build Gmail compose URL
            gmail_url = "https://mail.google.com/mail/?view=cm"

            if to_email:
                gmail_url += f"&to={urllib.parse.quote(to_email)}"
            if subject:
                gmail_url += f"&su={urllib.parse.quote(subject)}"
            if body:
                gmail_url += f"&body={urllib.parse.quote(body)}"

            webbrowser.open(gmail_url)

            return TaskResult(
                success=True,
                message=f"Opened Gmail compose for: {to_email}",
                url=gmail_url,
                task_type=self.task_type
            )

        except Exception as e:
            return TaskResult(
                success=False,
                message=f"Failed to open Gmail: {str(e)}",
                task_type=self.task_type
            )
