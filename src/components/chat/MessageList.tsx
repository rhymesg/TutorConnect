'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { Message, TypingIndicator } from '@/types/chat';
import { Language, chat as chatTranslations } from '@/lib/translations';
import MessageBubble from './MessageBubble';
import TypingIndicators from './TypingIndicators';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  language: Language;
  isLoading?: boolean;
  hasMore?: boolean;
  typingUsers?: TypingIndicator[];
  onLoadMore?: () => void;
  onMessageAction?: (action: string, messageId: string) => void;
  onRetryMessage?: (messageId: string) => void;
  onViewAppointment?: (messageId: string) => void;
  className?: string;
}

export default function MessageList({
  messages,
  currentUserId,
  language,
  isLoading = false,
  hasMore = false,
  typingUsers = [],
  onLoadMore,
  onMessageAction,
  onRetryMessage,
  onViewAppointment,
  className = '',
}: MessageListProps) {
  const t = chatTranslations[language];
  
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current && messages.length > lastMessageCount) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    setLastMessageCount(messages.length);
  }, [messages, shouldAutoScroll, lastMessageCount]);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    // Show/hide scroll to bottom button
    setShowScrollButton(!isAtBottom && scrollHeight > clientHeight);
    
    // Auto-scroll behavior
    setShouldAutoScroll(isAtBottom);
    
    // Load more messages if near top and has more
    if (scrollTop < 200 && hasMore && !isLoading && onLoadMore) {
      onLoadMore();
    }
  }, [hasMore, isLoading, onLoadMore]);

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setShouldAutoScroll(true);
    }
  };

  // Message grouping logic
  const getMessageGroups = () => {
    const groups: Array<{
      date: string;
      messages: Array<Message & {
        showAvatar: boolean;
        showTimestamp: boolean;
      }>;
    }> = [];

    let currentGroup: typeof groups[0] | null = null;
    
    messages.forEach((message, index) => {
      const messageDate = new Date(message.sentAt);
      const dateString = messageDate.toDateString();
      
      // Start new group if date changed
      if (!currentGroup || currentGroup.date !== dateString) {
        currentGroup = {
          date: dateString,
          messages: [],
        };
        groups.push(currentGroup);
      }
      
      // Determine if we should show avatar and timestamp
      const isOwn = message.senderId === currentUserId;
      const prevMessage = index > 0 ? messages[index - 1] : null;
      const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
      
      const showAvatar = !isOwn && (
        !prevMessage || 
        prevMessage.senderId !== message.senderId ||
        new Date(message.sentAt).getTime() - new Date(prevMessage.sentAt).getTime() > 300000 // 5 minutes
      );
      
      const showTimestamp = (
        !nextMessage ||
        nextMessage.senderId !== message.senderId ||
        new Date(nextMessage.sentAt).getTime() - new Date(message.sentAt).getTime() > 300000 // 5 minutes
      );
      
      currentGroup.messages.push({
        ...message,
        showAvatar,
        showTimestamp,
      });
    });
    
    return groups;
  };

  // Format date for group headers
  const formatGroupDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return language === 'no' ? 'I dag' : 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return language === 'no' ? 'I går' : 'Yesterday';
    } else {
      return date.toLocaleDateString(language === 'no' ? 'nb-NO' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  };

  // Message action handlers
  const handleReact = (messageId: string, emoji: string) => {
    onMessageAction?.('react', messageId);
  };

  const handleReply = (messageId: string) => {
    onMessageAction?.('reply', messageId);
  };

  const handleEdit = (messageId: string) => {
    onMessageAction?.('edit', messageId);
  };

  const handleDelete = (messageId: string) => {
    onMessageAction?.('delete', messageId);
  };

  const handleCopy = (messageId: string) => {
    onMessageAction?.('copy', messageId);
  };

  const handlePin = (messageId: string) => {
    onMessageAction?.('pin', messageId);
  };

  const handleForward = (messageId: string) => {
    onMessageAction?.('forward', messageId);
  };

  const handleReport = (messageId: string) => {
    onMessageAction?.('report', messageId);
  };

  if (messages.length === 0 && !isLoading) {
    return (
      <div className={`flex-1 flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500">
          <p className="text-lg mb-2">
            {language === 'no' ? 'Ingen meldinger enda' : 'No messages yet'}
          </p>
          <p className="text-sm">
            {language === 'no' 
              ? 'Send den første meldingen for å starte samtalen'
              : 'Send the first message to start the conversation'
            }
          </p>
        </div>
      </div>
    );
  }

  const messageGroups = getMessageGroups();

  return (
    <div className={`relative h-full ${className}`}>
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-4 py-4"
      >
        {/* Load more indicator at top */}
        {hasMore && (
          <div ref={loadMoreRef} className="flex justify-center py-4">
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <LoadingSpinner size="sm" />
                <span>{language === 'no' ? 'Laster flere meldinger...' : 'Loading more messages...'}</span>
              </div>
            ) : (
              <button
                onClick={onLoadMore}
                className="text-sm text-blue-600 hover:text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                {language === 'no' ? 'Last flere meldinger' : 'Load more messages'}
              </button>
            )}
          </div>
        )}

        {/* Message groups */}
        {messageGroups.map((group, groupIndex) => (
          <div key={group.date} className="space-y-2">
            {/* Date separator */}
            <div className="flex items-center justify-center py-4">
              <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                {formatGroupDate(group.date)}
              </div>
            </div>
            
            {/* Messages in group */}
            <div className="space-y-2">
              {group.messages.map((message) => (
                <MessageBubble
                  key={message.id || message.tempId}
                  message={message}
                  isOwn={message.senderId === currentUserId}
                  showAvatar={message.showAvatar}
                  showTimestamp={message.showTimestamp}
                  language={language}
                  status={message.status}
                  isOptimistic={message.isOptimistic}
                  error={message.error}
                  onReact={(emoji) => handleReact(message.id, emoji)}
                  onReply={() => handleReply(message.id)}
                  onEdit={() => handleEdit(message.id)}
                  onDelete={() => handleDelete(message.id)}
                  onCopy={() => handleCopy(message.id)}
                  onPin={() => handlePin(message.id)}
                  onForward={() => handleForward(message.id)}
                  onReport={() => handleReport(message.id)}
                  onRetry={() => onRetryMessage?.(message.id || message.tempId!)}
                  onViewAppointment={onViewAppointment}
                />
              ))}
            </div>
          </div>
        ))}
        
        {/* Typing indicators */}
        {typingUsers.length > 0 && (
          <div className="py-2">
            <TypingIndicators 
              typingUsers={typingUsers}
              currentUserId={currentUserId}
              language={language}
            />
          </div>
        )}
        
        {/* Bottom anchor for auto-scrolling */}
        <div ref={messagesEndRef} />

        {/* Scroll to bottom button */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors z-10"
            title={language === 'no' ? 'Gå til bunn' : 'Scroll to bottom'}
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}