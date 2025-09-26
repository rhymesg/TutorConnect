import { Metadata } from 'next';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { OmniContent } from './pageContent';

export const metadata: Metadata = {
  title: 'Om oss | TutorConnect',
  description: 'Les historien bak TutorConnect og hvordan vi hjelper elever og lærere å finne hverandre.',
};

export default function OmOssPage() {
  return <OmniContent />;
}
