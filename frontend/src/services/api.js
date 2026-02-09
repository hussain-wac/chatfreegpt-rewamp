const API_BASE = '/api';

export const api = {
  async checkHealth() {
    const response = await fetch(`${API_BASE}/health`);
    return response.json();
  },

  async getModels() {
    const response = await fetch(`${API_BASE}/models`);
    return response.json();
  },

  async sendMessage(message, model) {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, model }),
    });
    return response.json();
  },

  async streamMessage(message, model, onChunk) {
    const response = await fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, model }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      fullResponse += chunk;
      onChunk(fullResponse);
    }

    return fullResponse;
  },

  async executeTask(type, params) {
    const response = await fetch(`${API_BASE}/execute-task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, params }),
    });
    return response.json();
  },

  async clearConversation() {
    const response = await fetch(`${API_BASE}/clear`, { method: 'POST' });
    return response.json();
  },

  async getConversations() {
    const response = await fetch(`${API_BASE}/conversations`);
    return response.json();
  },

  async saveConversations(conversations) {
    const response = await fetch(`${API_BASE}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(conversations),
    });
    return response.json();
  },

  async deleteConversation(id) {
    const response = await fetch(`${API_BASE}/conversations/${id}`, {
      method: 'DELETE',
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
  return text.replace(/\[TASK:\w+:[^\]]+\]/g, '').trim();
}
