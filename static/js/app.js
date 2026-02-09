/**
 * ChatFreeGPT - Frontend Application
 */

class ChatApp {
    constructor() {
        this.conversations = {};
        this.currentConversationId = null;
        this.isStreaming = false;
        this.currentModel = 'llama3.2';

        this.init();
    }

    init() {
        this.bindElements();
        this.bindEvents();
        this.checkHealth();
        this.loadModels();
        this.loadConversations();

        // Auto-resize textarea
        this.setupAutoResize();

        // Check health periodically
        setInterval(() => this.checkHealth(), 30000);
    }

    bindElements() {
        this.elements = {
            sidebar: document.getElementById('sidebar'),
            toggleSidebarBtn: document.getElementById('toggleSidebar'),
            newChatBtn: document.getElementById('newChatBtn'),
            conversationList: document.getElementById('conversationList'),
            chatArea: document.getElementById('chatArea'),
            welcomeScreen: document.getElementById('welcomeScreen'),
            messagesContainer: document.getElementById('messagesContainer'),
            messageInput: document.getElementById('messageInput'),
            sendBtn: document.getElementById('sendBtn'),
            modelSelect: document.getElementById('modelSelect'),
            statusDot: document.getElementById('statusDot'),
            statusText: document.getElementById('statusText'),
        };
    }

