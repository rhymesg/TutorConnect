'use client';

import { useLanguage } from '@/lib/translations';
import { useActivityTracking } from '@/hooks/useActivityTracking';
import AuthGuard from '@/components/auth/AuthGuard';
import AppointmentsList from '@/components/appointments/AppointmentsList';

export default function AppointmentsClient() {
  // Track user activity on appointments page
  useActivityTracking();
  
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