'use client';

import { Message } from '@/types/chat';
import AppointmentCard from './AppointmentCard';
import { useLanguage, useLanguageText } from '@/contexts/LanguageContext';

interface AppointmentMessageProps {
  message: Message;
  isOwn: boolean;
  onViewAppointment?: () => void;
}

export default function AppointmentMessage({
  message,
  isOwn,
  onViewAppointment
}: AppointmentMessageProps) {
  const { language } = useLanguage();
  const translate = useLanguageText();
  const viewAppointmentLabel = translate('Se avtale', 'View appointment');
  const appointmentDeletedLabel = translate('Avtalen ble avslått og slettet', 'Appointment was rejected and deleted');

  // If appointment was deleted (appointmentId is null but message still exists)
  if ((message.appointmentId === null || !message.appointment) && message.type === 'APPOINTMENT_REQUEST') {
    return (
      <div className="p-3 bg-gray-100 border-l-4 border-gray-400 rounded-lg text-gray-600 text-sm italic">
        {appointmentDeletedLabel}
      </div>
    );
  }

  // Parse appointment data
  let appointmentData;
  
  if (message.type === 'APPOINTMENT_RESPONSE') {
    // For response messages, use the appointment data from the database
    appointmentData = message.appointment ? {
      dateTime: message.appointment.dateTime,
      endDateTime: new Date(new Date(message.appointment.dateTime).getTime() + ((message.appointment.duration || 60) * 60 * 1000)),
      date: new Date(message.appointment.dateTime).toISOString().split('T')[0],
      startTime: new Date(message.appointment.dateTime).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Oslo' }),
      endTime: new Date(new Date(message.appointment.dateTime).getTime() + ((message.appointment.duration || 60) * 60 * 1000)).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Oslo' }),
      location: message.appointment.location || ''
    } : {};
  } else {
    // For request messages, parse from content
    try {
      appointmentData = JSON.parse(message.content);
    } catch {
      appointmentData = message.appointment || {};
    }
  }

  const status = message.appointment?.status || 'PENDING';
  const isResponse = message.type === 'APPOINTMENT_RESPONSE';

  // Se avtale button for extra content
  const extraContent = !isResponse && onViewAppointment && message.appointment ? (
    <button
      onClick={onViewAppointment}
      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
    >
      {viewAppointmentLabel}
    </button>
  ) : null;

  return (
    <AppointmentCard
      appointmentData={appointmentData}
      status={status}
      statusPosition="top"
      extraContent={extraContent}
    />
  );
}
