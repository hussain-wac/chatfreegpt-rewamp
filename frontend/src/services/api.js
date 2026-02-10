const API_BASE = "/api";

export const api = {
  async checkHealth() {
    const response = await fetch(`${API_BASE}/health`);
    return response.json();
  },

  async getModels() {
    const response = await fetch(`${API_BASE}/models`);
    return response.json();
  },

  async sendMessage(message, model, conversationId) {
    const response = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, model, conversation_id: conversationId }),
    });
    return response.json();
  },

  async streamMessage(message, model, onChunk, history, signal, onVideo) {
    const response = await fetch(`${API_BASE}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, model, history }),
      signal,
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullResponse = "";
    let prefixParsed = false;
    const DELIMITER = "\n---STREAM---\n";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);

        if (!prefixParsed) {
          buffer += chunk;
          const delimIdx = buffer.indexOf(DELIMITER);
          if (delimIdx !== -1) {
            // Parse the JSON prefix for video data
            const prefix = buffer.substring(0, delimIdx);
            try {
              const meta = JSON.parse(prefix);
              if (meta.video && onVideo) {
                onVideo(meta.video);
              }
            } catch {
              // No prefix or parse failed — treat entire buffer as text
            }
            const rest = buffer.substring(delimIdx + DELIMITER.length);
            prefixParsed = true;
            if (rest) {
              fullResponse += rest;
              onChunk(fullResponse);
            }
          } else if (!buffer.startsWith("{")) {
            // No JSON prefix — plain text stream
            prefixParsed = true;
            fullResponse = buffer;
            onChunk(fullResponse);
          }
        } else {
          fullResponse += chunk;
          onChunk(fullResponse);
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        // User stopped generation — return what we have so far
      } else {
        throw err;
      }
    }

    // If prefix was never parsed (no delimiter found), treat buffer as text
    if (!prefixParsed) {
      fullResponse = buffer;
    }

    return fullResponse;
  },

  async searchStream(
    message,
    model,
    onChunk,
    history,
    signal,
    onImages,
    onSources,
    onVideo,
  ) {
    const response = await fetch(`${API_BASE}/chat/search-stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, model, history }),
      signal,
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullResponse = "";
    let prefixParsed = false;
    const DELIMITER = "\n---STREAM---\n";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);

        if (!prefixParsed) {
          buffer += chunk;
          const delimIdx = buffer.indexOf(DELIMITER);
          if (delimIdx !== -1) {
            // Parse the JSON prefix for images
            const prefix = buffer.substring(0, delimIdx);
            try {
              const meta = JSON.parse(prefix);
              if (meta.images && onImages) {
                onImages(meta.images);
              }
              if (meta.sources && onSources) {
                onSources(meta.sources);
              }
              if (meta.video && onVideo) {
                onVideo(meta.video);
              }
            } catch {
              // Prefix parse failed — ignore images
            }
            // Rest after delimiter is the start of the text stream
            const rest = buffer.substring(delimIdx + DELIMITER.length);
            prefixParsed = true;
            if (rest) {
              fullResponse += rest;
              onChunk(fullResponse);
            }
          }
        } else {
          fullResponse += chunk;
          onChunk(fullResponse);
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        // User stopped generation
      } else {
        throw err;
      }
    }

    return fullResponse;
  },

  async search(query) {
    const response = await fetch(`${API_BASE}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    return response.json();
  },

  async executeTask(type, params) {
    const response = await fetch(`${API_BASE}/execute-task`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, params }),
    });
    return response.json();
  },

  async clearConversation() {
    const response = await fetch(`${API_BASE}/clear`, { method: "POST" });
    return response.json();
  },

  async getConversations() {
    const response = await fetch(`${API_BASE}/conversations`);
    return response.json();
  },

  async saveConversations(conversations) {
    const response = await fetch(`${API_BASE}/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(conversations),
    });
    return response.json();
  },

  async deleteConversation(id) {
    const response = await fetch(`${API_BASE}/conversations/${id}`, {
      method: "DELETE",
    });
    return response.json();
  },
};

export function parseTaskMarkers(text) {
  const pattern = /\[TASK:(\w+):([^\]]+)\]/g;
  const tasks = [];
  let match;

  while ((match = pattern.exec(text)) !== null) {
    tasks.push({ type: match[1], params: match[2] });
  }

  return tasks;
}

export function removeTaskMarkers(text) {
  return text.replace(/\[TASK:\w+:[^\]]+\]/g, "").trim();
}
