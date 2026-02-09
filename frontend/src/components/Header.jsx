import { Bars3Icon } from '@heroicons/react/24/outline';

export function Header({ isHealthy, onToggleSidebar }) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-900">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-gray-800 rounded-lg lg:hidden"
        >
          <Bars3Icon className="w-5 h-5 text-gray-400" />
        </button>
        <h1 className="text-lg font-semibold text-gray-100">ChatFreeGPT</h1>
      </div>

      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-full">
        <span
          className={`w-2 h-2 rounded-full ${
            isHealthy ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span className="text-sm text-gray-400">
          {isHealthy ? 'Connected' : 'Disconnected'}
        </span>
      </div>
    </header>
  );
}
