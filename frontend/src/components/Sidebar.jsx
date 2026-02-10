import { useState } from "react";
import {
  PlusIcon,
  ChatBubbleLeftIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

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
  const [searchQuery, setSearchQuery] = useState("");

  const conversationList = Object.entries(conversations);

  // Filter conversations by search query
  const filteredList = searchQuery.trim()
    ? conversationList.filter(([, convo]) =>
        (convo.title || "").toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : conversationList;

  // Sort by date (newest first)
  filteredList.sort((a, b) => {
    const dateA = new Date(a[1].created_at || 0);
    const dateB = new Date(b[1].created_at || 0);
    return dateB - dateA;
  });

  // Group by date
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const todayConvos = [];
  const yesterdayConvos = [];
  const olderConvos = [];

  filteredList.forEach(([id, convo]) => {
    const convoDate = new Date(convo.created_at || Date.now()).toDateString();
    if (convoDate === today) {
      todayConvos.push([id, convo]);
    } else if (convoDate === yesterday) {
      yesterdayConvos.push([id, convo]);
    } else {
      olderConvos.push([id, convo]);
    }
  });

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-72 sm:w-80 lg:w-72 xl:w-80
          bg-gray-900/95 backdrop-blur-xl
          border-r border-gray-800/80
          flex flex-col
          transition-transform duration-300 ease-out lg:transform-none
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Header area */}
        <div className="p-3 sm:p-4 space-y-3">
          {/* New Chat Button */}
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
              bg-gradient-to-r from-blue-600 to-purple-600
              hover:from-blue-500 hover:to-purple-500
              text-white font-medium text-sm
              transition-all duration-200 active:scale-[0.98]
              shadow-lg shadow-blue-500/20"
          >
            <PlusIcon className="w-4 h-4" />
            New Chat
          </button>

          {/* Search Bar */}
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full pl-9 pr-8 py-2 bg-gray-800/50 border border-gray-700/50 rounded-xl
                text-sm text-gray-200 placeholder-gray-500
                focus:outline-none focus:border-gray-600 focus:bg-gray-800/80
                transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-700 rounded-md transition-colors"
              >
                <XMarkIcon className="w-3.5 h-3.5 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 scrollbar-thin">
          {filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-800/50 flex items-center justify-center mb-3">
                <ChatBubbleLeftIcon className="w-6 h-6 text-gray-600" />
              </div>
              <p className="text-gray-500 text-sm text-center">
                {searchQuery
                  ? "No matching conversations"
                  : "No conversations yet"}
              </p>
              <p className="text-gray-600 text-xs text-center mt-1">
                {searchQuery
                  ? "Try a different search"
                  : "Start a new chat to begin"}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <ConversationGroup
                label="Today"
                items={todayConvos}
                currentId={currentConversationId}
                onSelect={onSelectConversation}
                onDelete={onDeleteConversation}
              />
              <ConversationGroup
                label="Yesterday"
                items={yesterdayConvos}
                currentId={currentConversationId}
                onSelect={onSelectConversation}
                onDelete={onDeleteConversation}
              />
              <ConversationGroup
                label="Previous"
                items={olderConvos}
                currentId={currentConversationId}
                onSelect={onSelectConversation}
                onDelete={onDeleteConversation}
              />
            </div>
          )}
        </div>

        {/* Model Selector */}
        <div className="p-3 sm:p-4 border-t border-gray-800/80">
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2">
            <SparklesIcon className="w-3.5 h-3.5" />
            Model
          </label>
          <select
            value={currentModel}
            onChange={(e) => onModelChange(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-xl
              text-gray-200 text-sm
              focus:outline-none focus:border-blue-500/50
              transition-all duration-200
              appearance-none cursor-pointer
              bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20fill%3D%22%236b7280%22%20viewBox%3D%220%200%2016%2016%22%3E%3Cpath%20d%3D%22M7.247%2011.14L2.451%205.658C1.885%205.013%202.345%204%203.204%204h9.592a1%201%200%200%201%20.753%201.659l-4.796%205.48a1%201%200%200%201-1.506%200z%22%2F%3E%3C%2Fsvg%3E')]
              bg-[length:12px] bg-[right_12px_center] bg-no-repeat"
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

function ConversationGroup({ label, items, currentId, onSelect, onDelete }) {
  if (items.length === 0) return null;

  return (
    <div className="mb-2">
      <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-1.5">
        {label}
      </h3>
      {items.map(([id, convo]) => (
        <ConversationItem
          key={id}
          id={id}
          title={convo.title}
          isActive={id === currentId}
          onSelect={() => onSelect(id)}
          onDelete={() => onDelete(id)}
        />
      ))}
    </div>
  );
}

function ConversationItem({ id, title, isActive, onSelect, onDelete }) {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div
      className={`
        group flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer
        transition-all duration-200
        ${isActive ? "bg-gray-800/80 shadow-sm" : "hover:bg-gray-800/40"}
      `}
      onClick={onSelect}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <div
        className={`
        w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0
        ${isActive ? "bg-blue-500/20" : "bg-gray-800/60"}
      `}
      >
        <ChatBubbleLeftIcon
          className={`w-3.5 h-3.5 ${isActive ? "text-blue-400" : "text-gray-500"}`}
        />
      </div>
      <span
        className={`flex-1 text-sm truncate ${isActive ? "text-gray-100 font-medium" : "text-gray-400"}`}
      >
        {title || "New conversation"}
      </span>
      {showDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 hover:bg-red-500/10 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
        >
          <TrashIcon className="w-3.5 h-3.5 text-gray-500 hover:text-red-400 transition-colors" />
        </button>
      )}
    </div>
  );
}
