'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { useLanguage, useLanguageText } from '@/contexts/LanguageContext';

export interface AppointmentData {
  date: string;
  startTime: string;
  endTime: string;
  location: string;
}

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (appointment: AppointmentData) => void;
  chatId: string;
  error?: string | null;
  isSubmitting?: boolean;
}

export default function AppointmentModal({
  isOpen,
  onClose,
  onSubmit,
  chatId,
  error,
  isSubmitting = false,
}: AppointmentModalProps) {
  const { language } = useLanguage();
  const translate = useLanguageText();

  const labels = {
    title: translate('Avtale time', 'Schedule Time'),
    date: translate('Dato', 'Date'),
    start: translate('Fra', 'From'),
    end: translate('Til', 'To'),
    location: translate('Sted', 'Location'),
    optional: translate('Valgfritt', 'Optional'),
    submit: translate('Send forespørsel', 'Send Request'),
    cancel: translate('Avbryt', 'Cancel'),
    checking: translate('Sjekker dato...', 'Checking date...'),
    available: translate('Datoen er tilgjengelig.', 'Date is available.'),
    existing: translate('Det finnes allerede en avtale for denne datoen.', 'An appointment already exists on this date.'),
    sending: translate('Sender...', 'Sending...'),
    checkingShort: translate('Sjekker...', 'Checking...'),
    locationPlaceholder: translate('F.eks. Deichman bibliotek, Adresse', 'E.g. Deichman library, Address'),
    errors: {
      startPast: translate('Starttid må være etter nåværende tid', 'Start time must be after current time'),
      endBefore: translate('Sluttid må være etter starttid', 'End time must be after start time'),
    },
  };

  const [formData, setFormData] = useState<AppointmentData>({
    date: '',
    startTime: '',
    endTime: '',
    location: '',
  });
  const [hasExistingAppointment, setHasExistingAppointment] = useState(false);
  const [isCheckingDate, setIsCheckingDate] = useState(false);
  const [timeError, setTimeError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormData({ date: '', startTime: '', endTime: '', location: '' });
    setHasExistingAppointment(false);
    setIsCheckingDate(false);
    setTimeError(null);
  }, [isOpen]);

  useEffect(() => {
    const checkAppointment = async () => {
      if (!formData.date || !chatId) {
        return;
      }

      setIsCheckingDate(true);
      try {
        const response = await fetch(`/api/chat/${chatId}/appointments/check?date=${formData.date}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        setHasExistingAppointment(Boolean(data?.data?.hasAppointment));
      } catch (error) {
        console.error('Failed to check appointment:', error);
      } finally {
        setIsCheckingDate(false);
      }
    };

    checkAppointment();
  }, [formData.date, chatId]);

  useEffect(() => {
    let validationError: string | null = null;

    if (formData.startTime || formData.endTime) {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().slice(0, 5);

      if (formData.date === today && formData.startTime && formData.startTime <= currentTime) {
        validationError = labels.errors.startPast;
      } else if (formData.startTime && formData.endTime && formData.endTime <= formData.startTime) {
        validationError = labels.errors.endBefore;
      }
    }

    setTimeError(validationError);
  }, [formData.startTime, formData.endTime, formData.date, labels.errors.endBefore, labels.errors.startPast]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.date || !formData.startTime || !formData.endTime || !formData.location) {
      return;
    }

    if (timeError || hasExistingAppointment) {
      return;
    }

    onSubmit(formData);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg max-w-sm w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">{labels.title}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {labels.date}
              </label>
              <input
                type="date"
                value={formData.date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(event) => {
                  setFormData({ ...formData, date: event.target.value });
                  setHasExistingAppointment(false);
                }}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              {formData.date && (
                <div className="mt-2 text-sm">
                  {isCheckingDate ? (
                    <span className="text-gray-500">{labels.checking}</span>
                  ) : hasExistingAppointment ? (
                    <span className="text-red-600">{labels.existing}</span>
                  ) : (
                    <span className="text-green-600">{labels.available}</span>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">{labels.start}</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(event) => setFormData({ ...formData, startTime: event.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{labels.end}</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(event) => setFormData({ ...formData, endTime: event.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {timeError && <p className="text-sm text-red-600">{timeError}</p>}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {labels.location} <span className="text-gray-400 text-xs">({labels.optional})</span>
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(event) => setFormData({ ...formData, location: event.target.value })}
                placeholder={labels.locationPlaceholder}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

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
                {labels.cancel}
              </button>
              <button
                type="submit"
                disabled={hasExistingAppointment || isCheckingDate || Boolean(timeError) || isSubmitting}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  hasExistingAppointment || isCheckingDate || timeError || isSubmitting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {labels.sending}
                  </>
                ) : isCheckingDate ? (
                  labels.checkingShort
                ) : (
                  labels.submit
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
