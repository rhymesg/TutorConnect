import { CreateMessageData, MessageWithSender } from '@/types/database';

// Queue item interface
export interface QueuedMessage {
  id: string;
  tempId: string; // Temporary ID for optimistic updates
  chatId: string;
  content: string;
  type: 'TEXT' | 'APPOINTMENT_REQUEST' | 'APPOINTMENT_RESPONSE' | 'SYSTEM_MESSAGE';
  appointmentId?: string;
  timestamp: number;
  retryCount: number;
  lastRetryAt?: number;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  error?: string;
}

// Queue options
export interface MessageQueueOptions {
  maxRetries: number;
  retryDelayMs: number;
  maxRetryDelayMs: number;
  persistToStorage: boolean;
  storageKey: string;
  batchSize: number;
  enableCompression: boolean;
}

// Queue events
export type QueueEvent = 
  | { type: 'message_queued'; message: QueuedMessage }
  | { type: 'message_sending'; messageId: string }
  | { type: 'message_sent'; messageId: string; serverMessage: MessageWithSender }
  | { type: 'message_failed'; messageId: string; error: string }
  | { type: 'queue_cleared'; chatId?: string }
  | { type: 'sync_started'; queueSize: number }
  | { type: 'sync_completed'; sent: number; failed: number };

// Event listener type
export type QueueEventListener = (event: QueueEvent) => void;

// Default options
const DEFAULT_OPTIONS: MessageQueueOptions = {
  maxRetries: 3,
  retryDelayMs: 1000,
  maxRetryDelayMs: 10000,
  persistToStorage: true,
  storageKey: 'tutorconnect_message_queue',
  batchSize: 5,
  enableCompression: false,
};

/**
 * Message Queue Manager for offline/online synchronization
 * Features:
 * - Optimistic message updates
 * - Automatic retry with exponential backoff
 * - Local storage persistence
 * - Batch processing
 * - Event-driven architecture
 * - Norwegian timezone support
 */
export class MessageQueue {
  private queue: Map<string, QueuedMessage> = new Map();
  private options: MessageQueueOptions;
  private listeners: Set<QueueEventListener> = new Set();
  private isProcessing = false;
  private processingTimeout: NodeJS.Timeout | null = null;
  private sendMessageFn: ((data: CreateMessageData) => Promise<MessageWithSender>) | null = null;

  constructor(options: Partial<MessageQueueOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.loadFromStorage();
  }

  // Set the message sending function
  setSendMessageFunction(fn: (data: CreateMessageData) => Promise<MessageWithSender>) {
    this.sendMessageFn = fn;
  }

