import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { createClient as createSupabaseClient } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Connection states
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

// Network status
export type NetworkStatus = 'online' | 'offline' | 'slow';

// Connection options
export interface ConnectionOptions {
  enableRetry?: boolean;
  maxRetries?: number;
  retryDelayMs?: number;
  maxRetryDelayMs?: number;
  enableNetworkDetection?: boolean;
  heartbeatInterval?: number;
  enableAnalytics?: boolean;
}

// Connection state interface
export interface ConnectionState {
  status: ConnectionStatus;
  networkStatus: NetworkStatus;
  isConnected: boolean;
  lastConnectedAt: Date | null;
  lastDisconnectedAt: Date | null;
  retryCount: number;
  error: string | null;
  latency: number | null;
}

// Connection metrics for analytics
export interface ConnectionMetrics {
  connectionTime: number;
  reconnectionCount: number;
  totalDowntime: number;
  averageLatency: number;
  lastHeartbeat: Date | null;
}

// Default options
const DEFAULT_OPTIONS: Required<ConnectionOptions> = {
  enableRetry: true,
  maxRetries: 5,
  retryDelayMs: 1000,
  maxRetryDelayMs: 30000,
  enableNetworkDetection: true,
  heartbeatInterval: 30000, // 30 seconds
  enableAnalytics: true,
};

/**
 * Enhanced real-time connection hook with comprehensive connection management
 * Features:
 * - Automatic retry with exponential backoff
 * - Network status detection
 * - Connection health monitoring
 * - Performance metrics
 * - Norwegian timezone support
 */
