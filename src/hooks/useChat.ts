'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Chat, ChatListItem, Message } from '@/types/chat';
import { createClient, subscribeToChat } from '@/lib/supabase-client';

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
  totalUnreadCount: number;
  
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
        }));
        
        setChat(transformedChat);
        setMessages(transformedMessages);
        lastMessageCountRef.current = transformedMessages.length;
        
        // Update last message time for polling optimization
        if (transformedMessages.length > 0) {
          const lastMessage = transformedMessages[transformedMessages.length - 1];
          lastMessageTimeRef.current = lastMessage.sentAt.toISOString();
        }
        
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
    if (!enableTyping || !chatId || !user || !supabaseRef.current) return;
    
    try {
      await supabaseRef.current
        .channel(`typing:${chatId}`)
        .send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            userId: user.id,
            userName: user.name,
            isTyping: true,
            timestamp: Date.now(),
          },
        });
    } catch (error) {
      console.error('Failed to start typing:', error);
    }
  }, [enableTyping, chatId, user]);

  // Stop typing indicator
  const stopTyping = useCallback(async () => {
    if (!enableTyping || !chatId || !user || !supabaseRef.current) return;
    
    try {
      await supabaseRef.current
        .channel(`typing:${chatId}`)
        .send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            userId: user.id,
            userName: user.name,
            isTyping: false,
            timestamp: Date.now(),
          },
        });
    } catch (error) {
      console.error('Failed to stop typing:', error);
    }
  }, [enableTyping, chatId, user]);

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
      const timeoutId = setTimeout(() => {
        if (chatId) {
          loadChat(chatId);
        } else {
          loadChats();
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [chatId, autoLoad, loadChat, loadChats]);

  // Real-time connection
  const channelRef = useRef<any>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const lastMessageCountRef = useRef<number>(0);
  const lastMessageTimeRef = useRef<string | null>(null);
  const chatListPollingRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (enableRealtime && chatId && user) {
      // Create a new Supabase client instance for real-time
      if (!supabaseRef.current) {
        supabaseRef.current = createClient();
      }
      // Set up real-time subscription
      const handleNewMessage = async (payload: any) => {
        console.log('New message received:', payload);
        console.log('Payload details:', {
          chatId: payload.new?.chatId,
          senderId: payload.new?.senderId,
          currentChatId: chatId,
          currentUserId: user.id
        });
        
        // Don't add our own messages (they're already added optimistically)
        if (payload.new.senderId === user.id) {
          console.log('Skipping own message');
          return;
        }
        
        try {
          // Fetch the complete message with sender info from API
          const headers = await getAuthHeaders();
          const response = await fetch(`/api/chat/${chatId}/messages?limit=20`, {
            headers
          });
          
          if (response.ok) {
            const data = await response.json();
            const messages = data.data.messages || [];
            
            // Find the new message in the response
            const messageWithSender = messages.find((m: any) => m.id === payload.new.id);
            
            if (messageWithSender) {
              // Transform the new message with full sender info
              const newMessage: Message = {
                id: messageWithSender.id,
                content: messageWithSender.content,
                type: messageWithSender.type || 'TEXT',
                chatId: messageWithSender.chatId,
                senderId: messageWithSender.senderId,
                isEdited: messageWithSender.isEdited || false,
                sentAt: new Date(messageWithSender.sentAt),
                sender: messageWithSender.sender,
              };
              
              // Add the new message to the list
              setMessages(prev => [...prev, newMessage]);
              
              // Update the chat's last message in the chat list
              setChats(prev => prev.map(chat => {
                if (chat.id === chatId) {
                  return {
                    ...chat,
                    lastMessage: newMessage,
                    lastMessageAt: new Date(messageWithSender.sentAt),
                    unreadCount: chat.unreadCount + 1,
                  };
                }
                return chat;
              }));
              
              return;
            }
          }
        } catch (error) {
          console.error('Failed to fetch message details:', error);
        }
        
        // Fallback: Use basic info from payload if API call fails
        const newMessage: Message = {
          id: payload.new.id,
          content: payload.new.content,
          type: payload.new.type || 'TEXT',
          chatId: payload.new.chatId,
          senderId: payload.new.senderId,
          isEdited: payload.new.isEdited || false,
          sentAt: new Date(payload.new.sentAt),
          sender: { 
            id: payload.new.senderId, 
            name: 'User',
            profileImage: null 
          },
        };
        
        // Add the new message to the list
        setMessages(prev => [...prev, newMessage]);
        
        // Update the chat's last message in the chat list
        setChats(prev => prev.map(chat => {
          if (chat.id === chatId) {
            return {
              ...chat,
              lastMessage: newMessage,
              lastMessageAt: new Date(payload.new.sentAt),
              unreadCount: chat.unreadCount + 1,
            };
          }
          return chat;
        }));
      };
      
      const handleMessageUpdate = (payload: any) => {
        console.log('Message updated:', payload);
        setMessages(prev => prev.map(msg => 
          msg.id === payload.new.id 
            ? { ...msg, content: payload.new.content, isEdited: true }
            : msg
        ));
      };
      
      const handleMessageDelete = (payload: any) => {
        console.log('Message deleted:', payload);
        setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
      };
      
      // Subscribe to chat messages
      console.log('Setting up real-time subscription for chat:', chatId);
      
      const setupSubscription = async () => {
        try {
          const channel = await subscribeToChat(
            supabaseRef.current!,
            chatId,
            handleNewMessage,
            handleMessageUpdate,
            handleMessageDelete
          );
          
          channelRef.current = channel;
          
          // Enhanced system event logging
          channel.on('system', {}, (payload: any) => {
            console.log('Supabase system event:', payload);
            if (payload.type === 'system') {
              console.log('System message details:', payload);
            }
          });
          
          // Listen for subscription status changes
          channel.on('broadcast', { event: 'connection' }, (payload: any) => {
            console.log('Connection status:', payload);
            setIsConnected(payload.connected || false);
          });
          
          console.log('Real-time subscription established for chatId:', chatId);
          console.log('Channel state:', channel.state);
        } catch (error) {
          console.error('Failed to setup real-time subscription:', error);
        }
      };
      
      setupSubscription();
      
      // Fallback: Set up polling as backup for real-time
      const setupPolling = () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        
        pollingIntervalRef.current = setInterval(async () => {
          try {
            // Skip polling if user is not authenticated
            if (!user || !accessToken) {
              console.log('Skipping poll - no user or token');
              return;
            }
            
            const headers = await getAuthHeaders();
            
            // Simple polling - get latest messages and filter client-side
            const response = await fetch(`/api/chat/${chatId}/messages?limit=10`, { headers });
            
            if (response.ok) {
              const data = await response.json();
              const newMessages = data.data.messages || [];
              
              if (newMessages.length > 0) {
                console.log('Polling detected', newMessages.length, 'new messages');
                
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
                  }));
                  
                  setMessages(prev => [...prev, ...transformedMessages]);
                  
                  // Update last message time
                  const latestMessage = transformedMessages[transformedMessages.length - 1];
                  lastMessageTimeRef.current = latestMessage.sentAt.toISOString();
                }
              }
            } else if (response.status === 422 || response.status === 401) {
              console.log('Auth error in polling, attempting refresh...');
              const refreshed = await refreshAuth();
              if (!refreshed) {
                console.log('Auth refresh failed, stopping polling');
                if (pollingIntervalRef.current) {
                  clearInterval(pollingIntervalRef.current);
                  pollingIntervalRef.current = null;
                }
              }
            } else {
              console.log('Polling response not ok:', response.status, response.statusText);
            }
          } catch (error) {
            console.error('Polling error:', error);
            // Don't stop polling on network errors, just log them
          }
        }, 5000); // Poll every 5 seconds - good balance between real-time feel and server load
      };
      
      // Enable safe polling every 5 seconds
      setTimeout(setupPolling, 3000);
      
      // Subscribe to typing indicators if enabled
      let typingChannel: any = null;
      if (enableTyping) {
        typingChannel = supabaseRef.current!
          .channel(`typing:${chatId}`)
          .on('broadcast', { event: 'typing' }, (payload) => {
            console.log('Typing event:', payload);
            
            // Don't show our own typing
            if (payload.payload.userId === user.id) {
              return;
            }
            
            if (payload.payload.isTyping) {
              // Add user to typing list
              setTypingUsers(prev => {
                if (!prev.includes(payload.payload.userName)) {
                  return [...prev, payload.payload.userName];
                }
                return prev;
              });
              
              // Remove after 3 seconds
              setTimeout(() => {
                setTypingUsers(prev => prev.filter(name => name !== payload.payload.userName));
              }, 3000);
            } else {
              // Remove user from typing list
              setTypingUsers(prev => prev.filter(name => name !== payload.payload.userName));
            }
          })
          .subscribe();
      }
      
      setIsConnected(true);
      
      return () => {
        // Clean up Supabase channels
        if (channelRef.current && supabaseRef.current) {
          supabaseRef.current.removeChannel(channelRef.current);
          channelRef.current = null;
        }
        if (typingChannel && supabaseRef.current) {
          supabaseRef.current.removeChannel(typingChannel);
        }
        
        // Clean up polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        setIsConnected(false);
        setTypingUsers([]);
      };
    }
  }, [enableRealtime, chatId, user, enableTyping, getAuthHeaders]);

  // Chat list polling - runs when not in specific chat
  useEffect(() => {
    if (enableRealtime && !chatId && user) {
      console.log('Setting up chat list polling...');
      
      const setupChatListPolling = () => {
        if (chatListPollingRef.current) {
          clearInterval(chatListPollingRef.current);
        }
        
        chatListPollingRef.current = setInterval(async () => {
          try {
            // Skip polling if user is not authenticated
            if (!user || !accessToken) {
              console.log('Skipping chat list poll - no user or token');
              return;
            }
            
            console.log('Polling chat list for unread counts...');
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
                console.log('Chat list updated - new messages or chats detected');
                
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
              console.log('Auth error in chat list polling, attempting refresh...');
              const refreshed = await refreshAuth();
              if (!refreshed) {
                console.log('Auth refresh failed, stopping chat list polling');
                if (chatListPollingRef.current) {
                  clearInterval(chatListPollingRef.current);
                  chatListPollingRef.current = null;
                }
              }
            } else {
              console.log('Chat list polling response not ok:', response.status);
            }
          } catch (error) {
            console.error('Chat list polling error:', error);
          }
        }, 10000); // Poll every 10 seconds for chat list (less frequent than individual chat)
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
  }, [enableRealtime, chatId, user, accessToken, getAuthHeaders, refreshAuth, chats]);

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