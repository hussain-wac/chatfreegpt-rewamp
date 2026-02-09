import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

export function WelcomeScreen({ onSelectPrompt }) {
  const capabilities = [
    {
      icon: '🎵',
      title: 'YouTube Playback',
      description: 'Play music and videos directly',
      prompt: 'Play Shape of You by Ed Sheeran on YouTube',
    },
    {
      icon: '📧',
      title: 'Email Composer',
      description: 'Draft and open Gmail compose',
      prompt: 'Send an email to friend@example.com about weekend plans',
    },
    {
      icon: '🔍',
      title: 'Web Search',
      description: 'Search Google or DuckDuckGo',
      prompt: 'Search for the latest news about AI',
    },
    {
      icon: '💬',
      title: 'General Chat',
      description: 'Answer questions on any topic',
      prompt: "What's the weather like today?",
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      {/* Logo */}
      <div className="w-16 h-16 mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
        <ChatBubbleLeftRightIcon className="w-9 h-9 text-white" />
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold text-gray-100 mb-3">
        Welcome to ChatFreeGPT
      </h1>
      <p className="text-gray-400 mb-8 max-w-md">
        Your personal AI assistant with browser automation. Ask me anything or try one of the capabilities below.
      </p>

      {/* Capabilities Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
        {capabilities.map((cap, index) => (
          <button
            key={index}
            onClick={() => onSelectPrompt(cap.prompt)}
            className="flex flex-col items-start p-4 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 hover:border-gray-600 transition-colors text-left"
          >
            <span className="text-2xl mb-2">{cap.icon}</span>
            <span className="font-medium text-gray-200">{cap.title}</span>
            <span className="text-sm text-gray-500">{cap.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
