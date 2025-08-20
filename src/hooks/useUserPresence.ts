import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeConnection } from './useRealtimeConnection';

// User presence status
export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';

// Presence user interface
export interface PresenceUser {
  userId: string;
  userName: string;
  profileImage: string | null;
  status: PresenceStatus;
  lastSeen: Date;
  location?: string; // Current chat/page location
  device?: 'desktop' | 'mobile' | 'tablet';
  isIdle: boolean;
}

// Presence state
export interface PresenceState {
  currentStatus: PresenceStatus;
  users: Map<string, PresenceUser>;
  isVisible: boolean;
  isIdle: boolean;
  lastActivity: Date | null;
  totalOnlineUsers: number;
}

// Hook options
export interface UseUserPresenceOptions {
  chatId?: string;
  globalPresence?: boolean;
  idleTimeoutMs?: number;
  awayTimeoutMs?: number;
  heartbeatIntervalMs?: number;
  enableLocationTracking?: boolean;
  enableDeviceDetection?: boolean;
  enableAnalytics?: boolean;
}

// Presence analytics
export interface PresenceAnalytics {
  totalPresenceEvents: number;
  onlineTime: number;
  awayTime: number;
  idleTime: number;
  statusChanges: Record<PresenceStatus, number>;
  peakOnlineUsers: number;
  averageOnlineUsers: number;
}

// Presence event types
export type PresenceEvent = 
  | { type: 'user_online'; user: PresenceUser }
  | { type: 'user_offline'; userId: string; lastSeen: Date }
  | { type: 'user_status_changed'; userId: string; status: PresenceStatus }
  | { type: 'user_location_changed'; userId: string; location: string }
  | { type: 'status_changed'; status: PresenceStatus }
  | { type: 'idle_state_changed'; isIdle: boolean };

// Event listener type
export type PresenceEventListener = (event: PresenceEvent) => void;

/**
 * Comprehensive user presence hook for online/offline status tracking
 * Features:
 * - Multi-status presence (online, away, busy, offline)
 * - Idle detection with configurable timeouts
 * - Location tracking (current chat/page)
 * - Device detection
 * - Global vs. chat-specific presence
 * - Norwegian time formatting
 * - Analytics tracking
 */
