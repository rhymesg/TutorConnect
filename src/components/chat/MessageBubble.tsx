'use client';

import { useState } from 'react';
import { Check, CheckCheck, Clock, AlertCircle, User, Calendar, MapPin, DollarSign } from 'lucide-react';
import { Message } from '@/types/chat';
import { Language, chat as chatTranslations, formatters } from '@/lib/translations';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
  language: Language;
}

export default function MessageBubble({
  message,
  isOwn,
  showAvatar,
  showTimestamp,
  language,
}: MessageBubbleProps) {
  const t = chatTranslations[language];
  const [showMenu, setShowMenu] = useState(false);
  
  const getMessageStatusIcon = () => {
    // This would be connected to actual message status from backend
    return <CheckCheck className="h-3 w-3 text-blue-500" />;
  };

  const formatTime = (date: Date) => {
    return formatters.time(date);
  };

  const formatDateTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return formatTime(date);
    } else if (diffDays === 1) {
      return `${language === 'no' ? 'I går' : 'Yesterday'} ${formatTime(date)}`;
    } else if (diffDays < 7) {
      return `${date.toLocaleDateString(language === 'no' ? 'nb-NO' : 'en-US', { weekday: 'short' })} ${formatTime(date)}`;
    } else {
      return formatters.date(date);
    }
  };

  const renderSystemMessage = () => (
    <div className="flex justify-center my-4">
      <div className="bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded-full max-w-xs text-center">
        {message.content}
      </div>
    </div>
  );

  const renderAppointmentMessage = () => {
    if (!message.appointment) return null;

    const { appointment } = message;
    const isRequest = message.type === 'APPOINTMENT_REQUEST';
    const isResponse = message.type === 'APPOINTMENT_RESPONSE';

    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
        <div className={`max-w-sm ${isOwn ? 'ml-12' : 'mr-12'}`}>
          {!isOwn && showAvatar && (
            <div className="flex items-end gap-2 mb-1">
              {message.sender.profileImage ? (
                <img
                  src={message.sender.profileImage}
                  alt={message.sender.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
              )}
            </div>
          )}

          <div
            className={`p-4 rounded-2xl shadow-sm border ${
              isOwn
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-900 border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">
                {isRequest ? t.appointment.request : t.appointment.confirmed}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>{formatDateTime(appointment.dateTime)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                <span>{appointment.location}</span>
              </div>
              
              {message.content && (
                <div className="pt-2 border-t border-white/20">
                  <p>{message.content}</p>
                </div>
              )}
            </div>

            {isRequest && !isOwn && (
              <div className="flex gap-2 mt-3">
                <button className="flex-1 px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors">
                  {t.appointment.accept}
                </button>
                <button className="flex-1 px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors">
                  {t.appointment.decline}
                </button>
              </div>
            )}
          </div>

          {showTimestamp && (
            <div className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
              {formatDateTime(message.sentAt)}
              {isOwn && (
                <span className="ml-1">
                  {getMessageStatusIcon()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (message.type === 'SYSTEM_MESSAGE') {
    return renderSystemMessage();
  }

  if (message.type === 'APPOINTMENT_REQUEST' || message.type === 'APPOINTMENT_RESPONSE') {
    return renderAppointmentMessage();
  }

  // Regular text message
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-sm ${isOwn ? 'ml-12' : 'mr-12'}`}>
        {!isOwn && showAvatar && (
          <div className="flex items-end gap-2 mb-1">
            {message.sender.profileImage ? (
              <img
                src={message.sender.profileImage}
                alt={message.sender.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-4 w-4 text-gray-400" />
              </div>
            )}
            <span className="text-xs text-gray-500 mb-1">
              {message.sender.name}
            </span>
          </div>
        )}

        <div
          className={`relative group px-4 py-2 rounded-2xl shadow-sm ${
            isOwn
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-900 border border-gray-200'
          }`}
          onContextMenu={(e) => {
            e.preventDefault();
            setShowMenu(!showMenu);
          }}
        >
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>

          {message.isEdited && (
            <span className={`text-xs italic ml-2 ${
              isOwn ? 'text-blue-100' : 'text-gray-500'
            }`}>
              {language === 'no' ? 'redigert' : 'edited'}
            </span>
          )}

          {/* Message menu */}
          {showMenu && (
            <div className="absolute top-full right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 rounded-t-lg">
                {t.actions.copy}
              </button>
              {isOwn && (
                <>
                  <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50">
                    {t.actions.edit}
                  </button>
                  <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600 rounded-b-lg">
                    {t.actions.delete}
                  </button>
                </>
              )}
              {!isOwn && (
                <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600 rounded-b-lg">
                  {t.actions.report}
                </button>
              )}
            </div>
          )}
        </div>

        {showTimestamp && (
          <div className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
            {formatDateTime(message.sentAt)}
            {isOwn && (
              <span className="ml-1">
                {getMessageStatusIcon()}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}