"""ChatFreeGPT - Flask API Server with Task Automation."""

import json
import os
from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
from dotenv import load_dotenv
from main import (
    process_query, process_query_stream, clear_conversation,
    list_models, remove_task_markers, web_search, web_search_images
)
from tasks import YouTubeTask, GmailTask, BrowserTask, SearchTask
import ollama

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Enable CORS for React frontend
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
        "methods": ["GET", "POST", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Default model
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "llama3.2")

# Conversations storage
conversations = {}

# Task handlers
task_handlers = {
    'youtube': YouTubeTask(),
    'gmail': GmailTask(),
    'search': SearchTask(),
    'open': BrowserTask(),
}

# Conversations file path
CONVERSATIONS_FILE = os.path.join(os.path.dirname(__file__), 'conversations.json')


def load_conversations():
    """Load conversations from file."""
    global conversations
    try:
        if os.path.exists(CONVERSATIONS_FILE):
            with open(CONVERSATIONS_FILE, 'r') as f:
                conversations = json.load(f)
    except Exception as e:
        print(f"Error loading conversations: {e}")
        conversations = {}


def save_conversations():
    """Save conversations to file."""
    try:
        with open(CONVERSATIONS_FILE, 'w') as f:
            json.dump(conversations, f, indent=2)
    except Exception as e:
        print(f"Error saving conversations: {e}")


def get_conversation_history(conversation_id):
    """Get message history for a conversation, formatted for the AI."""
    if not conversation_id or conversation_id not in conversations:
        return []

    convo = conversations[conversation_id]
    messages = convo.get('messages', [])

    return clean_message_history(messages)


def clean_message_history(messages):
    """Clean a list of messages for AI context (remove task markers, limit size)."""
    history = []
    for msg in messages[-20:]:  # Last 20 messages
        role = msg.get('role', 'user')
        content = msg.get('content', '')
        if role == 'assistant':
            content = remove_task_markers(content)
        history.append({'role': role, 'content': content})
    return history


def build_search_query(user_input, history):
    """Build a contextual search query from user input and conversation history.

    If the user's message is vague (e.g. "is he a good singer"), combine it
    with recent user messages to form a meaningful search query.
    Only uses user messages to avoid polluting search with AI response text.
    """
    # Only grab recent USER messages for context (skip assistant responses)
    recent_user = [
        msg.get('content', '')[:80]
        for msg in (history[-6:] if history else [])
        if msg.get('role') == 'user' and msg.get('content', '')
    ]
    # Take last 2 user messages as context (not the current one)
    context = recent_user[-2:] if len(recent_user) > 0 else []

    if context:
        return ' '.join(context) + ' ' + user_input

    return user_input


def should_fetch_images(query):
    """Determine if a query would benefit from image results.

    Returns True for queries about people, places, animals, products,
    landmarks, etc. Returns False for abstract/conceptual questions.
    """
    q = query.lower().strip()

    # Keywords that suggest visual content is useful
    visual_keywords = [
        'who is', 'who was', 'who were',
        'show me', 'picture of', 'photo of', 'images of', 'look like', 'looks like',
        'where is', 'where are',
        'celebrity', 'actor', 'actress', 'singer', 'player', 'athlete',
        'flag of', 'logo of', 'brand',
        'mountain', 'beach', 'island',
        'painting', 'artwork',
    ]

    # Keywords that suggest NO images needed (abstract/conceptual)
    no_image_keywords = [
        'what is', 'what are', 'how to', 'why', 'explain', 'define',
        'difference between', 'meaning of', 'tutorial', 'guide',
        'code', 'programming', 'error', 'bug', 'fix',
        'best way', 'how can i', 'should i', 'help me',
        'calculate', 'convert', 'translate',
        'who are you', 'your name', 'your creator', 'who made you', 'who built you',
        'create', 'generate', 'make me', 'draw', 'write',
        'can you', 'do you', 'are you', 'tell me',
    ]

    # Check no-image keywords first (higher priority)
    for keyword in no_image_keywords:
        if keyword in q:
            return False

    # Check visual keywords
    for keyword in visual_keywords:
        if keyword in q:
            return True

    # Default: no images for generic queries
    return False


# Load conversations on startup
load_conversations()


