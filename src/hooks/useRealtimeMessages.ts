import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useRealtimeConnection } from './useRealtimeConnection';
import { MessageQueue, QueuedMessage, QueueEvent } from '@/lib/messageQueue';
import { subscribeToChat } from '@/lib/supabase';
import type { MessageWithSender, CreateMessageData } from '@/types/database';

// Message states for optimistic UI
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

// Extended message interface for UI
export interface UIMessage extends Omit<MessageWithSender, 'id'> {
  id: string;
  tempId?: string; // For optimistic messages
  status: MessageStatus;
  isOptimistic?: boolean;
  error?: string;
  retryCount?: number;
}

// Hook options
export interface UseRealtimeMessagesOptions {
  chatId: string;
  autoMarkAsRead?: boolean;
  enableOptimisticUpdates?: boolean;
  pageSize?: number;
  enableVirtualScrolling?: boolean;
  maxCachedMessages?: number;
  enableAnalytics?: boolean;
}

// Message state interface
export interface MessageState {
  messages: UIMessage[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  totalCount?: number;
  unreadCount: number;
}

// Pagination info
export interface PaginationInfo {
  page: number;
  hasMore: boolean;
  loading: boolean;
  totalCount?: number;
}

// Analytics data
export interface MessageAnalytics {
  totalSent: number;
  totalReceived: number;
  averageResponseTime: number;
  messageFrequency: Record<string, number>; // By hour
  failedMessages: number;
}

/**
 * Enhanced real-time messages hook with optimistic updates and offline support
 * Features:
 * - Optimistic UI updates
 * - Offline message queue
 * - Virtual scrolling support
 * - Read receipts
 * - Message analytics
 * - Norwegian timezone formatting
 */
export function useRealtimeMessages({
  chatId,
  autoMarkAsRead = true,
  enableOptimisticUpdates = true,
  pageSize = 20,
  enableVirtualScrolling = false,
  maxCachedMessages = 500,
  enableAnalytics = true,
}: UseRealtimeMessagesOptions) {
  const { user, token } = useAuth();
  const { isConnected, getChannel, removeChannel, formatNorwegianDateTime } = useRealtimeConnection();

  // Message state
  const [messageState, setMessageState] = useState<MessageState>({
    messages: [],
    loading: true,
    error: null,
    hasMore: true,
    page: 1,
    unreadCount: 0,
  });

  // Analytics state
  const [analytics, setAnalytics] = useState<MessageAnalytics>({
    totalSent: 0,
    totalReceived: 0,
    averageResponseTime: 0,
    messageFrequency: {},
    failedMessages: 0,
  });

  // Refs
  const messageQueueRef = useRef<MessageQueue | null>(null);
  const channelRef = useRef<any>(null);
  const lastMessageTimeRef = useRef<number | null>(null);
  const messageMapRef = useRef<Map<string, UIMessage>>(new Map());
  const tempMessageMapRef = useRef<Map<string, string>>(new Map()); // tempId -> serverId

  // Initialize message queue
  useEffect(() => {
    messageQueueRef.current = new MessageQueue({
      storageKey: `tutorconnect_messages_${chatId}`,
      maxRetries: 3,
      persistToStorage: true,
    });

    // Set up send message function
    messageQueueRef.current.setSendMessageFunction(async (data: CreateMessageData) => {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return response.json();
    });

    // Set up queue event listeners
    const queueUnsubscribe = messageQueueRef.current.addEventListener((event: QueueEvent) => {
      handleQueueEvent(event);
    });

    return () => {
      queueUnsubscribe();
      messageQueueRef.current?.destroy();
    };
  }, [chatId, token]);

  // Handle queue events
  const handleQueueEvent = useCallback((event: QueueEvent) => {
    switch (event.type) {
      case 'message_queued':
        if (enableOptimisticUpdates) {
          addOptimisticMessage(event.message);
        }
        break;

      case 'message_sending':
        updateMessageStatus(event.messageId, 'sending');
        break;

      case 'message_sent':
        handleMessageSent(event.messageId, event.serverMessage);
        break;

      case 'message_failed':
        updateMessageStatus(event.messageId, 'failed', event.error);
        setAnalytics(prev => ({ ...prev, failedMessages: prev.failedMessages + 1 }));
        break;

      case 'sync_completed':
        if (enableAnalytics) {
          updateAnalytics('sync_completed', { sent: event.sent, failed: event.failed });
        }
        break;
    }
  }, [enableOptimisticUpdates, enableAnalytics]);

  // Add optimistic message to UI
  const addOptimisticMessage = useCallback((queuedMessage: QueuedMessage) => {
    if (!user) return;

    const optimisticMessage: UIMessage = {
      id: queuedMessage.tempId,
      tempId: queuedMessage.tempId,
      content: queuedMessage.content,
      type: queuedMessage.type,
      chatId: queuedMessage.chatId,
      senderId: user.id,
      sentAt: new Date(queuedMessage.timestamp),
      editedAt: null,
      isDeleted: false,
      appointmentId: queuedMessage.appointmentId || null,
      sender: {
        id: user.id,
        name: user.name,
        profileImage: user.profileImage,
      },
      status: 'sending',
      isOptimistic: true,
    };

    setMessageState(prev => ({
      ...prev,
      messages: [optimisticMessage, ...prev.messages],
    }));

    messageMapRef.current.set(queuedMessage.tempId, optimisticMessage);
  }, [user]);

  // Update message status
  const updateMessageStatus = useCallback((messageId: string, status: MessageStatus, error?: string) => {
    setMessageState(prev => ({
      ...prev,
      messages: prev.messages.map(msg => 
        msg.id === messageId || msg.tempId === messageId
          ? { ...msg, status, error, retryCount: msg.retryCount ? msg.retryCount + 1 : 0 }
          : msg
      ),
    }));
  }, []);

  // Handle successful message send
  const handleMessageSent = useCallback((tempId: string, serverMessage: MessageWithSender) => {
    const serverUIMessage: UIMessage = {
      ...serverMessage,
      status: 'sent',
      isOptimistic: false,
    };

    // Map temp ID to server ID
    tempMessageMapRef.current.set(tempId, serverMessage.id);

    setMessageState(prev => ({
      ...prev,
      messages: prev.messages.map(msg => 
        msg.tempId === tempId
          ? serverUIMessage
          : msg
      ),
    }));

    messageMapRef.current.set(serverMessage.id, serverUIMessage);
    messageMapRef.current.delete(tempId);

    // Update analytics
    if (enableAnalytics) {
      updateAnalytics('message_sent', { messageId: serverMessage.id });
    }
  }, [enableAnalytics]);

  // Load messages from API
  const loadMessages = useCallback(async (page = 1, append = false) => {
    if (!token || !chatId) return;

    try {
      setMessageState(prev => ({ ...prev, loading: !append }));

      const response = await fetch(
        `/api/messages?chatId=${chatId}&page=${page}&limit=${pageSize}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json();
      const newMessages: UIMessage[] = data.data.map((msg: MessageWithSender) => ({
        ...msg,
        status: 'sent' as MessageStatus,
        isOptimistic: false,
      }));

      // Cache messages
      newMessages.forEach(msg => {
        messageMapRef.current.set(msg.id, msg);
      });

      // Limit cached messages for performance
      if (messageMapRef.current.size > maxCachedMessages) {
        const entries = Array.from(messageMapRef.current.entries());
        const oldEntries = entries.slice(0, entries.length - maxCachedMessages);
        oldEntries.forEach(([id]) => messageMapRef.current.delete(id));
      }

      setMessageState(prev => ({
        ...prev,
        messages: append ? [...prev.messages, ...newMessages] : newMessages,
        hasMore: data.pagination.hasNext,
        page: data.pagination.page,
        totalCount: data.pagination.total,
        loading: false,
        error: null,
      }));

      // Update analytics
      if (enableAnalytics && !append) {
        updateAnalytics('messages_loaded', { count: newMessages.length });
      }

    } catch (error) {
      setMessageState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load messages',
      }));
    }
  }, [token, chatId, pageSize, maxCachedMessages, enableAnalytics]);

  // Load more messages (pagination)
  const loadMore = useCallback(() => {
    if (messageState.hasMore && !messageState.loading) {
      loadMessages(messageState.page + 1, true);
    }
  }, [loadMessages, messageState.hasMore, messageState.loading, messageState.page]);

  // Send message
  const sendMessage = useCallback(async (
    content: string,
    type: 'TEXT' | 'APPOINTMENT_REQUEST' | 'APPOINTMENT_RESPONSE' | 'SYSTEM_MESSAGE' = 'TEXT',
    appointmentId?: string
  ): Promise<string | null> => {
    if (!user || !content.trim() || !messageQueueRef.current) return null;

    const messageData: CreateMessageData = {
      content: content.trim(),
      type,
      chatId,
      appointmentId,
    };

    // Add to queue (handles optimistic update automatically)
    const tempId = messageQueueRef.current.addMessage(messageData);
    
    // Track last message time for response time analytics
    lastMessageTimeRef.current = Date.now();

    return tempId;
  }, [user, chatId]);

  // Edit message
  const editMessage = useCallback(async (messageId: string, content: string) => {
    if (!token || !content.trim()) return null;

    try {
      // Optimistically update UI
      setMessageState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === messageId
            ? { ...msg, content: content.trim(), editedAt: new Date() }
            : msg
        ),
      }));

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
      const uiMessage: UIMessage = { ...updatedMessage, status: 'sent', isOptimistic: false };

      setMessageState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === messageId ? uiMessage : msg
        ),
      }));

      messageMapRef.current.set(messageId, uiMessage);
      return uiMessage;

    } catch (error) {
      // Revert optimistic update on error
      const originalMessage = messageMapRef.current.get(messageId);
      if (originalMessage) {
        setMessageState(prev => ({
          ...prev,
          messages: prev.messages.map(msg => 
            msg.id === messageId ? originalMessage : msg
          ),
        }));
      }
      
      setMessageState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to edit message',
      }));
      
      throw error;
    }
  }, [token]);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!token) return null;

    try {
      // Optimistically update UI
      setMessageState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === messageId
            ? { ...msg, isDeleted: true, content: '[Deleted]' }
            : msg
        ),
      }));

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
      const uiMessage: UIMessage = { ...deletedMessage, status: 'sent', isOptimistic: false };

      setMessageState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === messageId ? uiMessage : msg
        ),
      }));

      return uiMessage;

    } catch (error) {
      // Revert optimistic update on error
      const originalMessage = messageMapRef.current.get(messageId);
      if (originalMessage) {
        setMessageState(prev => ({
          ...prev,
          messages: prev.messages.map(msg => 
            msg.id === messageId ? originalMessage : msg
          ),
        }));
      }
      
      throw error;
    }
  }, [token]);

  // Retry failed message
  const retryMessage = useCallback(async (messageId: string) => {
    if (!messageQueueRef.current) return false;

    const queuedMessage = messageQueueRef.current.getMessage(messageId);
    if (!queuedMessage) return false;

    // Reset retry count and add back to queue
    queuedMessage.retryCount = 0;
    queuedMessage.status = 'pending';
    
    updateMessageStatus(messageId, 'sending');
    
    return messageQueueRef.current.forcSync().then(result => result.sent > 0);
  }, []);

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

      // Update local unread count
      setMessageState(prev => ({
        ...prev,
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));

    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, [token, autoMarkAsRead, chatId]);

  // Update analytics
  const updateAnalytics = useCallback((event: string, data: any) => {
    if (!enableAnalytics) return;

    const hour = new Date().getHours().toString();
    
    setAnalytics(prev => {
      const updated = { ...prev };
      
      switch (event) {
        case 'message_sent':
          updated.totalSent++;
          updated.messageFrequency[hour] = (updated.messageFrequency[hour] || 0) + 1;
          break;
          
        case 'message_received':
          updated.totalReceived++;
          if (lastMessageTimeRef.current) {
            const responseTime = Date.now() - lastMessageTimeRef.current;
            updated.averageResponseTime = updated.averageResponseTime 
              ? (updated.averageResponseTime + responseTime) / 2 
              : responseTime;
            lastMessageTimeRef.current = null;
          }
          break;
          
        case 'messages_loaded':
          // Track initial load performance
          break;
      }
      
      return updated;
    });
  }, [enableAnalytics]);

  // Setup real-time subscription
  useEffect(() => {
    if (!chatId || !user || !isConnected) return;

    const channel = getChannel(`chat:${chatId}`);
    if (!channel) return;

    channelRef.current = subscribeToChat(
      { channel } as any,
      chatId,
      (payload) => {
        // New message received
        if (payload.eventType === 'INSERT') {
          const newMessage = payload.new;
          if (newMessage.senderId !== user.id) {
            const uiMessage: UIMessage = {
              ...newMessage,
              status: 'delivered',
              isOptimistic: false,
            };

            setMessageState(prev => ({
              ...prev,
              messages: [uiMessage, ...prev.messages],
              unreadCount: prev.unreadCount + 1,
            }));

            messageMapRef.current.set(newMessage.id, uiMessage);
            
            // Auto mark as read if enabled
            if (autoMarkAsRead) {
              markAsRead(newMessage.id);
            }

            // Update analytics
            if (enableAnalytics) {
              updateAnalytics('message_received', { messageId: newMessage.id });
            }
          }
        }
      },
      (payload) => {
        // Message update
        if (payload.eventType === 'UPDATE') {
          const updatedMessage = payload.new;
          const uiMessage: UIMessage = {
            ...updatedMessage,
            status: 'sent',
            isOptimistic: false,
          };

          setMessageState(prev => ({
            ...prev,
            messages: prev.messages.map(msg => 
              msg.id === updatedMessage.id ? uiMessage : msg
            ),
          }));

          messageMapRef.current.set(updatedMessage.id, uiMessage);
        }
      }
    );

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
      removeChannel(`chat:${chatId}`);
    };
  }, [chatId, user, isConnected, getChannel, removeChannel, autoMarkAsRead, markAsRead, enableAnalytics, updateAnalytics]);

  // Load initial messages
  useEffect(() => {
    if (chatId) {
      loadMessages(1);
    }
  }, [chatId, loadMessages]);

  // Memoized values for performance
  const paginationInfo: PaginationInfo = useMemo(() => ({
    page: messageState.page,
    hasMore: messageState.hasMore,
    loading: messageState.loading,
    totalCount: messageState.totalCount,
  }), [messageState.page, messageState.hasMore, messageState.loading, messageState.totalCount]);

  // Virtual scrolling helpers
  const getVirtualizedMessages = useCallback((startIndex: number, endIndex: number) => {
    if (!enableVirtualScrolling) return messageState.messages;
    return messageState.messages.slice(startIndex, endIndex + 1);
  }, [enableVirtualScrolling, messageState.messages]);

  return {
    // Message data
    messages: messageState.messages,
    loading: messageState.loading,
    error: messageState.error,
    unreadCount: messageState.unreadCount,
    
    // Pagination
    pagination: paginationInfo,
    
    // Message actions
    sendMessage,
    editMessage,
    deleteMessage,
    retryMessage,
    loadMore,
    markAsRead,
    
    // Virtual scrolling
    getVirtualizedMessages,
    totalMessages: messageState.messages.length,
    
    // Analytics
    analytics: enableAnalytics ? analytics : null,
    
    // Queue management
    queueStats: messageQueueRef.current?.getQueueStats() || null,
    forceSync: () => messageQueueRef.current?.forcSync(),
    
    // Utility functions
    refresh: () => loadMessages(1),
    clearError: () => setMessageState(prev => ({ ...prev, error: null })),
    
    // Norwegian formatting helpers
    formatMessageTime: (date: Date) => formatNorwegianDateTime(date),
    isMessageFromToday: (date: Date) => {
      const today = new Date();
      const messageDate = new Date(date);
      return (
        today.getDate() === messageDate.getDate() &&
        today.getMonth() === messageDate.getMonth() &&
        today.getFullYear() === messageDate.getFullYear()
      );
    },
  };
}