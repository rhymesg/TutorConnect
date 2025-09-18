'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, MessageCircle, User, Archive, Trash2, Pin, MoreHorizontal } from 'lucide-react';
import { ChatListItem, ChatFilter } from '@/types/chat';
import { chat as chatTranslations, useLanguage, formatters } from '@/lib/translations';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { NoChatsEmptyState, NoSearchResultsEmptyState, ConnectionErrorEmptyState, ChatListLoadingState } from './EmptyStates';
import { useAuth } from '@/contexts/AuthContext';
import { getSubjectLabel } from '@/constants/subjects';

interface ChatRoomListProps {
  chats: ChatListItem[];
  isLoading: boolean;
  error: string | null;
  selectedChatId?: string;
  isLoadingChat?: boolean;
  onSelectChat: (chatId: string) => void;
  onSearch: (query: string) => void;
  onFilter: (filter: ChatFilter) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onArchiveChat?: (chatId: string) => void;
  onDeleteChat?: (chatId: string) => void;
  onPinChat?: (chatId: string) => void;
  onRetry?: () => void;
  onExploreContacts?: () => void;
}

export default function ChatRoomList({
  chats,
  isLoading,
  error,
  selectedChatId,
  isLoadingChat = false,
  onSelectChat,
  onSearch,
  onFilter,
  hasMore = false,
  onLoadMore,
  onArchiveChat,
  onDeleteChat,
  onPinChat,
  onRetry,
  onExploreContacts,
}: ChatRoomListProps) {
  const language = useLanguage();
  const t = chatTranslations[language];
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = useMemo(() => {
    let filtered = chats.filter(chat => chat.isActive);

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(chat => 
        chat.displayName.toLowerCase().includes(query) ||
        chat.lastMessage?.content.toLowerCase().includes(query) ||
        chat.relatedPost?.title.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [chats, searchQuery]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };


  const getTimeDisplay = (date: Date | undefined) => {
    if (!date) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return formatters.time(date);
    } else if (diffDays === 1) {
      return language === 'no' ? 'I går' : 'Yesterday';
    } else if (diffDays < 7) {
      return new Intl.DateTimeFormat(language === 'no' ? 'nb-NO' : 'en-US', {
        timeZone: 'Europe/Oslo',
        weekday: 'short',
      }).format(date);
    } else {
      return new Intl.DateTimeFormat(language === 'no' ? 'nb-NO' : 'en-US', {
        timeZone: 'Europe/Oslo',
        month: 'short',
        day: 'numeric',
      }).format(date);
    }
  };

  const truncateMessage = (message: string, maxLength: number = 60) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <MessageCircle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t.errors.loadFailed}
          </h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {t.errors.tryAgain || 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 md:pb-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          {t.roomList.title}
        </h2>
        
        {/* Search */}
        <div className="relative -mt-6 md:mt-0">
          <Search className="absolute left-3 top-9 md:top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={t.roomList.search}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-6 md:mt-0"
          />
        </div>
        
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && chats.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <LoadingSpinner />
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <MessageCircle className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {chats.length === 0 ? t.noChats : t.roomList.noResults}
            </h3>
            <p className="text-gray-500 text-sm max-w-xs">
              {chats.length === 0 ? t.noChatsDesc : ''}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`w-full p-4 text-left hover:bg-gray-50 transition-colors relative ${
                  selectedChatId === chat.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                }`}
              >
                {/* Loading overlay */}
                {isLoadingChat && selectedChatId === chat.id && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                    <LoadingSpinner size="sm" />
                  </div>
                )}
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {chat.displayImage ? (
                      <img
                        src={chat.displayImage}
                        alt={chat.displayName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Online indicator */}
                    {chat.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`text-sm font-medium truncate ${
                        chat.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {chat.displayName}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        {chat.lastMessage && (
                          <span>{getTimeDisplay(chat.lastMessage.sentAt)}</span>
                        )}
                        {chat.unreadCount > 0 && (
                          <span className="bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                            {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Last message */}
                    {chat.lastMessage ? (
                      <p className={`text-sm truncate ${
                        chat.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'
                      }`}>
                        {chat.lastMessage.type === 'APPOINTMENT_REQUEST' 
                          ? `📅 ${t.appointment.request}`
                          : chat.lastMessage.type === 'APPOINTMENT_RESPONSE'
                          ? `✅ ${t.appointment.confirmed}`
                          : chat.lastMessage.type === 'SYSTEM_MESSAGE'
                          ? `ℹ️ ${chat.lastMessage.content}`
                          : truncateMessage(chat.lastMessage.content)
                        }
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 truncate">
                        {chat.relatedPost?.title || (language === 'no' ? 'Ingen meldinger enda' : 'No messages yet')}
                      </p>
                    )}
                    
                    {/* Post info */}
                    {chat.relatedPost && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          (() => {
                            const isPostOwner = chat.relatedPost.user.id === user?.id;
                            const postType = chat.relatedPost.type;
                            const otherUserRole = isPostOwner 
                              ? (postType === 'TEACHER' ? 'STUDENT' : 'TEACHER')
                              : postType;
                            
                            return otherUserRole === 'TEACHER'
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800';
                          })()
                        }`}>
                          {/* Show the role of the other user in the chat */}
                          {(() => {
                            const isPostOwner = chat.relatedPost.user.id === user?.id;
                            const postType = chat.relatedPost.type;
                            
                            // If I own the post and it's a TEACHER post, the other person is a STUDENT
                            // If I own the post and it's a STUDENT post, the other person is a TEACHER
                            // If they own the post, their role matches the post type
                            const otherUserRole = isPostOwner 
                              ? (postType === 'TEACHER' ? 'STUDENT' : 'TEACHER')
                              : postType;
                            
                            return otherUserRole === 'TEACHER' 
                              ? (language === 'no' ? 'Lærer' : 'Teacher')
                              : (language === 'no' ? 'Student' : 'Student');
                          })()}
                        </div>
                        <span className="text-xs text-gray-600 font-medium">
                          {getSubjectLabel(chat.relatedPost.subject)}
                        </span>
                        {chat.relatedPost.hourlyRate && (
                          <span className="text-xs text-gray-500">
                            • {formatters.currency(chat.relatedPost.hourlyRate)}/t
                          </span>
                        )}
                      </div>
                    )}
                    
                  </div>
                </div>
              </button>
            ))}
            
            {/* Load More */}
            {hasMore && (
              <div className="p-4">
                <button
                  onClick={onLoadMore}
                  disabled={isLoading}
                  className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <LoadingSpinner size="sm" />
                      {language === 'no' ? 'Laster...' : 'Loading...'}
                    </div>
                  ) : (
                    t.roomList.loadMore
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
