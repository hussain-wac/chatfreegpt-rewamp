import { useState, useEffect, useCallback, useRef } from "react";
import { api, parseTaskMarkers, removeTaskMarkers } from "../services/api";

export function useChat() {
  const [conversations, setConversations] = useState({});
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHealthy, setIsHealthy] = useState(false);
  const [models, setModels] = useState([]);
  const [currentModel, setCurrentModel] = useState("llama3.2");
  const abortControllerRef = useRef(null);
  const messagesRef = useRef([]);
  const convIdRef = useRef(null);
  // Track pending user message for abort save
  const pendingUserMsgRef = useRef(null);

  // Keep refs in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    convIdRef.current = currentConversationId;
  }, [currentConversationId]);

  // Check health periodically
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const data = await api.checkHealth();
        setIsHealthy(data.status === "healthy");
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
        if (data.status === "success" && data.models) {
          setModels(data.models);
          if (data.models.length > 0) {
            setCurrentModel(data.models[0]);
          }
        }
      } catch (error) {
        console.error("Failed to load models:", error);
      }
    };
    loadModels();
  }, []);

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const data = await api.getConversations();
        if (data.status === "success") {
          setConversations(data.conversations || {});
        }
      } catch (error) {
        console.error("Failed to load conversations:", error);
      }
    };
    loadConversations();
  }, []);

  const generateId = () =>
    Date.now().toString(36) + Math.random().toString(36).substr(2);

  // Build clean history from current messages for sending to backend
  const buildHistory = () => {
    return messagesRef.current
      .filter((msg) => !msg.isStreaming)
      .map((msg) => ({
        role: msg.role,
        content:
          msg.role === "assistant"
            ? removeTaskMarkers(msg.content || "")
            : msg.content || "",
      }));
  };

  // Stop current generation and save partial response to the conversation
  const stopAndSavePartial = useCallback(() => {
    if (!abortControllerRef.current) return;

    abortControllerRef.current.abort();
    abortControllerRef.current = null;

    const currentMessages = messagesRef.current;
    const convId = convIdRef.current;
    const userMsg = pendingUserMsgRef.current;

    // Find the streaming message and finalize it
    const lastMsg = currentMessages[currentMessages.length - 1];
    if (lastMsg && lastMsg.isStreaming) {
      const partialContent = lastMsg.content || "";
      const tasks = parseTaskMarkers(partialContent);
      const cleanContent = removeTaskMarkers(partialContent);

      const finalizedMessages = [...currentMessages];
      finalizedMessages[finalizedMessages.length - 1] = {
        role: "assistant",
        content: partialContent,
        cleanContent,
        tasks,
        isStreaming: false,
        isSearching: false,
      };
      setMessages(finalizedMessages);

      // Save to conversations if we have content
      if (convId && partialContent && userMsg) {
        setConversations((prev) => {
          const updated = {
            ...prev,
            [convId]: {
              ...prev[convId],
              messages: [
                ...(prev[convId]?.messages || []),
                userMsg,
                { role: "assistant", content: partialContent },
              ],
            },
          };
          api.saveConversations(updated);
          return updated;
        });
      }
    }

    setIsLoading(false);
    pendingUserMsgRef.current = null;
  }, []);

  const _sendMessageInternal = useCallback(
    async (content, useSearch = false) => {
      if (!content.trim() || isLoading) return;

      let convId = currentConversationId;

      // Create new conversation if needed
      if (!convId) {
        convId = generateId();
        setCurrentConversationId(convId);
        setConversations((prev) => ({
          ...prev,
          [convId]: {
            title: content.substring(0, 50),
            messages: [],
            created_at: new Date().toISOString(),
          },
        }));
      }

      // Build history from current messages BEFORE adding the new ones
      const history = buildHistory();

      // Add user message
      const userMessage = { role: "user", content };
      pendingUserMsgRef.current = userMessage;
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Add placeholder for assistant response
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "",
          isStreaming: true,
          isSearching: useSearch,
        },
      ]);

      // Create AbortController for cancellation
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const onChunk = (text) => {
          setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              ...newMessages[newMessages.length - 1],
              content: text,
              isStreaming: true,
              isSearching: false,
            };
            return newMessages;
          });
        };

        const onImages = (images) => {
          setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              ...newMessages[newMessages.length - 1],
              images,
            };
            return newMessages;
          });
        };

        const onSources = (sources) => {
          setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              ...newMessages[newMessages.length - 1],
              sources,
            };
            return newMessages;
          });
        };

        const fullResponse = useSearch
          ? await api.searchStream(
              content,
              currentModel,
              onChunk,
              history,
              controller.signal,
              onImages,
              onSources,
            )
          : await api.streamMessage(
              content,
              currentModel,
              onChunk,
              history,
              controller.signal,
            );

        // Parse tasks from response
        const tasks = parseTaskMarkers(fullResponse);
        const cleanContent = removeTaskMarkers(fullResponse);

        // Update final message (spread to preserve images)
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            content: fullResponse,
            cleanContent,
            tasks,
            isStreaming: false,
            isSearching: false,
          };
          return newMessages;
        });

        // Save to conversations
        setConversations((prev) => {
          const updated = {
            ...prev,
            [convId]: {
              ...prev[convId],
              messages: [
                ...(prev[convId]?.messages || []),
                userMessage,
                { role: "assistant", content: fullResponse },
              ],
            },
          };
          api.saveConversations(updated);
          return updated;
        });
      } catch (error) {
        if (error.name === "AbortError") {
          // Handled by stopAndSavePartial — nothing more to do here
        } else {
          setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              role: "assistant",
              content: `Error: ${error.message}`,
              isStreaming: false,
              isSearching: false,
            };
            return newMessages;
          });
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
        pendingUserMsgRef.current = null;
      }
    },
    [currentConversationId, currentModel, isLoading],
  );

  const sendMessage = useCallback(
    (content) => {
      return _sendMessageInternal(content, false);
    },
    [_sendMessageInternal],
  );

  const sendMessageWithSearch = useCallback(
    (content) => {
      return _sendMessageInternal(content, true);
    },
    [_sendMessageInternal],
  );

  const stopGenerating = useCallback(() => {
    stopAndSavePartial();
  }, [stopAndSavePartial]);

  const newChat = useCallback(async () => {
    // If generating, stop and save partial first
    if (abortControllerRef.current) {
      stopAndSavePartial();
    }
    setCurrentConversationId(null);
    setMessages([]);
    await api.clearConversation();
  }, [stopAndSavePartial]);

  const loadConversation = useCallback(
    (id) => {
      // If generating, stop and save partial first
      if (abortControllerRef.current) {
        stopAndSavePartial();
      }

      const convo = conversations[id];
      if (convo) {
        setCurrentConversationId(id);
        setMessages(
          convo.messages?.map((msg) => ({
            ...msg,
            cleanContent: removeTaskMarkers(msg.content),
            tasks: parseTaskMarkers(msg.content),
          })) || [],
        );
      }
    },
    [conversations, stopAndSavePartial],
  );

  const deleteConversation = useCallback(
    async (id) => {
      await api.deleteConversation(id);
      setConversations((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      if (currentConversationId === id) {
        newChat();
      }
    },
    [currentConversationId, newChat],
  );

  const executeTask = useCallback(async (type, params) => {
    try {
      await api.executeTask(type, params);
    } catch (error) {
      console.error("Task execution error:", error);
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
    sendMessageWithSearch,
    stopGenerating,
    newChat,
    loadConversation,
    deleteConversation,
    executeTask,
  };
}