    bindEvents() {
        // Sidebar toggle
        this.elements.toggleSidebarBtn?.addEventListener('click', () => this.toggleSidebar());

        // New chat
        this.elements.newChatBtn?.addEventListener('click', () => this.newChat());

        // Send message
        this.elements.sendBtn?.addEventListener('click', () => this.sendMessage());
        this.elements.messageInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Model selection
        this.elements.modelSelect?.addEventListener('change', (e) => {
            this.currentModel = e.target.value;
        });

        // Quick actions
        document.querySelectorAll('.quick-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Capability cards
        document.querySelectorAll('.capability-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const prompt = e.currentTarget.dataset.prompt;
                if (prompt) {
                    this.elements.messageInput.value = prompt;
                    this.elements.messageInput.focus();
                }
            });
        });
    }

    setupAutoResize() {
        const textarea = this.elements.messageInput;
        if (!textarea) return;

        textarea.addEventListener('input', () => {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
        });
    }

    toggleSidebar() {
        this.elements.sidebar?.classList.toggle('collapsed');
    }

    async checkHealth() {
        try {
            const response = await fetch('/health');
            const data = await response.json();

            const isHealthy = data.status === 'healthy';

            this.elements.statusDot?.classList.toggle('healthy', isHealthy);
            if (this.elements.statusText) {
                this.elements.statusText.textContent = isHealthy ? 'Connected' : 'Disconnected';
            }

            if (this.elements.messageInput) {
                this.elements.messageInput.disabled = !isHealthy;
                this.elements.messageInput.placeholder = isHealthy
                    ? 'Message ChatFreeGPT...'
                    : 'Ollama not running...';
            }
            if (this.elements.sendBtn) {
                this.elements.sendBtn.disabled = !isHealthy;
            }
        } catch (error) {
            this.elements.statusDot?.classList.remove('healthy');
            if (this.elements.statusText) {
                this.elements.statusText.textContent = 'Error';
            }
        }
    }

    async loadModels() {
        try {
            const response = await fetch('/models');
            const data = await response.json();

            if (data.status === 'success' && data.models) {
                this.elements.modelSelect.innerHTML = '';
                data.models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model;
                    option.textContent = model;
                    this.elements.modelSelect.appendChild(option);
                });
                this.currentModel = data.models[0] || 'llama3.2';
            }
        } catch (error) {
            console.error('Failed to load models:', error);
        }
    }

    async loadConversations() {
        try {
            const response = await fetch('/conversations');
            const data = await response.json();

            if (data.status === 'success') {
                this.conversations = data.conversations || {};
                this.renderConversationList();
            }
        } catch (error) {
            console.error('Failed to load conversations:', error);
        }
    }

    renderConversationList() {
        if (!this.elements.conversationList) return;

        const conversations = Object.entries(this.conversations);

        if (conversations.length === 0) {
            this.elements.conversationList.innerHTML = `
                <div class="conversation-group">
                    <div class="conversation-group-title">No conversations yet</div>
                </div>
            `;
            return;
        }

        // Group by date
        const today = new Date().toDateString();
        const todayConvos = [];
        const olderConvos = [];

        conversations.forEach(([id, convo]) => {
            const convoDate = new Date(convo.created_at || Date.now()).toDateString();
            if (convoDate === today) {
                todayConvos.push([id, convo]);
            } else {
                olderConvos.push([id, convo]);
            }
        });

        let html = '';

        if (todayConvos.length > 0) {
            html += `<div class="conversation-group">
                <div class="conversation-group-title">Today</div>
                ${todayConvos.map(([id, convo]) => this.renderConversationItem(id, convo)).join('')}
            </div>`;
        }

        if (olderConvos.length > 0) {
            html += `<div class="conversation-group">
                <div class="conversation-group-title">Previous</div>
                ${olderConvos.map(([id, convo]) => this.renderConversationItem(id, convo)).join('')}
            </div>`;
        }

        this.elements.conversationList.innerHTML = html;

        // Bind click events
        this.elements.conversationList.querySelectorAll('.conversation-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.id;
                this.loadConversation(id);
            });
        });
    }

    renderConversationItem(id, convo) {
        const isActive = id === this.currentConversationId;
        const title = convo.title || 'New conversation';

        return `
            <div class="conversation-item ${isActive ? 'active' : ''}" data-id="${id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                ${this.escapeHtml(title)}
            </div>
        `;
    }

    newChat() {
        this.currentConversationId = null;

        // Clear messages and show welcome
        if (this.elements.messagesContainer) {
            this.elements.messagesContainer.innerHTML = '';
        }
        if (this.elements.welcomeScreen) {
            this.elements.welcomeScreen.style.display = 'flex';
        }

        // Clear input
        if (this.elements.messageInput) {
            this.elements.messageInput.value = '';
            this.elements.messageInput.style.height = 'auto';
        }

        // Clear server-side conversation
        fetch('/clear', { method: 'POST' });

        // Update sidebar
        this.renderConversationList();
    }

    async loadConversation(id) {
        if (!this.conversations[id]) return;

        this.currentConversationId = id;
        const convo = this.conversations[id];

        // Hide welcome screen
        if (this.elements.welcomeScreen) {
            this.elements.welcomeScreen.style.display = 'none';
        }

        // Render messages
        if (this.elements.messagesContainer) {
            this.elements.messagesContainer.innerHTML = '';
            (convo.messages || []).forEach(msg => {
                this.appendMessage(msg.role, msg.content, false);
            });
        }

        // Update sidebar
        this.renderConversationList();
    }

    async sendMessage() {
        const input = this.elements.messageInput;
        const message = input?.value.trim();

        if (!message || this.isStreaming) return;

        // Hide welcome screen
        if (this.elements.welcomeScreen) {
            this.elements.welcomeScreen.style.display = 'none';
        }

        // Create conversation if needed
        if (!this.currentConversationId) {
            this.currentConversationId = this.generateId();
            this.conversations[this.currentConversationId] = {
                title: message.substring(0, 50),
                messages: [],
                created_at: new Date().toISOString()
            };
        }

        // Add user message
        this.appendMessage('user', message);
        this.conversations[this.currentConversationId].messages.push({
            role: 'user',
            content: message
        });

        // Clear input
        input.value = '';
        input.style.height = 'auto';

        // Show typing indicator
        this.isStreaming = true;
        this.elements.sendBtn.disabled = true;
        const typingEl = this.appendTypingIndicator();

        try {
            const response = await fetch('/chat/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `user_input=${encodeURIComponent(message)}&model=${encodeURIComponent(this.currentModel)}`
            });

            // Remove typing indicator
            typingEl.remove();

            // Create message element for streaming
            const messageEl = this.appendMessage('assistant', '', false);
            const contentEl = messageEl.querySelector('.message-text');

            let fullResponse = '';
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                fullResponse += chunk;
                contentEl.innerHTML = this.renderMarkdown(this.removeTaskMarkers(fullResponse));
                this.scrollToBottom();
            }

            // Parse and render tasks
            const tasks = this.parseTaskMarkers(fullResponse);
            if (tasks.length > 0) {
                this.appendTaskButtons(messageEl, tasks);
            }

            // Save to conversation
            this.conversations[this.currentConversationId].messages.push({
                role: 'assistant',
                content: fullResponse
            });

            // Save conversations
            this.saveConversations();
            this.renderConversationList();

        } catch (error) {
            typingEl?.remove();
            this.appendMessage('assistant', `Error: ${error.message}`);
        } finally {
            this.isStreaming = false;
            this.elements.sendBtn.disabled = false;
        }
    }

    appendMessage(role, content, scroll = true) {
        if (!this.elements.messagesContainer) return;

        const messageEl = document.createElement('div');
        messageEl.className = `message ${role}`;

        const avatar = role === 'user' ? 'U' : 'AI';
        const displayContent = this.removeTaskMarkers(content);

        messageEl.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-text">${this.renderMarkdown(displayContent)}</div>
            </div>
        `;

        this.elements.messagesContainer.appendChild(messageEl);

        // Parse and add task buttons if assistant message
        if (role === 'assistant' && content) {
            const tasks = this.parseTaskMarkers(content);
            if (tasks.length > 0) {
                this.appendTaskButtons(messageEl, tasks);
            }
        }

        if (scroll) {
            this.scrollToBottom();
        }

        return messageEl;
    }

    appendTypingIndicator() {
        const el = document.createElement('div');
        el.className = 'message assistant';
        el.innerHTML = `
            <div class="message-avatar">AI</div>
            <div class="message-content">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        this.elements.messagesContainer?.appendChild(el);
        this.scrollToBottom();
        return el;
    }

    appendTaskButtons(messageEl, tasks) {
        const contentEl = messageEl.querySelector('.message-content');
        if (!contentEl) return;

        const buttonsEl = document.createElement('div');
        buttonsEl.className = 'task-buttons';

        tasks.forEach(task => {
            const btn = document.createElement('button');
            btn.className = `task-btn ${task.type}`;

            const icons = {
                youtube: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
                gmail: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/></svg>',
                search: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
                open: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>'
            };

            const labels = {
                youtube: 'Play on YouTube',
                gmail: 'Open Gmail',
                search: 'Search Web',
                open: 'Open Link'
            };

            btn.innerHTML = `${icons[task.type] || ''} ${labels[task.type] || task.type}`;
            btn.addEventListener('click', () => this.executeTask(task));
            buttonsEl.appendChild(btn);
        });

        contentEl.appendChild(buttonsEl);
    }

    parseTaskMarkers(text) {
        const pattern = /\[TASK:(\w+):([^\]]+)\]/g;
        const tasks = [];
        let match;

        while ((match = pattern.exec(text)) !== null) {
            tasks.push({
                type: match[1],
                params: match[2]
            });
        }

        return tasks;
    }

    removeTaskMarkers(text) {
        return text.replace(/\[TASK:\w+:[^\]]+\]/g, '').trim();
    }

    async executeTask(task) {
        try {
            const response = await fetch('/execute-task', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(task)
            });

            const data = await response.json();

            if (!data.success) {
                console.error('Task execution failed:', data.message);
            }
        } catch (error) {
            console.error('Task execution error:', error);
        }
    }

    handleQuickAction(action) {
        const prompts = {
            youtube: 'Play a song on YouTube for me',
            gmail: 'Help me compose an email',
            search: 'Search the web for '
        };

        if (prompts[action]) {
            this.elements.messageInput.value = prompts[action];
            this.elements.messageInput.focus();
        }
    }

    async saveConversations() {
        try {
            await fetch('/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.conversations)
            });
        } catch (error) {
            console.error('Failed to save conversations:', error);
        }
    }

    renderMarkdown(text) {
        if (!text) return '';

        // Simple markdown rendering
        let html = this.escapeHtml(text);

        // Code blocks
        html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');

        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Bold
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

        // Italic
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

        // Line breaks
        html = html.replace(/\n/g, '<br>');

        // Lists
        html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

        return html;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    scrollToBottom() {
        if (this.elements.chatArea) {
            this.elements.chatArea.scrollTop = this.elements.chatArea.scrollHeight;
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.chatApp = new ChatApp();
});