export function useRealtimeConnection(options: ConnectionOptions = {}) {
  const { user, token } = useAuth();
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // Connection state
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    networkStatus: 'online',
    isConnected: false,
    lastConnectedAt: null,
    lastDisconnectedAt: null,
    retryCount: 0,
    error: null,
    latency: null,
  });

  // Connection metrics
  const [metrics, setMetrics] = useState<ConnectionMetrics>({
    connectionTime: 0,
    reconnectionCount: 0,
    totalDowntime: 0,
    averageLatency: 0,
    lastHeartbeat: null,
  });

  // Refs
  const supabaseRef = useRef<ReturnType<typeof createSupabaseClient> | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const connectionStartTimeRef = useRef<number | null>(null);
  const disconnectionStartTimeRef = useRef<number | null>(null);
  const latencyTestTimeRef = useRef<number | null>(null);
  const channelMapRef = useRef<Map<string, RealtimeChannel>>(new Map());

  // Initialize Supabase client
  useEffect(() => {
    if (user && token) {
      supabaseRef.current = createSupabaseClient();
    }
    return () => {
      supabaseRef.current = null;
    };
  }, [user, token]);

  // Network status detection
  useEffect(() => {
    if (!mergedOptions.enableNetworkDetection) return;

    const updateNetworkStatus = () => {
      const networkStatus: NetworkStatus = navigator.onLine 
        ? (navigator.connection?.effectiveType === '2g' ? 'slow' : 'online')
        : 'offline';
      
      setConnectionState(prev => ({ ...prev, networkStatus }));
      
      // Trigger reconnection if we come back online
      if (networkStatus === 'online' && connectionState.status === 'disconnected') {
        connect();
      }
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    
    // Check initial status
    updateNetworkStatus();

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, [mergedOptions.enableNetworkDetection]);

  // Calculate exponential backoff delay
  const getRetryDelay = useCallback((retryCount: number): number => {
    const delay = Math.min(
      mergedOptions.retryDelayMs * Math.pow(2, retryCount),
      mergedOptions.maxRetryDelayMs
    );
    // Add jitter (±25%)
    const jitter = delay * 0.25 * (Math.random() - 0.5);
    return Math.max(delay + jitter, mergedOptions.retryDelayMs);
  }, [mergedOptions.retryDelayMs, mergedOptions.maxRetryDelayMs]);

  // Start heartbeat monitoring
  const startHeartbeat = useCallback(() => {
    if (!mergedOptions.heartbeatInterval || heartbeatIntervalRef.current) return;

    heartbeatIntervalRef.current = setInterval(async () => {
      if (!supabaseRef.current || connectionState.status !== 'connected') return;

      try {
        latencyTestTimeRef.current = Date.now();
        
        // Simple ping test using a lightweight Supabase operation
        await supabaseRef.current.from('users').select('count').limit(1);
        
        const latency = latencyTestTimeRef.current ? Date.now() - latencyTestTimeRef.current : null;
        
        setConnectionState(prev => ({ ...prev, latency }));
        setMetrics(prev => ({
          ...prev,
          lastHeartbeat: new Date(),
          averageLatency: prev.averageLatency 
            ? (prev.averageLatency + (latency || 0)) / 2 
            : latency || 0,
        }));
      } catch (error) {
        console.warn('Heartbeat failed:', error);
        // Don't immediately disconnect, as it might be a temporary issue
      }
    }, mergedOptions.heartbeatInterval);
  }, [mergedOptions.heartbeatInterval, connectionState.status]);

  // Stop heartbeat monitoring
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // Connect to Supabase realtime
  const connect = useCallback(async (): Promise<boolean> => {
    if (!supabaseRef.current || !user) {
      setConnectionState(prev => ({ 
        ...prev, 
        status: 'error',
        error: 'No Supabase client or user available',
      }));
      return false;
    }

    if (connectionState.status === 'connecting' || connectionState.status === 'connected') {
      return connectionState.status === 'connected';
    }

    try {
      setConnectionState(prev => ({ 
        ...prev, 
        status: 'connecting',
        error: null,
      }));

      connectionStartTimeRef.current = Date.now();

      // Test connection with a simple query
      await supabaseRef.current.from('users').select('count').limit(1);

      const connectionTime = connectionStartTimeRef.current 
        ? Date.now() - connectionStartTimeRef.current 
        : 0;

      setConnectionState(prev => ({
        ...prev,
        status: 'connected',
        isConnected: true,
        lastConnectedAt: new Date(),
        retryCount: 0,
        error: null,
        latency: connectionTime,
      }));

      // Update metrics
      setMetrics(prev => ({
        ...prev,
        connectionTime,
        reconnectionCount: prev.reconnectionCount + (prev.reconnectionCount > 0 ? 1 : 0),
        totalDowntime: disconnectionStartTimeRef.current 
          ? prev.totalDowntime + (Date.now() - disconnectionStartTimeRef.current)
          : prev.totalDowntime,
      }));

      // Clear disconnection timer
      disconnectionStartTimeRef.current = null;

      // Start heartbeat monitoring
      startHeartbeat();

      // Send analytics event
      if (mergedOptions.enableAnalytics) {
        try {
          await fetch('/api/analytics', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              event: 'realtime_connected',
              properties: {
                connectionTime,
                retryCount: connectionState.retryCount,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
              },
            }),
          });
        } catch (error) {
          console.warn('Failed to send analytics event:', error);
        }
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      
      setConnectionState(prev => ({
        ...prev,
        status: 'error',
        isConnected: false,
        error: errorMessage,
      }));

      // Trigger retry if enabled
      if (mergedOptions.enableRetry && connectionState.retryCount < mergedOptions.maxRetries) {
        scheduleRetry();
      }

      return false;
    }
  }, [user, token, connectionState.status, connectionState.retryCount, mergedOptions, startHeartbeat]);

  // Disconnect from Supabase realtime
  const disconnect = useCallback(async (): Promise<void> => {
    stopHeartbeat();
    
    // Close all channels
    channelMapRef.current.forEach(channel => {
      try {
        channel.unsubscribe();
      } catch (error) {
        console.warn('Error unsubscribing from channel:', error);
      }
    });
    channelMapRef.current.clear();

    setConnectionState(prev => ({
      ...prev,
      status: 'disconnected',
      isConnected: false,
      lastDisconnectedAt: new Date(),
      error: null,
    }));

    disconnectionStartTimeRef.current = Date.now();

    // Clear retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, [stopHeartbeat]);

  // Schedule retry with exponential backoff
  const scheduleRetry = useCallback(() => {
    if (!mergedOptions.enableRetry || connectionState.retryCount >= mergedOptions.maxRetries) {
      return;
    }

    const delay = getRetryDelay(connectionState.retryCount);
    
    setConnectionState(prev => ({
      ...prev,
      status: 'reconnecting',
      retryCount: prev.retryCount + 1,
    }));

    retryTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [mergedOptions.enableRetry, mergedOptions.maxRetries, connectionState.retryCount, getRetryDelay, connect]);

  // Force reconnection
  const reconnect = useCallback(async (): Promise<boolean> => {
    await disconnect();
    
    // Reset retry count for manual reconnection
    setConnectionState(prev => ({ ...prev, retryCount: 0 }));
    
    return connect();
  }, [disconnect, connect]);

  // Get or create channel
  const getChannel = useCallback((channelName: string, config?: any): RealtimeChannel | null => {
    if (!supabaseRef.current || !connectionState.isConnected) {
      return null;
    }

    let channel = channelMapRef.current.get(channelName);
    
    if (!channel) {
      channel = supabaseRef.current.channel(channelName, config);
      channelMapRef.current.set(channelName, channel);
    }

    return channel;
  }, [connectionState.isConnected]);

  // Remove channel from tracking
  const removeChannel = useCallback((channelName: string): void => {
    const channel = channelMapRef.current.get(channelName);
    if (channel) {
      try {
        channel.unsubscribe();
      } catch (error) {
        console.warn('Error unsubscribing from channel:', error);
      }
      channelMapRef.current.delete(channelName);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setConnectionState(prev => ({ ...prev, error: null }));
  }, []);

  // Auto-connect when user is available
  useEffect(() => {
    if (user && token && connectionState.status === 'disconnected') {
      connect();
    }
  }, [user, token, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [disconnect]);

  return {
    // Connection state
    connectionState,
    metrics,
    
    // Connection actions
    connect,
    disconnect,
    reconnect,
    clearError,
    
    // Channel management
    getChannel,
    removeChannel,
    
    // Utilities
    isConnected: connectionState.isConnected,
    isConnecting: connectionState.status === 'connecting',
    isReconnecting: connectionState.status === 'reconnecting',
    hasError: Boolean(connectionState.error),
    canRetry: connectionState.retryCount < mergedOptions.maxRetries,
    
    // Norwegian time helpers
    formatNorwegianTime: (date: Date) => {
      return new Intl.DateTimeFormat('nb-NO', {
        timeZone: 'Europe/Oslo',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(date);
    },
    
    formatNorwegianDateTime: (date: Date) => {
      return new Intl.DateTimeFormat('nb-NO', {
        timeZone: 'Europe/Oslo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    },
  };
}