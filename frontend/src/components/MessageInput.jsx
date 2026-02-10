import { useState, useRef, useEffect } from "react";
import { PaperAirplaneIcon, StopIcon } from "@heroicons/react/24/solid";
import { GlobeAltIcon } from "@heroicons/react/24/outline";

export function MessageInput({
  onSend,
  onSendWithSearch,
  onStop,
  isDisabled,
  isLoading,
}) {
  const [message, setMessage] = useState("");
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
    }
  }, [message]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (message.trim() && !isDisabled && !isLoading) {
      if (webSearchEnabled) {
        onSendWithSearch(message);
      } else {
        onSend(message);
      }
      setMessage("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-gray-950/80 backdrop-blur-xl border-t border-gray-800/50 px-2 sm:px-4 py-3 sm:py-4">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit}>
          <div
            className={`
            flex items-end gap-2 sm:gap-3
            bg-gray-800/50 rounded-2xl
            border transition-all duration-300
            p-2 sm:p-3
            ${
              webSearchEnabled
                ? "border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.08)]"
                : "border-gray-700/50 focus-within:border-gray-600"
            }
          `}
          >
            {/* Web Search Toggle */}
            <button
              type="button"
              onClick={() => setWebSearchEnabled(!webSearchEnabled)}
              className={`
                p-1.5 sm:p-2 rounded-xl transition-all duration-300 flex-shrink-0
                active:scale-90
                ${
                  webSearchEnabled
                    ? "bg-blue-500/20 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.15)]"
                    : "text-gray-500 hover:text-gray-300 hover:bg-gray-700/50"
                }
              `}
              title={
                webSearchEnabled ? "Disable web search" : "Enable web search"
              }
            >
              <GlobeAltIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isDisabled
                  ? "Ollama not running..."
                  : webSearchEnabled
                    ? "Search the web and ask..."
                    : "Message ChatFreeGPT..."
              }
              disabled={isDisabled}
              rows={1}
              className="flex-1 bg-transparent text-gray-200 placeholder-gray-500
                text-sm sm:text-base
                resize-none focus:outline-none max-h-48 py-1"
            />

            {/* Send / Stop Button */}
            {isLoading ? (
              <button
                type="button"
                onClick={onStop}
                className="p-1.5 sm:p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400
                  transition-all duration-200 flex-shrink-0 active:scale-90
                  ring-1 ring-red-500/30"
                title="Stop generating"
              >
                <StopIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!message.trim() || isDisabled}
                className={`
                  p-1.5 sm:p-2 rounded-xl transition-all duration-200 flex-shrink-0
                  active:scale-90
                  ${
                    message.trim() && !isDisabled
                      ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                      : "bg-gray-700/50 text-gray-600 cursor-not-allowed"
                  }
                `}
              >
                <PaperAirplaneIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
        </form>

        {/* Quick Actions */}
        <div className="flex gap-1.5 sm:gap-2 mt-2 sm:mt-3 justify-center items-center flex-wrap">
          {webSearchEnabled && (
            <span className="text-[11px] sm:text-xs text-blue-400 flex items-center gap-1 px-2 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
              <GlobeAltIcon className="w-3 h-3" />
              Web search active
            </span>
          )}
          <QuickAction
            icon="🎵"
            label="YouTube"
            onClick={() => setMessage("Play a song on YouTube for me")}
          />
          <QuickAction
            icon="📧"
            label="Gmail"
            onClick={() => setMessage("Help me compose an email")}
          />
          <QuickAction
            icon="🔍"
            label="Search"
            onClick={() => {
              setWebSearchEnabled(true);
              setMessage("Search the web for ");
            }}
          />
        </div>

        <p className="text-center text-[10px] sm:text-[11px] text-gray-600 mt-2">
          ChatFreeGPT can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}

function QuickAction({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full
        bg-gray-800/40 border border-gray-700/40
        text-gray-500 text-[11px] sm:text-xs font-medium
        hover:bg-gray-700/50 hover:text-gray-300 hover:border-gray-600/50
        transition-all duration-200 active:scale-95"
    >
      <span className="text-xs">{icon}</span>
      {label}
    </button>
  );
}
