"""Task automation module for ChatFreeGPT."""

from .base import TaskHandler, TaskResult
from .youtube import YouTubeTask
from .gmail import GmailTask
from .browser import BrowserTask, SearchTask

__all__ = [
    'TaskHandler',
    'TaskResult',
    'YouTubeTask',
    'GmailTask',
    'BrowserTask',
    'SearchTask',
]
