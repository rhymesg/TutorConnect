'use client';

import { Check, CheckCheck, Clock, AlertCircle, RotateCcw } from 'lucide-react';
import { MessageStatus as MessageStatusType } from '@/types/chat';
import { Language, chat as chatTranslations } from '@/lib/translations';

interface MessageStatusProps {
  status: MessageStatusType['status'];
  timestamp: Date;
  language: Language;
  size?: 'sm' | 'md';
  showTooltip?: boolean;
  onRetry?: () => void;
}

export default function MessageStatus({
  status,
  timestamp,
  language,
  size = 'sm',
  showTooltip = false,
  onRetry,
}: MessageStatusProps) {
  const t = chatTranslations[language];
  
  const getStatusIcon = () => {
    const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
    
    switch (status) {
      case 'sending':
        return (
          <div className={`${iconSize} border border-gray-400 border-t-transparent rounded-full animate-spin`} />
        );
      case 'sent':
        return <Check className={`${iconSize} text-gray-400`} />;
      case 'delivered':
        return <CheckCheck className={`${iconSize} text-gray-400`} />;
      case 'read':
        return <CheckCheck className={`${iconSize} text-blue-500`} />;
      case 'failed':
        return (
          <div className="flex items-center gap-1">
            <AlertCircle className={`${iconSize} text-red-500`} />
            {onRetry && (
              <button
                onClick={onRetry}
                className="p-0.5 hover:bg-red-100 rounded-full transition-colors"
                title={t.messages.retry}
              >
                <RotateCcw className="h-3 w-3 text-red-500" />
              </button>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'sending':
        return t.status.sending;
      case 'sent':
        return t.status.sent;
      case 'delivered':
        return t.status.delivered;
      case 'read':
        return t.status.read;
      case 'failed':
        return t.status.failed;
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'sending':
        return 'text-gray-500';
      case 'sent':
      case 'delivered':
        return 'text-gray-400';
      case 'read':
        return 'text-blue-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(language === 'no' ? 'nb-NO' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: language === 'en'
    });
  };

  return (
    <div className={`flex items-center gap-1 ${getStatusColor()}`}>
      <span className={`text-xs ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
        {formatTime(timestamp)}
      </span>
      
      <div className="flex items-center">
        {getStatusIcon()}
      </div>
      
      {showTooltip && (
        <span className={`text-xs ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      )}
    </div>
  );
}

// Utility component for message timestamp with status
export function MessageTimestamp({
  sentAt,
  status,
  language,
  isOwn = false,
  onRetry,
}: {
  sentAt: Date;
  status?: MessageStatusType['status'];
  language: Language;
  isOwn?: boolean;
  onRetry?: () => void;
}) {
  const formatDateTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    const timeStr = date.toLocaleTimeString(language === 'no' ? 'nb-NO' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: language === 'en'
    });

    if (diffDays === 0) {
      return timeStr;
    } else if (diffDays === 1) {
      return `${language === 'no' ? 'I går' : 'Yesterday'} ${timeStr}`;
    } else if (diffDays < 7) {
      const dayName = date.toLocaleDateString(language === 'no' ? 'nb-NO' : 'en-US', { weekday: 'short' });
      return `${dayName} ${timeStr}`;
    } else {
      const dateStr = date.toLocaleDateString(language === 'no' ? 'nb-NO' : 'en-US', {
        month: 'short',
        day: 'numeric'
      });
      return `${dateStr} ${timeStr}`;
    }
  };

  return (
    <div className={`flex items-center gap-1 text-xs text-gray-500 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <span>{formatDateTime(sentAt)}</span>
      {isOwn && status && (
        <MessageStatus
          status={status}
          timestamp={sentAt}
          language={language}
          onRetry={onRetry}
        />
      )}
    </div>
  );
}