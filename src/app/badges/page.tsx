import { Metadata } from 'next';
import { BadgesContent } from './pageContent';

export const metadata: Metadata = {
  title: 'Merker | TutorConnect',
  description: 'Oppdag hvordan du kan tjene TutorConnect-merker som lærer og student.',
};

export default function BadgesPage() {
  return <BadgesContent />;
}
