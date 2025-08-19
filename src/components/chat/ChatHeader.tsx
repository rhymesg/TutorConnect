'use client';

import { useState } from 'react';
import { 
  Phone, 
  Video, 
  MoreVertical, 
  User, 
  Info, 
  Archive, 
  Trash2, 
  Shield, 
  Flag,
  Settings,
  ChevronLeft,
  MapPin,
  DollarSign,
  Clock,
  GraduationCap,
  Calendar
} from 'lucide-react';
import { ChatListItem } from '@/types/chat';
import { Language, chat as chatTranslations, formatters } from '@/lib/translations';

interface ChatHeaderProps {
  chat: ChatListItem;
  language: Language;
  onBack?: () => void; // Mobile back navigation
  onCall?: () => void;
  onVideoCall?: () => void;
  onShowPostDetails?: () => void;
  onArchiveChat?: () => void;
  onDeleteChat?: () => void;
  onBlockUser?: () => void;
  onReportUser?: () => void;
  onSettings?: () => void;
}

export default function ChatHeader({
  chat,
  language,
  onBack,
  onCall,
  onVideoCall,
  onShowPostDetails,
  onArchiveChat,
  onDeleteChat,
  onBlockUser,
  onReportUser,
  onSettings,
}: ChatHeaderProps) {
  const t = chatTranslations[language];
  const [showMenu, setShowMenu] = useState(false);
  const [showPostDetails, setShowPostDetails] = useState(false);

  const getOnlineStatusText = () => {
    if (chat.isOnline) {
      return t.header.online;
    }
    return `${t.header.lastSeen} ${chat.lastSeenText}`;
  };

  const getTypingText = () => {
    // This would be connected to real typing indicators
    // For now, just a placeholder
    return null;
  };

  const handleMenuAction = (action: string) => {
    setShowMenu(false);
    
    switch (action) {
      case 'archive':
        onArchiveChat?.();
        break;
      case 'delete':
        onDeleteChat?.();
        break;
      case 'block':
        onBlockUser?.();
        break;
      case 'report':
        onReportUser?.();
        break;
      case 'settings':
        onSettings?.();
        break;
      default:
        break;
    }
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Mobile back button */}
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
          )}

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {chat.displayImage ? (
              <img
                src={chat.displayImage}
                alt={chat.displayName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-5 w-5 text-gray-400" />
              </div>
            )}
            
            {/* Online indicator */}
            {chat.isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
            )}
          </div>

          {/* User info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                {chat.displayName}
              </h2>
              {chat.relatedPost && (
                <button
                  onClick={() => setShowPostDetails(!showPostDetails)}
                  className="text-blue-600 hover:text-blue-700 p-1 rounded transition-colors"
                  title={t.header.about}
                >
                  <Info className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-1 text-sm text-gray-500">
              {getTypingText() || (
                <>
                  <div className={`w-2 h-2 rounded-full ${
                    chat.isOnline ? 'bg-green-400' : 'bg-gray-300'
                  }`} />
                  <span>{getOnlineStatusText()}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Quick actions for tutoring */}
          <button
            onClick={() => {
              // TODO: Open appointment scheduling modal
              console.log('Schedule appointment');
            }}
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
            title={language === 'no' ? 'Book undervisningstime' : 'Schedule tutoring session'}
          >
            <Calendar className="h-5 w-5" />
          </button>
          
          {/* Call buttons */}
          {onCall && (
            <button
              onClick={onCall}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
              title={t.header.call}
            >
              <Phone className="h-5 w-5" />
            </button>
          )}
          
          {onVideoCall && (
            <button
              onClick={onVideoCall}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
              title={t.header.videoCall}
            >
              <Video className="h-5 w-5" />
            </button>
          )}

          {/* More menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
              title={t.header.settings}
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {/* Menu dropdown */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                <button
                  onClick={() => handleMenuAction('settings')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                >
                  <Settings className="h-4 w-4" />
                  {t.header.settings}
                </button>
                
                <button
                  onClick={() => handleMenuAction('archive')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Archive className="h-4 w-4" />
                  {chat.isActive ? t.header.archive : t.header.unarchive}
                </button>
                
                <hr className="border-gray-100" />
                
                <button
                  onClick={() => handleMenuAction('block')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                >
                  <Shield className="h-4 w-4" />
                  {t.header.block}
                </button>
                
                <button
                  onClick={() => handleMenuAction('report')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                >
                  <Flag className="h-4 w-4" />
                  {t.header.report}
                </button>
                
                <button
                  onClick={() => handleMenuAction('delete')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                >
                  <Trash2 className="h-4 w-4" />
                  {t.header.delete}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post details panel */}
      {showPostDetails && chat.relatedPost && (
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  chat.relatedPost.type === 'TEACHER' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {chat.relatedPost.type === 'TEACHER' 
                    ? (language === 'no' ? 'Lærer' : 'Teacher')
                    : (language === 'no' ? 'Student' : 'Student')
                  }
                </div>
                <GraduationCap className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  {chat.relatedPost.subject}
                </span>
              </div>
              
              <h3 className="text-sm font-semibold text-blue-900 mb-2 line-clamp-2">
                {chat.relatedPost.title}
              </h3>
              
              <div className="flex flex-wrap items-center gap-4 text-xs text-blue-700">
                {chat.relatedPost.hourlyRate && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    <span>{formatters.currency(chat.relatedPost.hourlyRate)}/t</span>
                  </div>
                )}
                
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{chat.relatedPost.user.name}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{language === 'no' ? 'Fleksibel tid' : 'Flexible time'}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 ml-4">
              {onShowPostDetails && (
                <button
                  onClick={onShowPostDetails}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  {language === 'no' ? 'Se innlegg' : 'View post'}
                </button>
              )}
              
              <button
                onClick={() => setShowPostDetails(false)}
                className="text-blue-400 hover:text-blue-600 p-1 rounded transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowMenu(false)}
        />
      )}
    </>
  );
}