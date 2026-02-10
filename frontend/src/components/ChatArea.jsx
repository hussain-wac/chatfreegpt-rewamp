import { useRef, useEffect, useState, useCallback } from "react";
import { Message } from "./Message";
import { WelcomeScreen } from "./WelcomeScreen";

const SCROLL_THRESHOLD = 200;

export function ChatArea({ messages, onExecuteTask, onSelectPrompt }) {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const autoScrollRef = useRef(true);
  const rafRef = useRef(null);

  // Listen for user-initiated scroll (wheel and touch only).
  // We do NOT listen to "scroll" event — it fires for programmatic scrolls too.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleUserScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const nearBottom = distanceFromBottom < SCROLL_THRESHOLD;

      if (!nearBottom) {
        autoScrollRef.current = false;
        setShowScrollButton(true);
      } else {
        autoScrollRef.current = true;
        setShowScrollButton(false);
      }
    };

    container.addEventListener("wheel", handleUserScroll, { passive: true });
    container.addEventListener("touchmove", handleUserScroll, {
      passive: true,
    });
    return () => {
      container.removeEventListener("wheel", handleUserScroll);
      container.removeEventListener("touchmove", handleUserScroll);
    };
  }, []);

  // Auto-scroll when messages change, only if user hasn't scrolled away.
  // Uses rAF to wait for the browser to paint the new content first.
  // Cancels any pending rAF to avoid stacking multiple scroll jumps.
  useEffect(() => {
    if (!autoScrollRef.current) return;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    });

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    autoScrollRef.current = true;
    setShowScrollButton(false);
    const container = containerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, []);

  if (messages.length === 0) {
    return <WelcomeScreen onSelectPrompt={onSelectPrompt} />;
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto relative">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 md:px-6 py-4">
        <div className="space-y-1">
          {messages.map((message, index) => (
            <Message
              key={index}
              message={message}
              onExecuteTask={onExecuteTask}
            />
          ))}
        </div>
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Floating scroll-to-bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="sticky bottom-4 left-1/2 -translate-x-1/2 z-10
            bg-zinc-700 hover:bg-zinc-600 text-white
            rounded-full p-3 shadow-lg shadow-black/30
            transition-all duration-200 ease-in-out
            flex items-center gap-2 text-sm font-medium
            border border-zinc-600 cursor-pointer
            animate-bounce-in"
          aria-label="Scroll to bottom"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
          <span>New content below</span>
        </button>
      )}
    </div>
  );
}
