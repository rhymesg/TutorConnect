'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MoreVertical, Phone, Video, User, ExternalLink, Wifi, WifiOff, Activity } from 'lucide-react';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { useUserPresence } from '@/hooks/useUserPresence';
import { chat as chatTranslations, useLanguage, formatters } from '@/lib/translations';
import MessageBubble from './MessageBubble';
import MessageComposer from './MessageComposer';
import TypingIndicators from './TypingIndicators';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ConversationViewProps {
  chatId: string;
  currentUserId: string;
  onBack?: () => void;
  isMobile?: boolean;
  enablePresence?: boolean;
  enableTyping?: boolean;
  enableOptimistic?: boolean;
}

export default function ConversationView({
  chatId,
  currentUserId,
  onBack,
  isMobile = false,
  enablePresence = true,
  enableTyping = true,
  enableOptimistic = true,
}: ConversationViewProps) {
  const language = useLanguage();
  const t = chatTranslations[language];
  
  // Real-time chat hook
  const {
    chat,
    participants,
    loading: chatLoading,
    error: chatError,
    isConnected,
    messages,
    messagesLoading,
    messagesError,
    sendMessage,
    loadMoreMessages,
    markAsRead,
    startTyping,
    stopTyping,
    typingUsers,
    onlineUsers,
    statistics,
    addEventListener,
    formatTime,
    formatLastSeen,
  } = useRealtimeChat({
    chatId,
    enablePresence,
    enableTyping,
    autoSubscribe: true,
  });

  // User presence hook for global presence tracking
  const {
    getUserPresence,
    isUserOnline,
    formatLastSeen: formatUserLastSeen,
    getStatusColor,
  } = useUserPresence({ globalPresence: true });
  
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Error state (combine chat and message errors)
  const error = chatError || messagesError;
  const isLoading = chatLoading || messagesLoading;

  const otherParticipant = participants.find(
    p => p.userId !== currentUserId && p.isActive
  );

  // Get detailed presence info for the other participant
  const otherUserPresence = otherParticipant ? getUserPresence(otherParticipant.userId) : null;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, shouldAutoScroll]);

  // Mark as read when component mounts or chat changes
  useEffect(() => {
    if (chatId) {
      markAsRead();
    }
  }, [chatId, markAsRead]);

  // Setup chat event listeners
  useEffect(() => {
    const removeListener = addEventListener((event) => {
      switch (event.type) {
        case 'participant_joined':
          console.log(`${event.participant.name} joined the chat`);
          break;
        case 'participant_left':
          console.log('Participant left the chat');
          break;
        case 'appointment_created':
          // Handle appointment notifications
          break;
      }
    });

    return removeListener;
  }, [addEventListener]);

  // Handle scroll to check if user is at bottom
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldAutoScroll(isAtBottom);
    
    // Load more messages if near top
    if (scrollTop < 100 && !isLoading) {
      loadMoreMessages();
    }
  };

  // Handle message sending
  const handleSendMessage = async (content: string, type: 'TEXT' | 'APPOINTMENT_REQUEST' | 'APPOINTMENT_RESPONSE' | 'SYSTEM_MESSAGE' = 'TEXT') => {
    try {
      await sendMessage(content, type);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const getOnlineStatus = () => {
    if (!otherParticipant) return null;
    
    // Use real-time presence data if available
    if (otherUserPresence) {
      if (otherUserPresence.status === 'online') {
        return t.status.activeNow;
      } else if (otherUserPresence.status === 'away') {
        return language === 'no' ? 'Borte' : 'Away';
      } else if (otherUserPresence.status === 'busy') {
        return language === 'no' ? 'Opptatt' : 'Busy';
      }
      
      return formatUserLastSeen(otherUserPresence.lastSeen);
    }
    
    // Fallback to participant data
    if (otherParticipant.isOnline) {
      return t.status.activeNow;
    }
    
    if (otherParticipant.lastSeen) {
      return formatLastSeen(otherParticipant.lastSeen);
    }
    
    return t.status.offline;
  };

  const getStatusIndicator = () => {
    if (!otherParticipant) return null;
    
    if (otherUserPresence) {
      const colorClass = getStatusColor(otherUserPresence.status);
      return <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${colorClass} border-2 border-white rounded-full`} />;
    }
    
    if (otherParticipant.isOnline) {
      return <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />;
    }
    
    return null;
  };

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {language === 'no' ? 'Velg en samtale' : 'Select a conversation'}
          </h3>
          <p className="text-gray-500">
            {language === 'no' 
              ? 'Velg en samtale fra listen for å begynne å chatte'
              : 'Choose a conversation from the list to start chatting'
            }
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t.errors.loadFailed}
          </h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {t.errors.tryAgain || 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isMobile && onBack && (
              <button
                onClick={onBack}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            
            {/* Avatar */}
            <div className="relative">
              {otherParticipant?.profileImage ? (
                <img
                  src={otherParticipant.profileImage}
                  alt={otherParticipant.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
              )}
              
              {getStatusIndicator()}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900 truncate">
                  {otherParticipant?.name || 'Unknown User'}
                </h2>
                {otherParticipant?.isTyping && (
                  <div className="flex items-center gap-1 text-blue-600">
                    <Activity className="h-3 w-3 animate-pulse" />
                    <span className="text-xs font-medium">
                      {language === 'no' ? 'skriver...' : 'typing...'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-500 truncate">
                  {getOnlineStatus()}
                </p>
                {!isConnected && (
                  <div className="flex items-center gap-1 text-red-500">
                    <WifiOff className="h-3 w-3" />
                    <span className="text-xs">
                      {language === 'no' ? 'Frakoblet' : 'Disconnected'}
                    </span>
                  </div>
                )}
                {isConnected && (
                  <Wifi className="h-3 w-3 text-green-500" />
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <Phone className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <Video className="h-5 w-5" />
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 rounded-t-lg">
                    {t.conversation.viewProfile}
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50">
                    {t.conversation.muteNotifications}
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-red-600 rounded-b-lg">
                    {t.conversation.blockUser}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Related Post Info */}
        {chat?.relatedPost && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                chat.relatedPost.type === 'TEACHER' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {chat.relatedPost.type === 'TEACHER' 
                  ? (language === 'no' ? 'Lærer' : 'Teacher')
                  : (language === 'no' ? 'Student' : 'Student')
                }
              </div>
              <span className="text-sm text-gray-600">{t.post.relatedTo}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">
                  {chat.relatedPost.title}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span>{chat.relatedPost.subject}</span>
                  {chat.relatedPost.hourlyRate && (
                    <span>{formatters.currency(chat.relatedPost.hourlyRate)}/t</span>
                  )}
                </div>
              </div>
              
              <button className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700">
                <ExternalLink className="h-3 w-3" />
                {t.post.viewPost}
              </button>
            </div>
          </div>
        )}
        
        {/* Chat Statistics */}
        {statistics && (
          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
            <span>{statistics.totalMessages} {language === 'no' ? 'meldinger' : 'messages'}</span>
            <span>{statistics.activeParticipants} {language === 'no' ? 'aktive' : 'active'}</span>
            {statistics.lastActivity && (
              <span>
                {language === 'no' ? 'Sist aktiv' : 'Last active'}: {formatTime(statistics.lastActivity)}
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Messages */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {/* Load more indicator */}
        <div className="text-center py-2">
          {isLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <button
              onClick={loadMoreMessages}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {language === 'no' ? 'Last flere meldinger' : 'Load more messages'}
            </button>
          )}
        </div>
        
        {/* Messages */}
        {messages.map((message, index) => {
          const isOwn = message.senderId === currentUserId;
          const showAvatar = !isOwn && (
            index === 0 || 
            messages[index - 1]?.senderId !== message.senderId ||
            new Date(message.sentAt).getTime() - new Date(messages[index - 1]?.sentAt || 0).getTime() > 300000 // 5 minutes
          );
          const showTimestamp = (
            index === messages.length - 1 ||
            messages[index + 1]?.senderId !== message.senderId ||
            new Date(messages[index + 1]?.sentAt || 0).getTime() - new Date(message.sentAt).getTime() > 300000 // 5 minutes
          );

          return (
            <MessageBubble
              key={message.id || message.tempId}
              message={message}
              isOwn={isOwn}
              showAvatar={showAvatar}
              showTimestamp={showTimestamp}
              language={language}
              status={message.status}
              isOptimistic={message.isOptimistic}
              error={message.error}
              onRetry={() => retryMessage(message.id || message.tempId!)}
            />
          );
        })}        
        
        {/* Typing indicators */}
        {typingUsers.length > 0 && (
          <TypingIndicators 
            typingUsers={typingUsers.map(user => ({
              userId: user.userId,
              userName: user.name,
              timestamp: Date.now(),
            }))} 
            currentUserId={currentUserId}
            language={language}
          />
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Composer */}
      <MessageComposer
        onSendMessage={handleSendMessage}
        onStartTyping={startTyping}
        onStopTyping={stopTyping}
        language={language}
        disabled={!otherParticipant?.isActive || !isConnected}
        placeholder={!isConnected 
          ? (language === 'no' ? 'Kobler til...' : 'Connecting...')
          : undefined
        }
      />
    </div>
  );
}