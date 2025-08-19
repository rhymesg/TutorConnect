import { Metadata } from 'next';
import { AppointmentManager } from '../../components/appointments/AppointmentManager';

export const metadata: Metadata = {
  title: 'Avtaler - TutorConnect',
  description: 'Administrer dine avtalte timer og møter med elever og lærere',
};

export default function AppointmentsPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AppointmentManager
          showCreateButton={true}
          showFilters={true}
          allowViewSwitch={true}
          className="w-full"
        />
      </div>
    </div>
  );
}