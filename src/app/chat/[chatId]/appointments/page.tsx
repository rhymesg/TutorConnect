'use client';

import { useParams } from 'next/navigation';
import { useLanguage } from '@/lib/translations';
import AppointmentsList from '@/components/appointments/AppointmentsList';

export default function ChatAppointmentsPage() {
  const params = useParams();
  const language = useLanguage();
  const chatId = params?.chatId as string;

  const title = language === 'no' ? 'Avtaler for denne chatten' : 'Appointments for this chat';
  const backButtonText = language === 'no' ? 'Tilbake til chat' : 'Back to chat';

  return (
    <AppointmentsList 
      chatId={chatId}
      title={title}
      showBackButton={true}
      backButtonText={backButtonText}
    />
  );
}