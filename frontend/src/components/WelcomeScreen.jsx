import {
  ChatBubbleLeftRightIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

export function WelcomeScreen({ onSelectPrompt }) {
  const capabilities = [
    {
      icon: "🎵",
      title: "YouTube Playback",
      description: "Play music and videos",
      prompt: "Play Shape of You by Ed Sheeran on YouTube",
      color:
        "from-red-500/10 to-red-500/5 border-red-500/20 hover:border-red-400/40",
    },
    {
      icon: "📧",
      title: "Email Composer",
      description: "Draft and send emails",
      prompt: "Send an email to friend@example.com about weekend plans",
      color:
        "from-orange-500/10 to-orange-500/5 border-orange-500/20 hover:border-orange-400/40",
    },
    {
      icon: "🌐",
      title: "Web Search",
      description: "Search with AI synthesis",
      prompt: "Search for the latest news about AI",
      color:
        "from-blue-500/10 to-blue-500/5 border-blue-500/20 hover:border-blue-400/40",
    },
    {
      icon: "💬",
      title: "General Chat",
      description: "Ask anything you want",
      prompt: "Explain quantum computing in simple terms",
      color:
        "from-purple-500/10 to-purple-500/5 border-purple-500/20 hover:border-purple-400/40",
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 text-center overflow-y-auto">
      {/* Logo */}
      <div className="relative mb-6 sm:mb-8">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/20">
          <SparklesIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-lg flex items-center justify-center ring-4 ring-gray-950">
          <ChatBubbleLeftRightIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 mb-2 sm:mb-3">
        Welcome to{" "}
        <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          ChatFreeGPT
        </span>
      </h1>
      <p className="text-gray-400 mb-8 sm:mb-10 max-w-md text-sm sm:text-base leading-relaxed px-4">
        Your local AI assistant powered by Ollama. Ask anything, search the web,
        or try a capability below.
      </p>

      {/* Capabilities Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 max-w-lg w-full px-2">
        {capabilities.map((cap, index) => (
          <button
            key={index}
            onClick={() => onSelectPrompt(cap.prompt)}
            className={`
              group flex flex-col items-start p-3.5 sm:p-4
              bg-gradient-to-br ${cap.color}
              border rounded-xl sm:rounded-2xl
              hover:scale-[1.02]
              transition-all duration-200 text-left
              active:scale-[0.98]
            `}
          >
            <span className="text-xl sm:text-2xl mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform duration-200">
              {cap.icon}
            </span>
            <span className="font-medium text-gray-200 text-sm">
              {cap.title}
            </span>
            <span className="text-xs text-gray-500 mt-0.5">
              {cap.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
