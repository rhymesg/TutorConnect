import type { Metadata } from 'next';
import HomePageContent from '@/components/home/HomePageContent';

export const metadata: Metadata = {
  title: 'Hjem',
  description: 'Velkommen til TutorConnect - Norges ledende plattform for privatlæring og tutoring.',
};

export default function HomePage() {
  return <HomePageContent />;
}
