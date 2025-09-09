'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Chat, ChatListItem, Message } from '@/types/chat';

interface UseChatOptions {
  chatId?: string;
  autoLoad?: boolean;
  enablePolling?: boolean;
}

interface UseChatReturn {
  // Single chat data
  chat: Chat | null;
  messages: Message[];
  
  // Chat list data
  chats: ChatListItem[];
  totalUnreadCount: number;
  
  // Loading states
  isLoadingChat: boolean;
  isLoadingMessages: boolean;
  isLoadingChats: boolean;
  
  // Error states
  chatError: string | null;
  messageError: string | null;
  chatsError: string | null;
  
  // Actions
  loadChat: (chatId: string) => Promise<void>;
  loadChats: () => Promise<void>;
  sendMessage: (content: string, type?: Message['type']) => Promise<void>;
  retryLastAction: () => Promise<void>;
  
  // Utilities
  refreshAuth: () => Promise<boolean>;
  clearErrors: () => void;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const { 
    chatId, 
    autoLoad = true, 
    enablePolling = true 
  } = options;
  const { user, accessToken, refreshAuth: authRefresh } = useAuth();
  
  // State
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState<number>(0);
  
  // Loading states
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  
  // Error states
  const [chatError, setChatError] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [chatsError, setChatsError] = useState<string | null>(null);
  
  // Last action for retry
  const [lastAction, setLastAction] = useState<(() => Promise<void>) | null>(null);

