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
  const router = useRouter();
  const t = chatTranslations[language];

  // Get badges for the other user (like in ChatRoomList component)
  const getOtherUserBadges = () => {
    const otherUser = chat.otherParticipant?.user || chat.relatedPost?.user;
    if (!otherUser) return { teacherBadge: null, studentBadge: null };

    const teacherBadge = getTeacherBadge(otherUser.teacherSessions || 0, otherUser.teacherStudents || 0);
    const studentBadge = getStudentBadge(otherUser.studentSessions || 0, otherUser.studentTeachers || 0);
    
    return { teacherBadge, studentBadge };
  };

  const { teacherBadge, studentBadge } = getOtherUserBadges();

  return (
    <>
      <div className="p-4 bg-white border-b border-gray-200 relative z-0 flex-shrink-0">
        <div className="flex flex-col gap-2 md:gap-0 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {chat.displayImage ? (
                <img
                  src={chat.displayImage}
                  alt={chat.displayName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-400" />
                </div>
              )}
              {chat.isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              )}
            </div>

            {/* User info */}
            <div className="min-w-0 flex-1">
              {/* First row: User info */}
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
              
              {/* Second row: Action buttons (mobile only) */}
              <div className="md:hidden flex items-center gap-2 mt-2 flex-wrap">
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
                  data-testid="chat-header-view-appointments"
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
          
          {/* Desktop action buttons */}
          <div className="hidden md:flex items-center gap-4">
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
              data-testid="chat-header-view-appointments"
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
    </>
  );
}