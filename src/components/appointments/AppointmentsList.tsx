'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, User, MessageCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Language, useLanguage } from '@/lib/translations';
import { getSubjectLabel } from '@/constants/subjects';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AppointmentResponseModal from '@/components/chat/AppointmentResponseModal';
import { Message } from '@/types/chat';
import { createOsloFormatter } from '@/lib/datetime';

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

interface AppointmentsListProps {
  chatId?: string;
  title: string;
  showBackButton?: boolean;
  backButtonText?: string;
  onBackClick?: () => void;
}

export default function AppointmentsList({
  chatId,
  title,
  showBackButton = false,
  backButtonText,
  onBackClick,
}: AppointmentsListProps) {
  const router = useRouter();
  const language = useLanguage();
  const { user, accessToken } = useAuth();
  const locale = language === 'no' ? 'nb-NO' : 'en-US';
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [appointmentError, setAppointmentError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  // Available filter options - split ALL into CURRENT and PAST
  const availableFilters = ['CURRENT', 'PAST', 'PENDING', 'CONFIRMED', 'WAITING_TO_COMPLETE', 'COMPLETED', 'CANCELLED'] as const;
    
  type FilterType = typeof availableFilters[number];
  const [filter, setFilter] = useState<FilterType>('CURRENT');

  const t = {
    no: {
      title,
      backToChat: backButtonText || 'Tilbake til chat',
      noAppointments: chatId ? 'Ingen avtaler enda' : 'Ingen avtaler enda',
      noAppointmentsDesc: chatId ? 'Dere har ingen planlagte avtaler for denne chatten' : 'Du har ingen planlagte avtaler',
      pending: 'Venter',
      confirmed: 'Bekreftet',
      waiting_to_complete: 'Venter på fullføring',
      completed: 'Fullført',
      cancelled: 'Avbrutt',
      current: 'Kommende',
      past: 'Tidligere',
      with: 'med',
      subject: 'Fag',
      duration: 'minutter',
      goToChat: 'Gå til chat',
      online: 'Online',
      error: 'Feil ved lasting av avtaler'
    },
    en: {
      title,
      backToChat: backButtonText || 'Back to chat',
      noAppointments: chatId ? 'No appointments yet' : 'No appointments yet',
      noAppointmentsDesc: chatId ? 'You have no scheduled appointments for this chat' : 'You have no scheduled appointments',
      pending: 'Pending',
      confirmed: 'Confirmed',
      waiting_to_complete: 'Waiting to Complete',
      completed: 'Completed',
      cancelled: 'Cancelled',
      current: 'Upcoming',
      past: 'Past',
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
  }, [user, accessToken, chatId]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if user is authenticated
      if (!user || !accessToken) {
        router.push('/auth/login');
        return;
      }

      // Build API URL with optional chatId filter
      const url = chatId 
        ? `/api/appointments?chatId=${chatId}` 
        : '/api/appointments';

      const response = await fetch(url, {
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
      // Remove duplicates based on appointment ID
      const uniqueAppointments = data.data.appointments.filter((appointment: Appointment, index: number, self: Appointment[]) => 
        self.findIndex(a => a.id === appointment.id) === index
      );
      setAppointments(uniqueAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError(translations.error);
    } finally {
      setIsLoading(false);
    }
  };

  const dateKeyFormatter = useMemo(
    () =>
      createOsloFormatter('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }),
    []
  );

  const timeFormatter = useMemo(
    () =>
      createOsloFormatter(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    [locale]
  );

  const dateFormatter = useMemo(
    () =>
      createOsloFormatter(locale, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    [locale]
  );

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    const todayKey = dateKeyFormatter.format(new Date());
    const tomorrowKey = dateKeyFormatter.format(new Date(Date.now() + 24 * 60 * 60 * 1000));
    const targetKey = dateKeyFormatter.format(date);
    const timeString = timeFormatter.format(date);

    if (targetKey === todayKey) {
      return `${language === 'no' ? 'I dag' : 'Today'} ${timeString}`;
    }

    if (targetKey === tomorrowKey) {
      return `${language === 'no' ? 'I morgen' : 'Tomorrow'} ${timeString}`;
    }

    return `${dateFormatter.format(date)} ${timeString}`;
  };

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else if (chatId) {
      // Default behavior for chat appointments page
      window.close();
      // Fallback if window.close() doesn't work
      setTimeout(() => {
        router.push(`/chat?id=${chatId}`);
      }, 100);
    }
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    // Card click opens modal
    setSelectedAppointment(appointment);
    setShowAppointmentModal(true);
    setAppointmentError(null);
  };

  const handleGoToChat = (e: React.MouseEvent, appointment: Appointment) => {
    e.stopPropagation(); // Prevent card click
    
    if (chatId) {
      // For chat-specific pages, close window and navigate parent to chat
      if (window.opener) {
        window.opener.location.href = `/chat?id=${appointment.chatId}`;
        window.close();
      } else {
        router.push(`/chat?id=${appointment.chatId}`);
      }
    } else {
      // For general appointments page, navigate to chat
      router.push(`/chat?id=${appointment.chatId}`);
    }
  };

  // Convert appointment to message format for the modal
  const convertAppointmentToMessage = (appointment: Appointment): Message => {
    return {
      id: `appointment-${appointment.id}`,
      content: JSON.stringify({
        dateTime: appointment.dateTime,
        location: appointment.location || '',
        duration: appointment.duration
      }),
      type: 'APPOINTMENT_REQUEST',
      chatId: appointment.chatId,
      senderId: user?.id || '',
      sentAt: new Date().toISOString(),
      sender: {
        id: user?.id || '',
        name: user?.name || '',
        profileImage: user?.profileImage,
        isActive: true
      },
      appointment: {
        id: appointment.id,
        dateTime: appointment.dateTime,
        location: appointment.location || '',
        status: appointment.status,
        duration: appointment.duration,
        teacherReady: false,
        studentReady: false,
        bothCompleted: false
      },
      appointmentId: appointment.id
    };
  };

  const handleAcceptAppointment = async () => {
    if (!selectedAppointment) return;
    
    try {
      const response = await fetch(`/api/appointments/${selectedAppointment.id}/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accepted: true }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Kunne ikke godta avtalen');
      }
      
      await fetchAppointments();
      setShowAppointmentModal(false);
    } catch (error: any) {
      setAppointmentError(error?.message || 'Kunne ikke godta avtalen');
      throw error;
    }
  };

  const handleRejectAppointment = async () => {
    if (!selectedAppointment) return;
    
    try {
      const response = await fetch(`/api/appointments/${selectedAppointment.id}/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accepted: false }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Kunne ikke avslå avtalen');
      }
      
      await fetchAppointments();
      setShowAppointmentModal(false);
    } catch (error: any) {
      setAppointmentError(error?.message || 'Kunne ikke avslå avtalen');
      throw error;
    }
  };

  const handleCompletedAppointment = async () => {
    if (!selectedAppointment) return;
    
    try {
      const response = await fetch(`/api/appointments/${selectedAppointment.id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: true }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Kunne ikke bekrefte at avtalen ble gjennomført');
      }
      
      await fetchAppointments();
      setShowAppointmentModal(false);
    } catch (error: any) {
      setAppointmentError(error?.message || 'Kunne ikke bekrefte at avtalen ble gjennomført');
      throw error;
    }
  };

  const handleNotCompletedAppointment = async () => {
    if (!selectedAppointment) return;
    
    try {
      const response = await fetch(`/api/appointments/${selectedAppointment.id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: false }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Kunne ikke markere avtalen som ikke gjennomført');
      }
      
      await fetchAppointments();
      setShowAppointmentModal(false);
    } catch (error: any) {
      setAppointmentError(error?.message || 'Kunne ikke markere avtalen som ikke gjennomført');
      throw error;
    }
  };

  const handleDeleteAppointment = async () => {
    if (!selectedAppointment) return;
    
    try {
      const response = await fetch(`/api/appointments/${selectedAppointment.id}/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Kunne ikke slette avtalen');
      }
      
      await fetchAppointments();
      setShowAppointmentModal(false);
    } catch (error: any) {
      setAppointmentError(error?.message || 'Kunne ikke slette avtalen');
      throw error;
    }
  };

  const filteredAndSortedAppointments = (() => {
    const now = new Date();
    let filtered: Appointment[];

    if (filter === 'CURRENT') {
      // Show current and future appointments (based on end time = startTime + duration)
      filtered = appointments.filter(appointment => {
        const startTime = new Date(appointment.dateTime);
        const endTime = new Date(startTime.getTime() + (appointment.duration * 60 * 1000));
        return endTime >= now;
      });
      // Sort by dateTime ascending (earliest first)
      return filtered.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    } else if (filter === 'PAST') {
      // Show past appointments (based on end time = startTime + duration)  
      filtered = appointments.filter(appointment => {
        const startTime = new Date(appointment.dateTime);
        const endTime = new Date(startTime.getTime() + (appointment.duration * 60 * 1000));
        return endTime < now;
      });
      // Sort by dateTime descending (most recent first)
      return filtered.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
    } else {
      // Show appointments by status
      filtered = appointments.filter(appointment => appointment.status === filter);
      // Sort by dateTime descending for status-based filtering
      return filtered.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
    }
  })();

  if (!isClient || isLoading) {
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
          {showBackButton && (
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={handleBackClick}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                {translations.backToChat}
              </button>
            </div>
          )}
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {translations.title}
          </h1>
          
          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2">
            {availableFilters.map(status => (
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
        ) : filteredAndSortedAppointments.length === 0 ? (
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
            {filteredAndSortedAppointments.map(appointment => (
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

                  <div className="flex flex-col justify-between h-full min-h-[80px]">
                    {/* Status */}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[appointment.status]} self-end`}>
                      {translations[appointment.status.toLowerCase() as keyof typeof translations]}
                    </span>

                    {/* Go to chat button - pushed to bottom */}
                    <button 
                      onClick={(e) => handleGoToChat(e, appointment)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium self-end mt-4"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {translations.goToChat}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Appointment Response Modal */}
        {showAppointmentModal && selectedAppointment && (
          <AppointmentResponseModal
            isOpen={showAppointmentModal}
            onClose={() => {
              setShowAppointmentModal(false);
              setSelectedAppointment(null);
              setAppointmentError(null);
            }}
            message={convertAppointmentToMessage(selectedAppointment)}
            language={language}
            onAccept={handleAcceptAppointment}
            onReject={handleRejectAppointment}
            onCompleted={handleCompletedAppointment}
            onNotCompleted={handleNotCompletedAppointment}
            onDelete={handleDeleteAppointment}
            error={appointmentError}
          />
        )}
      </div>
    </div>
  );
}
