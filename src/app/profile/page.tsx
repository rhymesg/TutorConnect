import { Metadata } from 'next';
import { ProfileContainer } from '@/components/profile/ProfileContainer';

export const metadata: Metadata = {
  title: 'Min profil | TutorConnect',
  description: 'Administrer din profil, personlige opplysninger og personverninnstillinger på TutorConnect.',
};

/**
 * User profile page - displays current user's profile
 * Shows comprehensive profile information with editing capabilities
 */
export default function ProfilePage() {
  return <ProfileContainer />;
}