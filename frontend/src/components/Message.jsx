import { removeTaskMarkers } from '../services/api';

export function Message({ message, onExecuteTask }) {
  const { role, content, cleanContent, tasks, isStreaming } = message;
  const displayContent = cleanContent || removeTaskMarkers(content || '');

  const isUser = role === 'user';

  return (
    <div className={`flex gap-4 p-6 ${isUser ? '' : 'bg-gray-800/50'}`}>
      {/* Avatar */}
      <div
        className={`
          w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-semibold
          ${isUser ? 'bg-blue-600' : 'bg-purple-600'}
        `}
      >
        {isUser ? 'U' : 'AI'}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="prose prose-invert max-w-none">
          <MessageContent content={displayContent} />
        </div>

        {/* Streaming indicator */}
        {isStreaming && (
          <div className="flex gap-1 mt-2">
            <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
            <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
            <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
          </div>
        )}

        {/* Task buttons */}
        {tasks && tasks.length > 0 && !isStreaming && (
          <div className="flex gap-2 mt-4 flex-wrap">
            {tasks.map((task, index) => (
              <TaskButton
                key={index}
                type={task.type}
                params={task.params}
                onClick={() => onExecuteTask(task.type, task.params)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MessageContent({ content }) {
  if (!content) return null;

  // Simple markdown rendering
  const renderMarkdown = (text) => {
    let html = text
      // Escape HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Code blocks
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Bold
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-blue-400 hover:underline">$1</a>')
      // Line breaks
      .replace(/\n/g, '<br />');

    return html;
  };

  return (
    <div
      className="text-gray-200 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
}

function TaskButton({ type, params, onClick }) {
  const config = {
    youtube: {
      icon: '▶️',
      label: 'Play on YouTube',
      className: 'border-red-500/50 hover:bg-red-500/10',
    },
    gmail: {
      icon: '📧',
      label: 'Open Gmail',
      className: 'border-orange-500/50 hover:bg-orange-500/10',
    },
    search: {
      icon: '🔍',
      label: 'Search Web',
      className: 'border-blue-500/50 hover:bg-blue-500/10',
    },
    open: {
      icon: '🔗',
      label: 'Open Link',
      className: 'border-green-500/50 hover:bg-green-500/10',
    },
  };

  const { icon, label, className } = config[type] || {
    icon: '⚡',
    label: type,
    className: 'border-gray-500/50 hover:bg-gray-500/10',
  };

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-full
        border text-sm text-gray-200 transition-colors
        ${className}
      `}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}
