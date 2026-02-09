import { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

export function MessageInput({ onSend, isDisabled, isLoading }) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, [message]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (message.trim() && !isDisabled && !isLoading) {
      onSend(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-gray-700 bg-gray-900 p-4">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="flex items-end gap-3 bg-gray-800 rounded-2xl border border-gray-600 p-3 focus-within:border-blue-500 transition-colors">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isDisabled ? 'Ollama not running...' : 'Message ChatFreeGPT...'}
              disabled={isDisabled}
              rows={1}
              className="flex-1 bg-transparent text-gray-200 placeholder-gray-500 resize-none focus:outline-none max-h-48"
            />
            <button
              type="submit"
              disabled={!message.trim() || isDisabled || isLoading}
              className={`
                p-2 rounded-lg transition-colors flex-shrink-0
                ${message.trim() && !isDisabled && !isLoading
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </form>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-3 justify-center">
          <QuickAction
            icon="🎵"
            label="YouTube"
            onClick={() => setMessage('Play a song on YouTube for me')}
          />
          <QuickAction
            icon="📧"
            label="Gmail"
            onClick={() => setMessage('Help me compose an email')}
          />
          <QuickAction
            icon="🔍"
            label="Search"
            onClick={() => setMessage('Search the web for ')}
          />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700 text-gray-400 text-sm hover:bg-gray-700 hover:text-gray-200 transition-colors"
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}
