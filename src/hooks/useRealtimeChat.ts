import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { useRealtimeConnection } from './useRealtimeConnection';
import { useRealtimeMessages } from './useRealtimeMessages';
import type { ChatWithParticipants, MessageWithSender } from '@/types/database';

// Chat participant with real-time status
export interface RealtimeParticipant {
  userId: string;
  name: string;
  profileImage: string | null;
  isOnline: boolean;
  lastSeen: Date | null;
  isTyping: boolean;
  joinedAt: Date;
  isActive: boolean;
}

// Chat state interface
export interface ChatState {
  chat: ChatWithParticipants | null;
  participants: RealtimeParticipant[];
  loading: boolean;
  error: string | null;
  isActive: boolean;
  lastActivity: Date | null;
}

// Chat events
export type ChatEvent = 
  | { type: 'participant_joined'; participant: RealtimeParticipant }
  | { type: 'participant_left'; userId: string }
  | { type: 'participant_typing'; userId: string; isTyping: boolean }
  | { type: 'participant_presence'; userId: string; isOnline: boolean; lastSeen?: Date }
  | { type: 'chat_updated'; chat: ChatWithParticipants }
  | { type: 'appointment_created'; appointmentId: string }
  | { type: 'appointment_updated'; appointmentId: string; status: string };

// Event listener type
export type ChatEventListener = (event: ChatEvent) => void;

// Hook options
export interface UseRealtimeChatOptions {
  chatId: string;
  enablePresence?: boolean;
  enableTyping?: boolean;
  enableAppointments?: boolean;
  autoSubscribe?: boolean;
  presenceHeartbeatInterval?: number;
  enableNotifications?: boolean;
}

// Chat statistics
export interface ChatStatistics {
  totalMessages: number;
  totalParticipants: number;
  activeParticipants: number;
  messagesLast24h: number;
  averageResponseTime: number;
  lastActivity: Date | null;
}

/**
 * Comprehensive real-time chat hook for chat room management
 * Features:
 * - Real-time participant management
 * - Presence tracking
 * - Typing indicators
 * - Appointment integration
 * - Chat statistics
 * - Event system
 * - Norwegian timezone support
 */
