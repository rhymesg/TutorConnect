'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Chat, ChatListItem, Message } from '@/types/chat';

interface UseChatOptions {
  chatId?: string;
  autoLoad?: boolean;
  enableRealtime?: boolean;
  enablePresence?: boolean;
  enableTyping?: boolean;
}

interface UseChatReturn {
  // Single chat data
  chat: Chat | null;
  messages: Message[];
  
  // Chat list data
  chats: ChatListItem[];
  
  // Loading states
  isLoadingChat: boolean;
  isLoadingMessages: boolean;
  isLoadingChats: boolean;
  
  // Error states
  chatError: string | null;
  messageError: string | null;
  chatsError: string | null;
  
  // Real-time states
  isConnected: boolean;
  typingUsers: string[];
  
  // Actions
  loadChat: (chatId: string) => Promise<void>;
  loadChats: () => Promise<void>;
  sendMessage: (content: string, type?: Message['type']) => Promise<void>;
  retryLastAction: () => Promise<void>;
  
  // Real-time actions
  startTyping: () => Promise<void>;
  stopTyping: () => Promise<void>;
  
  // Utilities
  refreshAuth: () => Promise<boolean>;
  clearErrors: () => void;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const { 
    chatId, 
    autoLoad = true, 
    enableRealtime = false, 
    enablePresence = false, 
    enableTyping = false 
  } = options;
  const { user, refreshAuth: authRefresh } = useAuth();
  
  // State
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<ChatListItem[]>([]);
  
  // Loading states
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  
  // Error states
  const [chatError, setChatError] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [chatsError, setChatsError] = useState<string | null>(null);
  
  // Real-time states
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  // Last action for retry
  const [lastAction, setLastAction] = useState<(() => Promise<void>) | null>(null);

