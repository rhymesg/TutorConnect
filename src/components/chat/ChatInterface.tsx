'use client';

import { useState, useEffect } from 'react';
import { X, MessageCircle } from 'lucide-react';
import { useLanguage, chat as chatTranslations } from '@/lib/translations';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import ChatRoomList from './ChatRoomList';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageComposer from './MessageComposer';
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
  const { user } = useAuth();
  
  // Layout state
  const [selectedChatId, setSelectedChatId] = useState<string | null>(initialChatId || null);
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Use centralized chat hook
  const {
    chat,
    messages,
    chats,
    totalUnreadCount,
    isLoadingChat,
    isLoadingMessages,
    isLoadingChats,
    chatError,
    messageError,
    chatsError,
    loadChat,
    loadChats,
    sendMessage,
    clearErrors,
  } = useChat({
    chatId: selectedChatId || undefined,
    autoLoad: true,
    enablePolling: true, // Enable polling for updates
  });

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
    if (initialChatId && initialChatId !== selectedChatId) {
      setSelectedChatId(initialChatId);
    }
  }, [initialChatId, selectedChatId]);

  // Event handlers
  const handleSelectChat = (chatId: string) => {
    if (chatId !== selectedChatId) {
      setSelectedChatId(chatId);
      clearErrors(); // Clear any previous errors
    }
    
    // Hide sidebar on mobile
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  const handleBackToList = () => {
    setSelectedChatId(null);
    setShowSidebar(true);
  };

  const handleSendMessage = async (content: string, type?: Message['type']) => {
    if (!selectedChatId) {
      return;
    }
    
    try {
      await sendMessage(content, type || 'TEXT');
    } catch (error) {
      console.error('Failed to send message:', error);
      // Error is already handled in the useChat hook
    }
  };

  const handleLoadMoreChats = () => {
    console.log('Load more chats - TODO');
  };

  const handleLoadMoreMessages = () => {
    console.log('Load more messages - TODO');
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

  const handleRetry = async () => {
    if (selectedChatId) {
      await loadChat(selectedChatId);
    } else {
      await loadChats();
    }
  };

  const handleExploreContacts = () => {
    window.location.href = '/posts';
  };

  const handleMessageAction = (action: string, messageId: string) => {
    console.log('Message action:', action, messageId);
  };

  const handleRetryMessage = (messageId: string) => {
    console.log('Retry message:', messageId);
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
          error={chatsError}
          selectedChatId={selectedChatId || undefined}
          isLoadingChat={isLoadingChat}
          onSelectChat={handleSelectChat}
          onSearch={handleSearchChats}
          onFilter={handleFilterChats}
          hasMore={false} // TODO: Implement pagination
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
        {selectedChatId && chat ? (
          <>
            {/* Error display */}
            {(chatError || messageError) && (
              <div className="px-4 py-2 text-sm flex items-center justify-center gap-2 bg-red-50 text-red-700 border-b border-red-200">
                <span>{chatError || messageError}</span>
                <button 
                  onClick={() => {
                    clearErrors();
                    if (selectedChatId) {
                      handleRetry();
                    }
                  }}
                  className="ml-2 text-xs underline hover:no-underline"
                >
                  {language === 'no' ? 'Lukk' : 'Close'}
                </button>
              </div>
            )}

            {/* Chat Header */}
            <ChatHeader
              chat={chat}
              language={language}
              onBack={isMobile ? handleBackToList : undefined}
              onShowPostDetails={() => console.log('Show post details')}
              onArchiveChat={() => handleArchiveChat(selectedChatId)}
              onDeleteChat={() => handleDeleteChat(selectedChatId)}
              onBlockUser={() => console.log('Block user')}
              onReportUser={() => console.log('Report user')}
              onSettings={() => console.log('Settings')}
            />
            
            {/* Messages */}
            <div className="flex-1 flex flex-col relative">
              <MessageList
                messages={messages}
                currentUserId={user?.id || ""}
                language={language}
                isLoading={isLoadingMessages}
                hasMore={false} // TODO: Implement pagination
                typingUsers={[]}
                onLoadMore={handleLoadMoreMessages}
                onMessageAction={handleMessageAction}
                onRetryMessage={handleRetryMessage}
              />
            </div>
            
            {/* Message Composer */}
            <MessageComposer
              onSendMessage={handleSendMessage}
              language={language}
              disabled={false}
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