export function useRealtimeChat({
  chatId,
  enablePresence = true,
  enableTyping = true,
  enableAppointments = true,
  autoSubscribe = true,
  presenceHeartbeatInterval = 30000,
  enableNotifications = true,
}: UseRealtimeChatOptions) {
  const { user, token } = useAuth();
  const { isConnected, getChannel, removeChannel, formatNorwegianDateTime } = useRealtimeConnection();
  
  // Use the messages hook for message-specific functionality
  const messagesHook = useRealtimeMessages({ 
    chatId,
    enableOptimisticUpdates: true,
    enableAnalytics: true,
  });

  // Chat state
  const [chatState, setChatState] = useState<ChatState>({
    chat: null,
    participants: [],
    loading: true,
    error: null,
    isActive: false,
    lastActivity: null,
  });

  // Chat statistics
  const [statistics, setStatistics] = useState<ChatStatistics>({
    totalMessages: 0,
    totalParticipants: 0,
    activeParticipants: 0,
    messagesLast24h: 0,
    averageResponseTime: 0,
    lastActivity: null,
  });

  // Event listeners
  const [eventListeners] = useState<Set<ChatEventListener>>(new Set());

  // Refs
  const chatChannelRef = useRef<any>(null);
  const presenceChannelRef = useRef<any>(null);
  const typingChannelRef = useRef<any>(null);
  const presenceHeartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingTimeRef = useRef<number>(0);
  const responseTimeStartRef = useRef<number | null>(null);

  // Emit chat event
  const emitEvent = useCallback((event: ChatEvent) => {
    eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Chat event listener error:', error);
      }
    });
  }, [eventListeners]);

  // Add event listener
  const addEventListener = useCallback((listener: ChatEventListener) => {
    eventListeners.add(listener);
    return () => eventListeners.delete(listener);
  }, [eventListeners]);

  // Load chat data
  const loadChat = useCallback(async () => {
    if (!token || !chatId) return;

    try {
      setChatState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch(`/api/chat/${chatId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load chat');
      }

      const chatData: ChatWithParticipants = await response.json();
      
      // Transform participants to include real-time status
      const realtimeParticipants: RealtimeParticipant[] = chatData.participants
        .filter(p => p.isActive)
        .map(p => ({
          userId: p.user.id,
          name: p.user.name,
          profileImage: p.user.profileImage,
          isOnline: false, // Will be updated by presence
          lastSeen: null,
          isTyping: false,
          joinedAt: p.joinedAt,
          isActive: p.isActive,
        }));

      setChatState(prev => ({
        ...prev,
        chat: chatData,
        participants: realtimeParticipants,
        isActive: chatData.isActive,
        loading: false,
      }));

      // Update statistics
      setStatistics(prev => ({
        ...prev,
        totalParticipants: realtimeParticipants.length,
        activeParticipants: realtimeParticipants.length,
      }));

    } catch (error) {
      setChatState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load chat',
      }));
    }
  }, [token, chatId]);

  // Update participant status
  const updateParticipantStatus = useCallback((
    userId: string, 
    updates: Partial<Pick<RealtimeParticipant, 'isOnline' | 'lastSeen' | 'isTyping'>>
  ) => {
    setChatState(prev => ({
      ...prev,
      participants: prev.participants.map(p => 
        p.userId === userId ? { ...p, ...updates } : p
      ),
    }));

    // Update active participants count
    if ('isOnline' in updates) {
      setStatistics(prev => ({
        ...prev,
        activeParticipants: prev.activeParticipants + (updates.isOnline ? 1 : -1),
      }));
    }
  }, []);

  // Start typing indicator
  const startTyping = useCallback(async () => {
    if (!enableTyping || !user || !isConnected) return;

    const now = Date.now();
    
    // Debounce typing updates (max once per 3 seconds)
    if (now - lastTypingTimeRef.current < 3000) return;
    
    lastTypingTimeRef.current = now;

    try {
      // Update via API
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

      // Broadcast via real-time channel
      const channel = getChannel(`typing:${chatId}`);
      if (channel) {
        await channel.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            userId: user.id,
            userName: user.name,
            isTyping: true,
            timestamp: now,
          },
        });
      }

    } catch (error) {
      console.warn('Failed to start typing:', error);
    }
  }, [enableTyping, user, isConnected, chatId, token, getChannel]);

  // Stop typing indicator
  const stopTyping = useCallback(async () => {
    if (!enableTyping || !user || !isConnected) return;

    try {
      // Update via API
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

      // Broadcast via real-time channel
      const channel = getChannel(`typing:${chatId}`);
      if (channel) {
        await channel.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            userId: user.id,
            userName: user.name,
            isTyping: false,
            timestamp: Date.now(),
          },
        });
      }

    } catch (error) {
      console.warn('Failed to stop typing:', error);
    }
  }, [enableTyping, user, isConnected, chatId, token, getChannel]);

  // Join chat (subscribe to real-time updates)
  const joinChat = useCallback(async () => {
    if (!user || !isConnected) return false;

    try {
      // Subscribe to chat via API
      const response = await fetch('/api/chat/realtime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'subscribe',
          chatId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to join chat');
      }

      return true;
    } catch (error) {
      console.error('Failed to join chat:', error);
      setChatState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to join chat',
      }));
      return false;
    }
  }, [user, isConnected, token, chatId]);

  // Leave chat (unsubscribe from real-time updates)
  const leaveChat = useCallback(async () => {
    if (!user) return;

    try {
      // Stop typing if currently typing
      await stopTyping();

      // Unsubscribe from chat via API
      await fetch('/api/chat/realtime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'unsubscribe',
          chatId,
        }),
      });

      // Clean up channels
      if (chatChannelRef.current) {
        chatChannelRef.current.unsubscribe();
        chatChannelRef.current = null;
      }
      
      if (presenceChannelRef.current) {
        presenceChannelRef.current.unsubscribe();
        presenceChannelRef.current = null;
      }
      
      if (typingChannelRef.current) {
        typingChannelRef.current.unsubscribe();
        typingChannelRef.current = null;
      }

      removeChannel(`chat:${chatId}`);
      removeChannel(`presence:${chatId}`);
      removeChannel(`typing:${chatId}`);

      // Stop presence heartbeat
      if (presenceHeartbeatRef.current) {
        clearInterval(presenceHeartbeatRef.current);
        presenceHeartbeatRef.current = null;
      }

    } catch (error) {
      console.warn('Error leaving chat:', error);
    }
  }, [user, token, chatId, stopTyping, removeChannel]);

  // Update presence status
  const updatePresence = useCallback(async (status: 'online' | 'away' | 'offline') => {
    if (!enablePresence || !user || !isConnected) return;

    try {
      await fetch('/api/chat/realtime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'presence',
          chatId,
          status,
        }),
      });
    } catch (error) {
      console.warn('Failed to update presence:', error);
    }
  }, [enablePresence, user, isConnected, token, chatId]);

  // Setup real-time subscriptions
  useEffect(() => {
    if (!chatId || !user || !isConnected || !autoSubscribe) return;

    // Chat messages and updates
    const chatChannel = getChannel(`chat:${chatId}`);
    if (chatChannel) {
      chatChannelRef.current = chatChannel;

      // Subscribe to chat events
      chatChannel.on('broadcast', { event: 'user_joined' }, (payload: any) => {
        const { userId, userName } = payload.payload;
        if (userId !== user.id) {
          emitEvent({ type: 'participant_joined', participant: {
            userId,
            name: userName,
            profileImage: null,
            isOnline: true,
            lastSeen: null,
            isTyping: false,
            joinedAt: new Date(),
            isActive: true,
          }});
        }
      });

      chatChannel.on('broadcast', { event: 'user_left' }, (payload: any) => {
        const { userId } = payload.payload;
        if (userId !== user.id) {
          updateParticipantStatus(userId, { isOnline: false, lastSeen: new Date() });
          emitEvent({ type: 'participant_left', userId });
        }
      });

      // Subscribe to appointment events if enabled
      if (enableAppointments) {
        chatChannel.on('broadcast', { event: 'appointment_created' }, (payload: any) => {
          emitEvent({ type: 'appointment_created', appointmentId: payload.payload.appointmentId });
        });

        chatChannel.on('broadcast', { event: 'appointment_updated' }, (payload: any) => {
          emitEvent({ 
            type: 'appointment_updated', 
            appointmentId: payload.payload.appointmentId,
            status: payload.payload.status,
          });
        });
      }

      chatChannel.subscribe();
    }

    // Typing indicators
    if (enableTyping) {
      const typingChannel = getChannel(`typing:${chatId}`);
      if (typingChannel) {
        typingChannelRef.current = typingChannel;

        typingChannel.on('broadcast', { event: 'typing' }, (payload: any) => {
          const { userId, isTyping } = payload.payload;
          if (userId !== user.id) {
            updateParticipantStatus(userId, { isTyping });
            emitEvent({ type: 'participant_typing', userId, isTyping });
          }
        });

        typingChannel.subscribe();
      }
    }

    // Presence tracking
    if (enablePresence) {
      const presenceChannel = getChannel(`presence:${chatId}`);
      if (presenceChannel) {
        presenceChannelRef.current = presenceChannel;

        presenceChannel.on('presence', { event: 'sync' }, (payload: any) => {
          const presences = payload.presences || {};
          Object.values(presences).flat().forEach((presence: any) => {
            if (presence.userId !== user.id) {
              updateParticipantStatus(presence.userId, {
                isOnline: true,
                lastSeen: presence.onlineAt ? new Date(presence.onlineAt) : null,
              });
              emitEvent({ 
                type: 'participant_presence', 
                userId: presence.userId, 
                isOnline: true,
                lastSeen: presence.onlineAt ? new Date(presence.onlineAt) : undefined,
              });
            }
          });
        });

        presenceChannel.on('presence', { event: 'join' }, (payload: any) => {
          const { userId } = payload.key;
          if (userId !== user.id) {
            updateParticipantStatus(userId, { isOnline: true, lastSeen: null });
            emitEvent({ type: 'participant_presence', userId, isOnline: true });
          }
        });

        presenceChannel.on('presence', { event: 'leave' }, (payload: any) => {
          const { userId } = payload.key;
          if (userId !== user.id) {
            updateParticipantStatus(userId, { isOnline: false, lastSeen: new Date() });
            emitEvent({ type: 'participant_presence', userId, isOnline: false, lastSeen: new Date() });
          }
        });

        presenceChannel.subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({
              userId: user.id,
              userName: user.name,
              onlineAt: new Date().toISOString(),
            });
          }
        });
      }

      // Set up presence heartbeat
      if (presenceHeartbeatInterval > 0) {
        presenceHeartbeatRef.current = setInterval(() => {
          updatePresence('online');
        }, presenceHeartbeatInterval);
      }
    }

    // Auto-join chat
    joinChat();

    return () => {
      leaveChat();
    };
  }, [
    chatId, 
    user, 
    isConnected, 
    autoSubscribe, 
    enableTyping, 
    enablePresence, 
    enableAppointments,
    presenceHeartbeatInterval,
    getChannel,
    updateParticipantStatus,
    emitEvent,
    joinChat,
    leaveChat,
    updatePresence,
  ]);

  // Load initial chat data
  useEffect(() => {
    if (chatId) {
      loadChat();
    }
  }, [chatId, loadChat]);

  // Update statistics based on messages
  useEffect(() => {
    if (messagesHook.messages.length > 0) {
      const now = Date.now();
      const last24h = now - (24 * 60 * 60 * 1000);
      
      const recentMessages = messagesHook.messages.filter(
        msg => new Date(msg.sentAt).getTime() > last24h
      );

      setStatistics(prev => ({
        ...prev,
        totalMessages: messagesHook.messages.length,
        messagesLast24h: recentMessages.length,
        lastActivity: messagesHook.messages[0] ? new Date(messagesHook.messages[0].sentAt) : null,
      }));
    }
  }, [messagesHook.messages]);

  // Handle browser events for presence
  useEffect(() => {
    if (!enablePresence) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence('away');
      } else {
        updatePresence('online');
      }
    };

    const handleBeforeUnload = () => {
      updatePresence('offline');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enablePresence, updatePresence]);

  return {
    // Chat state
    chat: chatState.chat,
    participants: chatState.participants,
    loading: chatState.loading,
    error: chatState.error,
    isActive: chatState.isActive,
    isConnected,
    
    // Statistics
    statistics,
    
    // Message functionality (delegated to useRealtimeMessages)
    messages: messagesHook.messages,
    messagesLoading: messagesHook.loading,
    messagesError: messagesHook.error,
    sendMessage: messagesHook.sendMessage,
    editMessage: messagesHook.editMessage,
    deleteMessage: messagesHook.deleteMessage,
    retryMessage: messagesHook.retryMessage,
    loadMoreMessages: messagesHook.loadMore,
    markAsRead: messagesHook.markAsRead,
    
    // Typing functionality
    startTyping,
    stopTyping,
    typingUsers: chatState.participants.filter(p => p.isTyping),
    
    // Presence functionality
    updatePresence,
    onlineUsers: chatState.participants.filter(p => p.isOnline),
    onlineCount: chatState.participants.filter(p => p.isOnline).length,
    
    // Chat actions
    joinChat,
    leaveChat,
    refresh: loadChat,
    
    // Event system
    addEventListener,
    
    // Utility functions
    clearError: () => setChatState(prev => ({ ...prev, error: null })),
    
    // Norwegian formatting helpers
    formatTime: formatNorwegianDateTime,
    formatLastSeen: (date: Date | null) => {
      if (!date) return 'Aldri sett';
      
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (minutes < 1) return 'Nettopp';
      if (minutes < 60) return `${minutes} min siden`;
      if (hours < 24) return `${hours} timer siden`;
      if (days === 1) return 'I går';
      if (days < 7) return `${days} dager siden`;
      
      return formatNorwegianDateTime(date);
    },
  };
}