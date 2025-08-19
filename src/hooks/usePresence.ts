import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { getRealtimeManager } from '@/lib/realtime';
import type { RealtimeManager, PresenceState } from '@/lib/realtime';

// Online status types
export type OnlineStatus = 'online' | 'away' | 'offline' | 'unknown';

// User presence information
export interface UserPresence {
  userId: string;
  userName: string;
  status: OnlineStatus;
  lastSeen: Date;
  isTyping: boolean;
  chatId?: string;
}

// Presence hook options
export interface UsePresenceOptions {
  chatId?: string;
  enableAutoAway?: boolean;
  awayTimeoutMs?: number;
  enableVisibilityTracking?: boolean;
  enableNetworkTracking?: boolean;
  enableAnalytics?: boolean;
}

// Presence statistics for analytics
export interface PresenceStats {
  totalUsers: number;
  onlineUsers: number;
  awayUsers: number;
  offlineUsers: number;
  averageSessionDuration: number;
  lastActivity: Date | null;
}

const DEFAULT_OPTIONS: Required<UsePresenceOptions> = {
  chatId: '',
  enableAutoAway: true,
  awayTimeoutMs: 300000, // 5 minutes
  enableVisibilityTracking: true,
  enableNetworkTracking: true,
  enableAnalytics: true,
};

/**
 * Enhanced presence hook for real-time user status tracking
 * Optimized for Norwegian tutoring platform with mobile-first approach
 * 
 * Features:
 * - Real-time presence tracking
 * - Automatic away status after inactivity
 * - Network status integration
 * - Visibility change detection
 * - Norwegian time formatting
 * - Mobile battery optimization
 */
