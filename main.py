"""AI processing module for ChatFreeGPT with task detection."""

import ollama
import datetime
import re

# Conversation history for context
conversation_history = []

# System prompt with task awareness
SYSTEM_PROMPT = """You are ChatFreeGPT, a friendly and helpful AI assistant with browser automation capabilities.

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
- Be friendly and conversational"""


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


def process_query(query, model="llama3.2"):
    """
    Process user query using Ollama with task detection.

    Args:
        query: User's input message
        model: Ollama model to use (default: llama3.2)

    Returns:
        AI-generated response string (may include task markers)
    """
    global conversation_history

    # Check for time/date queries to inject current info
    query_lower = query.lower()
    context_info = ""
    if any(word in query_lower for word in ['time', 'date', 'today', 'now', 'current']):
        context_info = f"\n[Context: {get_current_datetime()}]"

    # Detect task intents
    task_hints = detect_task_intent(query)
    if task_hints:
        context_info += f"\n[Hints: {'; '.join(task_hints)}]"

    # Add user message to history
    conversation_history.append({
        "role": "user",
        "content": query + context_info
    })

    # Keep conversation history manageable (last 20 messages)
    if len(conversation_history) > 20:
        conversation_history = conversation_history[-20:]

    try:
        # Create messages list with system prompt
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT}
        ] + conversation_history

        # Call Ollama API
        response = ollama.chat(
            model=model,
            messages=messages
        )

        # Extract response text
        assistant_message = response['message']['content']

        # Add assistant response to history (without task markers for cleaner history)
        clean_message = remove_task_markers(assistant_message)
        conversation_history.append({
            "role": "assistant",
            "content": clean_message
        })

        return assistant_message

    except ollama.ResponseError as e:
        return f"Error: {e.error}. Make sure Ollama is running and the model '{model}' is installed."
    except Exception as e:
        return f"Error connecting to Ollama: {str(e)}. Make sure Ollama is running (ollama serve)."


def process_query_stream(query, model="llama3.2"):
    """
    Process user query with streaming response.

    Args:
        query: User's input message
        model: Ollama model to use

    Yields:
        Response chunks as they arrive
    """
    global conversation_history

    # Check for time/date queries
    query_lower = query.lower()
    context_info = ""
    if any(word in query_lower for word in ['time', 'date', 'today', 'now', 'current']):
        context_info = f"\n[Context: {get_current_datetime()}]"

    # Detect task intents
    task_hints = detect_task_intent(query)
    if task_hints:
        context_info += f"\n[Hints: {'; '.join(task_hints)}]"

    # Add user message to history
    conversation_history.append({
        "role": "user",
        "content": query + context_info
    })

    # Keep history manageable
    if len(conversation_history) > 20:
        conversation_history = conversation_history[-20:]

    try:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT}
        ] + conversation_history

        stream = ollama.chat(
            model=model,
            messages=messages,
            stream=True
        )

        full_response = ""
        for chunk in stream:
            if 'message' in chunk and 'content' in chunk['message']:
                content = chunk['message']['content']
                full_response += content
                yield content

        # Add to history (clean version)
        clean_message = remove_task_markers(full_response)
        conversation_history.append({
            "role": "assistant",
            "content": clean_message
        })

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
    """Clear the conversation history."""
    global conversation_history
    conversation_history = []
    return "Conversation cleared."


def list_models():
    """List available Ollama models."""
    try:
        models = ollama.list()
        return [model['name'] for model in models['models']]
    except Exception as e:
        return f"Error listing models: {str(e)}"


# For command-line testing
if __name__ == "__main__":
    print("ChatFreeGPT CLI (type 'quit' to exit, 'clear' to reset)")
    print("-" * 50)

    while True:
        user_input = input("\nYou: ").strip()

        if user_input.lower() == 'quit':
            break
        elif user_input.lower() == 'clear':
            print(clear_conversation())
            continue
        elif not user_input:
            continue

        response = process_query(user_input)
        print(f"\nAssistant: {response}")

        # Show detected tasks
        tasks = parse_task_markers(response)
        if tasks:
            print(f"\n[Detected tasks: {tasks}]")
