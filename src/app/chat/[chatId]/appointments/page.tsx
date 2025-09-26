'use client';

import { useParams } from 'next/navigation';
import { useLanguage, useLanguageText } from '@/contexts/LanguageContext';
import AppointmentsList from '@/components/appointments/AppointmentsList';

export default function ChatAppointmentsPage() {
  const params = useParams();
  const { language } = useLanguage();
  const t = useLanguageText();
  const chatId = params?.chatId as string;

  const title = t('Avtaler for denne chatten', 'Appointments for this chat');
  const backButtonText = t('Tilbake', 'Back');

  return (
    <AppointmentsList 
      chatId={chatId}
      title={title}
      showBackButton={true}
      backButtonText={backButtonText}
    />
  );
}
