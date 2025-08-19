'use client';

import { format, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns';
import { nb } from 'date-fns/locale';
import { 
  ClockIcon, 
  MapPinIcon, 
  UserIcon, 
  ChevronRightIcon,
  CheckIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftEllipsisIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { formatNorwegianCurrency } from '../../schemas/appointments';
import type { Appointment } from '../../types/appointments';

interface AppointmentCardProps {
  appointment: Appointment;
  onClick?: (appointment: Appointment) => void;
  onStatusChange?: (appointmentId: string, status: string) => void;
  onEdit?: (appointment: Appointment) => void;
  onOpenChat?: (appointment: Appointment) => void;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
  currentUserId?: string;
}

function getRelativeDateLabel(date: Date): string {
  if (isToday(date)) return 'I dag';
  if (isTomorrow(date)) return 'I morgen';
  if (isYesterday(date)) return 'I går';
  return format(date, 'EEEE d. MMMM', { locale: nb });
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'PENDING':
      return {
        label: 'Venter',
        color: 'text-yellow-700 bg-yellow-100 border-yellow-200',
        icon: ClockIcon,
        dotColor: 'bg-yellow-500',
      };
    case 'CONFIRMED':
      return {
        label: 'Bekreftet',
        color: 'text-green-700 bg-green-100 border-green-200',
        icon: CheckIcon,
        dotColor: 'bg-green-500',
      };
    case 'COMPLETED':
      return {
        label: 'Fullført',
        color: 'text-gray-700 bg-gray-100 border-gray-200',
        icon: CheckIcon,
        dotColor: 'bg-gray-500',
      };
    case 'CANCELLED':
      return {
        label: 'Kansellert',
        color: 'text-red-700 bg-red-100 border-red-200',
        icon: XCircleIcon,
        dotColor: 'bg-red-500',
      };
    default:
      return {
        label: status,
        color: 'text-gray-700 bg-gray-100 border-gray-200',
        icon: ExclamationTriangleIcon,
        dotColor: 'bg-gray-500',
      };
  }
}

export function AppointmentCard({
  appointment,
  onClick,
  onStatusChange,
  onEdit,
  onOpenChat,
  showActions = true,
  compact = false,
  className = '',
  currentUserId,
}: AppointmentCardProps) {
  const participant = appointment.chat?.participants?.find(p => p.user.id !== currentUserId)?.user;
  const subject = appointment.chat?.relatedPost?.subject;
  const appointmentDate = parseISO(appointment.dateTime);
  const statusConfig = getStatusConfig(appointment.status);
  const isUpcoming = appointmentDate > new Date();
  const isPast = appointmentDate < new Date();
  
  // Determine if current user is the teacher
  const isTeacher = appointment.chat?.relatedPost?.type === 'TEACHER';
  const canEdit = isUpcoming && (appointment.status === 'PENDING' || appointment.status === 'CONFIRMED');
  const canCancel = isUpcoming && appointment.status !== 'CANCELLED';
  const canComplete = isPast && appointment.status === 'CONFIRMED';

  const handleQuickStatusChange = (e: React.MouseEvent, newStatus: string) => {
    e.stopPropagation();
    if (onStatusChange) {
      onStatusChange(appointment.id, newStatus);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(appointment);
    }
  };

  const handleOpenChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenChat) {
      onOpenChat(appointment);
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(appointment);
    }
  };

  if (compact) {
    return (
      <div
        className={`bg-white border border-neutral-200 rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer ${className}`}
        onClick={handleCardClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div 
              className={`w-3 h-3 rounded-full flex-shrink-0 ${statusConfig.dotColor}`}
            />
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-medium text-neutral-900 truncate text-sm">
                  {subject || 'Avtale'}
                </h4>
                {participant && (
                  <span className="text-neutral-600 text-xs">
                    med {participant.name}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-4 text-xs text-neutral-600">
                <div className="flex items-center">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  {format(appointmentDate, 'HH:mm')}
                </div>
                <div className="flex items-center">
                  <MapPinIcon className="h-3 w-3 mr-1" />
                  <span className="truncate">{appointment.location}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
            <ChevronRightIcon className="h-4 w-4 text-neutral-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white border border-neutral-200 rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer ${className}`}
      onClick={handleCardClick}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div 
              className={`w-4 h-4 rounded-full flex-shrink-0 ${statusConfig.dotColor}`}
            />
            
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                {subject || 'Avtale'}
              </h3>
              {participant && (
                <div className="flex items-center text-neutral-600">
                  <UserIcon className="h-4 w-4 mr-2" />
                  <span>{participant.name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusConfig.color}`}>
              <statusConfig.icon className="h-4 w-4 mr-2" />
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Date and time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-neutral-700">
            <CalendarIcon className="h-5 w-5 mr-3 text-neutral-400" />
            <div>
              <div className="font-medium">
                {getRelativeDateLabel(appointmentDate)}
              </div>
              <div className="text-sm text-neutral-600">
                {format(appointmentDate, 'd. MMMM yyyy', { locale: nb })}
              </div>
            </div>
          </div>

          <div className="flex items-center text-neutral-700">
            <ClockIcon className="h-5 w-5 mr-3 text-neutral-400" />
            <div>
              <div className="font-medium">
                {format(appointmentDate, 'HH:mm')} ({appointment.duration} min)
              </div>
              <div className="text-sm text-neutral-600">
                Varighet: {Math.floor(appointment.duration / 60)}t {appointment.duration % 60}min
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center text-neutral-700 mb-4">
          <MapPinIcon className="h-5 w-5 mr-3 text-neutral-400" />
          <div>
            <div className="font-medium">{appointment.location}</div>
            {appointment.specificLocation && (
              <div className="text-sm text-neutral-600">{appointment.specificLocation}</div>
            )}
          </div>
        </div>

        {/* Additional info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {appointment.price && (
              <div className="text-lg font-semibold text-neutral-900">
                {formatNorwegianCurrency(appointment.price)}
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              {appointment.isTrialLesson && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Prøvetime
                </span>
              )}
              
              {appointment.specialRate && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Spesialpris
                </span>
              )}
            </div>
          </div>

          {/* Readiness indicators for confirmed appointments */}
          {appointment.status === 'CONFIRMED' && isUpcoming && (
            <div className="flex items-center space-x-3 text-xs">
              <div className={`flex items-center ${
                appointment.teacherReady ? 'text-green-600' : 'text-neutral-400'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  appointment.teacherReady ? 'bg-green-500' : 'bg-neutral-300'
                }`} />
                Lærer klar
              </div>
              <div className={`flex items-center ${
                appointment.studentReady ? 'text-green-600' : 'text-neutral-400'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  appointment.studentReady ? 'bg-green-500' : 'bg-neutral-300'
                }`} />
                Elev klar
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        {appointment.notes && (
          <div className="mb-4 p-3 bg-neutral-50 rounded-lg">
            <p className="text-sm text-neutral-700">{appointment.notes}</p>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
            <div className="flex items-center space-x-2">
              {/* Quick status actions */}
              {appointment.status === 'PENDING' && onStatusChange && (
                <>
                  <button
                    onClick={(e) => handleQuickStatusChange(e, 'CONFIRMED')}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
                  >
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Bekreft
                  </button>
                  <button
                    onClick={(e) => handleQuickStatusChange(e, 'CANCELLED')}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                  >
                    <XCircleIcon className="h-4 w-4 mr-2" />
                    Avlys
                  </button>
                </>
              )}
              
              {canComplete && onStatusChange && (
                <button
                  onClick={(e) => handleQuickStatusChange(e, 'COMPLETED')}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Marker fullført
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Open chat */}
              {onOpenChat && appointment.chatId && (
                <button
                  onClick={handleOpenChat}
                  className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                  title="Åpne samtale"
                >
                  <ChatBubbleLeftEllipsisIcon className="h-5 w-5" />
                </button>
              )}

              {/* Edit appointment */}
              {canEdit && onEdit && (
                <button
                  onClick={handleEdit}
                  className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                  title="Rediger avtale"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AppointmentCard;