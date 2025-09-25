'use client';

import { useEffect, useState } from 'react';
import { User } from '@prisma/client';
import { 
  UserIcon, 
  MapPinIcon, 
  AcademicCapIcon, 
  DocumentTextIcon,
  CheckBadgeIcon,
  ChatBubbleLeftRightIcon,
  InformationCircleIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { useLanguage, useLanguageText } from '@/contexts/LanguageContext';
import { isUserOnline } from '@/lib/user-utils';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileImage } from './ProfileImage';
import { DocumentsList } from './DocumentsList';

interface PublicProfileData extends User {
  lastActive: Date | null;
  documents?: Array<{
    id: string;
    documentType: string;
    fileName: string;
    verificationStatus: string;
    uploadedAt: string;
  }>;
}

interface Props {
  profile: PublicProfileData;
  currentUser: User | null;
  onInfoRequest: (fields: string[]) => Promise<void>;
  isRequestingInfo: boolean;
}

export function PublicProfileView({ 
  profile, 
  currentUser, 
  onInfoRequest, 
  isRequestingInfo 
}: Props) {
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const { language } = useLanguage();
  const t = useLanguageText();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const isOnline = hasMounted && isUserOnline(profile.lastActive);
  const { accessToken } = useAuth();
  
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

  const canRequestInfo = currentUser && currentUser.id !== profile.id;

  const nameFallback = t('Navn ikke tilgjengelig', 'Name not available');
  const onlineLabel = t('Online', 'Online');
  const offlineLabel = t('Offline', 'Offline');
  const verifiedProfileLabel = t('Verifisert profil', 'Verified profile');
  const startChatLabel = t('Start samtale', 'Start conversation');
  const startingChatLabel = t('Starter samtale...', 'Starting conversation...');
  const personalInfoTitle = t('Personlige opplysninger', 'Personal details');
  const genderLabel = t('Kjønn', 'Gender');
  const genderHiddenLabel = t('Kjønn er skjult', 'Gender is hidden');
  const genderEmptyLabel = t('Ikke oppgitt', 'Not provided');
  const ageLabel = t('Alder', 'Age');
  const ageHiddenLabel = t('Alder er skjult', 'Age is hidden');
  const memberSinceLabel = t('Medlem siden', 'Member since');
  const lastActiveLabel = t('Sist aktiv', 'Last active');
  const educationTitle = t('Utdanning', 'Education');
  const schoolLabel = t('Skole/Institusjon', 'School/Institution');
  const degreeLabel = t('Grad/Utdanning', 'Degree/Education');
  const certificationsLabel = t('Sertifiseringer', 'Certifications');
  const educationHiddenLabel = t('Utdanningsinformasjon er skjult', 'Education information is hidden');
  const aboutTitle = t('Om meg', 'About me');
  const documentsTitle = t('Dokumenter', 'Documents');
  const infoRequestTitle = t('Ønsker du å se mer informasjon?', 'Want to view more information?');
  const infoRequestBody = t(
    'Denne brukeren har skjult noe informasjon. Du kan sende en forespørsel om å få tilgang til mer detaljert informasjon.',
    'This user has hidden some information. You can send a request to access additional details.',
  );
  const sendRequestLabel = t('Send forespørsel', 'Send request');
  const sendingRequestLabel = t('Sender...', 'Sending...');
  const limitedProfileTitle = t('Begrenset profilinformasjon', 'Limited profile information');
  const limitedProfileBody = t(
    'Denne brukeren har valgt å begrense informasjonen som vises offentlig.',
    'This user has chosen to limit the information shown publicly.',
  );
  const contactUserLabel = t('Kontakt brukeren', 'Contact user');
  const chatErrorMessage = t('Kunne ikke opprette samtale. Prøv igjen.', 'Could not start the conversation. Please try again.');

  const handleStartChat = async () => {
    if (!currentUser || currentUser.id === profile.id || isCreatingChat) {
      return;
    }

    setIsCreatingChat(true);

    try {
      // For direct chat (not related to a specific post), use the general chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': accessToken ? `Bearer ${accessToken}` : '',
        },
        body: JSON.stringify({
          participantIds: [profile.id],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create chat');
      }

      const { chat } = await response.json();
      
      // Navigate to the chat page with the chat ID as query parameter
      window.location.href = `/chat?id=${chat.id}`;
    } catch (error) {
      console.error('Error creating chat:', error);
      alert(chatErrorMessage);
    } finally {
      setIsCreatingChat(false);
    }
  };
  const hiddenFields: string[] = [];

  // Check for hidden fields based on privacy settings
  if (!profile.gender) hiddenFields.push('gender');
  if (!profile.birthYear) hiddenFields.push('age');
  if (!profile.documents && !profile.school && !profile.degree) hiddenFields.push('education');
  if (!profile.email && !profile.postalCode) hiddenFields.push('contact');

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
                  {verifiedProfileLabel}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {canRequestInfo && (
          <button
            onClick={handleStartChat}
            disabled={isCreatingChat}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isCreatingChat 
                ? 'bg-blue-400 text-white cursor-wait'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isCreatingChat ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {startingChatLabel}
              </>
            ) : (
              <>
                <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                {startChatLabel}
              </>
            )}
          </button>
        )}
      </div>

      {/* Personal information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <UserIcon className="h-5 w-5 mr-2" />
            {personalInfoTitle}
          </h2>
          <dl className="space-y-3">
            {profile.gender ? (
              <div>
                <dt className="text-sm font-medium text-gray-500">{genderLabel}</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatGender(profile.gender) || <span className="text-gray-400 italic">{genderEmptyLabel}</span>}
                </dd>
              </div>
            ) : (
              <div className="flex items-center text-sm text-gray-500">
                <LockClosedIcon className="h-4 w-4 mr-2" />
                <span>{genderHiddenLabel}</span>
              </div>
            )}
            
            {profile.birthYear ? (
              <div>
                <dt className="text-sm font-medium text-gray-500">{ageLabel}</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatAge(profile.birthYear)}</dd>
              </div>
            ) : (
              <div className="flex items-center text-sm text-gray-500">
                <LockClosedIcon className="h-4 w-4 mr-2" />
                <span>{ageHiddenLabel}</span>
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
          
          {profile.school || profile.degree || profile.certifications ? (
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
            </dl>
          ) : (
            <div className="flex items-center text-sm text-gray-500">
              <LockClosedIcon className="h-4 w-4 mr-2" />
              <span>{educationHiddenLabel}</span>
            </div>
          )}
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

      {/* Documents section - only shown if user has public documents */}
      {profile.documents && profile.documents.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            {documentsTitle}
          </h2>
          <DocumentsList documents={profile.documents} />
        </div>
      )}

      {/* Info request section */}
      {canRequestInfo && hiddenFields.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900">
                {infoRequestTitle}
              </h3>
              <p className="mt-1 text-sm text-blue-700">
                {infoRequestBody}
              </p>
              <div className="mt-3">
                <button
                  onClick={() => onInfoRequest(hiddenFields)}
                  disabled={isRequestingInfo}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isRequestingInfo ? sendingRequestLabel : sendRequestLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state for limited profiles */}
      {(!profile.bio && (!profile.documents || profile.documents.length === 0)) && (
        <div className="text-center py-12">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {limitedProfileTitle}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {limitedProfileBody}
          </p>
          {canRequestInfo && (
            <div className="mt-6">
              <button
                onClick={() => {/* TODO: Open chat */}}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                {contactUserLabel}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