  // Add event listener
  addEventListener(listener: QueueEventListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Emit event
  private emit(event: QueueEvent) {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Queue event listener error:', error);
      }
    });
  }

  // Generate temporary message ID
  private generateTempId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Calculate retry delay with exponential backoff
  private getRetryDelay(retryCount: number): number {
    const delay = Math.min(
      this.options.retryDelayMs * Math.pow(2, retryCount),
      this.options.maxRetryDelayMs
    );
    // Add jitter (±25%)
    const jitter = delay * 0.25 * (Math.random() - 0.5);
    return Math.max(delay + jitter, this.options.retryDelayMs);
  }

  // Save queue to local storage
  private saveToStorage() {
    if (!this.options.persistToStorage || typeof window === 'undefined') return;

    try {
      const queueData = Array.from(this.queue.values());
      const data = this.options.enableCompression 
        ? this.compressData(queueData)
        : JSON.stringify(queueData);
      
      localStorage.setItem(this.options.storageKey, data);
    } catch (error) {
      console.warn('Failed to save message queue to storage:', error);
    }
  }

  // Load queue from local storage
  private loadFromStorage() {
    if (!this.options.persistToStorage || typeof window === 'undefined') return;

    try {
      const data = localStorage.getItem(this.options.storageKey);
      if (!data) return;

      const queueData = this.options.enableCompression 
        ? this.decompressData(data)
        : JSON.parse(data);

      if (Array.isArray(queueData)) {
        queueData.forEach(item => {
          if (this.isValidQueuedMessage(item)) {
            // Reset status for pending messages
            if (item.status === 'sending') {
              item.status = 'pending';
            }
            this.queue.set(item.id, item);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load message queue from storage:', error);
      // Clear corrupted data
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.options.storageKey);
      }
    }
  }

  // Simple compression (placeholder for actual compression)
  private compressData(data: any): string {
    return JSON.stringify(data); // Implement actual compression if needed
  }

  // Simple decompression (placeholder for actual decompression)
  private decompressData(data: string): any {
    return JSON.parse(data); // Implement actual decompression if needed
  }

  // Validate queued message structure
  private isValidQueuedMessage(item: any): item is QueuedMessage {
    return (
      typeof item === 'object' &&
      typeof item.id === 'string' &&
      typeof item.tempId === 'string' &&
      typeof item.chatId === 'string' &&
      typeof item.content === 'string' &&
      typeof item.type === 'string' &&
      typeof item.timestamp === 'number' &&
      typeof item.retryCount === 'number' &&
      ['pending', 'sending', 'sent', 'failed'].includes(item.status)
    );
  }

  // Add message to queue for optimistic update
  addMessage(messageData: CreateMessageData): string {
    const tempId = this.generateTempId();
    const queuedMessage: QueuedMessage = {
      id: tempId,
      tempId,
      chatId: messageData.chatId,
      content: messageData.content,
      type: messageData.type || 'TEXT',
      appointmentId: messageData.appointmentId,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    };

    this.queue.set(tempId, queuedMessage);
    this.saveToStorage();
    this.emit({ type: 'message_queued', message: queuedMessage });

    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing();
    }

    return tempId;
  }

  // Get queued message by ID
  getMessage(messageId: string): QueuedMessage | undefined {
    return this.queue.get(messageId);
  }

  // Get all queued messages for a chat
  getMessagesForChat(chatId: string): QueuedMessage[] {
    return Array.from(this.queue.values())
      .filter(msg => msg.chatId === chatId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  // Get all pending messages
  getPendingMessages(): QueuedMessage[] {
    return Array.from(this.queue.values())
      .filter(msg => msg.status === 'pending' || msg.status === 'failed')
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  // Remove message from queue
  removeMessage(messageId: string): boolean {
    const removed = this.queue.delete(messageId);
    if (removed) {
      this.saveToStorage();
    }
    return removed;
  }

  // Clear all messages or messages for specific chat
  clearMessages(chatId?: string) {
    if (chatId) {
      let cleared = false;
      this.queue.forEach((message, id) => {
        if (message.chatId === chatId) {
          this.queue.delete(id);
          cleared = true;
        }
      });
      if (cleared) {
        this.saveToStorage();
      }
    } else {
      this.queue.clear();
      this.saveToStorage();
    }
    
    this.emit({ type: 'queue_cleared', chatId });
  }

  // Get queue statistics
  getQueueStats() {
    const messages = Array.from(this.queue.values());
    const stats = {
      total: messages.length,
      pending: messages.filter(m => m.status === 'pending').length,
      sending: messages.filter(m => m.status === 'sending').length,
      failed: messages.filter(m => m.status === 'failed').length,
      oldestMessage: messages.length > 0 
        ? Math.min(...messages.map(m => m.timestamp))
        : null,
      byChatId: {} as Record<string, number>,
    };

    messages.forEach(msg => {
      stats.byChatId[msg.chatId] = (stats.byChatId[msg.chatId] || 0) + 1;
    });

    return stats;
  }

  // Start processing the queue
  private startProcessing() {
    if (this.isProcessing || !this.sendMessageFn) return;

    this.isProcessing = true;
    this.processQueue();
  }

  // Process messages in the queue
  private async processQueue() {
    if (!this.sendMessageFn) {
      this.isProcessing = false;
      return;
    }

    const pendingMessages = this.getPendingMessages()
      .slice(0, this.options.batchSize);

    if (pendingMessages.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.emit({ 
      type: 'sync_started', 
      queueSize: pendingMessages.length 
    });

    let sentCount = 0;
    let failedCount = 0;

    for (const message of pendingMessages) {
      try {
        // Update status to sending
        message.status = 'sending';
        this.queue.set(message.id, message);
        this.emit({ type: 'message_sending', messageId: message.id });

        // Attempt to send the message
        const serverMessage = await this.sendMessageFn({
          content: message.content,
          type: message.type,
          chatId: message.chatId,
          appointmentId: message.appointmentId,
        });

        // Message sent successfully
        this.queue.delete(message.id);
        sentCount++;
        
        this.emit({ 
          type: 'message_sent', 
          messageId: message.id, 
          serverMessage 
        });

      } catch (error) {
        // Message failed to send
        message.status = 'failed';
        message.retryCount++;
        message.lastRetryAt = Date.now();
        message.error = error instanceof Error ? error.message : 'Unknown error';

        if (message.retryCount >= this.options.maxRetries) {
          // Max retries reached, keep in queue but mark as permanently failed
          failedCount++;
          this.emit({ 
            type: 'message_failed', 
            messageId: message.id, 
            error: `Max retries reached: ${message.error}` 
          });
        } else {
          // Schedule retry
          message.status = 'pending';
          failedCount++;
          this.emit({ 
            type: 'message_failed', 
            messageId: message.id, 
            error: message.error 
          });
        }

        this.queue.set(message.id, message);
      }
    }

    this.saveToStorage();
    
    this.emit({ 
      type: 'sync_completed', 
      sent: sentCount, 
      failed: failedCount 
    });

    // Schedule next processing if there are more messages
    const remainingMessages = this.getPendingMessages();
    if (remainingMessages.length > 0) {
      const nextMessage = remainingMessages[0];
      const delay = nextMessage.retryCount > 0 
        ? this.getRetryDelay(nextMessage.retryCount)
        : 1000; // 1 second for new messages

      this.processingTimeout = setTimeout(() => {
        this.processQueue();
      }, delay);
    } else {
      this.isProcessing = false;
    }
  }

  // Force immediate sync
  async forcSync(): Promise<{ sent: number; failed: number }> {
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
      this.processingTimeout = null;
    }

    this.isProcessing = false;
    
    return new Promise((resolve) => {
      const listener = (event: QueueEvent) => {
        if (event.type === 'sync_completed') {
          this.listeners.delete(listener);
          resolve({ sent: event.sent, failed: event.failed });
        }
      };
      
      this.addEventListener(listener);
      this.startProcessing();
    });
  }

  // Stop processing
  stop() {
    this.isProcessing = false;
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
      this.processingTimeout = null;
    }
  }

  // Cleanup
  destroy() {
    this.stop();
    this.listeners.clear();
    this.queue.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.options.storageKey);
    }
  }
}