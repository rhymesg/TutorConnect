'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Chat, ChatListItem, Message, TypingIndicator, ChatFilter } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';
import ChatRoomList from './ChatRoomList';
import ConversationView from './ConversationView';
import { chat as chatTranslations, useLanguage } from '@/lib/translations';

interface ChatLayoutProps {
  initialChatId?: string;
}

export default function ChatLayout({ initialChatId }: ChatLayoutProps) {
  const { user, isAuthenticated } = useAuth();
  const language = useLanguage();
  const t = chatTranslations[language];
  
  // Layout state
  const [selectedChatId, setSelectedChatId] = useState<string | null>(initialChatId || null);
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Chat data state
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  
  // Loading states
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);

  // Pagination
  const [hasMoreChats, setHasMoreChats] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setShowSidebar(!mobile || !selectedChatId);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [selectedChatId]);

  // Load chats on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      loadChats();
    }
  }, [isAuthenticated, user]);

  // Load selected chat messages
  useEffect(() => {
    if (selectedChatId) {
      loadChatDetails(selectedChatId);
      loadMessages(selectedChatId);
      
      // Hide sidebar on mobile when chat is selected
      if (isMobile) {
        setShowSidebar(false);
      }
    }
  }, [selectedChatId, isMobile]);

  const loadChats = async () => {
    try {
      setIsLoadingChats(true);
      setChatError(null);
      
      const response = await fetch('/api/chat', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load chats');
      }

      const data = await response.json();
      
      // Transform chats to ChatListItem format
      const chatList: ChatListItem[] = data.data.chats.map((chat: Chat) => {
        const otherParticipant = chat.participants.find(
          p => p.userId !== user?.id && p.isActive
        );
        
        const isOnline = otherParticipant?.user.isActive && 
          otherParticipant.user.lastActive &&
          new Date().getTime() - new Date(otherParticipant.user.lastActive).getTime() < 300000; // 5 minutes
        
        let lastSeenText = '';
        if (otherParticipant?.user.lastActive) {
          const diffMs = new Date().getTime() - new Date(otherParticipant.user.lastActive).getTime();
          const diffMinutes = Math.floor(diffMs / (1000 * 60));
          
          if (diffMinutes < 60) {
            lastSeenText = `${diffMinutes}m ${language === 'no' ? 'siden' : 'ago'}`;
          } else {
            const diffHours = Math.floor(diffMinutes / 60);
            lastSeenText = `${diffHours}h ${language === 'no' ? 'siden' : 'ago'}`;
          }
        }
        
        return {
          ...chat,
          otherParticipant: otherParticipant!,
          displayName: otherParticipant?.user.name || 'Unknown User',
          displayImage: otherParticipant?.user.profileImage,
          isOnline,
          lastSeenText,
          unreadCount: otherParticipant?.unreadCount || 0,
        };
      });
      
      setChats(chatList);
      setHasMoreChats(data.data.hasMore || false);
      
    } catch (error) {
      console.error('Failed to load chats:', error);
      setChatError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoadingChats(false);
    }
  };

  const loadChatDetails = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat/${chatId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load chat details');
      }

      const data = await response.json();
      setSelectedChat(data.data.chat);
      
    } catch (error) {
      console.error('Failed to load chat details:', error);
    }
  };

  const loadMessages = async (chatId: string, offset = 0) => {
    try {
      if (offset === 0) {
        setIsLoadingMessages(true);
        setMessageError(null);
      }
      
      const response = await fetch(`/api/chat/${chatId}/messages?limit=50&offset=${offset}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json();
      
      if (offset === 0) {
        setMessages(data.data.messages);
      } else {
        setMessages(prev => [...data.data.messages, ...prev]);
      }
      
      setHasMoreMessages(data.data.hasMore || false);
      
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessageError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
  };

  const handleBackToList = () => {
    setSelectedChatId(null);
    setShowSidebar(true);
    setSelectedChat(null);
    setMessages([]);
  };

  const handleSendMessage = async (content: string, type?: Message['type']) => {
    if (!selectedChatId || !user) return;
    
    try {
      const response = await fetch(`/api/chat/${selectedChatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          content,
          type: type || 'TEXT',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      const newMessage = data.data.message;
      
      // Add message to local state
      setMessages(prev => [...prev, newMessage]);
      
      // Update chat list with new last message
      setChats(prev => prev.map(chat => 
        chat.id === selectedChatId 
          ? { ...chat, lastMessage: newMessage, lastMessageAt: newMessage.sentAt }
          : chat
      ));
      
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  const handleSearchChats = (query: string) => {
    // TODO: Implement chat search
    console.log('Search chats:', query);
  };

  const handleFilterChats = (filter: ChatFilter) => {
    // TODO: Implement chat filtering
    console.log('Filter chats:', filter);
  };

  const handleMarkAsRead = async () => {
    if (!selectedChatId) return;
    
    try {
      await fetch(`/api/chat/${selectedChatId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      
      // Update unread count in chat list
      setChats(prev => prev.map(chat => 
        chat.id === selectedChatId 
          ? { ...chat, unreadCount: 0 }
          : chat
      ));
      
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleArchiveChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat/${chatId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ status: 'archived' }),
      });

      if (!response.ok) {
        throw new Error('Failed to archive chat');
      }

      // Update chat in local state
      setChats(prev => prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, isActive: false }
          : chat
      ));

      // If this was the selected chat, go back to list
      if (selectedChatId === chatId) {
        handleBackToList();
      }
      
    } catch (error) {
      console.error('Failed to archive chat:', error);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!confirm(language === 'no' ? 'Er du sikker på at du vil slette denne samtalen?' : 'Are you sure you want to delete this conversation?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/chat/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete chat');
      }

      // Remove chat from local state
      setChats(prev => prev.filter(chat => chat.id !== chatId));

      // If this was the selected chat, go back to list
      if (selectedChatId === chatId) {
        handleBackToList();
      }
      
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  const handlePinChat = async (chatId: string) => {
    try {
      // This would pin/unpin the chat - implementation depends on your backend
      console.log('Pin/unpin chat:', chatId);
      
    } catch (error) {
      console.error('Failed to pin chat:', error);
    }
  };

  const handleRetry = () => {
    loadChats();
  };

  const handleExploreContacts = () => {
    // Navigate to posts page
    window.location.href = '/posts';
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {language === 'no' ? 'Logg inn for å se meldinger' : 'Sign in to view messages'}
          </h3>
          <p className="text-gray-500">
            {language === 'no' 
              ? 'Du må være logget inn for å kunne chatte'
              : 'You need to be signed in to chat'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Chat List Sidebar */}
      <div className={`${
        isMobile 
          ? `fixed inset-y-0 left-0 z-40 w-full transform ${showSidebar ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`
          : 'w-80 flex-shrink-0'
      } ${!isMobile && !showSidebar ? 'hidden' : ''}`}>
        {isMobile && !showSidebar && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setShowSidebar(false)}
          />
        )}
        
        <ChatRoomList
          chats={chats}
          isLoading={isLoadingChats}
          error={chatError}
          selectedChatId={selectedChatId || undefined}
          onSelectChat={handleSelectChat}
          onSearch={handleSearchChats}
          onFilter={handleFilterChats}
          hasMore={hasMoreChats}
          onLoadMore={loadChats}
          onArchiveChat={handleArchiveChat}
          onDeleteChat={handleDeleteChat}
          onPinChat={handlePinChat}
          onRetry={handleRetry}
          onExploreContacts={handleExploreContacts}
        />
      </div>

      {/* Conversation View */}
      <div className={`flex-1 ${isMobile && showSidebar ? 'hidden' : 'flex'}`}>
        <ConversationView
          chat={selectedChat}
          messages={messages}
          isLoading={isLoadingMessages}
          error={messageError}
          currentUserId={user?.id || ''}
          typingUsers={typingUsers}
          onBack={isMobile ? handleBackToList : undefined}
          onSendMessage={handleSendMessage}
          onLoadMore={() => selectedChatId && loadMessages(selectedChatId, messages.length)}
          onMarkAsRead={handleMarkAsRead}
          hasMore={hasMoreMessages}
          isMobile={isMobile}
        />
      </div>

      {/* Mobile overlay when sidebar is open */}
      {isMobile && showSidebar && selectedChatId && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={handleBackToList}
        />
      )}
    </div>
  );
}