@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle non-streaming chat requests."""
    data = request.get_json()
    user_input = data.get('message', '')
    model = data.get('model', DEFAULT_MODEL)
    conversation_id = data.get('conversation_id')

    if not user_input.strip():
        return jsonify({"error": "Please enter a message."}), 400

    history = get_conversation_history(conversation_id)
    response = process_query(user_input, model=model, history=history)
    return jsonify({"response": response})


@app.route('/api/chat/stream', methods=['POST'])
def chat_stream():
    """Handle streaming chat requests for real-time responses."""
    data = request.get_json()
    user_input = data.get('message', '')
    model = data.get('model', DEFAULT_MODEL)
    history = data.get('history', [])

    if not user_input.strip():
        return jsonify({"error": "Please enter a message."}), 400

    # Clean history (remove task markers from assistant messages)
    clean_history = clean_message_history(history)

    def generate():
        try:
            for chunk in process_query_stream(user_input, model=model, history=clean_history):
                yield chunk
        except Exception as e:
            yield f"Error: {str(e)}"

    return Response(stream_with_context(generate()), mimetype='text/plain')


@app.route('/api/chat/search-stream', methods=['POST'])
def chat_search_stream():
    """Handle chat with web search augmentation."""
    data = request.get_json()
    user_input = data.get('message', '')
    model = data.get('model', DEFAULT_MODEL)
    history = data.get('history', [])

    if not user_input.strip():
        return jsonify({"error": "Please enter a message."}), 400

    clean_history = clean_message_history(history)

    # Build a contextual search query using recent conversation context
    search_query = build_search_query(user_input, clean_history)

    # Perform web search
    search_results = web_search(search_query, max_results=5)

    # Only fetch images when the query is likely about a person, place, animal,
    # object, or other visual topic — not for general/abstract questions
    image_results = []
    if should_fetch_images(user_input):
        image_results = web_search_images(search_query, max_results=4)

    # Build source list for the frontend (verified real URLs)
    sources = []
    for i, result in enumerate(search_results):
        title = result.get('title', 'No title')
        url = result.get('href', result.get('url', ''))
        body = result.get('body', '')
        if url:
            sources.append({"number": i + 1, "title": title, "url": url, "body": body[:150]})

    # Format search results as extra context for the AI
    search_context = "## Web Search Results\n"
    search_context += f"The user has enabled web search. Search query used: \"{search_query}\"\n"
    search_context += "Here are the search results:\n\n"
    for src in sources:
        search_context += f"[{src['number']}] **{src['title']}**\n   {src['body']}\n\n"
    if image_results:
        search_context += "Relevant images have been found and are being displayed to the user above your response.\n"
    search_context += (
        "IMPORTANT: Synthesize these results into a helpful response. "
        "When citing a source, use ONLY the bracket number format like [1], [2], etc. "
        "Do NOT write out URLs or links — the UI will automatically convert [1], [2] etc. into clickable links. "
        "Never invent or guess URLs. Use the conversation history to understand what the user is referring to."
    )

    def generate():
        try:
            # Send image + source metadata as JSON prefix before the text stream
            import json as _json
            prefix = _json.dumps({"images": image_results, "sources": sources})
            yield prefix + "\n---STREAM---\n"

            for chunk in process_query_stream(
                user_input, model=model, history=clean_history,
                extra_system=search_context
            ):
                yield chunk
        except Exception as e:
            yield f"Error: {str(e)}"

    return Response(stream_with_context(generate()), mimetype='text/plain')


@app.route('/api/search', methods=['POST'])
def search():
    """Perform a web search and return results."""
    data = request.get_json()
    query = data.get('query', '')

    if not query.strip():
        return jsonify({"status": "error", "message": "No query provided"}), 400

    results = web_search(query, max_results=5)
    return jsonify({"status": "success", "results": results})


@app.route('/api/execute-task', methods=['POST'])
def execute_task():
    """Execute a browser automation task."""
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                'success': False,
                'message': 'No task data provided'
            }), 400

        task_type = data.get('type')
        params = data.get('params', '')

        if not task_type:
            return jsonify({
                'success': False,
                'message': 'Task type not specified'
            }), 400

        handler = task_handlers.get(task_type)

        if not handler:
            return jsonify({
                'success': False,
                'message': f'Unknown task type: {task_type}'
            }), 400

        result = handler.execute(params)

        return jsonify({
            'success': result.success,
            'message': result.message,
            'url': result.url,
            'task_type': result.task_type
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Task execution error: {str(e)}'
        }), 500


@app.route('/api/conversations', methods=['GET'])
def get_conversations():
    """Get all conversations."""
    return jsonify({
        'status': 'success',
        'conversations': conversations
    })


@app.route('/api/conversations', methods=['POST'])
def save_conversations_endpoint():
    """Save conversations."""
    global conversations
    try:
        data = request.get_json()
        if data:
            conversations = data
            save_conversations()
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/conversations/<conversation_id>', methods=['GET'])
def get_conversation(conversation_id):
    """Get a specific conversation."""
    if conversation_id in conversations:
        return jsonify({
            'status': 'success',
            'conversation': conversations[conversation_id]
        })
    return jsonify({
        'status': 'error',
        'message': 'Conversation not found'
    }), 404


@app.route('/api/conversations/<conversation_id>', methods=['DELETE'])
def delete_conversation(conversation_id):
    """Delete a specific conversation."""
    if conversation_id in conversations:
        del conversations[conversation_id]
        save_conversations()
        return jsonify({'status': 'success'})
    return jsonify({
        'status': 'error',
        'message': 'Conversation not found'
    }), 404


@app.route('/api/clear', methods=['POST'])
def clear():
    """Clear current conversation history."""
    result = clear_conversation()
    return jsonify({"status": "success", "message": result})


@app.route('/api/models', methods=['GET'])
def models():
    """List available Ollama models."""
    available_models = list_models()
    if isinstance(available_models, str):
        return jsonify({"status": "error", "message": available_models})
    return jsonify({"status": "success", "models": available_models})


@app.route('/api/health', methods=['GET'])
def health():
    """Check if Ollama is running."""
    try:
        ollama.list()
        return jsonify({"status": "healthy", "message": "Ollama is running"})
    except Exception as e:
        return jsonify({"status": "unhealthy", "message": str(e)}), 503


if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("DEBUG", "true").lower() == "true"

    print("\n" + "=" * 50)
    print("ChatFreeGPT API Server")
    print("=" * 50)
    print(f"API running at: http://127.0.0.1:{port}")
    print(f"Frontend expected at: http://localhost:5173")
    print("=" * 50)
    print("Setup:")
    print("  1. Install Ollama: https://ollama.ai")
    print("  2. Start Ollama: ollama serve")
    print(f"  3. Pull a model: ollama pull {DEFAULT_MODEL}")
    print("=" * 50 + "\n")

    app.run(host='0.0.0.0', port=port, debug=debug)
