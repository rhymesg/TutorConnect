'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Check, 
  CheckCheck, 
  Clock, 
  AlertCircle, 
  User, 
  Calendar, 
  MapPin, 
  DollarSign,
  Heart,
  ThumbsUp,
  Laugh,
  Frown,
  MoreHorizontal,
  Copy,
  Reply,
  Edit3,
  Trash2,
  Flag,
  Pin,
  Forward,
  Download,
  Play,
  FileText
} from 'lucide-react';
import { Message, MessageAttachment } from '@/types/chat';
import { Language, chat as chatTranslations, formatters } from '@/lib/translations';
import { MessageTimestamp } from './MessageStatus';
import AppointmentMessage from './AppointmentMessage';

interface MessageBubbleProps {
  message: Message & {
    attachments?: MessageAttachment[];
    reactions?: Array<{
      emoji: string;
      count: number;
      users: string[];
      hasReacted: boolean;
    }>;
    isPinned?: boolean;
    replyTo?: {
      id: string;
      content: string;
      senderName: string;
    };
    status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
    isOptimistic?: boolean;
    error?: string;
    tempId?: string;
  };
  isOwn: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
  language: Language;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  isOptimistic?: boolean;
  error?: string;
  onReact?: (emoji: string) => void;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onPin?: () => void;
  onForward?: () => void;
  onReport?: () => void;
  onRetry?: () => void;
  onAcceptAppointment?: (messageId: string) => void;
  onRejectAppointment?: (messageId: string) => void;
}

