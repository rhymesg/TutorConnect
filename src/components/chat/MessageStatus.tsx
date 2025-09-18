'use client';

import { useState, useEffect, useMemo } from 'react';
import { Check, CheckCheck, Clock, AlertCircle, RotateCcw, Wifi, WifiOff } from 'lucide-react';
import { MessageStatus as MessageStatusType } from '@/types/chat';
import { Language, chat as chatTranslations } from '@/lib/translations';
import { createOsloFormatter } from '@/lib/datetime';

interface MessageStatusProps {
  status: MessageStatusType['status'];
  timestamp: Date;
  language: Language;
  size?: 'sm' | 'md';
  showTooltip?: boolean;
  showProgressIndicator?: boolean;
  isRealTimeUpdate?: boolean;
  connectionStatus?: 'connected' | 'disconnected' | 'connecting';
  onRetry?: () => void;
}

export default function MessageStatus({
  status,
  timestamp,
  language,
  size = 'sm',
  showTooltip = false,
  showProgressIndicator = false,
  isRealTimeUpdate = false,
  connectionStatus = 'connected',
  onRetry,
}: MessageStatusProps) {
  const t = chatTranslations[language];
  const [isAnimating, setIsAnimating] = useState(isRealTimeUpdate);
  const locale = language === 'no' ? 'nb-NO' : 'en-US';
  const timeFormatter = useMemo(
    () =>
      createOsloFormatter(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: language === 'en',
      }),
    [language, locale]
  );
  const tooltipFormatter = useMemo(
    () =>
      createOsloFormatter(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    [locale]
  );
  
  // Animation effect for real-time updates
  useEffect(() => {
    if (isRealTimeUpdate) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isRealTimeUpdate, status]);
  
  const getStatusIcon = () => {
    const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
    const animationClass = isAnimating ? 'animate-pulse' : '';
    
    switch (status) {
      case 'sending':
        if (connectionStatus === 'disconnected') {
          return (
            <div className="flex items-center gap-1">
              <WifiOff className={`${iconSize} text-red-400`} title={language === 'no' ? 'Ingen tilkobling' : 'No connection'} />
              <Clock className={`${iconSize} text-orange-400`} />
            </div>
          );
        }
        return (
          <div className="flex items-center gap-1">
            <div className={`${iconSize} border-2 border-blue-400 border-t-transparent rounded-full animate-spin`} />
            {showProgressIndicator && (
              <div className="w-8 h-1 bg-gray-200 rounded-full overflow-hidden ml-1">
                <div className="h-full bg-blue-400 rounded-full animate-progress-bar"></div>
              </div>
            )}
          </div>
        );
      case 'sent':
        return (
          <Check 
            className={`${iconSize} text-gray-500 transition-all duration-300 ${animationClass}`} 
            title={language === 'no' ? 'Sendt' : 'Sent'}
          />
        );
      case 'delivered':
        return (
          <CheckCheck 
            className={`${iconSize} text-gray-500 transition-all duration-300 ${animationClass}`}
            title={language === 'no' ? 'Levert' : 'Delivered'}
          />
        );
      case 'read':
        return (
          <CheckCheck 
            className={`${iconSize} text-blue-500 transition-all duration-300 ${animationClass}`}
            title={language === 'no' ? 'Lest' : 'Read'}
          />
        );
      case 'failed':
        return (
          <div className="flex items-center gap-1">
            <AlertCircle className={`${iconSize} text-red-500 animate-pulse`} />
            {onRetry && (
              <button
                onClick={onRetry}
                className="p-1 hover:bg-red-50 rounded-full transition-colors group"
                title={language === 'no' ? 'Prøv på nytt' : 'Retry'}
              >
                <RotateCcw className="h-3 w-3 text-red-500 group-hover:animate-spin" />
              </button>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusText = () => {
    if (connectionStatus === 'disconnected' && status === 'sending') {
      return language === 'no' ? 'Venter på tilkobling...' : 'Waiting for connection...';
    }
    
    switch (status) {
      case 'sending':
        return language === 'no' ? 'Sender...' : 'Sending...';
      case 'sent':
        return language === 'no' ? 'Sendt' : 'Sent';
      case 'delivered':
        return language === 'no' ? 'Levert' : 'Delivered';
      case 'read':
        return language === 'no' ? 'Lest' : 'Read';
      case 'failed':
        return language === 'no' ? 'Feilet' : 'Failed';
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
    return timeFormatter.format(date);
  };

  return (
    <div className={`flex items-center gap-1.5 ${getStatusColor()} transition-all duration-300`}>
      <span 
        className={`${size === 'sm' ? 'text-xs' : 'text-sm'} font-mono tabular-nums`}
        title={tooltipFormatter.format(timestamp)}
      >
        {formatTime(timestamp)}
      </span>
      
      <div className="flex items-center relative">
        {getStatusIcon()}
        
        {/* Connection indicator for offline messages */}
        {connectionStatus === 'connecting' && (
          <div className="absolute -top-1 -right-1 w-2 h-2">
            <div className="w-full h-full bg-orange-400 rounded-full animate-ping"></div>
            <div className="absolute inset-0 w-full h-full bg-orange-500 rounded-full"></div>
          </div>
        )}
      </div>
      
      {showTooltip && (
        <span className={`${size === 'sm' ? 'text-xs' : 'text-sm'} ${getStatusColor()} font-medium`}>
          {getStatusText()}
        </span>
      )}
      
      <style jsx>{`
        @keyframes progress-bar {
          from { width: 0%; }
          to { width: 100%; }
        }
        
        .animate-progress-bar {
          animation: progress-bar 3s ease-out forwards;
        }
      `}</style>
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
  const locale = language === 'no' ? 'nb-NO' : 'en-US';
  const timeFormatter = useMemo(
    () =>
      createOsloFormatter(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: language === 'en',
      }),
    [language, locale]
  );
  const weekdayFormatter = useMemo(
    () =>
      createOsloFormatter(locale, {
        weekday: 'short',
      }),
    [locale]
  );
  const dateFormatter = useMemo(
    () =>
      createOsloFormatter(locale, {
        month: 'short',
        day: 'numeric',
      }),
    [locale]
  );

  const formatDateTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    const timeStr = timeFormatter.format(date);

    if (diffDays === 0) {
      return timeStr;
    } else if (diffDays === 1) {
      return `${language === 'no' ? 'I går' : 'Yesterday'} ${timeStr}`;
    } else if (diffDays < 7) {
      return `${weekdayFormatter.format(date)} ${timeStr}`;
    } else {
      return `${dateFormatter.format(date)} ${timeStr}`;
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
