'use client';

import { useState, useEffect } from 'react';
import { X, MessageCircle, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { Chat, ChatListItem, Message, TypingIndicator } from '@/types/chat';
import { useLanguage, chat as chatTranslations } from '@/lib/translations';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { usePresence } from '@/hooks/usePresence';
import ChatRoomList from './ChatRoomList';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageComposer from './MessageComposer';
import TypingIndicators from './TypingIndicators';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ChatInterfaceProps {
  initialChatId?: string;
  onClose?: () => void;
  className?: string;
}

export default function ChatInterface({ 
  initialChatId, 
  onClose,
  className = '' 
}: ChatInterfaceProps) {
  const language = useLanguage();
  const t = chatTranslations[language];
  
  // Layout state
  const [selectedChatId, setSelectedChatId] = useState<string | null>(initialChatId || null);
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Real-time chat hook - only initialize when we have a selected chat
  const realtimeChat = useRealtimeChat(
    selectedChatId 
      ? {
          chatId: selectedChatId,
          enablePresence: true,
          enableTyping: true,
          enableOptimisticUpdates: true,
          enableReadReceipts: true,
          autoMarkAsRead: true,
        }
      : { chatId: '', enablePresence: false }
  );

  // For chat list management - we'll use a separate hook in the future
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [chatError, setChatError] = useState<string | null>(null);
  const [hasMoreChats, setHasMoreChats] = useState(false);
  
  // Message state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [selectedChat, setSelectedChat] = useState<ChatListItem | null>(null);

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

  // Initialize with specific chat if provided
  useEffect(() => {
    console.log('ChatInterface initializing with chatId:', initialChatId);
    if (initialChatId) {
      console.log('Loading specific chat:', initialChatId);
      setSelectedChatId(initialChatId);
      // Load the specific chat details
      loadSpecificChat(initialChatId);
    } else {
      console.log('Loading all chats');
      // Load all chats if no specific chat is provided
      loadAllChats();
    }
  }, [initialChatId]);

  // Load specific chat when coming from post detail
  const loadSpecificChat = async (chatId: string) => {
    console.log('loadSpecificChat called with chatId:', chatId);
    setIsLoadingChats(true);
    setIsLoadingMessages(true);
    
    try {
      // This would be a real API call to get chat details
      // For now, we'll create a mock chat based on the chatId
      const mockChat: ChatListItem = {
        id: chatId,
        relatedPostId: 'post-1',
        isActive: true,
        lastMessageAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        participants: [],
        unreadCount: 0,
        otherParticipant: {
          id: 'p1',
          chatId: chatId,
          userId: 'other-user',
          joinedAt: new Date(),
          isActive: true,
          unreadCount: 0,
          user: {
            id: 'other-user',
            name: 'Post Author',
            email: 'author@example.com',
            profileImage: undefined,
            isActive: true,
            lastActive: new Date(),
          }
        },
        displayName: 'Post Author',
        lastMessagePreview: 'Chat started',
        relatedPost: {
          id: 'post-1',
          title: 'Mathematics Tutoring',
          type: 'TEACHER',
          subject: 'math',
        }
      };
      
      setChats([mockChat]);
      setSelectedChat(mockChat);
      
      // Load messages for this chat
      await loadMessages(chatId);
      
    } catch (error) {
      console.error('Error loading specific chat:', error);
      setChatError('Failed to load chat');
    } finally {
      setIsLoadingChats(false);
      setIsLoadingMessages(false);
    }
  };

  // Mock data loading - replace with real API calls
  const loadAllChats = async () => {
    setIsLoadingChats(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockChats: ChatListItem[] = [
        {
          id: '1',
          relatedPostId: 'post-1',
          isActive: true,
          lastMessageAt: new Date('2024-01-15T14:30:00'),
          createdAt: new Date('2024-01-10T10:00:00'),
          updatedAt: new Date('2024-01-15T14:30:00'),
          participants: [],
          unreadCount: 2,
          otherParticipant: {
            id: 'p1',
            chatId: '1',
            userId: 'user-1',
            joinedAt: new Date(),
            isActive: true,
            unreadCount: 0,
            user: {
              id: 'user-1',
              name: 'Erik Hansen',
              email: 'erik@example.com',
              profileImage: undefined,
              isActive: true,
              lastActive: new Date(),
            }
          },
          displayName: 'Erik Hansen',
          displayImage: undefined,
          isOnline: true,
          lastSeenText: 'Aktiv nå',
          relatedPost: {
            id: 'post-1',
            title: 'Matematikk for videregående skole',
            type: 'TEACHER' as const,
            subject: 'Matematikk',
            hourlyRate: 450,
            user: {
              id: 'user-1',
              name: 'Erik Hansen',
              profileImage: undefined,
            }
          },
          lastMessage: {
            id: 'msg-1',
            content: 'Hei! Når passer det best for deg å ha en time?',
            type: 'TEXT' as const,
            chatId: '1',
            senderId: 'user-1',
            isEdited: false,
            sentAt: new Date('2024-01-15T14:30:00'),
            sender: {
              id: 'user-1',
              name: 'Erik Hansen',
              profileImage: undefined,
            }
          }
        },
        {
          id: '2',
          relatedPostId: 'post-2',
          isActive: true,
          lastMessageAt: new Date('2024-01-14T16:45:00'),
          createdAt: new Date('2024-01-12T09:00:00'),
          updatedAt: new Date('2024-01-14T16:45:00'),
          participants: [],
          unreadCount: 0,
          otherParticipant: {
            id: 'p2',
            chatId: '2',
            userId: 'user-2',
            joinedAt: new Date(),
            isActive: true,
            unreadCount: 0,
            user: {
              id: 'user-2',
              name: 'Maria Olsen',
              email: 'maria@example.com',
              profileImage: undefined,
              isActive: false,
              lastActive: new Date('2024-01-14T16:45:00'),
            }
          },
          displayName: 'Maria Olsen',
          displayImage: undefined,
          isOnline: false,
          lastSeenText: '2t siden',
          relatedPost: {
            id: 'post-2',
            title: 'Trenger hjelp med engelsk grammatikk',
            type: 'STUDENT' as const,
            subject: 'Engelsk',
            hourlyRate: undefined,
            user: {
              id: 'user-2',
              name: 'Maria Olsen',
              profileImage: undefined,
            }
          },
          lastMessage: {
            id: 'msg-2',
            content: 'Takk for hjelpen! Vi sees i morgen.',
            type: 'TEXT' as const,
            chatId: '2',
            senderId: 'user-2',
            isEdited: false,
            sentAt: new Date('2024-01-14T16:45:00'),
            sender: {
              id: 'user-2',
              name: 'Maria Olsen',
              profileImage: undefined,
            }
          }
        }
      ];
      
      setChats(mockChats);
      setIsLoadingChats(false);
    };

  // This useEffect has been moved to the initialization logic above

  const loadMessages = async (chatId: string) => {
    setIsLoadingMessages(true);
    setMessageError(null);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock messages
    const mockMessages: Message[] = [
      {
        id: 'msg-1',
        content: 'Hei! Jeg så annonsen din om matematikk-undervisning. Er du ledig for en time i week?',
        type: 'TEXT',
        chatId,
        senderId: 'current-user',
        isEdited: false,
        sentAt: new Date('2024-01-15T13:00:00'),
        sender: {
          id: 'current-user',
          name: 'Deg',
          profileImage: undefined,
        }
      },
      {
        id: 'msg-2',
        content: 'Hei! Ja, jeg har ledig tid. Når passer det best for deg?',
        type: 'TEXT',
        chatId,
        senderId: 'user-1',
        isEdited: false,
        sentAt: new Date('2024-01-15T13:15:00'),
        sender: {
          id: 'user-1',
          name: 'Erik Hansen',
          profileImage: undefined,
        }
      },
      {
        id: 'msg-3',
        content: 'Jeg kan i dag etter klokka 15:00, eller i morgen formiddag. Hva passer best for deg?',
        type: 'TEXT',
        chatId,
        senderId: 'current-user',
        isEdited: false,
        sentAt: new Date('2024-01-15T13:20:00'),
        sender: {
          id: 'current-user',
          name: 'Deg',
          profileImage: undefined,
        }
      }
    ];
    
    setMessages(mockMessages);
    setIsLoadingMessages(false);
  };

  // loadChatDetails is now handled in loadSpecificChat function

  // Event handlers
  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    
    // Hide sidebar on mobile
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  const handleBackToList = () => {
    setSelectedChatId(null);
    setShowSidebar(true);
    setSelectedChat(null);
    setMessages([]);
  };

  const handleSendMessage = async (content: string, type?: Message['type']) => {
    if (!selectedChatId || !realtimeChat) return;
    
    // Use the real-time chat hook to send the message
    await realtimeChat.sendMessage(content, { type });
  };

  const handleLoadMoreChats = () => {
    console.log('Load more chats');
  };

  const handleLoadMoreMessages = async () => {
    if (!realtimeChat || realtimeChat.isLoadingMessages) return;
    await realtimeChat.loadMoreMessages();
  };

  const handleSearchChats = (query: string) => {
    console.log('Search chats:', query);
  };

  const handleFilterChats = (filter: any) => {
    console.log('Filter chats:', filter);
  };

  const handleArchiveChat = (chatId: string) => {
    console.log('Archive chat:', chatId);
  };

  const handleDeleteChat = (chatId: string) => {
    console.log('Delete chat:', chatId);
  };

  const handlePinChat = (chatId: string) => {
    console.log('Pin chat:', chatId);
  };

  const handleRetry = () => {
    console.log('Retry loading');
  };

  const handleExploreContacts = () => {
    window.location.href = '/posts';
  };

  const handleMessageAction = (action: string, messageId: string) => {
    console.log('Message action:', action, messageId);
  };

  const handleRetryMessage = async (messageId: string) => {
    if (!realtimeChat) return;
    await realtimeChat.retryMessage(messageId);
  };

  const handleStartTyping = async () => {
    if (!realtimeChat) return;
    await realtimeChat.startTyping();
  };

  const handleStopTyping = async () => {
    if (!realtimeChat) return;
    await realtimeChat.stopTyping();
  };

  return (
    <div className={`flex h-full bg-gray-50 ${className}`}>
      {/* Chat List Sidebar */}
      <div className={`${
        isMobile 
          ? `fixed inset-y-0 left-0 z-40 w-full transform ${
              showSidebar ? 'translate-x-0' : '-translate-x-full'
            } transition-transform duration-300 ease-in-out`
          : 'w-80 flex-shrink-0'
      } ${!isMobile && !showSidebar ? 'hidden' : ''} bg-white border-r border-gray-200`}>
        
        <ChatRoomList
          chats={chats}
          isLoading={isLoadingChats}
          error={chatError}
          selectedChatId={selectedChatId || undefined}
          onSelectChat={handleSelectChat}
          onSearch={handleSearchChats}
          onFilter={handleFilterChats}
          hasMore={hasMoreChats}
          onLoadMore={handleLoadMoreChats}
          onArchiveChat={handleArchiveChat}
          onDeleteChat={handleDeleteChat}
          onPinChat={handlePinChat}
          onRetry={handleRetry}
          onExploreContacts={handleExploreContacts}
        />
      </div>

      {/* Conversation View */}
      <div className={`flex-1 flex flex-col ${isMobile && showSidebar ? 'hidden' : ''}`}>
        {selectedChatId && realtimeChat?.chat ? (
          <>
            {/* Connection Status Bar */}
            {(!realtimeChat.isConnected || realtimeChat.hasError) && (
              <div className={`px-4 py-2 text-sm flex items-center justify-center gap-2 ${
                realtimeChat.hasError 
                  ? 'bg-red-50 text-red-700 border-b border-red-200' 
                  : 'bg-orange-50 text-orange-700 border-b border-orange-200'
              }`}>
                {realtimeChat.hasError ? (
                  <>
                    <AlertTriangle className="h-4 w-4" />
                    <span>{language === 'no' ? 'Tilkoblingsfeil - prøver å koble til igjen...' : 'Connection error - reconnecting...'}</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 animate-pulse" />
                    <span>{language === 'no' ? 'Kobler til...' : 'Connecting...'}</span>
                  </>
                )}
              </div>
            )}

            {/* Chat Header with enhanced presence */}
            <ChatHeader
              chat={realtimeChat.chat}
              language={language}
              onBack={isMobile ? handleBackToList : undefined}
              onShowPostDetails={() => console.log('Show post details')}
              onArchiveChat={() => handleArchiveChat(selectedChatId)}
              onDeleteChat={() => handleDeleteChat(selectedChatId)}
              onBlockUser={() => console.log('Block user')}
              onReportUser={() => console.log('Report user')}
              onSettings={() => console.log('Settings')}
            />
            
            {/* Messages with real-time data */}
            <div className="flex-1 flex flex-col relative">
              <MessageList
                messages={realtimeChat.messages}
                currentUserId="current-user" // This should come from auth context
                language={language}
                isLoading={realtimeChat.messagesLoading}
                hasMore={realtimeChat.hasMoreMessages}
                typingUsers={realtimeChat.typingUsers}
                onLoadMore={handleLoadMoreMessages}
                onMessageAction={handleMessageAction}
                onRetryMessage={handleRetryMessage}
              />

              {/* Enhanced Typing Indicators */}
              {realtimeChat.typingUsers.length > 0 && (
                <div className="px-4 pb-2">
                  <TypingIndicators
                    typingUsers={realtimeChat.typingUsers}
                    currentUserId="current-user"
                    language={language}
                    showAvatars={true}
                    maxDisplayUsers={3}
                    autoHideDelay={5000}
                  />
                </div>
              )}
            </div>
            
            {/* Message Composer with connection status */}
            <MessageComposer
              onSendMessage={handleSendMessage}
              onStartTyping={handleStartTyping}
              onStopTyping={handleStopTyping}
              language={language}
              disabled={realtimeChat.messagesLoading || !realtimeChat.isConnected}
              placeholder={
                !realtimeChat.isConnected 
                  ? (language === 'no' ? 'Venter på tilkobling...' : 'Waiting for connection...')
                  : undefined
              }
            />
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {language === 'no' ? 'Velg en samtale' : 'Select a conversation'}
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                {language === 'no' 
                  ? 'Velg en samtale fra listen for å begynne å chatte, eller utforsk innlegg for å finne nye lærere og studenter.'
                  : 'Choose a conversation from the list to start chatting, or explore posts to find new teachers and students.'
                }
              </p>
              <button 
                onClick={handleExploreContacts}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {language === 'no' ? 'Utforsk innlegg' : 'Explore Posts'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile overlay when sidebar is open */}
      {isMobile && showSidebar && selectedChatId && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={handleBackToList}
        />
      )}

      {/* Close button for modal mode */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full z-50"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}