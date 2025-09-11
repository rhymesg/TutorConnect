'use client';

import { Suspense } from 'react';
import { useLanguage } from '@/lib/translations';
import AppointmentsList from '@/components/appointments/AppointmentsList';
import AuthGuard from '@/components/auth/AuthGuard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function AppointmentsPageContent() {
  const language = useLanguage();
  const title = language === 'no' ? 'Mine timer' : 'My Appointments';

  return (
    <AppointmentsList 
      title={title}
    />
  );
}

export default function AppointmentsPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><LoadingSpinner size="lg" /></div>}>
        <AppointmentsPageContent />
      </Suspense>
    </AuthGuard>
  );
}