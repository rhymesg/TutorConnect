'use client';

import { format, parseISO } from 'date-fns';
import { nb } from 'date-fns/locale';
import { 
  CheckIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  UserCheckIcon
} from '@heroicons/react/24/outline';
import type { Appointment } from '../../types/appointments';

interface AppointmentStatusProps {
  appointment: Appointment;
  currentUserId?: string;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface StatusConfig {
  label: string;
  description: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  icon: React.ComponentType<any>;
  dotColor: string;
}

function getStatusConfig(status: string, appointment?: Appointment): StatusConfig {
  switch (status) {
    case 'PENDING':
      return {
        label: 'Venter på bekreftelse',
        description: 'Avtalen må bekreftes av begge parter',
        color: 'text-yellow-700',
        backgroundColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        icon: ClockIcon,
        dotColor: 'bg-yellow-500',
      };
    case 'CONFIRMED':
      return {
        label: 'Bekreftet',
        description: 'Avtalen er bekreftet og klar',
        color: 'text-green-700',
        backgroundColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: CheckIcon,
        dotColor: 'bg-green-500',
      };
    case 'COMPLETED':
      return {
        label: 'Fullført',
        description: 'Avtalen er gjennomført',
        color: 'text-gray-700',
        backgroundColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        icon: CheckIcon,
        dotColor: 'bg-gray-500',
      };
    case 'CANCELLED':
      const reason = appointment?.cancellationReason;
      return {
        label: 'Kansellert',
        description: reason ? `Grunn: ${reason}` : 'Avtalen er kansellert',
        color: 'text-red-700',
        backgroundColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: XCircleIcon,
        dotColor: 'bg-red-500',
      };
    default:
      return {
        label: 'Ukjent status',
        description: 'Status er ikke definert',
        color: 'text-gray-700',
        backgroundColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        icon: ExclamationTriangleIcon,
        dotColor: 'bg-gray-500',
      };
  }
}

export function AppointmentStatus({
  appointment,
  currentUserId,
  showDetails = false,
  size = 'md',
  className = '',
}: AppointmentStatusProps) {
  const statusConfig = getStatusConfig(appointment.status, appointment);
  const appointmentDate = parseISO(appointment.dateTime);
  const isUpcoming = appointmentDate > new Date();

  const sizeClasses = {
    sm: {
      badge: 'px-2 py-1 text-xs',
      icon: 'h-3 w-3',
      dot: 'w-2 h-2',
      text: 'text-xs',
    },
    md: {
      badge: 'px-3 py-1 text-sm',
      icon: 'h-4 w-4',
      dot: 'w-3 h-3',
      text: 'text-sm',
    },
    lg: {
      badge: 'px-4 py-2 text-base',
      icon: 'h-5 w-5',
      dot: 'w-4 h-4',
      text: 'text-base',
    },
  };

  const classes = sizeClasses[size];

  if (!showDetails) {
    // Simple badge version
    return (
      <span 
        className={`inline-flex items-center rounded-full font-medium border ${statusConfig.color} ${statusConfig.backgroundColor} ${statusConfig.borderColor} ${classes.badge} ${className}`}
      >
        <statusConfig.icon className={`mr-1.5 ${classes.icon}`} />
        {statusConfig.label}
      </span>
    );
  }

  // Detailed version with readiness indicators
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main status */}
      <div className={`p-4 rounded-lg border ${statusConfig.backgroundColor} ${statusConfig.borderColor}`}>
        <div className="flex items-start space-x-3">
          <div className={`${statusConfig.dotColor} ${classes.dot} rounded-full flex-shrink-0 mt-1`} />
          
          <div className="flex-1 min-w-0">
            <div className={`font-semibold ${statusConfig.color} ${classes.text}`}>
              {statusConfig.label}
            </div>
            <div className={`${statusConfig.color} opacity-80 ${classes.text} mt-1`}>
              {statusConfig.description}
            </div>
            
            {/* Additional status info for confirmed appointments */}
            {appointment.status === 'CONFIRMED' && isUpcoming && (
              <div className="mt-3 space-y-2">
                <div className="text-xs text-neutral-600 font-medium">
                  Klarhet for time:
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center space-x-2 ${classes.text} ${
                    appointment.teacherReady ? 'text-green-600' : 'text-neutral-500'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      appointment.teacherReady ? 'bg-green-500' : 'bg-neutral-300'
                    }`} />
                    <UserCheckIcon className="h-4 w-4" />
                    <span>Lærer {appointment.teacherReady ? 'klar' : 'ikke klar'}</span>
                  </div>
                  
                  <div className={`flex items-center space-x-2 ${classes.text} ${
                    appointment.studentReady ? 'text-green-600' : 'text-neutral-500'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      appointment.studentReady ? 'bg-green-500' : 'bg-neutral-300'
                    }`} />
                    <UserCheckIcon className="h-4 w-4" />
                    <span>Elev {appointment.studentReady ? 'klar' : 'ikke klar'}</span>
                  </div>
                </div>

                {appointment.teacherReady && appointment.studentReady && (
                  <div className="flex items-center space-x-2 text-green-600 text-sm mt-2 p-2 bg-green-50 rounded-lg">
                    <CheckIcon className="h-4 w-4" />
                    <span className="font-medium">Begge parter er klare for timen</span>
                  </div>
                )}
              </div>
            )}

            {/* Completion status */}
            {appointment.status === 'COMPLETED' && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center space-x-2 text-sm text-neutral-600">
                  <CalendarIcon className="h-4 w-4" />
                  <span>
                    Fullført {format(appointmentDate, 'd. MMMM yyyy', { locale: nb })}
                  </span>
                </div>
                
                {appointment.bothCompleted && (
                  <div className="flex items-center space-x-2 text-green-600 text-sm">
                    <CheckIcon className="h-4 w-4" />
                    <span>Begge parter har bekreftet gjennomføring</span>
                  </div>
                )}
              </div>
            )}

            {/* Cancellation details */}
            {appointment.status === 'CANCELLED' && appointment.cancellationReason && (
              <div className="mt-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                <div className="text-xs font-medium text-neutral-700 mb-1">
                  Grunn for avlysning:
                </div>
                <div className="text-sm text-neutral-600">
                  {appointment.cancellationReason}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Time and date context */}
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-3 w-3" />
          <span>
            {format(appointmentDate, 'EEEE d. MMMM, HH:mm', { locale: nb })}
          </span>
        </div>
        
        <div>
          {isUpcoming ? (
            <span className="text-blue-600 font-medium">Kommende</span>
          ) : (
            <span className="text-neutral-400">Tidligere</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Utility component for status indicators in lists
export function StatusIndicator({ 
  status, 
  size = 'sm',
  showLabel = true,
  className = '' 
}: { 
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}) {
  const statusConfig = getStatusConfig(status);
  
  const sizeClasses = {
    sm: { dot: 'w-2 h-2', text: 'text-xs', spacing: 'space-x-1' },
    md: { dot: 'w-3 h-3', text: 'text-sm', spacing: 'space-x-2' },
    lg: { dot: 'w-4 h-4', text: 'text-base', spacing: 'space-x-2' },
  };

  const classes = sizeClasses[size];

  return (
    <div className={`flex items-center ${classes.spacing} ${className}`}>
      <div className={`${statusConfig.dotColor} ${classes.dot} rounded-full flex-shrink-0`} />
      {showLabel && (
        <span className={`${statusConfig.color} font-medium ${classes.text}`}>
          {statusConfig.label}
        </span>
      )}
    </div>
  );
}

export default AppointmentStatus;