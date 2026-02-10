"""Task automation module for ChatFreeGPT."""

from .base import TaskHandler, TaskResult
from .youtube import YouTubeTask, find_first_video
from .gmail import GmailTask
from .browser import BrowserTask, SearchTask

__all__ = [
    'TaskHandler',
    'TaskResult',
    'YouTubeTask',
    'find_first_video',
    'GmailTask',
    'BrowserTask',
    'SearchTask',
]
