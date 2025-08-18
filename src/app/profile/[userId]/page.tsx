import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicProfileContainer } from '@/components/profile/PublicProfileContainer';

interface Props {
  params: { userId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Profil | TutorConnect`,
    description: 'Se brukerprofil på TutorConnect.',
  };
}

/**
 * Public profile page - displays other users' profiles with privacy controls
 * Shows profile information based on privacy settings
 */
export default function UserProfilePage({ params }: Props) {
  const { userId } = params;

  if (!userId) {
    notFound();
  }

  return <PublicProfileContainer userId={userId} />;
}