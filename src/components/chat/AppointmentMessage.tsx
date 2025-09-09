'use client';

import { Calendar, Clock, Check, X } from 'lucide-react';
import { Language } from '@/lib/translations';
import { Message } from '@/types/chat';

interface AppointmentMessageProps {
  message: Message;
  isOwn: boolean;
  language: Language;
  onAccept?: () => void;
  onReject?: () => void;
  disabled?: boolean;
}

export default function AppointmentMessage({
  message,
  isOwn,
  language,
  onAccept,
  onReject,
  disabled = false
}: AppointmentMessageProps) {
  const t = language === 'no' ? {
    proposedTime: 'Foreslått tid',
    accept: 'Godta',
    reject: 'Avslå',
    pending: 'Venter på svar',
    confirmed: 'Bekreftet',
    rejected: 'Avslått',
    cancelled: 'Avbrutt',
    waitingForResponse: 'Venter på svar fra',
    youProposed: 'Du foreslo denne timen'
  } : {
    proposedTime: 'Proposed time',
    accept: 'Accept',
    reject: 'Reject',
    pending: 'Pending',
    confirmed: 'Confirmed',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    waitingForResponse: 'Waiting for response from',
    youProposed: 'You proposed this time'
  };

  // Parse appointment data
  let appointmentData;
  
  if (message.type === 'APPOINTMENT_RESPONSE') {
    // For response messages, use the appointment data from the database
    appointmentData = message.appointment ? {
      dateTime: message.appointment.dateTime,
      endDateTime: new Date(new Date(message.appointment.dateTime).getTime() + ((message.appointment.duration || 60) * 60 * 1000)),
      date: new Date(message.appointment.dateTime).toISOString().split('T')[0],
      startTime: new Date(message.appointment.dateTime).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Oslo' }),
      endTime: new Date(new Date(message.appointment.dateTime).getTime() + ((message.appointment.duration || 60) * 60 * 1000)).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Oslo' })
    } : {};
  } else {
    // For request messages, parse from content
    try {
      appointmentData = JSON.parse(message.content);
    } catch {
      appointmentData = message.appointment || {};
    }
  }
  
  console.log('AppointmentMessage - message type:', message.type);
  console.log('AppointmentMessage - message.appointment:', message.appointment);
  console.log('AppointmentMessage - appointmentData:', appointmentData);
  
  if (message.appointment) {
    console.log('Raw appointment dateTime:', message.appointment.dateTime);
    console.log('Duration:', message.appointment.duration);
    console.log('Parsed date:', new Date(message.appointment.dateTime));
    console.log('Local time string:', new Date(message.appointment.dateTime).toLocaleString());
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Invalid Date';
    
    let date;
    // Try different date formats
    if (dateStr.includes('T')) {
      // ISO datetime format
      date = new Date(dateStr);
    } else if (dateStr.includes('-') && dateStr.length === 10) {
      // YYYY-MM-DD format
      date = new Date(dateStr + 'T00:00:00');
    } else {
      date = new Date(dateStr);
    }
    
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateStr);
      return 'Invalid Date';
    }
    
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
    
    // If it's just time (HH:mm), return as is
    if (timeStr.length === 5 && timeStr.includes(':') && !timeStr.includes('T')) {
      return timeStr;
    }
    
    // Parse from datetime
    let date;
    if (timeStr.includes('T')) {
      date = new Date(timeStr);
    } else {
      // Assume it's a time string, create a date for today
      const today = new Date().toISOString().split('T')[0];
      date = new Date(`${today}T${timeStr}`);
    }
    
    if (isNaN(date.getTime())) {
      console.error('Invalid time:', timeStr);
      return '';
    }
    
    return date.toLocaleTimeString(language === 'no' ? 'nb-NO' : 'en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  };

  const status = message.appointment?.status || 'PENDING';
  const isResponse = message.type === 'APPOINTMENT_RESPONSE';

  return (
    <div className={`p-4 rounded-lg border-2 ${
      status === 'CONFIRMED' ? 'border-green-200 bg-green-50' :
      status === 'CANCELLED' ? 'border-red-200 bg-red-50' :
      'border-blue-200 bg-blue-50'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${
          status === 'CONFIRMED' ? 'bg-green-100' :
          status === 'CANCELLED' ? 'bg-red-100' :
          'bg-blue-100'
        }`}>
          <Calendar className={`h-5 w-5 ${
            status === 'CONFIRMED' ? 'text-green-600' :
            status === 'CANCELLED' ? 'text-red-600' :
            'text-blue-600'
          }`} />
        </div>
        
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 mb-2">
            {t.proposedTime}
          </h3>
          
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
          </div>
          
          {/* Status or Actions */}
          <div className="mt-3">
            {isOwn && !isResponse ? (
              <p className="text-sm text-gray-500 italic">{t.youProposed}</p>
            ) : status === 'PENDING' && !isOwn && !isResponse && onAccept && onReject ? (
              <div className="flex gap-2">
                <button
                  onClick={onAccept}
                  disabled={disabled}
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  {t.accept}
                </button>
                <button
                  onClick={onReject}
                  disabled={disabled}
                  className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <X className="h-4 w-4" />
                  {t.reject}
                </button>
              </div>
            ) : (
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {status === 'CONFIRMED' && <Check className="h-4 w-4" />}
                {status === 'CANCELLED' && <X className="h-4 w-4" />}
                {t[status.toLowerCase() as keyof typeof t] || status}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}