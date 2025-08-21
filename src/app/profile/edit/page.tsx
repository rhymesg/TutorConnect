import { Metadata } from 'next';
import { ProfileEditContainer } from '@/components/profile/ProfileEditContainer';

export const metadata: Metadata = {
  title: 'Rediger profil | TutorConnect',
  description: 'Rediger din profil, personlige opplysninger og personverninnstillinger på TutorConnect.',
};

/**
 * Profile edit page - allows users to edit their profile information
 */
export default function ProfileEditPage() {
  return <ProfileEditContainer />;
}