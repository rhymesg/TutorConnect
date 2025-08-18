'use client';

import { MessageCircle, Search, Archive, Wifi, RefreshCw, Plus } from 'lucide-react';
import { Language, chat as chatTranslations } from '@/lib/translations';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface EmptyStateProps {
  language: Language;
  onAction?: () => void;
}

// No chats empty state
export function NoChatsEmptyState({ language, onAction }: EmptyStateProps) {
  const t = chatTranslations[language];
  
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
        <MessageCircle className="h-8 w-8 text-blue-600" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {t.noChats}
      </h3>
      
      <p className="text-gray-500 mb-6 max-w-md">
        {t.noChatsDesc}
      </p>
      
      {onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {language === 'no' ? 'Utforsk innlegg' : 'Explore posts'}
        </button>
      )}
    </div>
  );
}

// No search results empty state
export function NoSearchResultsEmptyState({ language, searchQuery }: EmptyStateProps & { searchQuery: string }) {
  const t = chatTranslations[language];
  
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Search className="h-8 w-8 text-gray-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {t.roomList.noResults}
      </h3>
      
      <p className="text-gray-500 mb-4">
        {language === 'no' 
          ? `Ingen samtaler funnet for "${searchQuery}"`
          : `No conversations found for "${searchQuery}"`
        }
      </p>
      
      <div className="text-sm text-gray-400 space-y-1">
        <p>{language === 'no' ? '• Sjekk stavingen' : '• Check your spelling'}</p>
        <p>{language === 'no' ? '• Prøv andre søkeord' : '• Try different search terms'}</p>
        <p>{language === 'no' ? '• Bruk færre ord' : '• Use fewer keywords'}</p>
      </div>
    </div>
  );
}

// No messages in chat empty state
export function NoMessagesEmptyState({ language, participantName }: EmptyStateProps & { participantName: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <MessageCircle className="h-8 w-8 text-green-600" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {language === 'no' 
          ? `Samtale med ${participantName}`
          : `Conversation with ${participantName}`
        }
      </h3>
      
      <p className="text-gray-500 mb-4">
        {language === 'no' 
          ? 'Send din første melding for å starte samtalen.'
          : 'Send your first message to start the conversation.'
        }
      </p>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-sm">
        <p className="text-sm text-blue-800">
          {language === 'no' 
            ? '💡 Tip: Vær høflig og presenter deg selv når du starter en samtale.'
            : '💡 Tip: Be polite and introduce yourself when starting a conversation.'
          }
        </p>
      </div>
    </div>
  );
}

// Archived chats empty state
export function NoArchivedChatsEmptyState({ language }: EmptyStateProps) {
  const t = chatTranslations[language];
  
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Archive className="h-8 w-8 text-gray-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {language === 'no' ? 'Ingen arkiverte samtaler' : 'No archived conversations'}
      </h3>
      
      <p className="text-gray-500">
        {language === 'no' 
          ? 'Samtaler du arkiverer vil vises her.'
          : 'Conversations you archive will appear here.'
        }
      </p>
    </div>
  );
}

// Connection error empty state
export function ConnectionErrorEmptyState({ language, onRetry }: EmptyStateProps) {
  const t = chatTranslations[language];
  
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <Wifi className="h-8 w-8 text-red-600" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {t.errors.connectionLost}
      </h3>
      
      <p className="text-gray-500 mb-6">
        {language === 'no' 
          ? 'Sjekk internettforbindelsen din og prøv igjen.'
          : 'Check your internet connection and try again.'
        }
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          {t.errors.tryAgain}
        </button>
      )}
    </div>
  );
}

// Loading states
export function ChatListLoadingState() {
  return (
    <div className="p-4 space-y-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
          <div className="w-12 h-12 bg-gray-200 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </div>
          <div className="w-8 h-3 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

export function MessagesLoadingState() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-gray-500 text-sm">
          Loading messages...
        </p>
      </div>
    </div>
  );
}

export function TypingIndicator({ language, userName }: { language: Language; userName: string }) {
  const t = chatTranslations[language];
  
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>{t.typing.single.replace('{name}', userName)}</span>
    </div>
  );
}

// Reconnecting indicator
export function ReconnectingIndicator({ language }: { language: Language }) {
  const t = chatTranslations[language];
  
  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
      <div className="flex items-center gap-2 text-sm text-yellow-800">
        <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
        <span>{t.errors.reconnecting}</span>
      </div>
    </div>
  );
}