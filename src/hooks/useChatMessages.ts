import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage, ActionType } from "@/types/coach-panel";

export interface UseChatMessagesOptions {
  userId: string | undefined;
  getCurrentMode: () => string;
}

export interface UseChatMessagesReturn {
  messages: ChatMessage[];
  loadingMessages: boolean;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  addMessage: (message: ChatMessage) => void;
  addCoachMessage: (content: string, id?: string) => ChatMessage;
  addUserMessage: (content: string, imageUrl?: string) => ChatMessage;
  addSystemMessage: (content: string, action?: ActionType) => ChatMessage;
  updateMessage: (id: string, content: string) => void;
  saveMessage: (msg: ChatMessage, coachingMode?: string) => Promise<void>;
  clearMessages: () => void;
}

export function useChatMessages({
  userId,
  getCurrentMode,
}: UseChatMessagesOptions): UseChatMessagesReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  // Load messages on mount (only for logged-in users)
  useEffect(() => {
    if (!userId) {
      setLoadingMessages(false);
      return;
    }

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(50);

      if (!error && data) {
        setMessages(
          data.map((m) => ({
            id: m.id,
            role: m.role as "coach" | "user" | "system",
            content: m.content,
            action: m.action_type as ActionType,
          }))
        );
      }
      setLoadingMessages(false);
    };

    loadMessages();
  }, [userId]);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const addCoachMessage = useCallback((content: string, id?: string): ChatMessage => {
    const message: ChatMessage = {
      id: id || Date.now().toString(),
      role: "coach",
      content,
    };
    setMessages((prev) => [...prev, message]);
    return message;
  }, []);

  const addUserMessage = useCallback((content: string, imageUrl?: string): ChatMessage => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
      imageUrl,
    };
    setMessages((prev) => [...prev, message]);
    return message;
  }, []);

  const addSystemMessage = useCallback((content: string, action?: ActionType): ChatMessage => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      role: "system",
      content,
      action,
    };
    setMessages((prev) => [...prev, message]);
    return message;
  }, []);

  const updateMessage = useCallback((id: string, content: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content } : m))
    );
  }, []);

  // Only persist to database if user is logged in
  const saveMessage = useCallback(
    async (msg: ChatMessage, coachingMode?: string) => {
      if (!userId) return; // Demo mode - no persistence

      await supabase.from("chat_messages").insert({
        user_id: userId,
        role: msg.role,
        content: msg.content,
        action_type: msg.action || null,
        coaching_mode: coachingMode || getCurrentMode(),
      });
    },
    [userId, getCurrentMode]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    loadingMessages,
    setMessages,
    addMessage,
    addCoachMessage,
    addUserMessage,
    addSystemMessage,
    updateMessage,
    saveMessage,
    clearMessages,
  };
}
