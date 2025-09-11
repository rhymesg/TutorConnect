'use client';

import { useLanguage } from '@/lib/translations';
import AppointmentsList from '@/components/appointments/AppointmentsList';
import AuthGuard from '@/components/auth/AuthGuard';

export default function AppointmentsPage() {
  const language = useLanguage();
  const title = language === 'no' ? 'Mine timer' : 'My Appointments';

  return (
    <AuthGuard>
      <AppointmentsList 
        title={title}
      />
    </AuthGuard>
  );
}