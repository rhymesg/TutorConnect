'use client';

import { Calendar, Clock, Check, X } from 'lucide-react';
import { Language } from '@/lib/translations';
import { ReactNode } from 'react';

interface AppointmentCardProps {
  appointmentData: {
    date?: string;
    dateTime?: string;
    startTime?: string;
    endTime?: string;
    endDateTime?: string;
    location?: string;
  };
  status: string;
  language: Language;
  title?: string;
  showStatusBadge?: boolean;
  statusPosition?: 'top' | 'bottom';
  extraContent?: ReactNode; // Se avtale 버튼 등
  className?: string;
}

export default function AppointmentCard({
  appointmentData,
  status,
  language,
  title,
  showStatusBadge = true,
  statusPosition = 'top',
  extraContent,
  className = ''
}: AppointmentCardProps) {
  const t = language === 'no' ? {
    proposedTime: 'Foreslått tid',
    appointmentDetails: 'Avtaledetaljer',
    pending: 'Venter på svar',
    confirmed: 'Bekreftet',
    cancelled: 'Avbrutt',
    waiting_to_complete: 'Venter på fullføring',
    completed: 'Fullført'
  } : {
    proposedTime: 'Proposed time',
    appointmentDetails: 'Appointment Details',
    pending: 'Pending',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    waiting_to_complete: 'Waiting to complete',
    completed: 'Completed'
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Invalid Date';
    
    let date;
    if (dateStr.includes('T')) {
      date = new Date(dateStr);
    } else if (dateStr.includes('-') && dateStr.length === 10) {
      date = new Date(dateStr + 'T00:00:00');
    } else {
      date = new Date(dateStr);
    }
    
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString(language === 'no' ? 'nb-NO' : 'en-US', options);
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    
    if (timeStr.length === 5 && timeStr.includes(':') && !timeStr.includes('T')) {
      return timeStr;
    }
    
    let date;
    if (timeStr.includes('T')) {
      date = new Date(timeStr);
    } else {
      const today = new Date().toISOString().split('T')[0];
      date = new Date(`${today}T${timeStr}`);
    }
    
    if (isNaN(date.getTime())) return '';
    
    return date.toLocaleTimeString(language === 'no' ? 'nb-NO' : 'en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  };

  const getStatusBadge = () => {
    if (!showStatusBadge) return null;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
        status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
        status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
        status === 'WAITING_TO_COMPLETE' ? 'bg-orange-100 text-orange-800' :
        status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {status === 'CONFIRMED' && <Check className="h-4 w-4" />}
        {status === 'CANCELLED' && <X className="h-4 w-4" />}
        {status === 'WAITING_TO_COMPLETE' && <Clock className="h-4 w-4" />}
        {status === 'COMPLETED' && <Check className="h-4 w-4" />}
        {t[status.toLowerCase() as keyof typeof t] || status}
      </div>
    );
  };

  const displayTitle = title || t.proposedTime;

  return (
    <div className={`p-4 rounded-lg border-2 ${
      status === 'CONFIRMED' ? 'border-green-200 bg-green-50' :
      status === 'CANCELLED' ? 'border-red-200 bg-red-50' :
      status === 'WAITING_TO_COMPLETE' ? 'border-orange-200 bg-orange-50' :
      status === 'COMPLETED' ? 'border-blue-200 bg-blue-50' :
      'border-blue-200 bg-blue-50'
    } ${className}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${
          status === 'CONFIRMED' ? 'bg-green-100' :
          status === 'CANCELLED' ? 'bg-red-100' :
          status === 'WAITING_TO_COMPLETE' ? 'bg-orange-100' :
          status === 'COMPLETED' ? 'bg-blue-100' :
          'bg-blue-100'
        }`}>
          <Calendar className={`h-5 w-5 ${
            status === 'CONFIRMED' ? 'text-green-600' :
            status === 'CANCELLED' ? 'text-red-600' :
            status === 'WAITING_TO_COMPLETE' ? 'text-orange-600' :
            status === 'COMPLETED' ? 'text-blue-600' :
            'text-blue-600'
          }`} />
        </div>
        
        <div className="flex-1">
          {/* Title and status badge */}
          <div className={`${statusPosition === 'top' ? 'flex items-center justify-between' : ''} mb-2`}>
            <h3 className="font-medium text-gray-900">
              {displayTitle}
            </h3>
            {statusPosition === 'top' && getStatusBadge()}
          </div>
          
          {/* Appointment details */}
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(appointmentData.date || appointmentData.dateTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                {formatTime(appointmentData.startTime || appointmentData.dateTime)} - 
                {formatTime(appointmentData.endTime || appointmentData.endDateTime)}
              </span>
            </div>
            {appointmentData.location && (
              <div className="flex items-start gap-2">
                <span className="mt-0.5">📍</span>
                <span>{appointmentData.location}</span>
              </div>
            )}
          </div>
          
          {/* Bottom status or extra content */}
          {(statusPosition === 'bottom' || extraContent) && (
            <div className="mt-3">
              {statusPosition === 'bottom' && getStatusBadge()}
              {extraContent}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}