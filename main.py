"""AI processing module for ChatFreeGPT with task detection."""

import ollama
import datetime
import re

# System prompt with task awareness
SYSTEM_PROMPT = """You are ChatFreeGPT, a friendly and helpful AI assistant with browser automation capabilities.

## About You:
You were created by Muhammed Hussain, a React.js developer at Weband Crafts. When anyone asks who built you, who made you, or who created you, always credit Muhammed Hussain at Weband Crafts. Do not say you were made by Meta, OpenAI, or any other company.

## Your Capabilities:
- Answer questions on various topics
- Help with general knowledge queries
- Provide the current date and time when asked
- **Play YouTube videos/music** - When asked to play something on YouTube
- **Compose emails** - When asked to send/write an email
- **Search the web** - When asked to search for something
- **Open websites** - When asked to open a URL or website

## Task Format:
When the user requests a task, include a task marker at the END of your response:
- YouTube: [TASK:youtube:search query or video name]
- Gmail: [TASK:gmail:email@example.com|Subject Line|Email body text]
- Web Search: [TASK:search:search query]
- Open URL: [TASK:open:website.com]

## Examples:

User: "Play Shape of You on YouTube"
Response: I'll play "Shape of You" by Ed Sheeran on YouTube for you! This is a great song from his album "÷" (Divide).
[TASK:youtube:Shape of You Ed Sheeran]

User: "Send an email to john@example.com about the meeting tomorrow"
Response: I'll help you compose that email to John about the meeting.
[TASK:gmail:john@example.com|Meeting Tomorrow|Hi John,

I wanted to reach out regarding our meeting tomorrow.

Best regards]

User: "Search for best Python tutorials"
Response: I'll search for the best Python tutorials for you!
[TASK:search:best Python tutorials 2024]

User: "Open github.com"
Response: Opening GitHub for you!
[TASK:open:github.com]

## Important Guidelines:
- Be conversational and helpful in your text response
- Only include ONE task marker per response
- Place the task marker at the very end of your response
- If no task is needed, just respond normally without any task markers
- For Gmail, use pipe (|) to separate: email|subject|body
- Keep your responses concise but informative
- Be friendly and conversational
- When web search results are provided in the context, synthesize the information and cite sources with URLs"""


def get_current_datetime():
    """Get formatted current date and time."""
    now = datetime.datetime.now()
    return f"Current date: {now.strftime('%A, %B %d, %Y')}. Current time: {now.strftime('%I:%M %p')}"


def detect_task_intent(query):
    """
    Detect if the query contains task-related intent.
    Returns hints to help the AI understand the context.
    """
    query_lower = query.lower()

    hints = []

    # YouTube detection
    youtube_patterns = ['play', 'youtube', 'music', 'song', 'video', 'watch', 'listen']
    if any(pattern in query_lower for pattern in youtube_patterns):
        hints.append("User might want to play something on YouTube")

    # Email detection
    email_patterns = ['email', 'mail', 'send', 'compose', 'write to', 'message to']
    if any(pattern in query_lower for pattern in email_patterns):
        hints.append("User might want to compose an email")

    # Search detection
    search_patterns = ['search', 'look up', 'find', 'google', 'search for']
    if any(pattern in query_lower for pattern in search_patterns):
        hints.append("User might want to search the web")

    # URL detection
    url_patterns = ['open', 'go to', 'visit', 'navigate to', '.com', '.org', '.net', 'website']
    if any(pattern in query_lower for pattern in url_patterns):
        hints.append("User might want to open a website")

    return hints


def _build_messages(query, history=None, extra_system=""):
    """Build the messages list for Ollama from history and current query."""
    # Check for time/date queries to inject current info
    query_lower = query.lower()
    context_info = ""
    if any(word in query_lower for word in ['time', 'date', 'today', 'now', 'current']):
        context_info = f"\n[Context: {get_current_datetime()}]"

    # Detect task intents
    task_hints = detect_task_intent(query)
    if task_hints:
        context_info += f"\n[Hints: {'; '.join(task_hints)}]"

    system_content = SYSTEM_PROMPT
    if extra_system:
        system_content += "\n\n" + extra_system

    messages = [{"role": "system", "content": system_content}]

    # Add conversation history (limit to last 20 messages)
    if history:
        messages.extend(history[-20:])

    # Add current user message
    messages.append({"role": "user", "content": query + context_info})

    return messages


