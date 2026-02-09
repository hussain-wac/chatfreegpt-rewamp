import { useState } from 'react';
import { useChat } from './hooks/useChat';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ChatArea } from './components/ChatArea';
import { MessageInput } from './components/MessageInput';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    conversations,
    currentConversationId,
    messages,
    isLoading,
    isHealthy,
    models,
    currentModel,
    setCurrentModel,
    sendMessage,
    newChat,
    loadConversation,
    deleteConversation,
    executeTask,
  } = useChat();

  const handleSelectPrompt = (prompt) => {
    sendMessage(prompt);
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        models={models}
        currentModel={currentModel}
        onModelChange={setCurrentModel}
        onNewChat={() => {
          newChat();
          setSidebarOpen(false);
        }}
        onSelectConversation={(id) => {
          loadConversation(id);
          setSidebarOpen(false);
        }}
        onDeleteConversation={deleteConversation}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <Header
          isHealthy={isHealthy}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <ChatArea
          messages={messages}
          onExecuteTask={executeTask}
          onSelectPrompt={handleSelectPrompt}
        />

        <MessageInput
          onSend={sendMessage}
          isDisabled={!isHealthy}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}

export default App;
