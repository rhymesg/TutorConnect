'use client';

import { useParams } from 'next/navigation';
import { useLanguage, useLanguageText } from '@/contexts/LanguageContext';
import AppointmentsList from '@/components/appointments/AppointmentsList';
import AdsterraBanner from '@/components/ads/AdsterraBanner';
import { adPlacementIds } from '@/constants/adPlacements';

export default function ChatAppointmentsPage() {
  const params = useParams();
  const { language } = useLanguage();
  const t = useLanguageText();
  const chatId = params?.chatId as string;

  const title = t('Avtaler for denne chatten', 'Appointments for this chat');
  const backButtonText = t('Tilbake', 'Back');

  return (
    <div className="bg-neutral-50">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col xl:flex-row gap-8 xl:items-start">
          <div className="flex-1 min-w-0">
            <AppointmentsList
              chatId={chatId}
              title={title}
              showBackButton={true}
              backButtonText={backButtonText}
            />
          </div>
          <div className="hidden xl:flex xl:justify-start">
            <AdsterraBanner placement={adPlacementIds.vertical160x600} />
          </div>
        </div>
      </div>
    </div>
  );
}
