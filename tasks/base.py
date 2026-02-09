"""Base task handler classes."""

import re
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class TaskResult:
    """Result of a task execution."""
    success: bool
    message: str
    url: Optional[str] = None
    task_type: Optional[str] = None


class TaskHandler(ABC):
    """Abstract base class for task handlers."""

    task_type: str = ""

    @abstractmethod
    def execute(self, params: str) -> TaskResult:
        """Execute the task with given parameters."""
        pass

    @classmethod
    def parse_task_marker(cls, text: str) -> list[tuple[str, str]]:
        """
        Parse task markers from AI response text.

        Format: [TASK:type:params]

        Returns list of (task_type, params) tuples.
        """
        pattern = r'\[TASK:(\w+):([^\]]+)\]'
        matches = re.findall(pattern, text)
        return matches

    @classmethod
    def remove_task_markers(cls, text: str) -> str:
        """Remove task markers from text for display."""
        pattern = r'\[TASK:\w+:[^\]]+\]'
        return re.sub(pattern, '', text).strip()
