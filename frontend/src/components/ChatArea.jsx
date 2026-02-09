import { useRef, useEffect } from 'react';
import { Message } from './Message';
import { WelcomeScreen } from './WelcomeScreen';

export function ChatArea({ messages, onExecuteTask, onSelectPrompt }) {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return <WelcomeScreen onSelectPrompt={onSelectPrompt} />;
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        {messages.map((message, index) => (
          <Message
            key={index}
            message={message}
            onExecuteTask={onExecuteTask}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
