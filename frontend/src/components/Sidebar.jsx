import { useState } from 'react';
import { PlusIcon, ChatBubbleLeftIcon, TrashIcon } from '@heroicons/react/24/outline';

export function Sidebar({
  conversations,
  currentConversationId,
  models,
  currentModel,
  onModelChange,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  isOpen,
  onClose,
}) {
  const conversationList = Object.entries(conversations);

  // Group by date
  const today = new Date().toDateString();
  const todayConvos = [];
  const olderConvos = [];

  conversationList.forEach(([id, convo]) => {
    const convoDate = new Date(convo.created_at || Date.now()).toDateString();
    if (convoDate === today) {
      todayConvos.push([id, convo]);
    } else {
      olderConvos.push([id, convo]);
    }
  });

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-gray-900 border-r border-gray-700
          flex flex-col
          transform transition-transform duration-300 lg:transform-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* New Chat Button */}
        <div className="p-4 border-b border-gray-700">
          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-600 hover:bg-gray-800 transition-colors text-gray-200"
          >
            <PlusIcon className="w-5 h-5" />
            New Chat
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2">
          {conversationList.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">
              No conversations yet
            </p>
          ) : (
            <>
              {todayConvos.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">
                    Today
                  </h3>
                  {todayConvos.map(([id, convo]) => (
                    <ConversationItem
                      key={id}
                      id={id}
                      title={convo.title}
                      isActive={id === currentConversationId}
                      onSelect={() => onSelectConversation(id)}
                      onDelete={() => onDeleteConversation(id)}
                    />
                  ))}
                </div>
              )}

              {olderConvos.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">
                    Previous
                  </h3>
                  {olderConvos.map(([id, convo]) => (
                    <ConversationItem
                      key={id}
                      id={id}
                      title={convo.title}
                      isActive={id === currentConversationId}
                      onSelect={() => onSelectConversation(id)}
                      onDelete={() => onDeleteConversation(id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Model Selector */}
        <div className="p-4 border-t border-gray-700">
          <label className="block text-xs font-medium text-gray-400 mb-2">
            Model
          </label>
          <select
            value={currentModel}
            onChange={(e) => onModelChange(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 text-sm focus:outline-none focus:border-blue-500"
          >
            {models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>
      </aside>
    </>
  );
}

function ConversationItem({ id, title, isActive, onSelect, onDelete }) {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div
      className={`
        group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer
        ${isActive ? 'bg-gray-700' : 'hover:bg-gray-800'}
      `}
      onClick={onSelect}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <ChatBubbleLeftIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
      <span className="flex-1 text-sm text-gray-200 truncate">
        {title || 'New conversation'}
      </span>
      {showDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 hover:bg-gray-600 rounded"
        >
          <TrashIcon className="w-4 h-4 text-gray-400 hover:text-red-400" />
        </button>
      )}
    </div>
  );
}
