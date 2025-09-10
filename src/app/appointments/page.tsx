'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, User, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/lib/translations';
import { getSubjectLabel } from '@/constants/subjects';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Appointment {
  id: string;
  dateTime: string;
  duration: number;
  location: string;
  status: 'PENDING' | 'CONFIRMED' | 'WAITING_TO_COMPLETE' | 'COMPLETED' | 'CANCELLED';
  chatId: string;
  otherUser: {
    id: string;
    name: string;
    profileImage?: string;
  } | null;
  relatedPost: {
    id: string;
    title: string;
    subject: string;
    type: string;
  } | null;
}

export default function AppointmentsPage() {
  const router = useRouter();
  const language = useLanguage();
  const { user, accessToken } = useAuth();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'WAITING_TO_COMPLETE' | 'COMPLETED' | 'CANCELLED'>('ALL');

  const t = {
    no: {
      title: 'Mine timer',
      noAppointments: 'Ingen avtaler enda',
      noAppointmentsDesc: 'Du har ingen planlagte avtaler',
      pending: 'Venter',
      confirmed: 'Bekreftet',
      waiting_to_complete: 'Venter på fullføring',
      completed: 'Fullført',
      cancelled: 'Avbrutt',
      all: 'Alle',
      with: 'med',
      subject: 'Fag',
      duration: 'minutter',
      goToChat: 'Gå til chat',
      online: 'Online',
      error: 'Feil ved lasting av avtaler'
    },
    en: {
      title: 'My Appointments',
      noAppointments: 'No appointments yet',
      noAppointmentsDesc: 'You have no scheduled appointments',
      pending: 'Pending',
      confirmed: 'Confirmed',
      waiting_to_complete: 'Waiting to Complete',
      completed: 'Completed',
      cancelled: 'Cancelled',
      all: 'All',
      with: 'with',
      subject: 'Subject',
      duration: 'minutes',
      goToChat: 'Go to chat',
      online: 'Online',
      error: 'Error loading appointments'
    }
  };

  const translations = t[language];

  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    CONFIRMED: 'bg-green-100 text-green-800 border-green-200',
    WAITING_TO_COMPLETE: 'bg-orange-100 text-orange-800 border-orange-200',
    COMPLETED: 'bg-blue-100 text-blue-800 border-blue-200',
    CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  };

  useEffect(() => {
    if (user && accessToken) {
      fetchAppointments();
    }
  }, [user, accessToken]);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if user is authenticated
      if (!user || !accessToken) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/appointments', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid, redirect to login
          router.push('/auth/login');
          return;
        }
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();
      setAppointments(data.data.appointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError(translations.error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const timeString = date.toLocaleTimeString(language === 'no' ? 'nb-NO' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    if (date.toDateString() === today.toDateString()) {
      return `${language === 'no' ? 'I dag' : 'Today'} ${timeString}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `${language === 'no' ? 'I morgen' : 'Tomorrow'} ${timeString}`;
    } else {
      const dateString = date.toLocaleDateString(language === 'no' ? 'nb-NO' : 'en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      return `${dateString} ${timeString}`;
    }
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    router.push(`/chat?id=${appointment.chatId}`);
  };

  const filteredAppointments = appointments.filter(appointment => 
    filter === 'ALL' || appointment.status === filter
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {translations.title}
          </h1>
          
          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2">
            {(['ALL', 'PENDING', 'CONFIRMED', 'WAITING_TO_COMPLETE', 'COMPLETED', 'CANCELLED'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
                }`}
              >
                {translations[status.toLowerCase() as keyof typeof translations] || status}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">{error}</div>
            <button 
              onClick={fetchAppointments}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {language === 'no' ? 'Prøv igjen' : 'Retry'}
            </button>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {translations.noAppointments}
            </h3>
            <p className="text-gray-500">
              {translations.noAppointmentsDesc}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map(appointment => (
              <div
                key={appointment.id}
                onClick={() => handleAppointmentClick(appointment)}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Date and time */}
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-gray-900">
                        {formatDateTime(appointment.dateTime)}
                      </span>
                      <Clock className="h-4 w-4 text-gray-400 ml-2" />
                      <span className="text-sm text-gray-600">
                        {appointment.duration} {translations.duration}
                      </span>
                    </div>

                    {/* Other user */}
                    {appointment.otherUser && (
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">
                          {translations.with} {appointment.otherUser.name}
                        </span>
                      </div>
                    )}

                    {/* Subject */}
                    {appointment.relatedPost && (
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">{translations.subject}:</span> {getSubjectLabel(appointment.relatedPost.subject)}
                      </div>
                    )}

                    {/* Location */}
                    {appointment.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {appointment.location}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {/* Status */}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[appointment.status]}`}>
                      {translations[appointment.status.toLowerCase() as keyof typeof translations]}
                    </span>

                    {/* Go to chat button */}
                    <button className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium">
                      <MessageCircle className="h-4 w-4" />
                      {translations.goToChat}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}