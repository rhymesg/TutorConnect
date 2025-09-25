'use client';

import { useEffect, useState } from 'react';
import { User } from '@prisma/client';
import { 
  UserIcon, 
  MapPinIcon, 
  AcademicCapIcon, 
  DocumentTextIcon,
  CheckBadgeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { useLanguage, useLanguageText } from '@/contexts/LanguageContext';
import { isUserOnline } from '@/lib/user-utils';
import { ProfileImage } from './ProfileImage';
import { DocumentsList } from './DocumentsList';

interface ProfileData extends User {
  lastActive: Date | null;
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
  const [hasMounted, setHasMounted] = useState(false);
  const { language } = useLanguage();
  const t = useLanguageText();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const isOnline = hasMounted && isUserOnline(profile.lastActive);

  const formatAge = (birthYear: number | null) => {
    if (!birthYear) return null;
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    return language === 'no' ? `${age} år` : `${age} years`;
  };

  const formatGender = (gender: string | null) => {
    if (!gender) return null;
    const genderMap = language === 'no'
      ? {
          MALE: 'Mann',
          FEMALE: 'Kvinne',
          OTHER: 'Annet'
        }
      : {
          MALE: 'Male',
          FEMALE: 'Female',
          OTHER: 'Other'
        };
    return genderMap[gender as keyof typeof genderMap] || gender;
  };

  const formatDate = (value: Date | string | null) => {
    if (!value) {
      return '';
    }

    const date = value instanceof Date ? value : new Date(value);

    return new Intl.DateTimeFormat(language === 'no' ? 'nb-NO' : 'en-GB', {
      timeZone: 'Europe/Oslo',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Helper to check if a field should be visible based on privacy settings
  const isFieldVisible = (privacySetting: string | null) => {
    if (!isPublicView) return true; // Always show on own profile
    return privacySetting === 'PUBLIC'; // Only show public fields on public view
  };

  const nameFallback = t('Navn ikke oppgitt', 'Name not provided');
  const locationLabel = t('Personlige opplysninger', 'Personal details');
  const emailLabel = t('E-post', 'Email');
  const genderLabel = t('Kjønn', 'Gender');
  const genderEmpty = t('Ikke oppgitt', 'Not provided');
  const ageLabel = t('Alder', 'Age');
  const memberSinceLabel = t('Medlem siden', 'Member since');
  const lastActiveLabel = t('Sist aktiv', 'Last active');
  const onlineLabel = t('Online', 'Online');
  const offlineLabel = t('Offline', 'Offline');
  const verifiedEmailLabel = t('Verifisert e-post', 'Verified email');
  const editProfileLabel = t('Rediger profil', 'Edit profile');
  const educationTitle = t('Utdanning', 'Education');
  const schoolLabel = t('Skole/Institusjon', 'School/Institution');
  const degreeLabel = t('Grad/Utdanning', 'Degree/Education');
  const certificationsLabel = t('Sertifiseringer', 'Certifications');
  const educationEmpty = t('Ingen utdanningsinformasjon lagt til enda.', 'No education information added yet.');
  const aboutTitle = t('Om meg', 'About me');
  const documentsTitle = t('Dokumenter', 'Documents');
  const emptyProfileHeading = t('Profilen din er ganske tom', 'Your profile looks a bit empty');
  const emptyProfileBody = t(
    'Legg til en biografi og last opp dokumenter for å fullføre profilen din.',
    'Add a bio and upload documents to complete your profile.',
  );

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
              {profile.name || nameFallback}
            </h1>
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <MapPinIcon className="h-4 w-4 mr-1" />
              <span>{profile.region}</span>
              {profile.postalCode && (
                <span className="ml-1">({profile.postalCode})</span>
              )}
            </div>
            <div className="flex items-center mt-2">
              <div className={`flex items-center text-sm ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                <div className={`mr-2 h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                {isOnline ? onlineLabel : offlineLabel}
              </div>
              {profile.emailVerified && (
                <div className="flex items-center text-sm text-blue-600 ml-4">
                  <CheckBadgeIcon className="h-4 w-4 mr-1" />
                  {verifiedEmailLabel}
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
            {editProfileLabel}
          </button>
        )}
      </div>

      {/* Personal information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <UserIcon className="h-5 w-5 mr-2" />
            {locationLabel}
          </h2>
          <dl className="space-y-3">
            {!isPublicView && (
              <div>
                <dt className="text-sm font-medium text-gray-500">{emailLabel}</dt>
                <dd className="mt-1 text-sm text-gray-900">{profile.email}</dd>
              </div>
            )}
            {profile.gender && isFieldVisible(profile.privacyGender) && (
              <div>
                <dt className="text-sm font-medium text-gray-500">{genderLabel}</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatGender(profile.gender) || <span className="text-gray-400 italic">{genderEmpty}</span>}
                </dd>
              </div>
            )}
            {profile.birthYear && isFieldVisible(profile.privacyAge) && (
              <div>
                <dt className="text-sm font-medium text-gray-500">{ageLabel}</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatAge(profile.birthYear)}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">{memberSinceLabel}</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDate(profile.createdAt)}
              </dd>
            </div>
            {profile.lastActive && (
              <div>
                <dt className="text-sm font-medium text-gray-500">{lastActiveLabel}</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(profile.lastActive)}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AcademicCapIcon className="h-5 w-5 mr-2" />
            {educationTitle}
          </h2>
          <dl className="space-y-3">
            {profile.school && (
              <div>
                <dt className="text-sm font-medium text-gray-500">{schoolLabel}</dt>
                <dd className="mt-1 text-sm text-gray-900">{profile.school}</dd>
              </div>
            )}
            {profile.degree && (
              <div>
                <dt className="text-sm font-medium text-gray-500">{degreeLabel}</dt>
                <dd className="mt-1 text-sm text-gray-900">{profile.degree}</dd>
              </div>
            )}
            {profile.certifications && (
              <div>
                <dt className="text-sm font-medium text-gray-500">{certificationsLabel}</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                  {profile.certifications}
                </dd>
              </div>
            )}
            {!profile.school && !profile.degree && !profile.certifications && (
              <p className="text-sm text-gray-500 italic">
                {educationEmpty}
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
            {aboutTitle}
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
            {documentsTitle}
          </h2>
          <DocumentsList documents={profile.documents} />
        </div>
      )}

      {/* Empty states */}
      {!isPublicView && (!profile.bio && (!profile.documents || profile.documents.length === 0)) && (
        <div className="text-center py-12">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {emptyProfileHeading}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {emptyProfileBody}
          </p>
        </div>
      )}
    </div>
  );
}
