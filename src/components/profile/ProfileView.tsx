'use client';

import { User } from '@prisma/client';
import { 
  UserIcon, 
  MapPinIcon, 
  AcademicCapIcon, 
  DocumentTextIcon,
  CheckBadgeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { formatters } from '@/lib/translations';
import { ProfileImage } from './ProfileImage';
import { DocumentsList } from './DocumentsList';

interface ProfileData extends User {
  privacyGender: string;
  privacyAge: string;
  privacyDocuments: string;
  privacyContact: string;
  completeness: {
    percentage: number;
    missingFields: string[];
  };
  documents: Array<{
    id: string;
    documentType: string;
    fileName: string;
    verificationStatus: string;
    uploadedAt: string;
  }>;
}

interface Props {
  profile: ProfileData;
  onEditClick: () => void;
  isPublicView?: boolean; // True when viewing someone else's profile
}

export function ProfileView({ profile, onEditClick, isPublicView = false }: Props) {
  const formatAge = (birthYear: number | null) => {
    if (!birthYear) return null;
    const currentYear = new Date().getFullYear();
    return `${currentYear - birthYear} år`;
  };

  const formatGender = (gender: string | null) => {
    if (!gender) return null;
    const genderMap = {
      MALE: 'Mann',
      FEMALE: 'Kvinne',
      OTHER: 'Annet'
    };
    return genderMap[gender as keyof typeof genderMap] || gender;
  };

  // Helper to check if a field should be visible based on privacy settings
  const isFieldVisible = (privacySetting: string | null) => {
    if (!isPublicView) return true; // Always show on own profile
    return privacySetting === 'PUBLIC'; // Only show public fields on public view
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header section */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-6">
          <ProfileImage 
            src={profile.profileImage} 
            name={profile.name || ''} 
            size="lg" 
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {profile.name || 'Navn ikke oppgitt'}
            </h1>
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <MapPinIcon className="h-4 w-4 mr-1" />
              <span>{profile.region}</span>
              {profile.postalCode && (
                <span className="ml-1">({profile.postalCode})</span>
              )}
            </div>
            <div className="flex items-center mt-2">
              <div className="flex items-center text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                {profile.isActive ? 'Aktiv' : 'Inaktiv'}
              </div>
              {profile.emailVerified && (
                <div className="flex items-center text-sm text-blue-600 ml-4">
                  <CheckBadgeIcon className="h-4 w-4 mr-1" />
                  Verifisert e-post
                </div>
              )}
            </div>
          </div>
        </div>
        
        {!isPublicView && (
          <button
            onClick={onEditClick}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Rediger profil
          </button>
        )}
      </div>

      {/* Personal information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <UserIcon className="h-5 w-5 mr-2" />
            Personlige opplysninger
          </h2>
          <dl className="space-y-3">
            {!isPublicView && (
              <div>
                <dt className="text-sm font-medium text-gray-500">E-post</dt>
                <dd className="mt-1 text-sm text-gray-900">{profile.email}</dd>
              </div>
            )}
            {profile.gender && isFieldVisible(profile.privacyGender) && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Kjønn</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatGender(profile.gender) || <span className="text-gray-400 italic">Ikke oppgitt</span>}
                </dd>
              </div>
            )}
            {profile.birthYear && isFieldVisible(profile.privacyAge) && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Alder</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatAge(profile.birthYear)}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">Medlem siden</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatters.date(new Date(profile.createdAt))}
              </dd>
            </div>
            {profile.lastActive && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Sist aktiv</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatters.date(new Date(profile.lastActive))}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AcademicCapIcon className="h-5 w-5 mr-2" />
            Utdanning
          </h2>
          <dl className="space-y-3">
            {profile.school && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Skole/Institusjon</dt>
                <dd className="mt-1 text-sm text-gray-900">{profile.school}</dd>
              </div>
            )}
            {profile.degree && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Grad/Utdanning</dt>
                <dd className="mt-1 text-sm text-gray-900">{profile.degree}</dd>
              </div>
            )}
            {profile.certifications && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Sertifiseringer</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                  {profile.certifications}
                </dd>
              </div>
            )}
            {!profile.school && !profile.degree && !profile.certifications && (
              <p className="text-sm text-gray-500 italic">
                Ingen utdanningsinformasjon lagt til enda.
              </p>
            )}
          </dl>
        </div>
      </div>

      {/* Bio section */}
      {profile.bio && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Om meg
          </h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {profile.bio}
            </p>
          </div>
        </div>
      )}

      {/* Documents section */}
      {profile.documents && profile.documents.length > 0 && isFieldVisible(profile.privacyDocuments) && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Dokumenter
          </h2>
          <DocumentsList documents={profile.documents} />
        </div>
      )}

      {/* Empty states */}
      {!isPublicView && (!profile.bio && (!profile.documents || profile.documents.length === 0)) && (
        <div className="text-center py-12">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Profilen din er ganske tom
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Legg til en biografi og last opp dokumenter for å fullføre profilen din.
          </p>
        </div>
      )}
    </div>
  );
}