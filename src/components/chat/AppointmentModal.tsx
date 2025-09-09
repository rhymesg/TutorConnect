'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { Language } from '@/lib/translations';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (appointment: AppointmentData) => void;
  language: Language;
  chatId: string;
  error?: string | null;
}

export interface AppointmentData {
  date: string;
  startTime: string;
  endTime: string;
}

export default function AppointmentModal({
  isOpen,
  onClose,
  onSubmit,
  language,
  chatId,
  error
}: AppointmentModalProps) {
  const t = language === 'no' ? {
    title: 'Avtale time',
    date: 'Dato',
    startTime: 'Fra',
    endTime: 'Til',
    submit: 'Send forespørsel',
    cancel: 'Avbryt'
  } : {
    title: 'Schedule Time',
    date: 'Date',
    startTime: 'From',
    endTime: 'To',
    submit: 'Send Request',
    cancel: 'Cancel'
  };

  const [formData, setFormData] = useState<AppointmentData>({
    date: '',
    startTime: '',
    endTime: ''
  });

  const [hasExistingAppointment, setHasExistingAppointment] = useState(false);
  const [isCheckingDate, setIsCheckingDate] = useState(false);
  const [timeError, setTimeError] = useState<string | null>(null);

  // Check for existing appointments when date changes
  useEffect(() => {
    const checkAppointment = async () => {
      if (!formData.date || !chatId) return;
      
      setIsCheckingDate(true);
      try {
        const response = await fetch(`/api/chat/${chatId}/appointments/check?date=${formData.date}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setHasExistingAppointment(data.data.hasAppointment);
        }
      } catch (error) {
        console.error('Failed to check appointment:', error);
      } finally {
        setIsCheckingDate(false);
      }
    };

    checkAppointment();
  }, [formData.date, chatId]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        date: '',
        startTime: '',
        endTime: ''
      });
      setHasExistingAppointment(false);
      setIsCheckingDate(false);
      setTimeError(null);
    }
  }, [isOpen]);

  // Validate times when they change
  useEffect(() => {
    let error = null;
    
    if (formData.startTime || formData.endTime) {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      
      // Check if start time is in the past (only for today)
      if (formData.date === today && formData.startTime && formData.startTime <= currentTime) {
        error = language === 'no' ? 'Starttid må være etter nåværende tid' : 'Start time must be after current time';
      }
      // Check if end time is after start time
      else if (formData.startTime && formData.endTime && formData.endTime <= formData.startTime) {
        error = language === 'no' ? 'Sluttid må være etter starttid' : 'End time must be after start time';
      }
    }
    
    setTimeError(error);
  }, [formData.startTime, formData.endTime, formData.date, language]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.startTime || !formData.endTime) {
      return;
    }
    
    // Check validation errors
    if (timeError || hasExistingAppointment) {
      return;
    }
    
    onSubmit(formData);
    // Don't close here - let the parent handle closing on success
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg max-w-sm w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">{t.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="inline h-4 w-4 mr-1" />
                {t.date}
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => {
                  setFormData({ ...formData, date: e.target.value });
                  setHasExistingAppointment(false); // Reset check
                }}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              
              {/* Show appointment check result */}
              {formData.date && (
                <div className="mt-2">
                  {isCheckingDate ? (
                    <div className="text-sm text-gray-500">Sjekker dato...</div>
                  ) : hasExistingAppointment ? (
                    <div className="text-sm text-red-600">
                      Det finnes allerede en avtale for denne datoen.
                    </div>
                  ) : formData.date ? (
                    <div className="text-sm text-green-600">
                      Datoen er tilgjengelig.
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="inline h-4 w-4 mr-1" />
                  {t.startTime}
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="inline h-4 w-4 mr-1" />
                  {t.endTime}
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Show time validation error */}
            {timeError && (
              <div className="text-sm text-red-600 mt-1">
                {timeError}
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={hasExistingAppointment || isCheckingDate || !!timeError}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  hasExistingAppointment || isCheckingDate || timeError
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isCheckingDate ? 'Sjekker...' : t.submit}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}