'use client';

import { MessageCircle, Search, Archive, Wifi, RefreshCw, Plus } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useLanguage, useLanguageText } from '@/contexts/LanguageContext';

interface EmptyStateProps {
  onAction?: () => void;
}

export function NoChatsEmptyState({ onAction }: EmptyStateProps) {
  const { language } = useLanguage();
  const translate = useLanguageText();

  const title = translate('Ingen samtaler enda', 'No conversations yet');
  const description = translate(
    'Start en samtale ved å kontakte en lærer eller student gjennom deres innlegg.',
    'Start a conversation by contacting a teacher or student through their post.',
  );
  const exploreLabel = translate('Utforsk innlegg', 'Explore posts');

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
        <MessageCircle className="h-8 w-8 text-blue-600" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-md">{description}</p>

      {onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {exploreLabel}
        </button>
      )}
    </div>
  );
}

export function NoSearchResultsEmptyState({ searchQuery }: { searchQuery: string }) {
  const { language } = useLanguage();
  const translate = useLanguageText();

  const title = translate('Ingen samtaler funnet', 'No conversations found');
  const summary = language === 'no'
    ? `Ingen samtaler funnet for "${searchQuery}"`
    : `No conversations found for "${searchQuery}"`;
  const tips = [
    translate('• Sjekk stavingen', '• Check your spelling'),
    translate('• Prøv andre søkeord', '• Try different search terms'),
    translate('• Bruk færre ord', '• Use fewer keywords'),
  ];

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Search className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-4">{summary}</p>
      <div className="text-sm text-gray-400 space-y-1">
        {tips.map((tip, index) => (
          <p key={index}>{tip}</p>
        ))}
      </div>
    </div>
  );
}

export function NoMessagesEmptyState({ participantName }: { participantName: string }) {
  const { language } = useLanguage();
  const translate = useLanguageText();

  const title = language === 'no'
    ? `Samtale med ${participantName}`
    : `Conversation with ${participantName}`;
  const prompt = translate(
    'Send din første melding for å starte samtalen.',
    'Send your first message to start the conversation.',
  );
  const tip = translate(
    '💡 Tip: Vær høflig og presenter deg selv når du starter en samtale.',
    '💡 Tip: Be polite and introduce yourself when starting a conversation.',
  );

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <MessageCircle className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-4">{prompt}</p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-sm">
        <p className="text-sm text-blue-800">{tip}</p>
      </div>
    </div>
  );
}

export function NoArchivedChatsEmptyState() {
  const translate = useLanguageText();
  const title = translate('Ingen arkiverte samtaler', 'No archived conversations');
  const body = translate('Samtaler du arkiverer vil vises her.', 'Conversations you archive will appear here.');

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Archive className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500">{body}</p>
    </div>
  );
}

export function ConnectionErrorEmptyState({ onRetry }: { onRetry?: () => void }) {
  const translate = useLanguageText();
  const title = translate('Tilkoblingen mistet', 'Connection lost');
  const description = translate('Sjekk internettforbindelsen din og prøv igjen.', 'Check your internet connection and try again.');
  const retryLabel = translate('Prøv igjen', 'Try again');

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <Wifi className="h-8 w-8 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          {retryLabel}
        </button>
      )}
    </div>
  );
}

export function ChatListLoadingState() {
  return (
    <div className="p-4 space-y-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 p-3 animate-pulse">
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
  const translate = useLanguageText();
  const loadingLabel = translate('Laster meldinger...', 'Loading messages...');

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-gray-500 text-sm">{loadingLabel}</p>
      </div>
    </div>
  );
}

export function TypingIndicator({ userName }: { userName: string }) {
  const { language } = useLanguage();
  const text = language === 'no' ? `${userName} skriver...` : `${userName} is typing...`;

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>{text}</span>
    </div>
  );
}

export function ReconnectingIndicator() {
  const translate = useLanguageText();
  const label = translate('Kobler til på nytt...', 'Reconnecting...');

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
      <div className="flex items-center gap-2 text-sm text-yellow-800">
        <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
        <span>{label}</span>
      </div>
    </div>
  );
}
