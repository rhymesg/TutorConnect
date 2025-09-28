'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, User, MessageCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, useLanguageText } from '@/contexts/LanguageContext';
import { getSubjectLabel } from '@/constants/subjects';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AppointmentResponseModal from '@/components/chat/AppointmentResponseModal';
import { Message } from '@/types/chat';
import { createOsloFormatter } from '@/lib/datetime';
import AdsterraBanner from '@/components/ads/AdsterraBanner';
import { adPlacementIds } from '@/constants/adPlacements';

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
  const { language } = useLanguage();
  const t = useLanguageText();
  const { user, accessToken } = useAuth();
  const locale = language === 'no' ? 'nb-NO' : 'en-US';
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [appointmentError, setAppointmentError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isMobileAd, setIsMobileAd] = useState(false);

  const acceptAppointmentError = t('Kunne ikke godta avtalen', 'Could not accept the appointment');
  const rejectAppointmentError = t('Kunne ikke avslå avtalen', 'Could not decline the appointment');
  const confirmCompletedError = t('Kunne ikke bekrefte at avtalen ble gjennomført', 'Could not confirm the appointment was completed');
  const markNotCompletedError = t('Kunne ikke markere avtalen som ikke gjennomført', 'Could not mark the appointment as not completed');
  const deleteAppointmentError = t('Kunne ikke slette avtalen', 'Could not delete the appointment');

  // Available filter options - split ALL into CURRENT and PAST
  const availableFilters = ['CURRENT', 'PAST', 'PENDING', 'CONFIRMED', 'WAITING_TO_COMPLETE', 'COMPLETED', 'CANCELLED'] as const;
    
  type FilterType = typeof availableFilters[number];
  const [filter, setFilter] = useState<FilterType>('CURRENT');

  const translations = {
    title,
    backToChat: backButtonText ?? t('Tilbake til chat', 'Back to chat'),
    noAppointments: t('Ingen avtaler enda', 'No appointments yet'),
    noAppointmentsDesc: chatId
      ? t('Dere har ingen planlagte avtaler for denne chatten', 'You have no scheduled appointments for this chat')
      : t('Du har ingen planlagte avtaler', 'You have no scheduled appointments'),
    pending: t('Venter', 'Pending'),
    confirmed: t('Bekreftet', 'Confirmed'),
    waiting_to_complete: t('Venter på fullføring', 'Waiting to Complete'),
    completed: t('Fullført', 'Completed'),
    cancelled: t('Avbrutt', 'Cancelled'),
    current: t('Kommende', 'Upcoming'),
    past: t('Tidligere', 'Past'),
    with: t('med', 'with'),
    subject: t('Fag', 'Subject'),
    duration: t('minutter', 'minutes'),
    goToChat: t('Gå til chat', 'Go to chat'),
    online: t('Online', 'Online'),
    error: t('Feil ved lasting av avtaler', 'Error loading appointments'),
  };

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

  useEffect(() => {
    const updateAdBreakpoint = () => {
      if (typeof window === 'undefined') return;
      setIsMobileAd(window.innerWidth < 768);
    };
    updateAdBreakpoint();
    window.addEventListener('resize', updateAdBreakpoint);
    return () => window.removeEventListener('resize', updateAdBreakpoint);
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
      return `${t('I dag', 'Today')} ${timeString}`;
    }

    if (targetKey === tomorrowKey) {
      return `${t('I morgen', 'Tomorrow')} ${timeString}`;
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
        throw new Error(errorData.error || acceptAppointmentError);
      }
      
      await fetchAppointments();
      setShowAppointmentModal(false);
    } catch (error: any) {
      setAppointmentError(error?.message || acceptAppointmentError);
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
        throw new Error(errorData.error || rejectAppointmentError);
      }
      
      await fetchAppointments();
      setShowAppointmentModal(false);
    } catch (error: any) {
      setAppointmentError(error?.message || rejectAppointmentError);
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
        throw new Error(errorData.error || confirmCompletedError);
      }
      
      await fetchAppointments();
      setShowAppointmentModal(false);
    } catch (error: any) {
      setAppointmentError(error?.message || confirmCompletedError);
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
        throw new Error(errorData.error || markNotCompletedError);
      }
      
      await fetchAppointments();
      setShowAppointmentModal(false);
    } catch (error: any) {
      setAppointmentError(error?.message || markNotCompletedError);
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
        throw new Error(errorData.error || deleteAppointmentError);
      }
      
      await fetchAppointments();
      setShowAppointmentModal(false);
    } catch (error: any) {
      setAppointmentError(error?.message || deleteAppointmentError);
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
      <div className="flex min-h-[300px] items-center justify-center bg-neutral-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  let content: React.ReactNode;

  if (error) {
    content = (
      <div className="text-center">
        <div className="mb-4 text-red-600">{error}</div>
        <button
          onClick={fetchAppointments}
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          {t('Prøv igjen', 'Retry')}
        </button>
      </div>
    );
  } else if (filteredAndSortedAppointments.length === 0) {
    content = (
      <div className="text-center py-8">
        <Calendar className="mx-auto mb-4 h-16 w-16 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900">
          {translations.noAppointments}
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          {translations.noAppointmentsDesc}
        </p>
      </div>
    );
  } else {
    content = (
      <div className="space-y-4">
        {filteredAndSortedAppointments.map(appointment => (
          <div
            key={appointment.id}
            onClick={() => handleAppointmentClick(appointment)}
            className="cursor-pointer rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-900">
                    {formatDateTime(appointment.dateTime)}
                  </span>
                  <Clock className="ml-2 h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {appointment.duration} {translations.duration}
                  </span>
                </div>

                {appointment.otherUser && (
                  <div className="mb-2 flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">
                      {translations.with} {appointment.otherUser.name}
                    </span>
                  </div>
                )}

                {appointment.relatedPost && (
                  <div className="mb-2 text-sm text-gray-600">
                    <span className="font-medium">{translations.subject}:</span> {getSubjectLabel(appointment.relatedPost.subject)}
                  </div>
                )}

                {appointment.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{appointment.location}</span>
                  </div>
                )}
              </div>

              <div className="flex min-h-[80px] flex-col justify-between">
                <span
                  className={`self-end rounded-full border px-3 py-1 text-xs font-medium ${statusColors[appointment.status]}`}
                >
                  {translations[appointment.status.toLowerCase() as keyof typeof translations]}
                </span>
                <button
                  onClick={(e) => handleGoToChat(e, appointment)}
                  className="mt-4 self-end flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  <MessageCircle className="h-4 w-4" />
                  {translations.goToChat}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <div className="bg-white border-b border-neutral-200 px-4 py-12 sm:py-16 text-center">
          {showBackButton && (
            <div className="mb-4 flex items-center gap-2">
              <button
                onClick={handleBackClick}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                {translations.backToChat}
              </button>
            </div>
          )}

          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            {translations.title}
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-lg text-neutral-600">
            {t('Administrer alle dine avtaler og følg opp statusen for hver time.', 'Manage and follow up on all your tutoring appointments.')}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {availableFilters.map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-200 bg-white text-gray-600 hover:text-gray-900'
                }`}
              >
                {translations[status.toLowerCase() as keyof typeof translations] || status}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {content}
          </div>
        </div>

        <div className="flex justify-center overflow-x-auto pb-6">
          <AdsterraBanner
            placement={
              isMobileAd
                ? adPlacementIds.horizontalMobile320x50
                : adPlacementIds.horizontal728x90
            }
            className="mx-auto"
          />
        </div>
      </div>

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
    </>
  );
}
