import { useState, useEffect, useCallback } from 'react';
import { api, parseTaskMarkers, removeTaskMarkers } from '../services/api';

export function useChat() {
  const [conversations, setConversations] = useState({});
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHealthy, setIsHealthy] = useState(false);
  const [models, setModels] = useState([]);
  const [currentModel, setCurrentModel] = useState('llama3.2');

  // Check health periodically
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const data = await api.checkHealth();
        setIsHealthy(data.status === 'healthy');
      } catch {
        setIsHealthy(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const data = await api.getModels();
        if (data.status === 'success' && data.models) {
          setModels(data.models);
          if (data.models.length > 0) {
            setCurrentModel(data.models[0]);
          }
        }
      } catch (error) {
        console.error('Failed to load models:', error);
      }
    };

    loadModels();
  }, []);

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const data = await api.getConversations();
        if (data.status === 'success') {
          setConversations(data.conversations || {});
        }
      } catch (error) {
        console.error('Failed to load conversations:', error);
      }
    };

    loadConversations();
  }, []);

  const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || isLoading) return;

    let convId = currentConversationId;

    // Create new conversation if needed
    if (!convId) {
      convId = generateId();
      setCurrentConversationId(convId);
      setConversations(prev => ({
        ...prev,
        [convId]: {
          title: content.substring(0, 50),
          messages: [],
          created_at: new Date().toISOString(),
        }
      }));
    }

    // Add user message
    const userMessage = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Add placeholder for assistant response
    const assistantMessage = { role: 'assistant', content: '', isStreaming: true };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const fullResponse = await api.streamMessage(content, currentModel, (text) => {
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: 'assistant',
            content: text,
            isStreaming: true,
          };
          return newMessages;
        });
      });

      // Parse tasks from response
      const tasks = parseTaskMarkers(fullResponse);
      const cleanContent = removeTaskMarkers(fullResponse);

      // Update final message
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: 'assistant',
          content: fullResponse,
          cleanContent,
          tasks,
          isStreaming: false,
        };
        return newMessages;
      });

      // Save to conversations
      setConversations(prev => {
        const updated = {
          ...prev,
          [convId]: {
            ...prev[convId],
            messages: [
              ...(prev[convId]?.messages || []),
              userMessage,
              { role: 'assistant', content: fullResponse },
            ],
          },
        };
        api.saveConversations(updated);
        return updated;
      });

    } catch (error) {
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: 'assistant',
          content: `Error: ${error.message}`,
          isStreaming: false,
        };
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentConversationId, currentModel, isLoading]);

  const newChat = useCallback(async () => {
    setCurrentConversationId(null);
    setMessages([]);
    await api.clearConversation();
  }, []);

  const loadConversation = useCallback((id) => {
    const convo = conversations[id];
    if (convo) {
      setCurrentConversationId(id);
      setMessages(convo.messages?.map(msg => ({
        ...msg,
        cleanContent: removeTaskMarkers(msg.content),
        tasks: parseTaskMarkers(msg.content),
      })) || []);
    }
  }, [conversations]);

  const deleteConversation = useCallback(async (id) => {
    await api.deleteConversation(id);
    setConversations(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    if (currentConversationId === id) {
      newChat();
    }
  }, [currentConversationId, newChat]);

  const executeTask = useCallback(async (type, params) => {
    try {
      await api.executeTask(type, params);
    } catch (error) {
      console.error('Task execution error:', error);
    }
  }, []);

  return {
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
  };
}
