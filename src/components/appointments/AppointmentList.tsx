'use client';

import { useMemo } from 'react';
import { format, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns';
import { nb } from 'date-fns/locale';
import { 
  ClockIcon, 
  MapPinIcon, 
  UserIcon, 
  ChevronRightIcon,
  CalendarIcon,
  CheckIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

import { LoadingSpinner } from '../ui/LoadingSpinner';
import { formatNorwegianDateTime, formatNorwegianCurrency } from '../../schemas/appointments';
import type { AppointmentListProps, Appointment } from '../../types/appointments';

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
      };
    case 'CONFIRMED':
      return {
        label: 'Bekreftet',
        color: 'text-green-700 bg-green-100 border-green-200',
        icon: CheckIcon,
      };
    case 'COMPLETED':
      return {
        label: 'Fullført',
        color: 'text-gray-700 bg-gray-100 border-gray-200',
        icon: CheckIcon,
      };
    case 'CANCELLED':
      return {
        label: 'Kansellert',
        color: 'text-red-700 bg-red-100 border-red-200',
        icon: XCircleIcon,
      };
    default:
      return {
        label: status,
        color: 'text-gray-700 bg-gray-100 border-gray-200',
        icon: ExclamationTriangleIcon,
      };
  }
}

export function AppointmentList({
  appointments,
  onAppointmentClick,
  onStatusChange,
  groupBy = 'date',
  sortBy = 'dateTime',
  sortOrder = 'asc',
  showActions = true,
  loading = false,
  className = '',
}: AppointmentListProps) {
  // Sort appointments
  const sortedAppointments = useMemo(() => {
    const sorted = [...appointments].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'dateTime':
          aValue = new Date(a.dateTime).getTime();
          bValue = new Date(b.dateTime).getTime();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'status':
          const statusOrder = { 'PENDING': 1, 'CONFIRMED': 2, 'COMPLETED': 3, 'CANCELLED': 4 };
          aValue = statusOrder[a.status as keyof typeof statusOrder] || 5;
          bValue = statusOrder[b.status as keyof typeof statusOrder] || 5;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'desc') {
        return bValue - aValue;
      }
      return aValue - bValue;
    });
    
    return sorted;
  }, [appointments, sortBy, sortOrder]);

  // Group appointments
  const groupedAppointments = useMemo(() => {
    if (groupBy === 'none') {
      return { 'all': sortedAppointments };
    }

    return sortedAppointments.reduce((groups, appointment) => {
      let groupKey: string;
      
      switch (groupBy) {
        case 'date':
          groupKey = format(parseISO(appointment.dateTime), 'yyyy-MM-dd');
          break;
        case 'status':
          groupKey = appointment.status;
          break;
        case 'participant':
          const participant = appointment.chat?.participants?.[0];
          groupKey = participant?.user.name || 'Ukjent';
          break;
        default:
          groupKey = 'all';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(appointment);
      
      return groups;
    }, {} as Record<string, Appointment[]>);
  }, [sortedAppointments, groupBy]);

  const getGroupTitle = (groupKey: string, appointments: Appointment[]): string => {
    switch (groupBy) {
      case 'date':
        const date = parseISO(groupKey);
        return `${getRelativeDateLabel(date)} (${appointments.length})`;
      case 'status':
        const statusConfig = getStatusConfig(groupKey);
        return `${statusConfig.label} (${appointments.length})`;
      case 'participant':
        return `${groupKey} (${appointments.length})`;
      default:
        return `Alle avtaler (${appointments.length})`;
    }
  };

  const handleQuickStatusChange = (appointment: Appointment, newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(appointment.id, newStatus as any);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <CalendarIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-neutral-900 mb-2">Ingen avtaler</h3>
        <p className="text-neutral-600">
          Du har ingen avtaler som matcher de valgte kriteriene.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {Object.entries(groupedAppointments).map(([groupKey, groupAppointments]) => (
        <div key={groupKey} className="bg-white rounded-lg border border-neutral-200">
          {/* Group header */}
          {groupBy !== 'none' && (
            <div className="px-6 py-4 border-b border-neutral-100">
              <h3 className="text-lg font-semibold text-neutral-900">
                {getGroupTitle(groupKey, groupAppointments)}
              </h3>
            </div>
          )}

          {/* Appointments list */}
          <div className="divide-y divide-neutral-100">
            {groupAppointments.map((appointment) => {
              const participant = appointment.chat?.participants?.[0];
              const subject = appointment.chat?.relatedPost?.subject;
              const appointmentDate = parseISO(appointment.dateTime);
              const statusConfig = getStatusConfig(appointment.status);
              const isUpcoming = appointmentDate > new Date();
              const isPast = appointmentDate < new Date();
              
              return (
                <div
                  key={appointment.id}
                  className="p-6 hover:bg-neutral-50 cursor-pointer transition-colors"
                  onClick={() => onAppointmentClick(appointment)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Title and status */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-lg font-medium text-neutral-900 truncate">
                            {subject || 'Avtale'}
                            {participant && ` - ${participant.user.name}`}
                          </h4>
                          
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                            <statusConfig.icon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </span>
                        </div>

                        {showActions && (
                          <div className="flex items-center space-x-2">
                            {/* Quick actions based on status */}
                            {appointment.status === 'PENDING' && onStatusChange && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickStatusChange(appointment, 'CONFIRMED');
                                  }}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Bekreft avtale"
                                >
                                  <CheckIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickStatusChange(appointment, 'CANCELLED');
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Avlys avtale"
                                >
                                  <XCircleIcon className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            
                            {appointment.status === 'CONFIRMED' && isPast && onStatusChange && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickStatusChange(appointment, 'COMPLETED');
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Marker som fullført"
                              >
                                <CheckIcon className="h-4 w-4" />
                              </button>
                            )}

                            <ChevronRightIcon className="h-5 w-5 text-neutral-400" />
                          </div>
                        )}
                      </div>

                      {/* Appointment details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-neutral-600">
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-2 text-neutral-400" />
                          <div>
                            <div className="font-medium">
                              {groupBy !== 'date' && getRelativeDateLabel(appointmentDate)}
                            </div>
                            <div>
                              {format(appointmentDate, 'HH:mm')} 
                              ({appointment.duration} min)
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <MapPinIcon className="h-4 w-4 mr-2 text-neutral-400" />
                          <div className="truncate" title={appointment.location}>
                            {appointment.location}
                          </div>
                        </div>

                        {participant && (
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-2 text-neutral-400" />
                            <div className="truncate">
                              {participant.user.name}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Additional info */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm">
                          {appointment.price && (
                            <div className="font-medium text-neutral-900">
                              {formatNorwegianCurrency(appointment.price)}
                            </div>
                          )}
                          
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

                        {/* Readiness indicators for confirmed appointments */}
                        {appointment.status === 'CONFIRMED' && isUpcoming && (
                          <div className="flex items-center space-x-2 text-xs">
                            <div className={`flex items-center ${
                              appointment.teacherReady ? 'text-green-600' : 'text-neutral-400'
                            }`}>
                              <div className={`w-2 h-2 rounded-full mr-1 ${
                                appointment.teacherReady ? 'bg-green-500' : 'bg-neutral-300'
                              }`} />
                              Lærer
                            </div>
                            <div className={`flex items-center ${
                              appointment.studentReady ? 'text-green-600' : 'text-neutral-400'
                            }`}>
                              <div className={`w-2 h-2 rounded-full mr-1 ${
                                appointment.studentReady ? 'bg-green-500' : 'bg-neutral-300'
                              }`} />
                              Elev
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Notes preview */}
                      {appointment.notes && (
                        <div className="mt-3 p-3 bg-neutral-50 rounded-lg">
                          <p className="text-sm text-neutral-700 line-clamp-2">
                            {appointment.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default AppointmentList;