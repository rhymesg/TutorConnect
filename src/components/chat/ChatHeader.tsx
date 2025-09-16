'use client';

// import { useState } from 'react'; // TODO: Re-add when menu functionality is implemented
import { useRouter } from 'next/navigation';
import { 
  Phone, 
  Video, 
  // MoreVertical, // TODO: Re-add when menu functionality is implemented
  User, 
  // Archive, // TODO: Re-add when menu functionality is implemented
  // Trash2, // TODO: Re-add when menu functionality is implemented
  // Shield, // TODO: Re-add when menu functionality is implemented
  // Flag, // TODO: Re-add when menu functionality is implemented
  // Settings, // TODO: Re-add when menu functionality is implemented
  ChevronLeft
  // Calendar // TODO: Re-add when calendar functionality is implemented (now using text button)
} from 'lucide-react';
import { ChatListItem } from '@/types/chat';
import { Language, chat as chatTranslations } from '@/lib/translations';
import { getTeacherBadge, getStudentBadge } from '@/lib/badges';

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
  onScheduleAppointment?: () => void;
  onViewAppointments?: () => void;
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
  onScheduleAppointment,
  onViewAppointments,
}: ChatHeaderProps) {
  const t = chatTranslations[language];
  const router = useRouter();
  // const [showMenu, setShowMenu] = useState(false); // TODO: Re-enable when menu functionality is implemented
  
  // Get badges for the other user - use same pattern as PostCard and InlineProfileView
  const getOtherUserBadges = () => {
    // Get the other participant's data
    const otherUser = chat.otherParticipant?.user || chat.relatedPost?.user;
    if (!otherUser) return { teacherBadge: null, studentBadge: null };
    
    // Calculate badges based on user's session data
    const teacherBadge = getTeacherBadge(otherUser.teacherSessions || 0, otherUser.teacherStudents || 0);
    const studentBadge = getStudentBadge(otherUser.studentSessions || 0, otherUser.studentTeachers || 0);
    
    return { teacherBadge, studentBadge };
  };

  const { teacherBadge, studentBadge } = getOtherUserBadges();

  /* TODO: Re-enable when menu functionality is implemented
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
  */

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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {/* Show displayName (other participant's name) - same as ChatRoomList */}
                {(chat.otherParticipant?.user?.id || chat.relatedPost?.user?.id) ? (
                  <button
                    onClick={() => window.open(`/profile/${chat.otherParticipant?.user?.id || chat.relatedPost?.user?.id}`, '_blank', 'noopener,noreferrer,width=800,height=600')}
                    className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate cursor-pointer text-left"
                  >
                    {chat.displayName}
                  </button>
                ) : (
                  <h2 className="text-lg font-semibold text-gray-900 truncate">
                    {chat.displayName}
                  </h2>
                )}
                
                {/* Badges - same pattern as InlineProfileView */}
                <div className="flex items-center space-x-1">
                  {teacherBadge && (
                    <button 
                      onClick={() => window.location.href = '/badges'}
                      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium hover:scale-105 transition-transform cursor-pointer ${teacherBadge.color}`}
                      title={`Lærer ${teacherBadge.level} - Klikk for mer info`}
                    >
                      <span className="mr-1">👨‍🏫</span>
                      <span>{teacherBadge.icon}</span>
                    </button>
                  )}
                  {studentBadge && (
                    <button 
                      onClick={() => window.location.href = '/badges'}
                      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium hover:scale-105 transition-transform cursor-pointer ${studentBadge.color}`}
                      title={`Student ${studentBadge.level} - Klikk for mer info`}
                    >
                      <span className="mr-1">🎓</span>
                      <span>{studentBadge.icon}</span>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center gap-4">
                {chat.relatedPost?.id && (
                  <button
                    onClick={() => router.push(`/posts/${chat.relatedPost.id}?from_chat=${chat.id}`)}
                    className="flex-shrink-0 inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    Se annonse
                    <svg className="ml-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                )}
                
                <button
                  onClick={onViewAppointments}
                  className="flex-shrink-0 inline-flex items-center text-sm text-green-600 hover:text-green-800 font-medium transition-colors"
                >
                  Se timer
                  <svg className="ml-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
                
                <button
                  onClick={onScheduleAppointment}
                  className="flex-shrink-0 inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-md hover:bg-blue-200 border border-blue-200 hover:border-blue-300 transition-colors"
                  title="Avtale undervisningstime"
                >
                  Avtale time
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
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

          {/* TODO: Implement menu functionality (settings, archive, block, report, delete)
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
              title={t.header.settings}
            >
              <MoreVertical className="h-5 w-5" />
            </button>

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
          */}
        </div>
      </div>
      
      {/* Instruction banner */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-1">
        <p className="text-center text-xs text-gray-600">
          {language === 'no' 
            ? `Chat med ${chat.displayName} og klikk "Avtale time" for å booke undervisning`
            : `Chat with ${chat.displayName} and click "Schedule time" to book tutoring`
          }
        </p>
      </div>

      {/* TODO: Re-enable when menu functionality is implemented
      {showMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowMenu(false)}
        />
      )}
      */}
    </>
  );
}