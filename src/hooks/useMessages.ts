import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { 
  subscribeToChat, 
  subscribeToTyping, 
  subscribeToPresence, 
  subscribeToReadReceipts,
  broadcastTyping,
  createClient as createSupabaseClient 
} from '@/lib/supabase-client';
import type { MessageWithSender, CreateMessageData } from '@/types/database';

interface UseMessagesOptions {
  chatId: string;
  autoMarkAsRead?: boolean;
  enableTyping?: boolean;
  enablePresence?: boolean;
}

interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

interface PresenceUser {
  userId: string;
  userName: string;
  onlineAt: string;
}

interface MessageState {
  messages: MessageWithSender[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
}

interface TypingState {
  users: TypingUser[];
  isUserTyping: boolean;
}

interface PresenceState {
  users: PresenceUser[];
  onlineCount: number;
}

export function useMessages({ 
  chatId, 
  autoMarkAsRead = true, 
  enableTyping = true,
  enablePresence = true 
}: UseMessagesOptions) {
  const { user, token } = useAuth();
  const supabase = createSupabaseClient();
  
  // Message state
  const [messageState, setMessageState] = useState<MessageState>({
    messages: [],
    loading: true,
    error: null,
    hasMore: true,
    page: 1,
  });

  // Typing state
  const [typingState, setTypingState] = useState<TypingState>({
    users: [],
    isUserTyping: false,
  });

  // Presence state
  const [presenceState, setPresenceState] = useState<PresenceState>({
    users: [],
    onlineCount: 0,
  });

  // Refs for cleanup
  const chatSubscription = useRef<any>(null);
  const typingSubscription = useRef<any>(null);
  const presenceSubscription = useRef<any>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load messages
  const loadMessages = useCallback(async (page = 1, append = false) => {
    if (!token || !chatId) return;

    try {
      setMessageState(prev => ({ ...prev, loading: !append }));

      const response = await fetch(`/api/messages?chatId=${chatId}&page=${page}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json();
      
      setMessageState(prev => ({
        ...prev,
        messages: append ? [...prev.messages, ...data.data] : data.data,
        hasMore: data.pagination.hasNext,
        page: data.pagination.page,
        loading: false,
        error: null,
      }));
    } catch (error) {
      setMessageState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load messages',
      }));
    }
  }, [token, chatId]);

  // Load more messages
  const loadMore = useCallback(() => {
    if (messageState.hasMore && !messageState.loading) {
      loadMessages(messageState.page + 1, true);
    }
  }, [loadMessages, messageState.hasMore, messageState.loading, messageState.page]);

  // Send message
  const sendMessage = useCallback(async (content: string, type: 'TEXT' | 'APPOINTMENT_REQUEST' | 'APPOINTMENT_RESPONSE' | 'SYSTEM_MESSAGE' = 'TEXT', appointmentId?: string) => {
    if (!token || !user || !content.trim()) return;

    try {
      const messageData: CreateMessageData = {
        content: content.trim(),
        type,
        chatId,
        appointmentId,
      };

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const newMessage = await response.json();
      
      // Optimistically add message to state
      setMessageState(prev => ({
        ...prev,
        messages: [newMessage, ...prev.messages],
      }));

      // Stop typing indicator
      if (enableTyping && typingState.isUserTyping) {
        await stopTyping();
      }

      return newMessage;
    } catch (error) {
      setMessageState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to send message',
      }));
      throw error;
    }
  }, [token, user, chatId, enableTyping, typingState.isUserTyping]);

  // Edit message
  const editMessage = useCallback(async (messageId: string, content: string) => {
    if (!token || !content.trim()) return;

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to edit message');
      }

      const updatedMessage = await response.json();
      
      setMessageState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === messageId ? updatedMessage : msg
        ),
      }));

      return updatedMessage;
    } catch (error) {
      setMessageState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to edit message',
      }));
      throw error;
    }
  }, [token]);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      const deletedMessage = await response.json();
      
      setMessageState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === messageId ? deletedMessage : msg
        ),
      }));

      return deletedMessage;
    } catch (error) {
      setMessageState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete message',
      }));
      throw error;
    }
  }, [token]);

  // Start typing
  const startTyping = useCallback(async () => {
    if (!enableTyping || !user || typingState.isUserTyping) return;

    try {
      await fetch('/api/messages/typing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          chatId,
          isTyping: true,
        }),
      });

      // Also broadcast via Supabase
      await broadcastTyping(supabase, chatId, user.id, user.name, true);

      setTypingState(prev => ({ ...prev, isUserTyping: true }));

      // Auto-stop typing after 5 seconds
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
      typingTimeout.current = setTimeout(() => {
        stopTyping();
      }, 5000);
    } catch (error) {
      console.error('Failed to start typing:', error);
    }
  }, [enableTyping, user, typingState.isUserTyping, token, chatId, supabase]);

  // Stop typing
  const stopTyping = useCallback(async () => {
    if (!enableTyping || !user || !typingState.isUserTyping) return;

    try {
      await fetch('/api/messages/typing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          chatId,
          isTyping: false,
        }),
      });

      // Also broadcast via Supabase
      await broadcastTyping(supabase, chatId, user.id, user.name, false);

      setTypingState(prev => ({ ...prev, isUserTyping: false }));

      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
        typingTimeout.current = null;
      }
    } catch (error) {
      console.error('Failed to stop typing:', error);
    }
  }, [enableTyping, user, typingState.isUserTyping, token, chatId, supabase]);

  // Mark messages as read
  const markAsRead = useCallback(async (messageId?: string) => {
    if (!token || !autoMarkAsRead) return;

    try {
      await fetch('/api/messages/read-receipts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          chatId,
          messageId,
          markAsRead: true,
        }),
      });
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, [token, autoMarkAsRead, chatId]);

  // Search messages
  const searchMessages = useCallback(async (query: string, filters?: any) => {
    if (!token || !query.trim()) return [];

    try {
      const searchParams = new URLSearchParams({
        q: query.trim(),
        chatId,
        ...filters,
      });

      const response = await fetch(`/api/messages/search?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to search messages');
      }

      const data = await response.json();
      return data.data.messages;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }, [token, chatId]);

  // Setup real-time subscriptions
  useEffect(() => {
    if (!chatId || !user) return;

    // Chat subscription
    chatSubscription.current = subscribeToChat(
      supabase,
      chatId,
      (payload) => {
        // New message
        if (payload.eventType === 'INSERT') {
          const newMessage = payload.new;
          if (newMessage.senderId !== user.id) {
            setMessageState(prev => ({
              ...prev,
              messages: [newMessage, ...prev.messages],
            }));

            // Auto mark as read if enabled
            if (autoMarkAsRead) {
              markAsRead(newMessage.id);
            }
          }
        }
      },
      (payload) => {
        // Message update
        if (payload.eventType === 'UPDATE') {
          const updatedMessage = payload.new;
          setMessageState(prev => ({
            ...prev,
            messages: prev.messages.map(msg => 
              msg.id === updatedMessage.id ? updatedMessage : msg
            ),
          }));
        }
      }
    );

    // Typing subscription
    if (enableTyping) {
      typingSubscription.current = subscribeToTyping(
        supabase,
        chatId,
        (payload) => {
          const { userId, userName, isTyping, timestamp } = payload.payload;
          
          if (userId !== user.id) {
            setTypingState(prev => {
              const existingUserIndex = prev.users.findIndex(u => u.userId === userId);
              let updatedUsers = [...prev.users];

              if (isTyping) {
                if (existingUserIndex >= 0) {
                  updatedUsers[existingUserIndex] = { userId, userName, timestamp };
                } else {
                  updatedUsers.push({ userId, userName, timestamp });
                }
              } else if (existingUserIndex >= 0) {
                updatedUsers.splice(existingUserIndex, 1);
              }

              return { ...prev, users: updatedUsers };
            });
          }
        }
      );
    }

    // Presence subscription
    if (enablePresence) {
      presenceSubscription.current = subscribeToPresence(
        supabase,
        chatId,
        user.id,
        user.name,
        (payload) => {
          const presences = payload.presences || {};
          const users = Object.values(presences).flat().filter((p: any) => p.userId !== user.id);
          
          setPresenceState({
            users: users as PresenceUser[],
            onlineCount: users.length,
          });
        }
      );
    }

    return () => {
      if (chatSubscription.current) {
        chatSubscription.current.unsubscribe();
      }
      if (typingSubscription.current) {
        typingSubscription.current.unsubscribe();
      }
      if (presenceSubscription.current) {
        presenceSubscription.current.unsubscribe();
      }
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
    };
  }, [chatId, user, autoMarkAsRead, enableTyping, enablePresence]);

  // Load initial messages
  useEffect(() => {
    if (chatId) {
      loadMessages(1);
    }
  }, [chatId, loadMessages]);

  return {
    // Message data
    messages: messageState.messages,
    loading: messageState.loading,
    error: messageState.error,
    hasMore: messageState.hasMore,
    
    // Message actions
    sendMessage,
    editMessage,
    deleteMessage,
    loadMore,
    markAsRead,
    searchMessages,
    
    // Typing
    typingUsers: typingState.users,
    isUserTyping: typingState.isUserTyping,
    startTyping,
    stopTyping,
    
    // Presence
    onlineUsers: presenceState.users,
    onlineCount: presenceState.onlineCount,
    
    // Utility
    refresh: () => loadMessages(1),
    clearError: () => setMessageState(prev => ({ ...prev, error: null })),
  };
}