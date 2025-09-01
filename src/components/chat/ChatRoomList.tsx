'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Filter, MessageCircle, Clock, User, Archive, Trash2, Pin, MoreHorizontal } from 'lucide-react';
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
  const [activeFilter, setActiveFilter] = useState<ChatFilter>({ type: 'all' });
  const [showFilters, setShowFilters] = useState(false);

  const filteredChats = useMemo(() => {
    let filtered = chats;

    // Apply filter
    if (activeFilter.type === 'unread') {
      filtered = filtered.filter(chat => chat.unreadCount > 0);
    } else if (activeFilter.type === 'archived') {
      filtered = filtered.filter(chat => !chat.isActive);
    } else {
      filtered = filtered.filter(chat => chat.isActive);
    }

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
  }, [chats, searchQuery, activeFilter]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleFilter = (type: ChatFilter['type']) => {
    const newFilter = { type, search: searchQuery };
    setActiveFilter(newFilter);
    onFilter(newFilter);
    setShowFilters(false);
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
      return date.toLocaleDateString(language === 'no' ? 'nb-NO' : 'en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString(language === 'no' ? 'nb-NO' : 'en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
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
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          {t.roomList.title}
        </h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={t.roomList.search}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 px-3 py-1 text-sm rounded-full transition-colors ${
              showFilters 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Filter className="h-3 w-3" />
            {t.roomList.filter}
          </button>
          
          {activeFilter.type !== 'all' && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
              {t.roomList[`filter${activeFilter.type.charAt(0).toUpperCase() + activeFilter.type.slice(1)}` as keyof typeof t.roomList]}
            </span>
          )}
        </div>
        
        {/* Filter Options */}
        {showFilters && (
          <div className="absolute top-full left-4 right-4 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            {(['all', 'unread', 'archived'] as const).map((filterType) => (
              <button
                key={filterType}
                onClick={() => handleFilter(filterType)}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                  activeFilter.type === filterType 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700'
                }`}
              >
                {t.roomList[`filter${filterType.charAt(0).toUpperCase() + filterType.slice(1)}` as keyof typeof t.roomList]}
              </button>
            ))}
          </div>
        )}
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
                className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                  selectedChatId === chat.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                }`}
              >
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
                    
                    {/* Status indicator */}
                    {!chat.isOnline && (
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-400">
                          {chat.lastSeenText}
                        </span>
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