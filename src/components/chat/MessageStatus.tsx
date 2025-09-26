'use client';

import { useState, useEffect, useMemo } from 'react';
import { Check, CheckCheck, Clock, AlertCircle, RotateCcw, WifiOff } from 'lucide-react';
import { MessageStatus as MessageStatusType } from '@/types/chat';
import { createOsloFormatter } from '@/lib/datetime';
import { useLanguage, useLanguageText } from '@/contexts/LanguageContext';

interface MessageStatusProps {
  status: MessageStatusType['status'];
  timestamp: Date;
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
  size = 'sm',
  showTooltip = false,
  showProgressIndicator = false,
  isRealTimeUpdate = false,
  connectionStatus = 'connected',
  onRetry,
}: MessageStatusProps) {
  const { language } = useLanguage();
  const translate = useLanguageText();
  const locale = language === 'no' ? 'nb-NO' : 'en-GB';
  const [isAnimating, setIsAnimating] = useState(isRealTimeUpdate);

  const timeFormatter = useMemo(
    () =>
      createOsloFormatter(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: language !== 'no',
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

  const labels = {
    waitingForConnection: translate('Venter på tilkobling...', 'Waiting for connection...'),
    sending: translate('Sender...', 'Sending...'),
    sent: translate('Sendt', 'Sent'),
    delivered: translate('Levert', 'Delivered'),
    read: translate('Lest', 'Read'),
    failed: translate('Feilet', 'Failed'),
    retry: translate('Prøv på nytt', 'Retry'),
    yesterday: translate('I går', 'Yesterday'),
  };

  useEffect(() => {
    if (!isRealTimeUpdate) {
      return;
    }

    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 1000);
    return () => clearTimeout(timer);
  }, [isRealTimeUpdate, status]);

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

  const getStatusText = () => {
    if (connectionStatus === 'disconnected' && status === 'sending') {
      return labels.waitingForConnection;
    }

    switch (status) {
      case 'sending':
        return labels.sending;
      case 'sent':
        return labels.sent;
      case 'delivered':
        return labels.delivered;
      case 'read':
        return labels.read;
      case 'failed':
        return labels.failed;
      default:
        return '';
    }
  };

  const getStatusIcon = () => {
    const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
    const animationClass = isAnimating ? 'animate-pulse' : '';

    if (status === 'sending' && connectionStatus === 'disconnected') {
      return (
        <div className="flex items-center gap-1">
          <WifiOff className={`${iconSize} text-red-400`} title={labels.waitingForConnection} />
          <Clock className={`${iconSize} text-orange-400`} />
        </div>
      );
    }

    switch (status) {
      case 'sending':
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
        return <Check className={`${iconSize} text-gray-500 ${animationClass}`} title={labels.sent} />;
      case 'delivered':
        return <CheckCheck className={`${iconSize} text-gray-500 ${animationClass}`} title={labels.delivered} />;
      case 'read':
        return <CheckCheck className={`${iconSize} text-blue-500 ${animationClass}`} title={labels.read} />;
      case 'failed':
        return (
          <div className="flex items-center gap-1">
            <AlertCircle className={`${iconSize} text-red-500 animate-pulse`} />
            {onRetry && (
              <button
                onClick={onRetry}
                className="p-1 hover:bg-red-50 rounded-full transition-colors group"
                title={labels.retry}
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

  return (
    <div className={`flex items-center gap-1.5 ${getStatusColor()} transition-all duration-300`}>
      <span
        className={`${size === 'sm' ? 'text-xs' : 'text-sm'} font-mono tabular-nums`}
        title={tooltipFormatter.format(timestamp)}
      >
        {timeFormatter.format(timestamp)}
      </span>

      <div className="flex items-center relative">
        {getStatusIcon()}

        {connectionStatus === 'connecting' && (
          <div className="absolute -top-1 -right-1 w-2 h-2">
            <div className="w-full h-full bg-orange-400 rounded-full animate-ping" />
            <div className="absolute inset-0 w-full h-full bg-orange-500 rounded-full" />
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

export function MessageTimestamp({
  sentAt,
  status,
  isOwn = false,
  onRetry,
}: {
  sentAt: Date;
  status?: MessageStatusType['status'];
  isOwn?: boolean;
  onRetry?: () => void;
}) {
  const { language } = useLanguage();
  const translate = useLanguageText();
  const locale = language === 'no' ? 'nb-NO' : 'en-GB';
  const timeFormatter = useMemo(
    () =>
      createOsloFormatter(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: language !== 'no',
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
  const yesterdayLabel = translate('I går', 'Yesterday');

  const formatDateTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const timeStr = timeFormatter.format(date);

    if (diffDays === 0) {
      return timeStr;
    }

    if (diffDays === 1) {
      return `${yesterdayLabel} ${timeStr}`;
    }

    if (diffDays < 7) {
      return `${weekdayFormatter.format(date)} ${timeStr}`;
    }

    return `${dateFormatter.format(date)} ${timeStr}`;
  };

  return (
    <div className={`flex items-center gap-1 text-xs text-gray-500 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <span>{formatDateTime(sentAt)}</span>
      {isOwn && status && (
        <MessageStatus
          status={status}
          timestamp={sentAt}
          onRetry={onRetry}
        />
      )}
    </div>
  );
}
