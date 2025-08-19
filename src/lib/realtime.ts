import { createClient } from './supabase-client';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Types for real-time functionality
export interface RealtimeConfig {
  enableRetry: boolean;
  maxRetries: number;
  retryDelay: number;
  heartbeatInterval: number;
  connectionTimeout: number;
  enableAnalytics: boolean;
}

export interface ConnectionStats {
  isConnected: boolean;
  connectionTime: Date | null;
  disconnectionTime: Date | null;
  retryCount: number;
  latency: number | null;
  lastHeartbeat: Date | null;
}

export interface PresenceState {
  userId: string;
  userName: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: string;
  chatId?: string;
}

export interface TypingState {
  userId: string;
  userName: string;
  chatId: string;
  isTyping: boolean;
  timestamp: number;
}

export interface MessageEvent {
  type: 'message' | 'typing' | 'presence' | 'read_receipt' | 'connection';
  payload: any;
  timestamp: Date;
  chatId?: string;
}

// Default configuration optimized for Norwegian mobile networks
const DEFAULT_CONFIG: RealtimeConfig = {
  enableRetry: true,
  maxRetries: 5,
  retryDelay: 2000, // Start with 2 seconds for Norwegian mobile networks
  heartbeatInterval: 30000, // 30 seconds heartbeat
  connectionTimeout: 10000, // 10 seconds timeout
  enableAnalytics: true,
};

/**
 * Enhanced Supabase real-time utilities for TutorConnect
 * Optimized for Norwegian mobile networks and tutoring platform needs
 */
export class RealtimeManager {
  private supabase: SupabaseClient<Database>;
  private config: RealtimeConfig;
  private channels: Map<string, RealtimeChannel> = new Map();
  private connectionStats: ConnectionStats;
  private eventListeners: Map<string, Set<(event: MessageEvent) => void>> = new Map();
  private retryTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectionStartTime: number | null = null;

  constructor(config: Partial<RealtimeConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.supabase = createClient();
    this.connectionStats = {
      isConnected: false,
      connectionTime: null,
      disconnectionTime: null,
      retryCount: 0,
      latency: null,
      lastHeartbeat: null,
    };
    
    this.setupConnectionHandlers();
  }