  // Centralized auth refresh
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      const result = await authRefresh();
      return result;
    } catch (error) {
      console.error('Auth refresh failed:', error);
      return false;
    }
  }, [authRefresh]);

  // Get headers with auth token
  const getAuthHeaders = useCallback(async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      const refreshed = await refreshAuth();
      if (!refreshed) {
        throw new Error('Authentication required');
      }
      return {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json',
      };
    }
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }, [refreshAuth]);

  // Load specific chat with messages
  const loadChat = useCallback(async (targetChatId: string) => {
    setIsLoadingChat(true);
    setIsLoadingMessages(true);
    setChatError(null);
    setMessageError(null);
    
    const action = async () => {
      try {
        const headers = await getAuthHeaders();
        
        const response = await fetch(`/api/chat/${targetChatId}`, { headers });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `Failed to load chat: ${response.status}`);
        }

        const data = await response.json();
        
        const chatData = data.data?.chat || data.data;
        const messagesData = data.data?.messages || [];
        
        // Transform chat data
        const transformedChat: Chat = {
          id: chatData.id,
          relatedPostId: chatData.relatedPostId,
          isActive: chatData.isActive,
          lastMessageAt: chatData.lastMessageAt ? new Date(chatData.lastMessageAt) : new Date(),
          createdAt: new Date(chatData.createdAt),
          updatedAt: new Date(chatData.updatedAt),
          participants: chatData.participants || [],
          relatedPost: chatData.relatedPost,
        };
        
        // Transform messages
        const transformedMessages: Message[] = messagesData.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          type: msg.type || 'TEXT',
          chatId: msg.chatId,
          senderId: msg.senderId,
          isEdited: msg.isEdited || false,
          sentAt: new Date(msg.sentAt),
          sender: msg.sender,
        }));
        
        setChat(transformedChat);
        setMessages(transformedMessages);
        
        // Also add to chats list if not present
        const otherParticipants = chatData.otherParticipants || 
          chatData.participants?.filter((p: any) => p.userId !== user?.id) || [];
        const otherParticipant = otherParticipants[0];
        
        const chatItem: ChatListItem = {
          id: chatData.id,
          relatedPostId: chatData.relatedPostId,
          isActive: chatData.isActive,
          lastMessageAt: chatData.lastMessageAt ? new Date(chatData.lastMessageAt) : new Date(),
          createdAt: new Date(chatData.createdAt),
          updatedAt: new Date(chatData.updatedAt),
          participants: chatData.participants || [],
          unreadCount: chatData.unreadCount || 0,
          otherParticipant,
          displayName: otherParticipant?.user?.name || chatData.relatedPost?.user?.name || 'Unknown',
          lastMessagePreview: transformedMessages[0]?.content || 'Chat started',
          relatedPost: chatData.relatedPost,
        };
        
        setChats(prev => {
          const existing = prev.find(c => c.id === chatItem.id);
          if (existing) {
            return prev.map(c => c.id === chatItem.id ? chatItem : c);
          }
          return [chatItem, ...prev];
        });
        
      } catch (error) {
        console.error('Error loading chat:', error);
        setChatError(error instanceof Error ? error.message : 'Failed to load chat');
        throw error;
      }
    };
    
    setLastAction(() => action);
    
    try {
      await action();
    } finally {
      setIsLoadingChat(false);
      setIsLoadingMessages(false);
    }
  }, [getAuthHeaders, user]);

  // Load all chats
  const loadChats = useCallback(async () => {
    setIsLoadingChats(true);
    setChatsError(null);
    
    const action = async () => {
      try {
        const headers = await getAuthHeaders();
        
        const response = await fetch('/api/chat?limit=20&sortBy=lastMessageAt&sortOrder=desc', {
          headers
        });

        if (!response.ok) {
          throw new Error('Failed to load chats');
        }

        const data = await response.json();
        const chatsData = data.data.chats || [];
        
        const transformedChats: ChatListItem[] = chatsData.map((chat: any) => ({
          id: chat.id,
          relatedPostId: chat.relatedPostId,
          isActive: chat.isActive,
          lastMessageAt: new Date(chat.lastMessageAt),
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt),
          participants: chat.participants || [],
          unreadCount: chat.unreadCount || 0,
          otherParticipant: chat.otherParticipant,
          displayName: chat.otherParticipant?.user?.name || 'Unknown',
          lastMessagePreview: chat.lastMessage?.content || 'Chat started',
          relatedPost: chat.relatedPost,
        }));
        
        setChats(transformedChats);
      } catch (error) {
        console.error('Error loading chats:', error);
        setChatsError(error instanceof Error ? error.message : 'Failed to load chats');
        throw error;
      }
    };
    
    setLastAction(() => action);
    
    try {
      await action();
    } finally {
      setIsLoadingChats(false);
    }
  }, [getAuthHeaders]);

  // Send message
  const sendMessage = useCallback(async (content: string, type: Message['type'] = 'TEXT') => {
    if (!chatId || !content.trim()) {
      return;
    }
    setMessageError(null);
    
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`/api/chat/${chatId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: content.trim(), type }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API error response:', errorData);
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data = await response.json();
      const newMessage = data.data.message;
      
      // Transform and add the new message
      const transformedMessage: Message = {
        id: newMessage.id,
        content: newMessage.content,
        type: newMessage.type,
        chatId: newMessage.chatId,
        senderId: newMessage.senderId,
        isEdited: newMessage.isEdited || false,
        sentAt: new Date(newMessage.sentAt),
        sender: newMessage.sender,
      };
      
      setMessages(prev => [...prev, transformedMessage]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setMessageError(error instanceof Error ? error.message : 'Failed to send message');
      throw error;
    }
  }, [chatId, getAuthHeaders]);

  // Retry last action
  const retryLastAction = useCallback(async () => {
    if (lastAction) {
      await lastAction();
    }
  }, [lastAction]);

  // Start typing indicator
  const startTyping = useCallback(async () => {
    if (!enableTyping || !chatId) return;
    
    try {
      console.log('Start typing - TODO: Implement real-time typing');
      // TODO: Implement real-time typing with Supabase
    } catch (error) {
      console.error('Failed to start typing:', error);
    }
  }, [enableTyping, chatId]);

  // Stop typing indicator
  const stopTyping = useCallback(async () => {
    if (!enableTyping || !chatId) return;
    
    try {
      console.log('Stop typing - TODO: Implement real-time typing');
      // TODO: Implement real-time typing with Supabase
    } catch (error) {
      console.error('Failed to stop typing:', error);
    }
  }, [enableTyping, chatId]);

  // Clear errors
  const clearErrors = useCallback(() => {
    setChatError(null);
    setMessageError(null);
    setChatsError(null);
  }, []);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      if (chatId) {
        loadChat(chatId);
      } else {
        loadChats();
      }
    }
  }, [chatId, autoLoad, loadChat, loadChats]);

  // Real-time connection (placeholder for future implementation)
  useEffect(() => {
    if (enableRealtime && chatId) {
      console.log('Real-time connection - TODO: Implement Supabase real-time');
      setIsConnected(true);
      
      return () => {
        setIsConnected(false);
        setTypingUsers([]);
      };
    }
  }, [enableRealtime, chatId]);

  return {
    // Data
    chat,
    messages,
    chats,
    
    // Loading states
    isLoadingChat,
    isLoadingMessages,
    isLoadingChats,
    
    // Error states
    chatError,
    messageError,
    chatsError,
    
    // Real-time states
    isConnected,
    typingUsers,
    
    // Actions
    loadChat,
    loadChats,
    sendMessage,
    retryLastAction,
    
    // Real-time actions
    startTyping,
    stopTyping,
    
    // Utilities
    refreshAuth,
    clearErrors,
  };
}

export default useChat;