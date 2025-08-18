'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MoreVertical, Phone, Video, User, ExternalLink, Calendar, MapPin, Clock } from 'lucide-react';
import { Chat, Message, TypingIndicator } from '@/types/chat';
import { chat as chatTranslations, useLanguage, formatters } from '@/lib/translations';
import MessageBubble from './MessageBubble';
import MessageComposer from './MessageComposer';
import TypingIndicators from './TypingIndicators';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ConversationViewProps {
  chat: Chat | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  currentUserId: string;
  typingUsers: TypingIndicator[];
  onBack?: () => void;
  onSendMessage: (content: string, type?: Message['type']) => Promise<void>;
  onLoadMore?: () => void;
  onMarkAsRead?: () => void;
  onStartTyping?: () => void;
  onStopTyping?: () => void;
  hasMore?: boolean;
  isMobile?: boolean;
}

export default function ConversationView({
  chat,
  messages,
  isLoading,
  error,
  currentUserId,
  typingUsers,
  onBack,
  onSendMessage,
  onLoadMore,
  onMarkAsRead,
  onStartTyping,
  onStopTyping,
  hasMore = false,
  isMobile = false,
}: ConversationViewProps) {
  const language = useLanguage();
  const t = chatTranslations[language];
  
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const otherParticipant = chat?.participants?.find(
    p => p.userId !== currentUserId && p.isActive
  );

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, shouldAutoScroll]);

  // Mark as read when component mounts or chat changes
  useEffect(() => {
    if (chat && onMarkAsRead) {
      onMarkAsRead();
    }
  }, [chat?.id, onMarkAsRead]);

  // Handle scroll to check if user is at bottom
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldAutoScroll(isAtBottom);
    
    // Load more messages if near top
    if (scrollTop < 100 && hasMore && onLoadMore && !isLoading) {
      onLoadMore();
    }
  };

  const getOnlineStatus = () => {
    if (!otherParticipant) return null;
    
    const user = otherParticipant.user;
    if (!user.lastActive) return t.status.offline;
    
    const now = new Date();
    const lastActive = new Date(user.lastActive);
    const diffMs = now.getTime() - lastActive.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 5) return t.status.activeNow;
    if (diffMinutes < 60) {
      return t.status.lastSeen.replace('{time}', `${diffMinutes}m`);
    }
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return t.status.lastSeen.replace('{time}', `${diffHours}h`);
    }
    
    const diffDays = Math.floor(diffHours / 24);
    return t.status.lastSeen.replace('{time}', `${diffDays}d`);
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
              {otherParticipant?.user.profileImage ? (
                <img
                  src={otherParticipant.user.profileImage}
                  alt={otherParticipant.user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
              )}
              
              {otherParticipant?.user.isActive && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                {otherParticipant?.user.name || 'Unknown User'}
              </h2>
              <p className="text-sm text-gray-500 truncate">
                {getOnlineStatus()}
              </p>
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
        {chat.relatedPost && (
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
      </div>
      
      {/* Messages */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {/* Load more indicator */}
        {hasMore && (
          <div className="text-center py-2">
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <button
                onClick={onLoadMore}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {language === 'no' ? 'Last flere meldinger' : 'Load more messages'}
              </button>
            )}
          </div>
        )}
        
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
              key={message.id}
              message={message}
              isOwn={isOwn}
              showAvatar={showAvatar}
              showTimestamp={showTimestamp}
              language={language}
            />
          );
        })}
        
        {/* Typing indicators */}
        {typingUsers.length > 0 && (
          <TypingIndicators 
            typingUsers={typingUsers} 
            currentUserId={currentUserId}
            language={language}
          />
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Composer */}
      <MessageComposer
        onSendMessage={onSendMessage}
        onStartTyping={onStartTyping}
        onStopTyping={onStopTyping}
        language={language}
        disabled={!otherParticipant?.isActive}
      />
    </div>
  );
}