  private setupConnectionHandlers() {
    // Handle connection state changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        this.connect();
      } else if (event === 'SIGNED_OUT') {
        this.disconnect();
      }
    });

    // Network status monitoring (Norwegian mobile network optimization)
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[RealtimeManager] Network back online, reconnecting...');
        this.reconnect();
      });

      window.addEventListener('offline', () => {
        console.log('[RealtimeManager] Network offline detected');
        this.handleDisconnection();
      });

      // Visibility change handling for Norwegian battery optimization
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          // Reduce heartbeat when app is in background
          this.adjustHeartbeatForBackground(true);
        } else {
          // Resume normal heartbeat when app is active
          this.adjustHeartbeatForBackground(false);
          this.ensureConnection();
        }
      });
    }
  }

  private adjustHeartbeatForBackground(isBackground: boolean) {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.connectionStats.isConnected) {
      const interval = isBackground 
        ? this.config.heartbeatInterval * 2 // Double interval when in background
        : this.config.heartbeatInterval;
      
      this.startHeartbeat(interval);
    }
  }

  private startHeartbeat(interval: number = this.config.heartbeatInterval) {
    if (this.heartbeatInterval) return;

    this.heartbeatInterval = setInterval(async () => {
      try {
        const startTime = Date.now();
        
        // Use a lightweight query to test connection
        await this.supabase.from('users').select('count').limit(1);
        
        const latency = Date.now() - startTime;
        this.connectionStats.latency = latency;
        this.connectionStats.lastHeartbeat = new Date();
        
        // Emit heartbeat event for analytics
        if (this.config.enableAnalytics) {
          this.emitEvent('connection', 'heartbeat', { latency });
        }
        
      } catch (error) {
        console.warn('[RealtimeManager] Heartbeat failed:', error);
        this.handleDisconnection();
      }
    }, interval);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  async connect(): Promise<boolean> {
    if (this.connectionStats.isConnected) return true;

    try {
      this.connectionStartTime = Date.now();
      console.log('[RealtimeManager] Connecting to Supabase realtime...');

      // Test connection with a simple query
      await this.supabase.from('users').select('count').limit(1);

      this.connectionStats.isConnected = true;
      this.connectionStats.connectionTime = new Date();
      this.connectionStats.retryCount = 0;
      
      // Start heartbeat monitoring
      this.startHeartbeat();
      
      // Emit connection event
      this.emitEvent('connection', 'connected', {
        connectionTime: this.connectionStartTime ? Date.now() - this.connectionStartTime : 0,
      });

      console.log('[RealtimeManager] Connected successfully');
      return true;
      
    } catch (error) {
      console.error('[RealtimeManager] Connection failed:', error);
      this.handleDisconnection();
      
      if (this.config.enableRetry && this.connectionStats.retryCount < this.config.maxRetries) {
        this.scheduleRetry();
      }
      
      return false;
    }
  }

  private async ensureConnection(): Promise<void> {
    if (!this.connectionStats.isConnected) {
      await this.connect();
    }
  }

  async disconnect(): Promise<void> {
    console.log('[RealtimeManager] Disconnecting...');
    
    this.stopHeartbeat();
    
    // Unsubscribe from all channels
    for (const [channelName, channel] of this.channels) {
      try {
        await channel.unsubscribe();
      } catch (error) {
        console.warn(`[RealtimeManager] Error unsubscribing from ${channelName}:`, error);
      }
    }
    
    this.channels.clear();
    this.connectionStats.isConnected = false;
    this.connectionStats.disconnectionTime = new Date();
    
    // Clear retry timeout
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    
    this.emitEvent('connection', 'disconnected', {});
  }

  private handleDisconnection(): void {
    if (this.connectionStats.isConnected) {
      this.connectionStats.isConnected = false;
      this.connectionStats.disconnectionTime = new Date();
      this.stopHeartbeat();
      
      this.emitEvent('connection', 'disconnected', { 
        reason: 'network_error' 
      });
    }
  }

  async reconnect(): Promise<boolean> {
    console.log('[RealtimeManager] Reconnecting...');
    await this.disconnect();
    return this.connect();
  }

  private scheduleRetry(): void {
    if (this.retryTimeout) return;
    
    this.connectionStats.retryCount++;
    const delay = Math.min(
      this.config.retryDelay * Math.pow(2, this.connectionStats.retryCount - 1),
      30000 // Max 30 seconds delay for Norwegian networks
    );
    
    console.log(`[RealtimeManager] Scheduling retry ${this.connectionStats.retryCount}/${this.config.maxRetries} in ${delay}ms`);
    
    this.retryTimeout = setTimeout(() => {
      this.retryTimeout = null;
      this.connect();
    }, delay);
  }

  // Channel management with Norwegian error messages
  async subscribeToChat(chatId: string): Promise<RealtimeChannel | null> {
    await this.ensureConnection();
    
    const channelName = `chat:${chatId}`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    try {
      const channel = this.supabase.channel(channelName, {
        config: {
          broadcast: { self: false },
          presence: { key: 'user_id' },
        },
      });

      // Subscribe to postgres changes for messages
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chatId=eq.${chatId}`,
        },
        (payload) => {
          this.emitEvent('message', 'new_message', {
            chatId,
            message: payload.new,
          });
        }
      );

      // Subscribe to message updates
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chatId=eq.${chatId}`,
        },
        (payload) => {
          this.emitEvent('message', 'message_updated', {
            chatId,
            message: payload.new,
            oldMessage: payload.old,
          });
        }
      );

      // Subscribe to message deletions
      channel.on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `chatId=eq.${chatId}`,
        },
        (payload) => {
          this.emitEvent('message', 'message_deleted', {
            chatId,
            messageId: payload.old.id,
          });
        }
      );

      await channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[RealtimeManager] Subscribed to chat ${chatId}`);
          this.emitEvent('connection', 'channel_subscribed', { channelName });
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`[RealtimeManager] Failed to subscribe to chat ${chatId}`);
          this.emitEvent('connection', 'channel_error', { channelName });
        }
      });

      this.channels.set(channelName, channel);
      return channel;
      
    } catch (error) {
      console.error(`[RealtimeManager] Error subscribing to chat ${chatId}:`, error);
      return null;
    }
  }

  async subscribeToTyping(chatId: string): Promise<RealtimeChannel | null> {
    await this.ensureConnection();
    
    const channelName = `typing:${chatId}`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    try {
      const channel = this.supabase.channel(channelName);
      
      channel.on('broadcast', { event: 'typing' }, (payload) => {
        this.emitEvent('typing', 'typing_update', {
          chatId,
          ...payload.payload,
        });
      });

      await channel.subscribe();
      this.channels.set(channelName, channel);
      return channel;
      
    } catch (error) {
      console.error(`[RealtimeManager] Error subscribing to typing for chat ${chatId}:`, error);
      return null;
    }
  }

  async subscribeToPresence(chatId: string, userId: string, userName: string): Promise<RealtimeChannel | null> {
    await this.ensureConnection();
    
    const channelName = `presence:${chatId}`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    try {
      const channel = this.supabase.channel(channelName);
      
      // Handle presence events
      channel
        .on('presence', { event: 'sync' }, (payload) => {
          this.emitEvent('presence', 'sync', {
            chatId,
            presences: payload.presences,
          });
        })
        .on('presence', { event: 'join' }, (payload) => {
          this.emitEvent('presence', 'user_joined', {
            chatId,
            user: payload.key,
            newPresences: payload.newPresences,
          });
        })
        .on('presence', { event: 'leave' }, (payload) => {
          this.emitEvent('presence', 'user_left', {
            chatId,
            user: payload.key,
            leftPresences: payload.leftPresences,
          });
        });

      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId,
            userName,
            status: 'online',
            lastSeen: new Date().toISOString(),
            chatId,
          });
        }
      });

      this.channels.set(channelName, channel);
      return channel;
      
    } catch (error) {
      console.error(`[RealtimeManager] Error subscribing to presence for chat ${chatId}:`, error);
      return null;
    }
  }

  // Broadcasting functions
  async broadcastTyping(chatId: string, userId: string, userName: string, isTyping: boolean): Promise<void> {
    const channel = this.channels.get(`typing:${chatId}`);
    
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId,
          userName,
          isTyping,
          timestamp: Date.now(),
          // Norwegian typing message
          message: isTyping ? 'skriver...' : '',
        },
      });
    }
  }

  async updatePresence(chatId: string, userId: string, status: 'online' | 'away' | 'offline'): Promise<void> {
    const channel = this.channels.get(`presence:${chatId}`);
    
    if (channel) {
      await channel.track({
        userId,
        status,
        lastSeen: new Date().toISOString(),
        chatId,
      });
    }
  }

  // Event system
  addEventListener(eventType: string, listener: (event: MessageEvent) => void): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    
    this.eventListeners.get(eventType)!.add(listener);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(eventType);
      if (listeners) {
        listeners.delete(listener);
      }
    };
  }

  private emitEvent(type: string, subtype: string, payload: any): void {
    const event: MessageEvent = {
      type: type as any,
      payload: {
        type: subtype,
        ...payload,
      },
      timestamp: new Date(),
      chatId: payload.chatId,
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`[RealtimeManager] Event listener error:`, error);
        }
      });
    }
  }

  // Utility functions
  async unsubscribeFromChat(chatId: string): Promise<void> {
    const channelNames = [
      `chat:${chatId}`,
      `typing:${chatId}`,
      `presence:${chatId}`,
    ];

    for (const channelName of channelNames) {
      const channel = this.channels.get(channelName);
      if (channel) {
        await channel.unsubscribe();
        this.channels.delete(channelName);
      }
    }
  }

  getConnectionStats(): ConnectionStats {
    return { ...this.connectionStats };
  }

  // Norwegian-specific formatting helpers
  formatLastSeen(lastSeen: string): string {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Nettopp';
    if (diffMinutes < 60) return `${diffMinutes} min siden`;
    if (diffHours < 24) return `${diffHours} timer siden`;
    if (diffDays === 1) return 'I går';
    if (diffDays < 7) return `${diffDays} dager siden`;

    return new Intl.DateTimeFormat('nb-NO', {
      timeZone: 'Europe/Oslo',
      day: 'numeric',
      month: 'short',
      year: diffDays > 365 ? 'numeric' : undefined,
    }).format(date);
  }

  formatNorwegianTime(date: Date): string {
    return new Intl.DateTimeFormat('nb-NO', {
      timeZone: 'Europe/Oslo',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  // Cleanup method
  async cleanup(): Promise<void> {
    console.log('[RealtimeManager] Cleaning up...');
    await this.disconnect();
    this.eventListeners.clear();
  }
}

// Singleton instance for global use
let realtimeManager: RealtimeManager | null = null;

export const getRealtimeManager = (config?: Partial<RealtimeConfig>): RealtimeManager => {
  if (!realtimeManager) {
    realtimeManager = new RealtimeManager(config);
  }
  return realtimeManager;
};

// Hook factory for creating real-time subscriptions
export const createRealtimeSubscription = (
  channelName: string,
  eventHandlers: Record<string, (payload: any) => void>
) => {
  const manager = getRealtimeManager();
  const unsubscribeFunctions: (() => void)[] = [];

  const subscribe = async () => {
    for (const [eventType, handler] of Object.entries(eventHandlers)) {
      const unsubscribe = manager.addEventListener(eventType, handler);
      unsubscribeFunctions.push(unsubscribe);
    }
  };

  const unsubscribe = () => {
    unsubscribeFunctions.forEach(unsub => unsub());
    unsubscribeFunctions.length = 0;
  };

  return { subscribe, unsubscribe };
};