'use client';

import { useState } from 'react';
import { Calendar, Clock, Check, X } from 'lucide-react';
import { Language } from '@/lib/translations';
import { Message } from '@/types/chat';

interface AppointmentResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message;
  language: Language;
  onAccept: () => Promise<void>;
  onReject: () => Promise<void>;
  error?: string | null;
}

export default function AppointmentResponseModal({
  isOpen,
  onClose,
  message,
  language,
  onAccept,
  onReject,
  error
}: AppointmentResponseModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const t = language === 'no' ? {
    title: 'Avtaleforespørsel',
    proposedTime: 'Foreslått tid',
    accept: 'Godta',
    reject: 'Avslå',
    cancel: 'Lukk',
    from: 'Fra',
    alreadyResponded: 'Du har allerede svart på denne avtalen'
  } : {
    title: 'Appointment Request',
    proposedTime: 'Proposed time',
    accept: 'Accept',
    reject: 'Reject', 
    cancel: 'Close',
    from: 'From',
    alreadyResponded: 'You have already responded to this appointment'
  };

  if (!isOpen) return null;

  // Parse appointment data
  let appointmentData;
  try {
    appointmentData = JSON.parse(message.content);
  } catch {
    appointmentData = message.appointment || {};
  }

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

  const handleAccept = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await onAccept();
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await onReject();
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsProcessing(false);
    }
  };

  const status = message.appointment?.status || 'PENDING';
  const isAlreadyResponded = status !== 'PENDING';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {t.title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              {t.from}: <span className="font-medium">{message.sender.name}</span>
            </p>
          </div>

          {/* Appointment Details */}
          <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50 mb-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                <Calendar className="h-5 w-5 text-blue-600" />
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
              </div>
            </div>
          </div>

          {/* Status or Error */}
          {isAlreadyResponded && (
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm">
              {t.alreadyResponded}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {!isAlreadyResponded ? (
              <>
                <button
                  onClick={handleAccept}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  {t.accept}
                </button>
                <button
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <X className="h-4 w-4" />
                  {t.reject}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                {t.cancel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}