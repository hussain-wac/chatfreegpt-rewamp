"""ChatFreeGPT - Flask API Server with Task Automation."""

import json
import os
from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
from dotenv import load_dotenv
from main import process_query, process_query_stream, clear_conversation, list_models
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


# Load conversations on startup
load_conversations()


@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle non-streaming chat requests."""
    data = request.get_json()
    user_input = data.get('message', '')
    model = data.get('model', DEFAULT_MODEL)

    if not user_input.strip():
        return jsonify({"error": "Please enter a message."}), 400

    response = process_query(user_input, model=model)
    return jsonify({"response": response})


@app.route('/api/chat/stream', methods=['POST'])
def chat_stream():
    """Handle streaming chat requests for real-time responses."""
    data = request.get_json()
    user_input = data.get('message', '')
    model = data.get('model', DEFAULT_MODEL)

    if not user_input.strip():
        return jsonify({"error": "Please enter a message."}), 400

    def generate():
        try:
            for chunk in process_query_stream(user_input, model=model):
                yield chunk
        except Exception as e:
            yield f"Error: {str(e)}"

    return Response(stream_with_context(generate()), mimetype='text/plain')


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