  // Centralized auth refresh
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      const result = await authRefresh();
      return result;
    } catch (error) {
      // console.error('Auth refresh failed:', error);
      return false;
    }
  }, [authRefresh]);

  // Get headers with auth token
  const getAuthHeaders = useCallback(async () => {
    if (!accessToken) {
      const refreshed = await refreshAuth();
      if (!refreshed) {
        throw new Error('Authentication required');
      }
      // After refresh, we need to get the new token
      const newToken = localStorage.getItem('accessToken');
      return {
        'Authorization': `Bearer ${newToken}`,
        'Content-Type': 'application/json',
      };
    }
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }, [accessToken, refreshAuth]);

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
          appointment: msg.appointment,
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
        // console.error('Error loading chat:', error);
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
          // Handle token expiration gracefully
          if (response.status === 401) {
            // Try to refresh token before throwing error
            const refreshed = await refreshAuth();
            if (refreshed) {
              // Retry the request with new token
              const newHeaders = await getAuthHeaders();
              const retryResponse = await fetch('/api/chat?limit=20&sortBy=lastMessageAt&sortOrder=desc', {
                headers: newHeaders
              });
              
              if (retryResponse.ok) {
                const data = await retryResponse.json();
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
                  participantCount: chat.participants?.length || 0,
                }));
                
                setChats(transformedChats);
                return;
              }
            }
          }
          
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `Failed to load chats: ${response.status}`);
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
          participantCount: chat.participants?.length || 0,
        }));
        
        setChats(transformedChats);
      } catch (error) {
        // Don't log 401 errors as they're handled by token refresh
        if (!(error instanceof Error && error.message.includes('401'))) {
          // console.error('Error loading chats:', error);
        }
        setChatsError(error instanceof Error ? error.message : 'Failed to load chats');
        throw error;
      }
    };
    
    setLastAction(() => action);
    
    try {
      await action();
    } catch (error) {
      // Silently fail on initial load if it's a 401 error
      if (error instanceof Error && error.message.includes('401')) {
        // Clear the error after a short delay to avoid flash of error
        setTimeout(() => setChatsError(null), 100);
      }
    } finally {
      setIsLoadingChats(false);
    }
  }, [getAuthHeaders, refreshAuth]);

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
        // console.error('API error response:', errorData);
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
        appointment: newMessage.appointment,
      };
      
      setMessages(prev => [...prev, transformedMessage]);
      
    } catch (error) {
      // console.error('Error sending message:', error);
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


  // Clear errors
  const clearErrors = useCallback(() => {
    setChatError(null);
    setMessageError(null);
    setChatsError(null);
  }, []);

  // Calculate total unread count whenever chats change
  useEffect(() => {
    const total = chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
    setTotalUnreadCount(total);
  }, [chats]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      const timeoutId = setTimeout(async () => {
        if (chatId) {
          // Load both chat list and specific chat
          await loadChats();
          await loadChat(chatId);
        } else {
          await loadChats();
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [chatId, autoLoad, loadChat, loadChats]);

  // Polling refs
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chatListPollingRef = useRef<NodeJS.Timeout | null>(null);
  
  // Message polling for individual chat
  useEffect(() => {
    if (enablePolling && chatId && user) {
      const setupPolling = () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        
        pollingIntervalRef.current = setInterval(async () => {
          try {
            // Skip polling if user is not authenticated
            if (!user || !accessToken) {
              return;
            }
            
            const headers = await getAuthHeaders();
            
            // Simple polling - get latest messages and filter client-side
            const response = await fetch(`/api/chat/${chatId}/messages?limit=10`, { headers });
            
            if (response.ok) {
              const data = await response.json();
              const newMessages = data.data.messages || [];
              
              if (newMessages.length > 0) {
                // Filter out our own messages and duplicates
                const filteredMessages = newMessages.filter((msg: any) => 
                  msg.senderId !== user.id && 
                  !messages.some(existingMsg => existingMsg.id === msg.id)
                );
                
                if (filteredMessages.length > 0) {
                  const transformedMessages: Message[] = filteredMessages.map((msg: any) => ({
                    id: msg.id,
                    content: msg.content,
                    type: msg.type || 'TEXT',
                    chatId: msg.chatId,
                    senderId: msg.senderId,
                    isEdited: msg.isEdited || false,
                    sentAt: new Date(msg.sentAt),
                    sender: msg.sender,
                    appointment: msg.appointment,
                  }));
                  
                  setMessages(prev => [...prev, ...transformedMessages]);
                }
              }
            } else if (response.status === 422 || response.status === 401) {
              const refreshed = await refreshAuth();
              if (!refreshed) {
                if (pollingIntervalRef.current) {
                  clearInterval(pollingIntervalRef.current);
                  pollingIntervalRef.current = null;
                }
              }
            }
          } catch (error) {
            // console.error('Polling error:', error);
          }
        }, 5000); // Poll every 5 seconds
      };
      
      // Start polling after a delay
      setTimeout(setupPolling, 1000);
      
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    }
  }, [enablePolling, chatId, user, accessToken, getAuthHeaders, refreshAuth, messages]);

  // Chat list polling - runs when not in specific chat
  useEffect(() => {
    if (enablePolling && !chatId && user) {
      const setupChatListPolling = () => {
        if (chatListPollingRef.current) {
          clearInterval(chatListPollingRef.current);
        }
        
        chatListPollingRef.current = setInterval(async () => {
          try {
            // Skip polling if user is not authenticated
            if (!user || !accessToken) {
              return;
            }
            
            const headers = await getAuthHeaders();
            const response = await fetch('/api/chat?limit=20&sortBy=lastMessageAt&sortOrder=desc', {
              headers
            });
            
            if (response.ok) {
              const data = await response.json();
              const updatedChats = data.data.chats || [];
              
              // Compare with existing chats and update if there are changes
              const currentChatIds = chats.map(c => c.id).sort();
              const newChatIds = updatedChats.map((c: any) => c.id).sort();
              const chatsChanged = JSON.stringify(currentChatIds) !== JSON.stringify(newChatIds);
              
              // Check for unread count changes
              const unreadCountChanged = updatedChats.some((newChat: any) => {
                const existingChat = chats.find(c => c.id === newChat.id);
                return existingChat && existingChat.unreadCount !== (newChat.unreadCount || 0);
              });
              
              if (chatsChanged || unreadCountChanged) {
                const transformedChats: ChatListItem[] = updatedChats.map((chat: any) => ({
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
              }
              
            } else if (response.status === 422 || response.status === 401) {
              const refreshed = await refreshAuth();
              if (!refreshed) {
                if (chatListPollingRef.current) {
                  clearInterval(chatListPollingRef.current);
                  chatListPollingRef.current = null;
                }
              }
            }
          } catch (error) {
            // console.error('Chat list polling error:', error);
          }
        }, 10000); // Poll every 10 seconds for chat list
      };
      
      // Start chat list polling after a delay
      setTimeout(setupChatListPolling, 2000);
      
      return () => {
        if (chatListPollingRef.current) {
          clearInterval(chatListPollingRef.current);
          chatListPollingRef.current = null;
        }
      };
    }
  }, [enablePolling, chatId, user, accessToken, getAuthHeaders, refreshAuth, chats]);

  return {
    // Data
    chat,
    messages,
    chats,
    totalUnreadCount,
    
    // Loading states
    isLoadingChat,
    isLoadingMessages,
    isLoadingChats,
    
    // Error states
    chatError,
    messageError,
    chatsError,
    
    // Actions
    loadChat,
    loadChats,
    sendMessage,
    retryLastAction,
    
    // Utilities
    refreshAuth,
    clearErrors,
  };
}

export default useChat;