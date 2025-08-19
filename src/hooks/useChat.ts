import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { 
  ChatListItem, 
  Chat, 
  Message, 
  TypingIndicator, 
  ChatFilter,
  UseChatReturn,
  MessageStatus
} from '@/types/chat';
import { useLanguage } from '@/lib/translations';

interface UseChatOptions {
  enableRealtime?: boolean;
  enableTyping?: boolean;
  enablePresence?: boolean;
  autoMarkAsRead?: boolean;
}

interface ChatState {
  chats: ChatListItem[];
  selectedChat: Chat | null;
  messages: Message[];
  typingUsers: TypingIndicator[];
  onlineUsers: string[];
  unreadCount: number;
}

interface LoadingState {
  chatsLoading: boolean;
  messagesLoading: boolean;
  sendingMessage: boolean;
}

interface ErrorState {
  chatsError: string | null;
  messagesError: string | null;
  connectionError: string | null;
}

interface PaginationState {
  hasMoreChats: boolean;
  hasMoreMessages: boolean;
  chatsPage: number;
  messagesPage: number;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const { user, token } = useAuth();
  const language = useLanguage();
  
  const {
    enableRealtime = true,
    enableTyping = true,
    enablePresence = true,
    autoMarkAsRead = true,
  } = options;

  // State
  const [chatState, setChatState] = useState<ChatState>({
    chats: [],
    selectedChat: null,
    messages: [],
    typingUsers: [],
    onlineUsers: [],
    unreadCount: 0,
  });

  const [loadingState, setLoadingState] = useState<LoadingState>({
    chatsLoading: true,
    messagesLoading: false,
    sendingMessage: false,
  });

  const [errorState, setErrorState] = useState<ErrorState>({
    chatsError: null,
    messagesError: null,
    connectionError: null,
  });

  const [paginationState, setPaginationState] = useState<PaginationState>({
    hasMoreChats: false,
    hasMoreMessages: false,
    chatsPage: 1,
    messagesPage: 1,
  });

  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ChatFilter>({ type: 'all' });
  
