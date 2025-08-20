import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeConnection } from './useRealtimeConnection';

// Typing user interface
export interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
  startedAt: Date;
}

// Typing state
export interface TypingState {
  isTyping: boolean;
  lastTypingAt: Date | null;
  typingUsers: TypingUser[];
  canStartTyping: boolean;
}

// Hook options
export interface UseTypingIndicatorOptions {
  chatId: string;
  debounceMs?: number;
  autoStopMs?: number;
  maxTypingUsers?: number;
  enableThrottling?: boolean;
  throttleMs?: number;
}

// Typing analytics
export interface TypingAnalytics {
  totalTypingEvents: number;
  averageTypingDuration: number;
  typingFrequency: Record<string, number>; // By hour
  longestTypingSession: number;
}

/**
 * Dedicated typing indicator hook with advanced debouncing and throttling
 * Features:
 * - Debounced typing start/stop
 * - Automatic typing timeout
 * - Typing user management
 * - Performance optimizations
 * - Norwegian message formatting
 * - Analytics tracking
 */
export function useTypingIndicator({
  chatId,
  debounceMs = 1000,
  autoStopMs = 5000,
  maxTypingUsers = 5,
  enableThrottling = true,
  throttleMs = 500,
}: UseTypingIndicatorOptions) {
  const { user, token } = useAuth();
  const { isConnected, getChannel, removeChannel } = useRealtimeConnection();

  // Typing state
  const [typingState, setTypingState] = useState<TypingState>({
    isTyping: false,
    lastTypingAt: null,
    typingUsers: [],
    canStartTyping: true,
  });

  // Analytics state
  const [analytics, setAnalytics] = useState<TypingAnalytics>({
    totalTypingEvents: 0,
    averageTypingDuration: 0,
    typingFrequency: {},
    longestTypingSession: 0,
  });

  // Refs for debouncing and timing
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoStopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const typingStartTimeRef = useRef<number | null>(null);
  const channelRef = useRef<any>(null);

  // Cleanup typing users periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const staleThreshold = autoStopMs + 2000; // 2 seconds grace period

      setTypingState(prev => ({
        ...prev,
        typingUsers: prev.typingUsers.filter(user => 
          now - user.timestamp < staleThreshold
        ),
      }));
    }, 2000);

    return () => clearInterval(cleanupInterval);
  }, [autoStopMs]);

  // Send typing indicator to server
  const sendTypingIndicator = useCallback(async (isTyping: boolean) => {
    if (!user || !token || !isConnected) return;

    try {
      // Send via API
      await fetch('/api/messages/typing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          chatId,
          isTyping,
        }),
      });

      // Broadcast via real-time channel
      const channel = getChannel(`typing:${chatId}`);
      if (channel) {
        const timestamp = Date.now();
        await channel.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            userId: user.id,
            userName: user.name,
            isTyping,
            timestamp,
          },
        });

        // Update analytics
        if (isTyping) {
          typingStartTimeRef.current = timestamp;
          setAnalytics(prev => ({
            ...prev,
            totalTypingEvents: prev.totalTypingEvents + 1,
            typingFrequency: {
              ...prev.typingFrequency,
              [new Date().getHours().toString()]: (prev.typingFrequency[new Date().getHours().toString()] || 0) + 1,
            },
          }));
        } else if (typingStartTimeRef.current) {
          const duration = timestamp - typingStartTimeRef.current;
          setAnalytics(prev => ({
            ...prev,
            averageTypingDuration: prev.averageTypingDuration 
              ? (prev.averageTypingDuration + duration) / 2 
              : duration,
            longestTypingSession: Math.max(prev.longestTypingSession, duration),
          }));
          typingStartTimeRef.current = null;
        }
      }
    } catch (error) {
      console.warn('Failed to send typing indicator:', error);
    }
  }, [user, token, isConnected, chatId, getChannel]);

  // Start typing with debouncing
  const startTyping = useCallback(() => {
    if (!typingState.canStartTyping || typingState.isTyping) return;

    // Throttle typing updates
    if (enableThrottling) {
      const now = Date.now();
      if (now - lastUpdateTimeRef.current < throttleMs) {
        return;
      }
      lastUpdateTimeRef.current = now;
    }

    // Clear existing timeouts
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
    }

    // Update local state immediately
    setTypingState(prev => ({
      ...prev,
      isTyping: true,
      lastTypingAt: new Date(),
    }));

    // Debounce the actual network call
    debounceTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(true);
    }, debounceMs);

    // Auto-stop typing after specified time
    autoStopTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, autoStopMs);
  }, [
    typingState.canStartTyping, 
    typingState.isTyping, 
    enableThrottling, 
    throttleMs, 
    debounceMs, 
    autoStopMs, 
    sendTypingIndicator
  ]);

  // Stop typing
  const stopTyping = useCallback(() => {
    if (!typingState.isTyping) return;

    // Clear timeouts
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }

    // Update local state
    setTypingState(prev => ({
      ...prev,
      isTyping: false,
    }));

    // Send stop typing indicator
    sendTypingIndicator(false);
  }, [typingState.isTyping, sendTypingIndicator]);

  // Handle typing input (to be called on input events)
  const handleTyping = useCallback(() => {
    if (!user || !isConnected) return;

    startTyping();
  }, [user, isConnected, startTyping]);

  // Handle input stop (to be called when user stops typing)
  const handleStopTyping = useCallback(() => {
    // Don't immediately stop - let the auto-stop timeout handle it
    // This prevents rapid start/stop cycles during pauses in typing
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = setTimeout(stopTyping, debounceMs);
    }
  }, [stopTyping, debounceMs]);

  // Add typing user to state
  const addTypingUser = useCallback((userId: string, userName: string, timestamp: number) => {
    if (userId === user?.id) return; // Don't add self

    setTypingState(prev => {
      const existingIndex = prev.typingUsers.findIndex(u => u.userId === userId);
      let updatedUsers = [...prev.typingUsers];

      const typingUser: TypingUser = {
        userId,
        userName,
        timestamp,
        startedAt: new Date(timestamp),
      };

      if (existingIndex >= 0) {
        updatedUsers[existingIndex] = typingUser;
      } else {
        updatedUsers.unshift(typingUser);
      }

      // Limit number of typing users displayed
      if (updatedUsers.length > maxTypingUsers) {
        updatedUsers = updatedUsers.slice(0, maxTypingUsers);
      }

      return {
        ...prev,
        typingUsers: updatedUsers,
      };
    });
  }, [user?.id, maxTypingUsers]);

  // Remove typing user from state
  const removeTypingUser = useCallback((userId: string) => {
    setTypingState(prev => ({
      ...prev,
      typingUsers: prev.typingUsers.filter(u => u.userId !== userId),
    }));
  }, []);

  // Setup real-time subscription for typing indicators
  useEffect(() => {
    if (!chatId || !user || !isConnected) return;

    const channel = getChannel(`typing:${chatId}`);
    if (!channel) return;

    channelRef.current = channel;

    // Subscribe to typing events
    channel.on('broadcast', { event: 'typing' }, (payload: any) => {
      const { userId, userName, isTyping, timestamp } = payload.payload;
      
      if (userId !== user.id) {
        if (isTyping) {
          addTypingUser(userId, userName, timestamp);
        } else {
          removeTypingUser(userId);
        }
      }
    });

    channel.subscribe();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      removeChannel(`typing:${chatId}`);
    };
  }, [chatId, user, isConnected, getChannel, removeChannel, addTypingUser, removeTypingUser]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingState.isTyping) {
        stopTyping();
      }
      
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (autoStopTimeoutRef.current) {
        clearTimeout(autoStopTimeoutRef.current);
      }
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, [typingState.isTyping, stopTyping]);

  // Pause/resume typing (for performance optimization)
  const pauseTyping = useCallback(() => {
    setTypingState(prev => ({ ...prev, canStartTyping: false }));
    if (typingState.isTyping) {
      stopTyping();
    }
  }, [typingState.isTyping, stopTyping]);

  const resumeTyping = useCallback(() => {
    setTypingState(prev => ({ ...prev, canStartTyping: true }));
  }, []);

  // Format typing users for display (Norwegian)
  const formatTypingUsers = useCallback((users: TypingUser[]): string => {
    if (users.length === 0) return '';

    const names = users.map(u => u.userName);
    
    if (names.length === 1) {
      return `${names[0]} skriver...`;
    } else if (names.length === 2) {
      return `${names[0]} og ${names[1]} skriver...`;
    } else if (names.length === 3) {
      return `${names[0]}, ${names[1]} og ${names[2]} skriver...`;
    } else {
      return `${names[0]}, ${names[1]} og ${names.length - 2} andre skriver...`;
    }
  }, []);

  // Get typing indicator text for UI
  const getTypingText = useCallback((): string => {
    return formatTypingUsers(typingState.typingUsers);
  }, [typingState.typingUsers, formatTypingUsers]);

  // Check if anyone is typing
  const isAnyoneTyping = typingState.typingUsers.length > 0;

  // Get typing user count
  const typingUserCount = typingState.typingUsers.length;

  return {
    // Typing state
    isTyping: typingState.isTyping,
    isAnyoneTyping,
    typingUsers: typingState.typingUsers,
    typingUserCount,
    lastTypingAt: typingState.lastTypingAt,
    canStartTyping: typingState.canStartTyping,

    // Typing actions
    startTyping,
    stopTyping,
    handleTyping,
    handleStopTyping,
    pauseTyping,
    resumeTyping,

    // Display helpers
    getTypingText,
    formatTypingUsers,

    // Analytics
    analytics,

    // Utility
    isConnected,
    hasTypingUsers: typingState.typingUsers.length > 0,
    
    // Norwegian-specific formatting
    getShortTypingText: () => {
      const count = typingState.typingUsers.length;
      if (count === 0) return '';
      if (count === 1) return 'skriver...';
      return `${count} skriver...`;
    },
    
    getTypingDuration: (user: TypingUser) => {
      const now = Date.now();
      const duration = now - user.timestamp;
      const seconds = Math.floor(duration / 1000);
      if (seconds < 60) return `${seconds}s`;
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m`;
    },
  };
}