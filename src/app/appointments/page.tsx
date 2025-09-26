'use client';

import { useLanguageText } from '@/contexts/LanguageContext';
import { useActivityTracking } from '@/hooks/useActivityTracking';
import AppointmentsList from '@/components/appointments/AppointmentsList';
import AuthGuard from '@/components/auth/AuthGuard';

export default function AppointmentsPage() {
  // Track user activity on appointments page
  useActivityTracking();
  
  const t = useLanguageText();
  const title = t('Mine timer', 'My Appointments');

  return (
    <AuthGuard>
      <AppointmentsList 
        title={title}
      />
    </AuthGuard>
  );
}
