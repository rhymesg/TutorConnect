'use client';

import { useLanguageText } from '@/contexts/LanguageContext';
import { useActivityTracking } from '@/hooks/useActivityTracking';
import AppointmentsList from '@/components/appointments/AppointmentsList';
import AuthGuard from '@/components/auth/AuthGuard';
import AdsterraBanner from '@/components/ads/AdsterraBanner';
import { adPlacementIds } from '@/constants/adPlacements';

export default function AppointmentsPage() {
  useActivityTracking();

  const t = useLanguageText();
  const title = t('Mine timer', 'My Appointments');

  return (
    <AuthGuard>
      <div className="bg-neutral-50">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col xl:flex-row gap-8 xl:items-start">
            <div className="flex-1 min-w-0">
              <AppointmentsList title={title} />
            </div>

            <div className="hidden xl:flex xl:justify-start">
              <AdsterraBanner placement={adPlacementIds.vertical160x600} />
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