  // Refs for cleanup
  const realtimeSubscription = useRef<any>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load chats
  const loadChats = useCallback(async (page = 1, append = false) => {
    if (!token || !user) return;

    try {
      setLoadingState(prev => ({ ...prev, chatsLoading: !append }));
      setErrorState(prev => ({ ...prev, chatsError: null }));

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search: searchQuery,
        filter: activeFilter.type,
      });

      const response = await fetch(`/api/chat?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load chats: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform chats to ChatListItem format
      const chatList: ChatListItem[] = data.data.chats.map((chat: Chat) => {
        const otherParticipant = chat.participants.find(
          p => p.userId !== user.id && p.isActive
        );
        
        if (!otherParticipant) {
          console.warn('Chat without other participant:', chat.id);
          return null;
        }

        const isOnline = otherParticipant.user.isActive && 
          otherParticipant.user.lastActive &&
          new Date().getTime() - new Date(otherParticipant.user.lastActive).getTime() < 300000; // 5 minutes
        
        let lastSeenText = '';
        if (otherParticipant.user.lastActive && !isOnline) {
          const diffMs = new Date().getTime() - new Date(otherParticipant.user.lastActive).getTime();
          const diffMinutes = Math.floor(diffMs / (1000 * 60));
          
          if (diffMinutes < 60) {
            lastSeenText = `${diffMinutes}m ${language === 'no' ? 'siden' : 'ago'}`;
          } else {
            const diffHours = Math.floor(diffMinutes / 60);
            if (diffHours < 24) {
              lastSeenText = `${diffHours}t ${language === 'no' ? 'siden' : 'ago'}`;
            } else {
              const diffDays = Math.floor(diffHours / 24);
              lastSeenText = `${diffDays}d ${language === 'no' ? 'siden' : 'ago'}`;
            }
          }
        } else if (isOnline) {
          lastSeenText = language === 'no' ? 'Aktiv nå' : 'Active now';
        }
        
        return {
          ...chat,
          otherParticipant,
          displayName: otherParticipant.user.name,
          displayImage: otherParticipant.user.profileImage,
          isOnline,
          lastSeenText,
          unreadCount: otherParticipant.unreadCount || 0,
        };
      }).filter(Boolean);
      
      setChatState(prev => ({
        ...prev,
        chats: append ? [...prev.chats, ...chatList] : chatList,
        unreadCount: chatList.reduce((sum, chat) => sum + chat.unreadCount, 0),
      }));
      
      setPaginationState(prev => ({
        ...prev,
        hasMoreChats: data.data.hasMore || false,
        chatsPage: page,
      }));
      
    } catch (error) {
      console.error('Failed to load chats:', error);
      setErrorState(prev => ({
        ...prev,
        chatsError: error instanceof Error ? error.message : 'Unknown error',
      }));
    } finally {
      setLoadingState(prev => ({ ...prev, chatsLoading: false }));
    }
  }, [token, user, searchQuery, activeFilter, language]);

  // Load chat details
  const loadChatDetails = useCallback(async (chatId: string) => {
    if (!token) return null;

    try {
      const response = await fetch(`/api/chat/${chatId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load chat details');
      }

      const data = await response.json();
      const chat = data.data.chat;
      
      setChatState(prev => ({ ...prev, selectedChat: chat }));
      return chat;
      
    } catch (error) {
      console.error('Failed to load chat details:', error);
      return null;
    }
  }, [token]);

  // Load messages
  const loadMessages = useCallback(async (chatId: string, page = 1, append = false) => {
    if (!token) return;

    try {
      if (!append) {
        setLoadingState(prev => ({ ...prev, messagesLoading: true }));
        setErrorState(prev => ({ ...prev, messagesError: null }));
      }

      const response = await fetch(`/api/chat/${chatId}/messages?page=${page}&limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json();
      
      setChatState(prev => ({
        ...prev,
        messages: append ? [...data.data.messages, ...prev.messages] : data.data.messages,
      }));
      
      setPaginationState(prev => ({
        ...prev,
        hasMoreMessages: data.data.hasMore || false,
        messagesPage: page,
      }));

      // Auto mark as read if enabled
      if (autoMarkAsRead && !append) {
        markAsRead(chatId);
      }
      
    } catch (error) {
      console.error('Failed to load messages:', error);
      setErrorState(prev => ({
        ...prev,
        messagesError: error instanceof Error ? error.message : 'Unknown error',
      }));
    } finally {
      setLoadingState(prev => ({ ...prev, messagesLoading: false }));
    }
  }, [token, autoMarkAsRead]);

  // Send message
  const sendMessage = useCallback(async (chatId: string, content: string, type: Message['type'] = 'TEXT'): Promise<Message | null> => {
    if (!token || !user || !content.trim()) return null;

    const tempId = `temp-${Date.now()}-${Math.random()}`;
    
    // Create optimistic message
    const optimisticMessage: Message = {
      id: tempId,
      content: content.trim(),
      type,
      chatId,
      senderId: user.id,
      isEdited: false,
      sentAt: new Date(),
      sender: {
        id: user.id,
        name: user.name,
        profileImage: user.profileImage,
      },
      status: 'sending',
      isOptimistic: true,
      tempId,
    };

    // Add optimistic message immediately
    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, optimisticMessage],
    }));

    try {
      setLoadingState(prev => ({ ...prev, sendingMessage: true }));

      const response = await fetch(`/api/chat/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: content.trim(),
          type,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      const sentMessage = data.data.message;
      
      // Replace optimistic message with real message
      setChatState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.tempId === tempId ? sentMessage : msg
        ),
        chats: prev.chats.map(chat => 
          chat.id === chatId 
            ? { ...chat, lastMessage: sentMessage, lastMessageAt: sentMessage.sentAt }
            : chat
        ),
      }));

      return sentMessage;
      
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Update optimistic message to failed state
      setChatState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.tempId === tempId 
            ? { ...msg, status: 'failed' as MessageStatus, error: error instanceof Error ? error.message : 'Failed to send' }
            : msg
        ),
      }));
      
      return null;
    } finally {
      setLoadingState(prev => ({ ...prev, sendingMessage: false }));
    }
  }, [token, user]);

  // Retry failed message
  const retryMessage = useCallback(async (messageId: string) => {
    const message = chatState.messages.find(m => m.id === messageId || m.tempId === messageId);
    if (!message || !chatState.selectedChat) return;

    await sendMessage(chatState.selectedChat.id, message.content, message.type);
    
    // Remove the failed message
    setChatState(prev => ({
      ...prev,
      messages: prev.messages.filter(m => m.id !== messageId && m.tempId !== messageId),
    }));
  }, [chatState.messages, chatState.selectedChat, sendMessage]);

  // Mark as read
  const markAsRead = useCallback(async (chatId: string) => {
    if (!token) return;

    try {
      await fetch(`/api/chat/${chatId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      // Update unread count in chat list
      setChatState(prev => ({
        ...prev,
        chats: prev.chats.map(chat => 
          chat.id === chatId 
            ? { ...chat, unreadCount: 0 }
            : chat
        ),
        unreadCount: prev.unreadCount - (prev.chats.find(c => c.id === chatId)?.unreadCount || 0),
      }));
      
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, [token]);

  // Search chats
  const searchChats = useCallback((query: string) => {
    setSearchQuery(query);
    // Reload chats with new search query
    loadChats(1, false);
  }, [loadChats]);

  // Filter chats
  const filterChats = useCallback((filter: ChatFilter) => {
    setActiveFilter(filter);
    // Reload chats with new filter
    loadChats(1, false);
  }, [loadChats]);

  // Load more chats
  const loadMoreChats = useCallback(() => {
    if (paginationState.hasMoreChats && !loadingState.chatsLoading) {
      loadChats(paginationState.chatsPage + 1, true);
    }
  }, [loadChats, paginationState.hasMoreChats, paginationState.chatsPage, loadingState.chatsLoading]);

  // Load more messages
  const loadMoreMessages = useCallback(() => {
    if (paginationState.hasMoreMessages && !loadingState.messagesLoading && chatState.selectedChat) {
      loadMessages(chatState.selectedChat.id, paginationState.messagesPage + 1, true);
    }
  }, [loadMessages, paginationState.hasMoreMessages, paginationState.messagesPage, loadingState.messagesLoading, chatState.selectedChat]);

  // Select chat
  const selectChat = useCallback(async (chatId: string) => {
    const chat = await loadChatDetails(chatId);
    if (chat) {
      await loadMessages(chatId);
    }
  }, [loadChatDetails, loadMessages]);

  // Refresh
  const refresh = useCallback(() => {
    loadChats(1, false);
    if (chatState.selectedChat) {
      loadMessages(chatState.selectedChat.id, 1, false);
    }
  }, [loadChats, loadMessages, chatState.selectedChat]);

  // Initialize
  useEffect(() => {
    if (user && token) {
      loadChats();
    }
  }, [user, token, loadChats]);

  // TODO: Setup real-time subscriptions
  useEffect(() => {
    if (!enableRealtime || !user) return;

    // Setup WebSocket or Supabase subscriptions here
    console.log('Setting up real-time subscriptions...');

    return () => {
      if (realtimeSubscription.current) {
        realtimeSubscription.current.unsubscribe();
      }
    };
  }, [enableRealtime, user]);

  return {
    // Data
    chats: chatState.chats,
    selectedChat: chatState.selectedChat,
    messages: chatState.messages,
    typingUsers: chatState.typingUsers,
    onlineUsers: chatState.onlineUsers,
    unreadCount: chatState.unreadCount,
    
    // Loading states
    isLoading: loadingState.chatsLoading || loadingState.messagesLoading,
    chatsLoading: loadingState.chatsLoading,
    messagesLoading: loadingState.messagesLoading,
    sendingMessage: loadingState.sendingMessage,
    
    // Error states
    error: errorState.chatsError || errorState.messagesError || errorState.connectionError,
    chatsError: errorState.chatsError,
    messagesError: errorState.messagesError,
    connectionError: errorState.connectionError,
    
    // Pagination
    hasMore: paginationState.hasMoreChats,
    hasMoreChats: paginationState.hasMoreChats,
    hasMoreMessages: paginationState.hasMoreMessages,
    
    // Actions
    loadChats: () => loadChats(1, false),
    selectChat,
    sendMessage,
    retryMessage,
    loadMore: loadMoreChats,
    loadMoreMessages,
    markAsRead,
    searchChats,
    filterChats,
    refresh,
    
    // Clear functions
    clearChatsError: () => setErrorState(prev => ({ ...prev, chatsError: null })),
    clearMessagesError: () => setErrorState(prev => ({ ...prev, messagesError: null })),
    clearConnectionError: () => setErrorState(prev => ({ ...prev, connectionError: null })),
  } as UseChatReturn;
}