def process_query(query, model="llama3.2", history=None):
    """
    Process user query using Ollama with task detection.

    Args:
        query: User's input message
        model: Ollama model to use
        history: List of previous messages [{role, content}, ...]

    Returns:
        AI-generated response string (may include task markers)
    """
    try:
        messages = _build_messages(query, history)

        response = ollama.chat(
            model=model,
            messages=messages
        )

        return response['message']['content']

    except ollama.ResponseError as e:
        return f"Error: {e.error}. Make sure Ollama is running and the model '{model}' is installed."
    except Exception as e:
        return f"Error connecting to Ollama: {str(e)}. Make sure Ollama is running (ollama serve)."


def process_query_stream(query, model="llama3.2", history=None, extra_system=""):
    """
    Process user query with streaming response.

    Args:
        query: User's input message
        model: Ollama model to use
        history: List of previous messages [{role, content}, ...]
        extra_system: Additional system context (e.g. web search results)

    Yields:
        Response chunks as they arrive
    """
    try:
        messages = _build_messages(query, history, extra_system)

        stream = ollama.chat(
            model=model,
            messages=messages,
            stream=True
        )

        for chunk in stream:
            if 'message' in chunk and 'content' in chunk['message']:
                yield chunk['message']['content']

    except Exception as e:
        yield f"Error: {str(e)}"


def remove_task_markers(text):
    """Remove task markers from text."""
    pattern = r'\[TASK:\w+:[^\]]+\]'
    return re.sub(pattern, '', text).strip()


def parse_task_markers(text):
    """
    Parse task markers from response text.

    Returns:
        List of (task_type, params) tuples
    """
    pattern = r'\[TASK:(\w+):([^\]]+)\]'
    return re.findall(pattern, text)


def clear_conversation():
    """Clear the conversation history (no-op, history is now per-conversation)."""
    return "Conversation cleared."


def list_models():
    """List available Ollama models."""
    try:
        result = ollama.list()
        return [model.model for model in result.models]
    except Exception as e:
        return f"Error listing models: {str(e)}"


def web_search(query, max_results=5):
    """
    Search the web using DuckDuckGo.

    Args:
        query: Search query string
        max_results: Number of results to return

    Returns:
        List of dicts with title, url, body keys
    """
    try:
        from ddgs import DDGS
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
            return results
    except Exception as e:
        return [{"title": "Search Error", "url": "", "body": str(e)}]


def web_search_images(query, max_results=4):
    """
    Search for images using DuckDuckGo.

    Args:
        query: Search query string
        max_results: Number of image results to return

    Returns:
        List of dicts with title, image, thumbnail, source keys
    """
    try:
        from ddgs import DDGS
        with DDGS() as ddgs:
            results = list(ddgs.images(query, max_results=max_results))
            return [
                {
                    "title": r.get("title", ""),
                    "image": r.get("image", ""),
                    "thumbnail": r.get("thumbnail", ""),
                    "source": r.get("url", ""),
                }
                for r in results
            ]
    except Exception:
        return []


# For command-line testing
if __name__ == "__main__":
    print("ChatFreeGPT CLI (type 'quit' to exit, 'clear' to reset)")
    print("-" * 50)

    cli_history = []

    while True:
        user_input = input("\nYou: ").strip()

        if user_input.lower() == 'quit':
            break
        elif user_input.lower() == 'clear':
            cli_history = []
            print("Conversation cleared.")
            continue
        elif not user_input:
            continue

        response = process_query(user_input, history=cli_history)
        print(f"\nAssistant: {response}")

        # Update CLI history
        cli_history.append({"role": "user", "content": user_input})
        clean = remove_task_markers(response)
        cli_history.append({"role": "assistant", "content": clean})

        # Show detected tasks
        tasks = parse_task_markers(response)
        if tasks:
            print(f"\n[Detected tasks: {tasks}]")
