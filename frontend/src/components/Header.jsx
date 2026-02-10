import {
  Bars3Icon,
  CpuChipIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

export function Header({ isHealthy, currentModel, onToggleSidebar }) {
  return (
    <header className="flex items-center justify-between px-3 sm:px-6 py-3 border-b border-gray-800/80 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-30">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-gray-800 rounded-xl lg:hidden transition-all duration-200 active:scale-95"
        >
          <Bars3Icon className="w-5 h-5 text-gray-400" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <SparklesIcon className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-base sm:text-lg font-semibold text-gray-100 truncate">
            ChatFreeGPT
          </h1>
        </div>

        {currentModel && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-gray-800/60 rounded-lg border border-gray-700/50">
            <CpuChipIcon className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs text-gray-500 font-medium">
              {currentModel}
            </span>
          </div>
        )}
      </div>

      <div
        className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm
        ${
          isHealthy
            ? "bg-green-500/10 border border-green-500/20"
            : "bg-red-500/10 border border-red-500/20"
        }
      `}
      >
        <span
          className={`
          w-2 h-2 rounded-full flex-shrink-0
          ${
            isHealthy
              ? "bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse"
              : "bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
          }
        `}
        />
        <span
          className={`font-medium ${isHealthy ? "text-green-400" : "text-red-400"}`}
        >
          {isHealthy ? "Online" : "Offline"}
        </span>
      </div>
    </header>
  );
}
