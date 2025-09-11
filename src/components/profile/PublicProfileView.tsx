'use client';

import { useState } from 'react';
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
import { formatters } from '@/lib/translations';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileImage } from './ProfileImage';
import { DocumentsList } from './DocumentsList';

interface PublicProfileData extends User {
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
  const { accessToken } = useAuth();
  
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

  const canRequestInfo = currentUser && currentUser.id !== profile.id;

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
      alert('Kunne ikke opprette samtale. Prøv igjen.');
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
              {profile.name || 'Navn ikke tilgjengelig'}
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
                  Verifisert profil
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
                Starter samtale...
              </>
            ) : (
              <>
                <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                Start samtale
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
            Personlige opplysninger
          </h2>
          <dl className="space-y-3">
            {profile.gender ? (
              <div>
                <dt className="text-sm font-medium text-gray-500">Kjønn</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatGender(profile.gender) || <span className="text-gray-400 italic">Ikke oppgitt</span>}
                </dd>
              </div>
            ) : (
              <div className="flex items-center text-sm text-gray-500">
                <LockClosedIcon className="h-4 w-4 mr-2" />
                <span>Kjønn er skjult</span>
              </div>
            )}
            
            {profile.birthYear ? (
              <div>
                <dt className="text-sm font-medium text-gray-500">Alder</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatAge(profile.birthYear)}</dd>
              </div>
            ) : (
              <div className="flex items-center text-sm text-gray-500">
                <LockClosedIcon className="h-4 w-4 mr-2" />
                <span>Alder er skjult</span>
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
          
          {profile.school || profile.degree || profile.certifications ? (
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
            </dl>
          ) : (
            <div className="flex items-center text-sm text-gray-500">
              <LockClosedIcon className="h-4 w-4 mr-2" />
              <span>Utdanningsinformasjon er skjult</span>
            </div>
          )}
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

      {/* Documents section - only shown if user has public documents */}
      {profile.documents && profile.documents.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Dokumenter
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
                Ønsker du å se mer informasjon?
              </h3>
              <p className="mt-1 text-sm text-blue-700">
                Denne brukeren har skjult noe informasjon. Du kan sende en forespørsel 
                om å få tilgang til mer detaljert informasjon.
              </p>
              <div className="mt-3">
                <button
                  onClick={() => onInfoRequest(hiddenFields)}
                  disabled={isRequestingInfo}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isRequestingInfo ? 'Sender...' : 'Send forespørsel'}
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
            Begrenset profilinformasjon
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Denne brukeren har valgt å begrense informasjonen som vises offentlig.
          </p>
          {canRequestInfo && (
            <div className="mt-6">
              <button
                onClick={() => {/* TODO: Open chat */}}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                Kontakt brukeren
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}