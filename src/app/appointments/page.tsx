'use client';

import { useLanguageText } from '@/contexts/LanguageContext';
import { useActivityTracking } from '@/hooks/useActivityTracking';
import AppointmentsList from '@/components/appointments/AppointmentsList';
import AuthGuard from '@/components/auth/AuthGuard';
import AdsterraBanner from '@/components/ads/AdsterraBanner';

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

            <div className="w-full xl:w-auto flex justify-center xl:justify-start">
              <AdsterraBanner
                placementKey="a5659616e7810115e1f11798ce145254"
                width={160}
                height={600}
                className="w-full max-w-[160px] xl:w-[160px]"
              />
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