export function useUserPresence({
  chatId,
  globalPresence = false,
  idleTimeoutMs = 300000, // 5 minutes
  awayTimeoutMs = 900000, // 15 minutes
  heartbeatIntervalMs = 30000, // 30 seconds
  enableLocationTracking = true,
  enableDeviceDetection = true,
  enableAnalytics = true,
}: UseUserPresenceOptions = {}) {
  const { user, token } = useAuth();
  const { isConnected, getChannel, removeChannel, formatNorwegianDateTime } = useRealtimeConnection();

  // Presence state
  const [presenceState, setPresenceState] = useState<PresenceState>({
    currentStatus: 'offline',
    users: new Map(),
    isVisible: true,
    isIdle: false,
    lastActivity: null,
    totalOnlineUsers: 0,
  });

  // Analytics state
  const [analytics, setAnalytics] = useState<PresenceAnalytics>({
    totalPresenceEvents: 0,
    onlineTime: 0,
    awayTime: 0,
    idleTime: 0,
    statusChanges: {
      online: 0,
      away: 0,
      busy: 0,
      offline: 0,
    },
    peakOnlineUsers: 0,
    averageOnlineUsers: 0,
  });

  // Event listeners
  const [eventListeners] = useState<Set<PresenceEventListener>>(new Set());

  // Refs
  const channelRef = useRef<any>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const awayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const statusStartTimeRef = useRef<Record<PresenceStatus, number>>({
    online: 0,
    away: 0,
    busy: 0,
    offline: 0,
  });

  // Emit presence event
  const emitEvent = useCallback((event: PresenceEvent) => {
    eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Presence event listener error:', error);
      }
    });
  }, [eventListeners]);

  // Add event listener
  const addEventListener = useCallback((listener: PresenceEventListener) => {
    eventListeners.add(listener);
    return () => eventListeners.delete(listener);
  }, [eventListeners]);

  // Detect device type
  const detectDevice = useCallback((): 'desktop' | 'mobile' | 'tablet' => {
    if (!enableDeviceDetection) return 'desktop';

    const userAgent = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet';
    }
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      return 'mobile';
    }
    return 'desktop';
  }, [enableDeviceDetection]);

  // Get current location
  const getCurrentLocation = useCallback((): string => {
    if (!enableLocationTracking) return '';
    
    const path = window.location.pathname;
    if (path.includes('/chat/')) {
      const chatIdFromPath = path.split('/chat/')[1];
      return `chat:${chatIdFromPath}`;
    }
    if (path.includes('/posts/')) {
      return 'posts';
    }
    if (path.includes('/profile/')) {
      return 'profile';
    }
    return 'dashboard';
  }, [enableLocationTracking]);

  // Update analytics
  const updateAnalytics = useCallback((event: string, data?: any) => {
    if (!enableAnalytics) return;

    setAnalytics(prev => {
      const updated = { ...prev };
      
      switch (event) {
        case 'status_changed':
          const { oldStatus, newStatus } = data;
          updated.totalPresenceEvents++;
          updated.statusChanges[newStatus]++;
          
          // Track time spent in previous status
          if (oldStatus && statusStartTimeRef.current[oldStatus]) {
            const timeSpent = Date.now() - statusStartTimeRef.current[oldStatus];
            switch (oldStatus) {
              case 'online':
                updated.onlineTime += timeSpent;
                break;
              case 'away':
                updated.awayTime += timeSpent;
                break;
              case 'offline':
                // Don't track offline time as it's not accurate
                break;
            }
          }
          
          statusStartTimeRef.current[newStatus] = Date.now();
          break;
          
        case 'user_count_changed':
          const { count } = data;
          updated.peakOnlineUsers = Math.max(updated.peakOnlineUsers, count);
          updated.averageOnlineUsers = updated.averageOnlineUsers 
            ? (updated.averageOnlineUsers + count) / 2 
            : count;
          break;
          
        case 'idle_changed':
          if (data.isIdle) {
            updated.idleTime += Date.now() - lastActivityRef.current;
          }
          break;
      }
      
      return updated;
    });
  }, [enableAnalytics]);

  // Update user activity
  const updateActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    
    setPresenceState(prev => ({
      ...prev,
      lastActivity: new Date(now),
      isIdle: false,
    }));

    // Clear idle/away timeouts and reset them
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    if (awayTimeoutRef.current) {
      clearTimeout(awayTimeoutRef.current);
    }

    // Set new idle timeout
    idleTimeoutRef.current = setTimeout(() => {
      setPresenceState(prev => ({ ...prev, isIdle: true }));
      emitEvent({ type: 'idle_state_changed', isIdle: true });
      updateAnalytics('idle_changed', { isIdle: true });
      
      if (presenceState.currentStatus === 'online') {
        updateStatus('away');
      }
    }, idleTimeoutMs);

    // Set new away timeout
    awayTimeoutRef.current = setTimeout(() => {
      if (presenceState.currentStatus !== 'offline') {
        updateStatus('away');
      }
    }, awayTimeoutMs);

    // If currently idle, update status back to online
    if (presenceState.isIdle && presenceState.currentStatus === 'away') {
      updateStatus('online');
    }
  }, [idleTimeoutMs, awayTimeoutMs, presenceState.currentStatus, presenceState.isIdle, emitEvent, updateAnalytics]);

  // Update presence status
  const updateStatus = useCallback(async (status: PresenceStatus) => {
    if (!user || !isConnected || presenceState.currentStatus === status) return;

    const oldStatus = presenceState.currentStatus;
    
    try {
      // Update via API
      const endpoint = globalPresence ? '/api/users/presence' : '/api/chat/realtime';
      const body = globalPresence 
        ? { status }
        : { action: 'presence', chatId, status };

      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      // Broadcast via real-time channel
      const channelName = globalPresence ? 'global_presence' : `presence:${chatId}`;
      const channel = getChannel(channelName);
      
      if (channel) {
        await channel.send({
          type: 'broadcast',
          event: 'presence_update',
          payload: {
            userId: user.id,
            userName: user.name,
            profileImage: user.profileImage,
            status,
            timestamp: Date.now(),
            location: getCurrentLocation(),
            device: detectDevice(),
          },
        });
      }

      // Update local state
      setPresenceState(prev => ({
        ...prev,
        currentStatus: status,
      }));

      // Emit events
      emitEvent({ type: 'status_changed', status });
      updateAnalytics('status_changed', { oldStatus, newStatus: status });

    } catch (error) {
      console.warn('Failed to update presence status:', error);
    }
  }, [
    user, 
    isConnected, 
    presenceState.currentStatus, 
    globalPresence, 
    chatId, 
    token, 
    getChannel, 
    getCurrentLocation, 
    detectDevice,
    emitEvent,
    updateAnalytics,
  ]);

  // Set status manually
  const setStatus = useCallback((status: PresenceStatus) => {
    updateStatus(status);
  }, [updateStatus]);

  // Go online
  const goOnline = useCallback(() => {
    updateStatus('online');
  }, [updateStatus]);

  // Go away
  const goAway = useCallback(() => {
    updateStatus('away');
  }, [updateStatus]);

  // Go busy
  const goBusy = useCallback(() => {
    updateStatus('busy');
  }, [updateStatus]);

  // Go offline
  const goOffline = useCallback(() => {
    updateStatus('offline');
  }, [updateStatus]);

  // Add or update user presence
  const updateUserPresence = useCallback((userPresence: Partial<PresenceUser> & { userId: string }) => {
    setPresenceState(prev => {
      const updatedUsers = new Map(prev.users);
      const existingUser = updatedUsers.get(userPresence.userId);
      
      const updatedUser: PresenceUser = {
        userId: userPresence.userId,
        userName: userPresence.userName || existingUser?.userName || 'Unknown',
        profileImage: userPresence.profileImage || existingUser?.profileImage || null,
        status: userPresence.status || existingUser?.status || 'offline',
        lastSeen: userPresence.lastSeen || existingUser?.lastSeen || new Date(),
        location: userPresence.location || existingUser?.location || '',
        device: userPresence.device || existingUser?.device || 'desktop',
        isIdle: userPresence.isIdle ?? existingUser?.isIdle ?? false,
      };

      updatedUsers.set(userPresence.userId, updatedUser);
      
      const onlineUsers = Array.from(updatedUsers.values()).filter(u => u.status === 'online');
      const totalOnlineUsers = onlineUsers.length;

      // Update analytics
      updateAnalytics('user_count_changed', { count: totalOnlineUsers });

      return {
        ...prev,
        users: updatedUsers,
        totalOnlineUsers,
      };
    });

    // Emit appropriate event
    if (userPresence.status === 'online') {
      emitEvent({ type: 'user_online', user: userPresence as PresenceUser });
    } else if (userPresence.status === 'offline') {
      emitEvent({ 
        type: 'user_offline', 
        userId: userPresence.userId, 
        lastSeen: userPresence.lastSeen || new Date() 
      });
    } else if (userPresence.status) {
      emitEvent({ 
        type: 'user_status_changed', 
        userId: userPresence.userId, 
        status: userPresence.status 
      });
    }
  }, [emitEvent, updateAnalytics]);

  // Remove user from presence
  const removeUserPresence = useCallback((userId: string) => {
    setPresenceState(prev => {
      const updatedUsers = new Map(prev.users);
      const user = updatedUsers.get(userId);
      
      if (user) {
        updatedUsers.delete(userId);
        emitEvent({ type: 'user_offline', userId, lastSeen: user.lastSeen });
      }

      const onlineUsers = Array.from(updatedUsers.values()).filter(u => u.status === 'online');
      
      return {
        ...prev,
        users: updatedUsers,
        totalOnlineUsers: onlineUsers.length,
      };
    });
  }, [emitEvent]);

  // Setup activity listeners
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      updateActivity();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [updateActivity]);

  // Setup visibility change listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      
      setPresenceState(prev => ({ ...prev, isVisible }));
      
      if (isVisible) {
        updateActivity();
        if (presenceState.currentStatus === 'away') {
          updateStatus('online');
        }
      } else {
        // Don't immediately go away, let the timeout handle it
        setTimeout(() => {
          if (document.hidden && presenceState.currentStatus === 'online') {
            updateStatus('away');
          }
        }, 5000); // 5 second delay
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [presenceState.currentStatus, updateActivity, updateStatus]);

  // Setup heartbeat
  useEffect(() => {
    if (!user || !isConnected || heartbeatIntervalMs <= 0) return;

    heartbeatIntervalRef.current = setInterval(() => {
      if (presenceState.currentStatus !== 'offline') {
        // Send heartbeat to maintain presence
        updateStatus(presenceState.currentStatus);
      }
    }, heartbeatIntervalMs);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, [user, isConnected, heartbeatIntervalMs, presenceState.currentStatus, updateStatus]);

  // Setup real-time subscription
  useEffect(() => {
    if (!user || !isConnected) return;

    const channelName = globalPresence ? 'global_presence' : `presence:${chatId}`;
    if (!channelName.includes(':') && !globalPresence) return;

    const channel = getChannel(channelName);
    if (!channel) return;

    channelRef.current = channel;

    // Subscribe to presence events
    channel.on('presence', { event: 'sync' }, (payload: any) => {
      const presences = payload.presences || {};
      Object.values(presences).flat().forEach((presence: any) => {
        if (presence.userId !== user.id) {
          updateUserPresence({
            userId: presence.userId,
            userName: presence.userName,
            profileImage: presence.profileImage,
            status: 'online',
            lastSeen: new Date(presence.timestamp || Date.now()),
            location: presence.location,
            device: presence.device,
          });
        }
      });
    });

    channel.on('presence', { event: 'join' }, (payload: any) => {
      const presence = payload.newPresences?.[0];
      if (presence && presence.userId !== user.id) {
        updateUserPresence({
          userId: presence.userId,
          userName: presence.userName,
          profileImage: presence.profileImage,
          status: 'online',
          lastSeen: new Date(),
          location: presence.location,
          device: presence.device,
        });
      }
    });

    channel.on('presence', { event: 'leave' }, (payload: any) => {
      const presence = payload.leftPresences?.[0];
      if (presence && presence.userId !== user.id) {
        updateUserPresence({
          userId: presence.userId,
          status: 'offline',
          lastSeen: new Date(),
        });
      }
    });

    // Subscribe to status updates
    channel.on('broadcast', { event: 'presence_update' }, (payload: any) => {
      const { userId, userName, profileImage, status, location, device } = payload.payload;
      if (userId !== user.id) {
        updateUserPresence({
          userId,
          userName,
          profileImage,
          status,
          lastSeen: new Date(),
          location,
          device,
        });
      }
    });

    // Subscribe to the channel
    channel.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        // Track our presence
        await channel.track({
          userId: user.id,
          userName: user.name,
          profileImage: user.profileImage,
          timestamp: Date.now(),
          location: getCurrentLocation(),
          device: detectDevice(),
        });

        // Set initial status
        updateStatus('online');
      }
    });

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      removeChannel(channelName);
    };
  }, [
    user, 
    isConnected, 
    globalPresence, 
    chatId, 
    getChannel, 
    removeChannel, 
    updateUserPresence, 
    updateStatus,
    getCurrentLocation,
    detectDevice,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (presenceState.currentStatus !== 'offline') {
        goOffline();
      }
      
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      if (awayTimeoutRef.current) {
        clearTimeout(awayTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [presenceState.currentStatus, goOffline]);

  // Helper functions
  const getOnlineUsers = useCallback((): PresenceUser[] => {
    return Array.from(presenceState.users.values()).filter(u => u.status === 'online');
  }, [presenceState.users]);

  const getAwayUsers = useCallback((): PresenceUser[] => {
    return Array.from(presenceState.users.values()).filter(u => u.status === 'away');
  }, [presenceState.users]);

  const getBusyUsers = useCallback((): PresenceUser[] => {
    return Array.from(presenceState.users.values()).filter(u => u.status === 'busy');
  }, [presenceState.users]);

  const getUserPresence = useCallback((userId: string): PresenceUser | null => {
    return presenceState.users.get(userId) || null;
  }, [presenceState.users]);

  const isUserOnline = useCallback((userId: string): boolean => {
    const user = presenceState.users.get(userId);
    return user?.status === 'online' || false;
  }, [presenceState.users]);

  // Norwegian formatting helpers
  const formatLastSeen = useCallback((date: Date): string => {
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
  }, [formatNorwegianDateTime]);

  const getStatusText = useCallback((status: PresenceStatus): string => {
    switch (status) {
      case 'online': return 'Tilgjengelig';
      case 'away': return 'Borte';
      case 'busy': return 'Opptatt';
      case 'offline': return 'Frakoblet';
      default: return 'Ukjent';
    }
  }, []);

  const getStatusColor = useCallback((status: PresenceStatus): string => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  }, []);

  return {
    // Presence state
    currentStatus: presenceState.currentStatus,
    isOnline: presenceState.currentStatus === 'online',
    isAway: presenceState.currentStatus === 'away',
    isBusy: presenceState.currentStatus === 'busy',
    isOffline: presenceState.currentStatus === 'offline',
    isIdle: presenceState.isIdle,
    isVisible: presenceState.isVisible,
    lastActivity: presenceState.lastActivity,

    // User management
    users: Array.from(presenceState.users.values()),
    totalUsers: presenceState.users.size,
    onlineUsers: getOnlineUsers(),
    awayUsers: getAwayUsers(),
    busyUsers: getBusyUsers(),
    totalOnlineUsers: presenceState.totalOnlineUsers,

    // Status actions
    setStatus,
    goOnline,
    goAway,
    goBusy,
    goOffline,
    updateActivity,

    // User queries
    getUserPresence,
    isUserOnline,

    // Event system
    addEventListener,

    // Analytics
    analytics: enableAnalytics ? analytics : null,

    // Utility functions
    formatLastSeen,
    getStatusText,
    getStatusColor,
    
    // Connection status
    isConnected,
  };
}