export function usePresence(options: UsePresenceOptions = {}) {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const { user } = useAuth();
  const realtimeManager = getRealtimeManager();

  // State
  const [currentUserStatus, setCurrentUserStatus] = useState<OnlineStatus>('offline');
  const [presences, setPresences] = useState<Map<string, UserPresence>>(new Map());
  const [stats, setStats] = useState<PresenceStats>({
    totalUsers: 0,
    onlineUsers: 0,
    awayUsers: 0,
    offlineUsers: 0,
    averageSessionDuration: 0,
    lastActivity: null,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [lastActivity, setLastActivity] = useState<Date>(new Date());

  // Refs
  const awayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activityListenersRef = useRef<(() => void)[]>([]);
  const presenceChannelRef = useRef<any>(null);
  const sessionStartTimeRef = useRef<Date | null>(null);
  const lastStatusUpdateRef = useRef<Date>(new Date());

  // Update user activity timestamp
  const updateActivity = useCallback(() => {
    const now = new Date();
    setLastActivity(now);
    lastStatusUpdateRef.current = now;

    // Reset away timeout
    if (awayTimeoutRef.current) {
      clearTimeout(awayTimeoutRef.current);
    }

    // Set user as online if not already
    if (currentUserStatus !== 'online' && user) {
      updateUserStatus('online');
    }

    // Schedule auto-away if enabled
    if (mergedOptions.enableAutoAway && mergedOptions.awayTimeoutMs > 0) {
      awayTimeoutRef.current = setTimeout(() => {
        if (currentUserStatus === 'online') {
          updateUserStatus('away');
        }
      }, mergedOptions.awayTimeoutMs);
    }
  }, [currentUserStatus, user, mergedOptions.enableAutoAway, mergedOptions.awayTimeoutMs]);

  // Update user presence status
  const updateUserStatus = useCallback(async (status: OnlineStatus) => {
    if (!user || !realtimeManager) return;

    try {
      setCurrentUserStatus(status);
      lastStatusUpdateRef.current = new Date();

      // Update presence on the server
      if (mergedOptions.chatId) {
        await realtimeManager.updatePresence(mergedOptions.chatId, user.id, status);
      }

      // Send analytics event
      if (mergedOptions.enableAnalytics) {
        const sessionDuration = sessionStartTimeRef.current 
          ? Date.now() - sessionStartTimeRef.current.getTime()
          : 0;

        try {
          await fetch('/api/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'presence_updated',
              properties: {
                status,
                sessionDuration,
                chatId: mergedOptions.chatId,
                timestamp: new Date().toISOString(),
              },
            }),
          });
        } catch (error) {
          console.warn('Failed to send presence analytics:', error);
        }
      }
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
  }, [user, realtimeManager, mergedOptions.chatId, mergedOptions.enableAnalytics]);

  // Handle presence events from real-time subscription
  const handlePresenceEvent = useCallback((event: any) => {
    if (!event.payload) return;

    const { type, presences, user: eventUser } = event.payload;

    switch (type) {
      case 'sync':
        // Update all presences
        const newPresences = new Map<string, UserPresence>();
        
        if (presences) {
          Object.values(presences).flat().forEach((presence: any) => {
            if (presence && presence.userId !== user?.id) {
              newPresences.set(presence.userId, {
                userId: presence.userId,
                userName: presence.userName || 'Ukjent bruker',
                status: presence.status || 'unknown',
                lastSeen: presence.lastSeen ? new Date(presence.lastSeen) : new Date(),
                isTyping: false,
                chatId: presence.chatId,
              });
            }
          });
        }
        
        setPresences(newPresences);
        break;

      case 'user_joined':
        if (eventUser && event.payload.newPresences) {
          const newUserPresences = event.payload.newPresences;
          Object.values(newUserPresences).flat().forEach((presence: any) => {
            if (presence && presence.userId !== user?.id) {
              setPresences(prev => new Map(prev.set(presence.userId, {
                userId: presence.userId,
                userName: presence.userName || 'Ukjent bruker',
                status: 'online',
                lastSeen: new Date(),
                isTyping: false,
                chatId: presence.chatId,
              })));
            }
          });
        }
        break;

      case 'user_left':
        if (eventUser && event.payload.leftPresences) {
          const leftUserPresences = event.payload.leftPresences;
          Object.values(leftUserPresences).flat().forEach((presence: any) => {
            if (presence && presence.userId !== user?.id) {
              setPresences(prev => {
                const newMap = new Map(prev);
                const existingPresence = newMap.get(presence.userId);
                if (existingPresence) {
                  newMap.set(presence.userId, {
                    ...existingPresence,
                    status: 'offline',
                    lastSeen: new Date(),
                  });
                }
                return newMap;
              });
            }
          });
        }
        break;
    }
  }, [user?.id]);

  // Handle typing events
  const handleTypingEvent = useCallback((event: any) => {
    if (!event.payload || event.payload.userId === user?.id) return;

    const { userId, isTyping } = event.payload;
    
    setPresences(prev => {
      const newMap = new Map(prev);
      const existingPresence = newMap.get(userId);
      
      if (existingPresence) {
        newMap.set(userId, {
          ...existingPresence,
          isTyping,
        });
      } else if (isTyping) {
        // Create temporary presence for typing user
        newMap.set(userId, {
          userId,
          userName: event.payload.userName || 'Ukjent bruker',
          status: 'online',
          lastSeen: new Date(),
          isTyping: true,
          chatId: mergedOptions.chatId,
        });
      }
      
      return newMap;
    });
  }, [user?.id, mergedOptions.chatId]);

  // Setup activity listeners for automatic status detection
  useEffect(() => {
    if (!mergedOptions.enableAutoAway || typeof window === 'undefined') return;

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const activityHandler = () => {
      updateActivity();
    };

    // Add activity listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, activityHandler, { passive: true });
    });

    // Store cleanup functions
    activityListenersRef.current = activityEvents.map(event => () => {
      window.removeEventListener(event, activityHandler);
    });

    return () => {
      activityListenersRef.current.forEach(cleanup => cleanup());
      activityListenersRef.current = [];
    };
  }, [mergedOptions.enableAutoAway, updateActivity]);

  // Setup visibility change tracking
  useEffect(() => {
    if (!mergedOptions.enableVisibilityTracking || typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, set as away after a delay
        setTimeout(() => {
          if (document.hidden && currentUserStatus === 'online') {
            updateUserStatus('away');
          }
        }, 30000); // 30 seconds delay for Norwegian mobile patterns
      } else {
        // Page is visible again, set as online
        if (currentUserStatus !== 'online') {
          updateUserStatus('online');
        }
        updateActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [mergedOptions.enableVisibilityTracking, currentUserStatus, updateUserStatus, updateActivity]);

  // Setup network status tracking
  useEffect(() => {
    if (!mergedOptions.enableNetworkTracking || typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsConnected(true);
      if (user && currentUserStatus === 'offline') {
        updateUserStatus('online');
      }
    };

    const handleOffline = () => {
      setIsConnected(false);
      updateUserStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set initial network status
    setIsConnected(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [mergedOptions.enableNetworkTracking, user, currentUserStatus, updateUserStatus]);

  // Subscribe to real-time presence updates
  useEffect(() => {
    if (!user || !mergedOptions.chatId) return;

    const setupPresenceSubscription = async () => {
      try {
        // Subscribe to presence events
        const unsubscribePresence = realtimeManager.addEventListener('presence', handlePresenceEvent);
        const unsubscribeTyping = realtimeManager.addEventListener('typing', handleTypingEvent);
        
        // Subscribe to the presence channel
        await realtimeManager.subscribeToPresence(mergedOptions.chatId!, user.id, user.name || user.email || 'Bruker');
        
        // Subscribe to typing channel
        await realtimeManager.subscribeToTyping(mergedOptions.chatId!);

        setIsConnected(true);
        sessionStartTimeRef.current = new Date();
        
        // Set initial status as online
        updateUserStatus('online');
        updateActivity();

        return () => {
          unsubscribePresence();
          unsubscribeTyping();
        };
      } catch (error) {
        console.error('Failed to setup presence subscription:', error);
        setIsConnected(false);
      }
    };

    const cleanup = setupPresenceSubscription();
    
    return () => {
      cleanup.then(fn => fn?.());
    };
  }, [user, mergedOptions.chatId, realtimeManager, handlePresenceEvent, handleTypingEvent, updateUserStatus, updateActivity]);

  // Update statistics
  useEffect(() => {
    const presenceArray = Array.from(presences.values());
    const onlineCount = presenceArray.filter(p => p.status === 'online').length;
    const awayCount = presenceArray.filter(p => p.status === 'away').length;
    const offlineCount = presenceArray.filter(p => p.status === 'offline').length;

    const avgSessionDuration = sessionStartTimeRef.current
      ? Date.now() - sessionStartTimeRef.current.getTime()
      : 0;

    setStats({
      totalUsers: presenceArray.length + (user ? 1 : 0),
      onlineUsers: onlineCount + (currentUserStatus === 'online' ? 1 : 0),
      awayUsers: awayCount + (currentUserStatus === 'away' ? 1 : 0),
      offlineUsers: offlineCount + (currentUserStatus === 'offline' ? 1 : 0),
      averageSessionDuration: avgSessionDuration,
      lastActivity,
    });
  }, [presences, currentUserStatus, user, lastActivity]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (awayTimeoutRef.current) {
        clearTimeout(awayTimeoutRef.current);
      }
      
      // Set offline when component unmounts
      if (user && currentUserStatus !== 'offline') {
        updateUserStatus('offline');
      }
    };
  }, []);

  // Utility functions
  const getUserPresence = useCallback((userId: string): UserPresence | null => {
    return presences.get(userId) || null;
  }, [presences]);

  const getOnlineUsers = useCallback((): UserPresence[] => {
    return Array.from(presences.values()).filter(p => p.status === 'online');
  }, [presences]);

  const getTypingUsers = useCallback((): UserPresence[] => {
    return Array.from(presences.values()).filter(p => p.isTyping);
  }, [presences]);

  const formatLastSeen = useCallback((date: Date): string => {
    return realtimeManager.formatLastSeen(date.toISOString());
  }, [realtimeManager]);

  const formatNorwegianStatus = useCallback((status: OnlineStatus): string => {
    switch (status) {
      case 'online': return 'På nett';
      case 'away': return 'Borte';
      case 'offline': return 'Frakoblet';
      default: return 'Ukjent';
    }
  }, []);

  // Manual status update function
  const setStatus = useCallback(async (status: OnlineStatus) => {
    await updateUserStatus(status);
    updateActivity();
  }, [updateUserStatus, updateActivity]);

  return {
    // Current user status
    currentUserStatus,
    isConnected,
    lastActivity,
    
    // Other users' presence
    presences: Array.from(presences.values()),
    onlineUsers: getOnlineUsers(),
    typingUsers: getTypingUsers(),
    
    // Statistics
    stats,
    
    // Utility functions
    getUserPresence,
    getOnlineUsers,
    getTypingUsers,
    formatLastSeen,
    formatNorwegianStatus,
    
    // Actions
    setStatus,
    updateActivity,
    
    // Status helpers
    isOnline: currentUserStatus === 'online',
    isAway: currentUserStatus === 'away',
    isOffline: currentUserStatus === 'offline',
    
    // Norwegian status text
    statusText: formatNorwegianStatus(currentUserStatus),
  };
}

export default usePresence;