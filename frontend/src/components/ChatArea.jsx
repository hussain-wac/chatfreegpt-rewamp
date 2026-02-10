import { useRef, useEffect } from "react";
import { Message } from "./Message";
import { WelcomeScreen } from "./WelcomeScreen";

export function ChatArea({ messages, onExecuteTask, onSelectPrompt }) {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return <WelcomeScreen onSelectPrompt={onSelectPrompt} />;
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto scroll-smooth">
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
    </div>
  );
}