export default function MessageBubble({
  message,
  isOwn,
  showAvatar,
  showTimestamp,
  language,
  status,
  isOptimistic,
  error,
  onReact,
  onReply,
  onEdit,
  onDelete,
  onCopy,
  onPin,
  onForward,
  onReport,
  onRetry,
  onAcceptAppointment,
  onRejectAppointment,
}: MessageBubbleProps) {
  const t = chatTranslations[language];
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [imageError, setImageError] = useState<string[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleImageError = (attachmentId: string) => {
    setImageError(prev => [...prev, attachmentId]);
  };

  const getFileTypeIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    return '📎';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / 1048576) + ' MB';
  };

  const handleReaction = (emoji: string) => {
    onReact?.(emoji);
    setShowReactions(false);
  };

  const commonReactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];

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

  // Get message status (use prop status first, then message status)
  const messageStatus = status || message.status || 'sent';
  const messageIsOptimistic = isOptimistic ?? message.isOptimistic ?? false;
  const messageError = error || message.error;

  const getMessageStatusIcon = () => {
    switch (messageStatus) {
      case 'sending':
        return <Clock className="h-3 w-3 text-gray-400 animate-pulse" />;
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return null;
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
          
          <AppointmentMessage
            message={message}
            isOwn={isOwn}
            language={language}
            onAccept={() => onAcceptAppointment?.(message.id)}
            onReject={() => onRejectAppointment?.(message.id)}
          />
        </div>
      </div>
    );
  };

  // Debug all messages to see what's happening
  console.log('MessageBubble - ALL MESSAGES DEBUG:');
  console.log('- message.type:', message.type);
  console.log('- message.id:', message.id);
  console.log('- message.content:', message.content?.substring(0, 50) + '...');
  console.log('- message.appointment:', message.appointment);
  console.log('- full message keys:', Object.keys(message));

  if (message.type === 'SYSTEM_MESSAGE') {
    return renderSystemMessage();
  }
  
  if (message.type === 'APPOINTMENT_REQUEST' || message.type === 'APPOINTMENT_RESPONSE') {
    console.log('Rendering appointment message');
    return renderAppointmentMessage();
  }

  // Regular text message
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2 group`}>
      <div className={`max-w-sm ${isOwn ? 'ml-12' : 'mr-12'} relative`}>
        {/* Reply preview */}
        {message.replyTo && (
          <div className="mb-2 pl-3 border-l-3 border-gray-300 bg-gray-50 rounded p-2">
            <p className="text-xs font-medium text-gray-600 mb-1">
              {message.replyTo.senderName}
            </p>
            <p className="text-xs text-gray-500 line-clamp-2">
              {message.replyTo.content}
            </p>
          </div>
        )}
        
        {/* Pinned indicator */}
        {message.isPinned && (
          <div className="flex items-center gap-1 text-xs text-yellow-600 mb-1">
            <Pin className="h-3 w-3" />
            <span>{language === 'no' ? 'Festet melding' : 'Pinned message'}</span>
          </div>
        )}
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
          className={`relative group px-4 py-2 rounded-2xl shadow-sm transition-all ${
            isOwn
              ? messageStatus === 'failed'
                ? 'bg-red-500 text-white'
                : messageIsOptimistic
                ? 'bg-blue-400 text-white opacity-75'
                : 'bg-blue-500 text-white'
              : 'bg-white text-gray-900 border border-gray-200'
          } ${messageStatus === 'sending' ? 'animate-pulse' : ''}`}
          onContextMenu={(e) => {
            e.preventDefault();
            setShowMenu(!showMenu);
          }}
          onDoubleClick={() => onReact?.('👍')}
        >
          <div className="flex items-start gap-2">
            <p className="text-sm whitespace-pre-wrap break-words flex-1">
              {message.content}
            </p>
            {messageStatus === 'failed' && (
              <AlertCircle className="h-4 w-4 text-red-300 flex-shrink-0 mt-0.5" />
            )}
          </div>

          {/* Optimistic/Error message */}
          {messageIsOptimistic && messageStatus === 'sending' && (
            <div className="text-xs opacity-75 mt-1">
              {language === 'no' ? 'Sender...' : 'Sending...'}
            </div>
          )}
          
          {messageError && messageStatus === 'failed' && (
            <div className="text-xs bg-red-400/20 px-2 py-1 rounded mt-2 flex items-center justify-between">
              <span className="text-red-100">
                {language === 'no' ? 'Kunne ikke sende' : 'Failed to send'}
              </span>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="text-xs underline text-red-200 hover:text-red-100 ml-2"
                >
                  {language === 'no' ? 'Prøv igjen' : 'Retry'}
                </button>
              )}
            </div>
          )}

          {message.isEdited && (
            <span className={`text-xs italic ml-2 ${
              isOwn ? 'text-blue-100' : 'text-gray-500'
            }`}>
              {language === 'no' ? 'redigert' : 'edited'}
            </span>
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment) => (
                <div key={attachment.id} className="relative">
                  {attachment.type === 'image' && !imageError.includes(attachment.id) ? (
                    <div className="relative">
                      <img
                        src={attachment.fileUrl}
                        alt={attachment.fileName}
                        className="max-w-sm max-h-64 rounded-lg object-cover cursor-pointer"
                        onClick={() => window.open(attachment.fileUrl, '_blank')}
                        onError={() => handleImageError(attachment.id)}
                      />
                      <button
                        onClick={() => window.open(attachment.fileUrl, '_blank')}
                        className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                      >
                        <Download className="h-3 w-3" />
                      </button>
                    </div>
                  ) : attachment.type === 'video' ? (
                    <div className="relative bg-gray-100 rounded-lg p-4 max-w-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Play className="h-6 w-6 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {attachment.fileName}
                          </p>
                          {attachment.fileSize && (
                            <p className="text-xs text-gray-500">
                              {formatFileSize(attachment.fileSize)}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => window.open(attachment.fileUrl, '_blank')}
                          className="p-2 text-gray-500 hover:text-gray-700"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-100 rounded-lg p-3 max-w-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {getFileTypeIcon(attachment.mimeType || '')}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {attachment.fileName}
                          </p>
                          {attachment.fileSize && (
                            <p className="text-xs text-gray-500">
                              {formatFileSize(attachment.fileSize)}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => window.open(attachment.fileUrl, '_blank')}
                          className="p-1 text-gray-500 hover:text-gray-700"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Message reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {message.reactions.map((reaction, index) => (
                <button
                  key={index}
                  onClick={() => handleReaction(reaction.emoji)}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                    reaction.hasReacted
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{reaction.emoji}</span>
                  <span>{reaction.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Message menu */}
          {showMenu && (
            <div 
              ref={menuRef}
              className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20"
            >
              {/* Quick reactions */}
              <div className="p-2 border-b border-gray-100">
                <div className="flex gap-1">
                  {commonReactions.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(emoji)}
                      className="p-1 hover:bg-gray-100 rounded text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Actions */}
              <div className="py-1">
                {onReply && (
                  <button 
                    onClick={() => { onReply(); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    <Reply className="h-4 w-4" />
                    {t.actions.reply}
                  </button>
                )}
                
                <button 
                  onClick={() => { onCopy?.(); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm hover:bg-gray-50"
                >
                  <Copy className="h-4 w-4" />
                  {t.actions.copy}
                </button>
                
                {onPin && (
                  <button 
                    onClick={() => { onPin(); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    <Pin className="h-4 w-4" />
                    {message.isPinned ? t.actions.unpin : t.actions.pin}
                  </button>
                )}
                
                {onForward && (
                  <button 
                    onClick={() => { onForward(); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    <Forward className="h-4 w-4" />
                    {t.actions.forward}
                  </button>
                )}
                
                {isOwn && onEdit && (
                  <button 
                    onClick={() => { onEdit(); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    <Edit3 className="h-4 w-4" />
                    {t.actions.edit}
                  </button>
                )}
                
                {isOwn && onDelete && (
                  <button 
                    onClick={() => { onDelete(); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm hover:bg-gray-50 text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t.actions.delete}
                  </button>
                )}
                
                {!isOwn && onReport && (
                  <button 
                    onClick={() => { onReport(); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm hover:bg-gray-50 text-red-600"
                  >
                    <Flag className="h-4 w-4" />
                    {t.actions.report}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {showTimestamp && (
          <div className={`text-xs text-gray-500 mt-1 flex items-center gap-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <span>{formatDateTime(message.sentAt)}</span>
            {isOwn && (
              <span className="flex items-center">
                {getMessageStatusIcon()}
              </span>
            )}
            {messageIsOptimistic && (
              <span className="text-orange-500">
                {language === 'no' ? '(venter)' : '(pending)'}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}