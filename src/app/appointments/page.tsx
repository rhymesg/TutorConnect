'use client';

import { useLanguage } from '@/lib/translations';
import AppointmentsList from '@/components/appointments/AppointmentsList';

export default function AppointmentsPage() {
  const language = useLanguage();

  const title = language === 'no' ? 'Mine timer' : 'My Appointments';

  return (
    <AppointmentsList 
      title={title}
    />
  );
}