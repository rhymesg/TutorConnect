'use client';

import { useState, useRef, useEffect } from 'react';
import { User, NorwegianRegion, Gender } from '@prisma/client';
import { 
  UserIcon, 
  MapPinIcon, 
  AcademicCapIcon, 
  DocumentTextIcon,
  CheckBadgeIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  PhotoIcon,
  EyeIcon,
  EyeSlashIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';
import { formatters } from '@/lib/translations';
import { isUserOnline } from '@/lib/user-utils';
import { ProfileImage } from './ProfileImage';
import { DocumentsList } from './DocumentsList';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getRegionOptions, getRegionLabel } from '@/constants/regions';
import { getTeacherBadge, getStudentBadge } from '@/lib/badges';

interface ProfileData extends User {
  lastActive: Date | null;
  privacyGender: string;
  privacyAge: string;
  privacyDocuments: string;
  privacyContact: string;
  privacyEducation: string;
  privacyCertifications: string;
  privacyLocation: string;
  privacyPostalCode: string;
  privacyMemberSince: string;
  privacyLastActive: string;
  privacyActivity: string;
  privacyStats: string;
  teacherSessions: number;
  teacherStudents: number;
  studentSessions: number;
  studentTeachers: number;
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
  onProfileUpdate?: (updatedProfile: ProfileData) => void;
  isPublicView?: boolean;
}

export function InlineProfileView({ profile, onProfileUpdate, isPublicView = false }: Props) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState<Record<string, any>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const isOnline = hasMounted && isUserOnline(profile.lastActive);

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

  const isFieldVisible = (privacySetting: string | null) => {
    if (!isPublicView) return true; // Always show on own profile
    return privacySetting === 'PUBLIC'; // Only show public fields on public view
  };


  const handleFieldEdit = (fieldName: string, currentValue: any) => {
    setEditingField(fieldName);
    setTempValues({ [fieldName]: currentValue });
  };

  const handleFieldSave = async (fieldName: string) => {
    setSaving(fieldName);
    
    try {
      // Convert birthYear to number if needed, handle empty strings as null
      let value = tempValues[fieldName];
      if (fieldName === 'birthYear' && value) {
        value = parseInt(value, 10);
      } else if ((fieldName === 'birthYear' || fieldName === 'gender') && value === '') {
        value = null;
      }
      
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [fieldName]: value })
      });

      const data = await response.json();
      
      if (data.success && onProfileUpdate) {
        onProfileUpdate({ ...profile, [fieldName]: value });
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setSaving(null);
      setEditingField(null);
      setTempValues({});
    }
  };

  const handleFieldSaveMultiple = async (fields: Record<string, any>) => {
    setSaving('education');
    
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      });

      const data = await response.json();
      
      if (data.success && onProfileUpdate) {
        onProfileUpdate({ ...profile, ...fields });
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setSaving(null);
      setEditingField(null);
      setTempValues({});
    }
  };

  const handleFieldCancel = () => {
    setEditingField(null);
    setTempValues({});
  };

  const handlePrivacyToggle = async (privacyField: string, currentValue: string) => {
    const newValue = currentValue === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
    setSaving(privacyField);
    
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [privacyField]: newValue })
      });

      const data = await response.json();
      
      if (data.success && onProfileUpdate) {
        onProfileUpdate({ ...profile, [privacyField]: newValue });
      }
    } catch (error) {
      console.error('Failed to update privacy:', error);
    } finally {
      setSaving(null);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSaving('profileImage');
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await fetch('/api/profile/image', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success && onProfileUpdate) {
        onProfileUpdate({ ...profile, profileImage: data.imageUrl });
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
    } finally {
      setSaving(null);
    }
  };

  const renderEditableField = (
    fieldName: string, 
    label: string, 
    value: any, 
    type: 'text' | 'select' | 'textarea' = 'text',
    options?: { value: string; label: string }[],
    privacyField?: string
  ) => {
    const isEditing = editingField === fieldName;
    const isSaving = saving === fieldName;

    if (isEditing) {
      return (
        <div>
          <dt className="text-sm font-medium text-gray-500 mb-1">{label}</dt>
          <dd className="flex items-center space-x-2">
            {type === 'select' ? (
              <select
                value={tempValues[fieldName] || ''}
                onChange={(e) => setTempValues({ ...tempValues, [fieldName]: e.target.value })}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                autoFocus
              >
                <option value="">Velg {label.toLowerCase()}</option>
                {options?.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            ) : type === 'textarea' ? (
              <textarea
                value={tempValues[fieldName] || ''}
                onChange={(e) => setTempValues({ ...tempValues, [fieldName]: e.target.value })}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                rows={3}
                autoFocus
              />
            ) : (
              <input
                type={type}
                value={tempValues[fieldName] || ''}
                onChange={(e) => setTempValues({ ...tempValues, [fieldName]: e.target.value })}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                autoFocus
              />
            )}
            
            <button
              onClick={() => handleFieldSave(fieldName)}
              disabled={isSaving}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
            >
              {isSaving ? (
                <LoadingSpinner className="w-4 h-4" />
              ) : (
                <CheckIcon className="w-4 h-4" />
              )}
            </button>
            
            <button
              onClick={handleFieldCancel}
              disabled={isSaving}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </dd>
        </div>
      );
    }

    const privacyValue = privacyField ? (profile as any)[privacyField] : null;
    const isPrivacySaving = saving === privacyField;

    // If this is a public view and the field should be private, don't render at all
    if (isPublicView && privacyValue === 'PRIVATE') {
      return null;
    }
    
    // For public view, if field doesn't exist (filtered by privacy), don't render
    if (isPublicView && !value && privacyField && !(profile as any).hasOwnProperty(fieldName)) {
      return null;
    }

    return (
      <div>
        <dt className="text-sm font-medium text-gray-500 flex items-center justify-between">
          <span>{label}</span>
          {!isPublicView && privacyField && (
            <button
              onClick={() => handlePrivacyToggle(privacyField, privacyValue)}
              disabled={isPrivacySaving}
              className={`flex items-center text-xs px-2 py-1 rounded-full transition-colors ${
                privacyValue === 'PUBLIC' 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={privacyValue === 'PUBLIC' ? 'Klikk for å gjøre privat' : 'Klikk for å gjøre offentlig'}
            >
              {isPrivacySaving ? (
                <LoadingSpinner className="w-3 h-3 mr-1" />
              ) : privacyValue === 'PUBLIC' ? (
                <EyeIcon className="w-3 h-3 mr-1" />
              ) : (
                <EyeSlashIcon className="w-3 h-3 mr-1" />
              )}
              {privacyValue === 'PUBLIC' ? 'Offentlig' : 'Privat'}
            </button>
          )}
        </dt>
        <dd className="mt-1 flex items-center group">
          <span className="text-sm text-gray-900 flex-1">
            {(() => {
              // Special formatting for gender field
              if (fieldName === 'gender') {
                const formattedGender = formatGender(value);
                return formattedGender || <span className="text-gray-400 italic">Ikke oppgitt</span>;
              }
              // Default behavior for other fields
              return value || <span className="text-gray-400 italic">Ikke oppgitt</span>;
            })()}
          </span>
          {!isPublicView && (
            <button
              onClick={() => handleFieldEdit(fieldName, value)}
              className="ml-2 p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-brand-600 transition-all"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
          )}
        </dd>
      </div>
    );
  };

  const currentYear = new Date().getFullYear();
  const birthYearOptions = [];
  for (let year = currentYear; year >= currentYear - 100; year--) {
    birthYearOptions.push({ value: year.toString(), label: year.toString() });
  }

  const genderOptions = [
    { value: 'MALE', label: 'Mann' },
    { value: 'FEMALE', label: 'Kvinne' },
    { value: 'OTHER', label: 'Annet' }
  ];

  // Region options from centralized constants
  const regionOptions = getRegionOptions();

  const degreeOptions = [
    { value: 'BACHELOR', label: 'Bachelor' },
    { value: 'MASTER', label: 'Master' },
    { value: 'PHD', label: 'PhD/Doktor' },
    { value: 'PROFESSOR', label: 'Professor' },
    { value: 'DIPLOMA', label: 'Diplom' },
    { value: 'CERTIFICATE', label: 'Sertifikat' },
    { value: 'HIGH_SCHOOL', label: 'Videregående' },
    { value: 'OTHER', label: 'Annet' }
  ];

  // Format education display
  const formatEducation = (degree: string | null, education: string | null) => {
    if (!degree && !education) return null;
    if (degree && education) {
      const degreeLabel = degreeOptions.find(opt => opt.value === degree)?.label || degree;
      return `${degreeLabel} - ${education}`;
    }
    if (degree) {
      return degreeOptions.find(opt => opt.value === degree)?.label || degree;
    }
    return education;
  };

  return (
    <div className="relative space-y-8 p-6">
      {/* View Profile Button */}
      {!isPublicView && (
        <div className="mb-4 flex justify-start md:absolute md:top-4 md:right-4 md:mb-0 md:justify-end">
          <button
            onClick={() => {
              const { openProfilePopup } = require('@/constants/ui');
              openProfilePopup(profile.id);
            }}
            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <span>👁️</span>
            <span className="ml-2">Se offentlig profil</span>
          </button>
        </div>
      )}

      {/* Header section */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-6">
          <div className="relative group">
            <ProfileImage 
              src={profile.profileImage} 
              name={profile.name || ''} 
              size="lg" 
            />
            {!isPublicView && (
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition-opacity">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving === 'profileImage'}
                  className="text-white hover:text-gray-300"
                >
                  {saving === 'profileImage' ? (
                    <LoadingSpinner className="w-6 h-6" />
                  ) : (
                    <PhotoIcon className="w-6 h-6" />
                  )}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            {editingField === 'name' ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={tempValues.name || ''}
                  onChange={(e) => setTempValues({ ...tempValues, name: e.target.value })}
                  className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-brand-500 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => handleFieldSave('name')}
                  disabled={saving === 'name'}
                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                >
                  {saving === 'name' ? (
                    <LoadingSpinner className="w-4 h-4" />
                  ) : (
                    <CheckIcon className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={handleFieldCancel}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center group">
                <h1 className="text-2xl font-bold text-gray-900 flex-1">
                  {profile.name || 'Navn ikke oppgitt'}
                </h1>
                {!isPublicView && (
                  <button
                    onClick={() => handleFieldEdit('name', profile.name)}
                    className="ml-2 p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-brand-600 transition-all"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
            
            {profile.region && (
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <MapPinIcon className="h-4 w-4 mr-1" />
                <span>{getRegionLabel(profile.region)}</span>
              </div>
            )}
            
            <div className="flex items-center mt-2">
              <div className="flex items-center space-x-3">
                {/* Show activity status with appropriate colors */}
                <div className={`flex items-center text-sm ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                  <div className={`mr-2 h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  {isOnline ? 'Online' : 'Offline'}
                </div>
                
                {/* Badges */}
                <div className="flex items-center space-x-2">
                  {(() => {
                    const teacherBadge = getTeacherBadge(profile.teacherSessions || 0, profile.teacherStudents || 0);
                    const studentBadge = getStudentBadge(profile.studentSessions || 0, profile.studentTeachers || 0);
                    
                    return (
                      <>
                        {teacherBadge && (
                          <button 
                            onClick={() => window.location.href = '/badges'}
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium hover:scale-105 transition-transform cursor-pointer ${teacherBadge.color}`}
                            title={`Lærer ${teacherBadge.level} - Klikk for mer info`}>
                            <span className="mr-1">👨‍🏫</span>
                            <span>{teacherBadge.icon}</span>
                          </button>
                        )}
                        {studentBadge && (
                          <button 
                            onClick={() => window.location.href = '/badges'}
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium hover:scale-105 transition-transform cursor-pointer ${studentBadge.color}`}
                            title={`Student ${studentBadge.level} - Klikk for mer info`}>
                            <span className="mr-1">🎓</span>
                            <span>{studentBadge.icon}</span>
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <UserIcon className="h-5 w-5 mr-2" />
            Personlige opplysninger
          </h2>
          <dl className="space-y-4">
            {!isPublicView && (
              <div>
                <dt className="text-sm font-medium text-gray-500">E-post</dt>
                <dd className="mt-1 text-sm text-gray-900">{profile.email}</dd>
              </div>
            )}
            
            {renderEditableField('gender', 'Kjønn', profile.gender, 'select', genderOptions, 'privacyGender')}
            
            {renderEditableField('birthYear', 'Fødselsår', profile.birthYear, 'select', birthYearOptions, 'privacyAge')}
            
            {renderEditableField('region', 'Region', profile.region, 'select', regionOptions, 'privacyLocation')}
            
            {renderEditableField('postalCode', 'Postnummer', profile.postalCode, 'text', undefined, 'privacyPostalCode')}
            
            {isFieldVisible(profile.privacyMemberSince) && (
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center justify-between">
                  <span>Medlem siden</span>
                  {!isPublicView && (
                    <button
                      onClick={() => handlePrivacyToggle('privacyMemberSince', profile.privacyMemberSince)}
                      disabled={saving === 'privacyMemberSince'}
                      className={`flex items-center text-xs px-2 py-1 rounded-full transition-colors ${
                        profile.privacyMemberSince === 'PUBLIC' 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={profile.privacyMemberSince === 'PUBLIC' ? 'Klikk for å gjøre privat' : 'Klikk for å gjøre offentlig'}
                    >
                      {saving === 'privacyMemberSince' ? (
                        <LoadingSpinner className="w-3 h-3 mr-1" />
                      ) : profile.privacyMemberSince === 'PUBLIC' ? (
                        <EyeIcon className="w-3 h-3 mr-1" />
                      ) : (
                        <EyeSlashIcon className="w-3 h-3 mr-1" />
                      )}
                      {profile.privacyMemberSince === 'PUBLIC' ? 'Offentlig' : 'Privat'}
                    </button>
                  )}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatters.date(new Date(profile.createdAt))}
                </dd>
              </div>
            )}
            
            {isFieldVisible(profile.privacyLastActive) && (
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center justify-between">
                  <span>Sist aktiv</span>
                  {!isPublicView && (
                    <button
                      onClick={() => handlePrivacyToggle('privacyLastActive', profile.privacyLastActive)}
                      disabled={saving === 'privacyLastActive'}
                      className={`flex items-center text-xs px-2 py-1 rounded-full transition-colors ${
                        profile.privacyLastActive === 'PUBLIC' 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={profile.privacyLastActive === 'PUBLIC' ? 'Klikk for å gjøre privat' : 'Klikk for å gjøre offentlig'}
                    >
                      {saving === 'privacyLastActive' ? (
                        <LoadingSpinner className="w-3 h-3 mr-1" />
                      ) : profile.privacyLastActive === 'PUBLIC' ? (
                        <EyeIcon className="w-3 h-3 mr-1" />
                      ) : (
                        <EyeSlashIcon className="w-3 h-3 mr-1" />
                      )}
                      {profile.privacyLastActive === 'PUBLIC' ? 'Offentlig' : 'Privat'}
                    </button>
                  )}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {profile.lastActive ? formatters.date(new Date(profile.lastActive)) : <span className="text-gray-400 italic">Ikke oppgitt</span>}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div>
          <dl className="space-y-4">
            {/* Combined degree + education field */}
            {isFieldVisible(profile.privacyEducation) && (
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center justify-between">
                  <span>Utdanning</span>
                  {!isPublicView && (
                    <button
                      onClick={() => handlePrivacyToggle('privacyEducation', profile.privacyEducation)}
                      disabled={saving === 'privacyEducation'}
                      className={`flex items-center text-xs px-2 py-1 rounded-full transition-colors ${
                        profile.privacyEducation === 'PUBLIC' 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={profile.privacyEducation === 'PUBLIC' ? 'Klikk for å gjøre privat' : 'Klikk for å gjøre offentlig'}
                    >
                      {saving === 'privacyEducation' ? (
                        <LoadingSpinner className="w-3 h-3 mr-1" />
                      ) : profile.privacyEducation === 'PUBLIC' ? (
                        <EyeIcon className="w-3 h-3 mr-1" />
                      ) : (
                        <EyeSlashIcon className="w-3 h-3 mr-1" />
                      )}
                      {profile.privacyEducation === 'PUBLIC' ? 'Offentlig' : 'Privat'}
                    </button>
                  )}
                </dt>
              {editingField === 'education' ? (
                <dd className="mt-1 space-y-2">
                  <div className="flex space-x-2">
                    <select
                      value={tempValues.degree || ''}
                      onChange={(e) => setTempValues({ ...tempValues, degree: e.target.value })}
                      className="flex-shrink-0 w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    >
                      <option value="">Grad</option>
                      {degreeOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={tempValues.education || ''}
                      onChange={(e) => setTempValues({ ...tempValues, education: e.target.value })}
                      placeholder="Skole/Institusjon og fagområde"
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      autoFocus
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        // Save both degree and education
                        const saveData = {
                          degree: tempValues.degree || null,
                          education: tempValues.education || null
                        };
                        handleFieldSaveMultiple(saveData);
                      }}
                      disabled={saving === 'education'}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                    >
                      {saving === 'education' ? (
                        <LoadingSpinner className="w-4 h-4" />
                      ) : (
                        <CheckIcon className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={handleFieldCancel}
                      disabled={saving === 'education'}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                </dd>
              ) : (
                <dd className="mt-1 flex items-center group">
                  <span className="text-sm text-gray-900 flex-1">
                    {formatEducation(profile.degree, profile.education) || <span className="text-gray-400 italic">Ikke oppgitt</span>}
                  </span>
                  {!isPublicView && (
                    <button
                      onClick={() => {
                        setEditingField('education');
                        setTempValues({ 
                          degree: profile.degree || '', 
                          education: profile.education || '' 
                        });
                      }}
                      className="ml-2 p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-brand-600 transition-all"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  )}
                </dd>
              )}
              </div>
            )}

            {renderEditableField('certifications', 'Sertifiseringer', profile.certifications, 'textarea', undefined, 'privacyCertifications')}
            
            {/* Portfolio/Supporting Documents Section */}
            {isFieldVisible(profile.privacyDocuments) && (
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center justify-between">
                  <span>Tilleggsmateriale</span>
                  {!isPublicView && (
                    <button
                      onClick={() => handlePrivacyToggle('privacyDocuments', profile.privacyDocuments)}
                      disabled={saving === 'privacyDocuments'}
                      className={`flex items-center text-xs px-2 py-1 rounded-full transition-colors ${
                        profile.privacyDocuments === 'PUBLIC' 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={profile.privacyDocuments === 'PUBLIC' ? 'Klikk for å gjøre privat' : 'Klikk for å gjøre offentlig'}
                  >
                    {saving === 'privacyDocuments' ? (
                      <LoadingSpinner className="w-3 h-3 mr-1" />
                    ) : profile.privacyDocuments === 'PUBLIC' ? (
                      <EyeIcon className="w-3 h-3 mr-1" />
                    ) : (
                      <EyeSlashIcon className="w-3 h-3 mr-1" />
                    )}
                    {profile.privacyDocuments === 'PUBLIC' ? 'Offentlig' : 'Privat'}
                  </button>
                )}
              </dt>
              <dd className="mt-2">
                {isPublicView ? (
                  // Public view - simple file list placeholder
                  <div className="bg-gray-50 rounded-lg p-4">
                    {profile.documents && profile.documents.length > 0 ? (
                      <div className="space-y-2">
                        {profile.documents.map((doc, index) => (
                          <div key={doc.id || index} className="flex items-center space-x-2 p-2 bg-white rounded border">
                            <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-700 truncate">{doc.fileName}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">
                        Ingen filer tilgjengelig
                      </div>
                    )}
                  </div>
                ) : (
                  // Private view - upload interface
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
                    <DocumentTextIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Last opp tilleggsmateriale</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      CV, portefølje, vitnemål, sertifikater, prosjekteksempler
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PDF, DOC, DOCX, JPG, PNG • Maks 10MB per fil
                    </p>
                    
                    {/* Show uploaded files if any */}
                    {profile.documents && profile.documents.length > 0 ? (
                      <div className="mt-4 space-y-2">
                        {profile.documents.map((doc, index) => (
                          <div key={doc.id || index} className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                            <DocumentTextIcon className="h-4 w-4" />
                            <span>{doc.fileName}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 text-xs text-gray-400">
                        <div className="flex items-center justify-center space-x-1">
                          <span>📄</span>
                          <span>Ingen filer lastet opp ennå</span>
                        </div>
                      </div>
                    )}
                    
                    <button
                      type="button" 
                      disabled
                      className="mt-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed"
                    >
                      <DocumentArrowUpIcon className="h-4 w-4 mr-1" />
                      Velg filer (kommer snart)
                    </button>
                  </div>
                )}
              </dd>
              </div>
            )}

            {/* Activity Stats */}
            <div className="mt-6">
              <dt className="text-sm font-medium text-gray-500 mb-3 flex items-center justify-between">
                <span>Aktivitetshistorikk</span>
                {!isPublicView && (
                  <button
                    onClick={() => handlePrivacyToggle('privacyStats', profile.privacyStats)}
                    disabled={saving === 'privacyStats'}
                    className={`flex items-center text-xs px-2 py-1 rounded-full transition-colors ${
                      profile.privacyStats === 'PUBLIC' 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={profile.privacyStats === 'PUBLIC' ? 'Klikk for å gjøre privat' : 'Klikk for å gjøre offentlig'}
                  >
                    {saving === 'privacyStats' ? (
                      <LoadingSpinner className="w-3 h-3 mr-1" />
                    ) : profile.privacyStats === 'PUBLIC' ? (
                      <EyeIcon className="w-3 h-3 mr-1" />
                    ) : (
                      <EyeSlashIcon className="w-3 h-3 mr-1" />
                    )}
                    {profile.privacyStats === 'PUBLIC' ? 'Offentlig' : 'Privat'}
                  </button>
                )}
              </dt>
              {isFieldVisible(profile.privacyStats) ? (
                <dd className="mt-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-500 mb-1">Som lærer</div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">Økter gjennomført</span>
                          <span className="text-sm font-medium text-gray-900">{profile.teacherSessions || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">Unike elever</span>
                          <span className="text-sm font-medium text-gray-900">{profile.teacherStudents || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-500 mb-1">Som elev</div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">Økter gjennomført</span>
                          <span className="text-sm font-medium text-gray-900">{profile.studentSessions || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">Unike lærere</span>
                          <span className="text-sm font-medium text-gray-900">{profile.studentTeachers || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </dd>
              ) : (
                <dd className="mt-1 text-sm text-gray-500 italic">
                  Skjult
                </dd>
              )}
            </div>
            
          </dl>
        </div>
      </div>

      {/* Bio section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <DocumentTextIcon className="h-5 w-5 mr-2" />
          Om meg
        </h2>
        {editingField === 'bio' ? (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex flex-col space-y-2">
              <textarea
                value={tempValues.bio || ''}
                onChange={(e) => setTempValues({ ...tempValues, bio: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                rows={6}
                placeholder="Fortell litt om deg selv..."
                maxLength={1000}
                autoFocus
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {(tempValues.bio || '').length}/1000 tegn
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleFieldSave('bio')}
                    disabled={saving === 'bio'}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {saving === 'bio' ? <LoadingSpinner className="w-4 h-4" /> : 'Lagre'}
                  </button>
                  <button
                    onClick={handleFieldCancel}
                    className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="group">
            {profile.bio ? (
              <div className="bg-gray-50 rounded-lg p-4 relative">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {profile.bio}
                </p>
                {!isPublicView && (
                  <button
                    onClick={() => handleFieldEdit('bio', profile.bio)}
                    className="absolute top-2 right-2 p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-brand-600 transition-all"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-center relative group">
                <p className="text-sm text-gray-500 italic">
                  Ingen biografi lagt til enda.
                </p>
                {!isPublicView && (
                  <button
                    onClick={() => handleFieldEdit('bio', '')}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-white bg-opacity-90 transition-all"
                  >
                    <span className="text-brand-600 text-sm font-medium flex items-center">
                      <PencilIcon className="w-4 h-4 mr-1" />
                      Legg til biografi
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Documents section */}
      {profile.documents && profile.documents.length > 0 && isFieldVisible(profile.privacyDocuments) && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Dokumenter
            </h2>
            {!isPublicView && (
              <button
                onClick={() => handlePrivacyToggle('privacyDocuments', profile.privacyDocuments)}
                disabled={saving === 'privacyDocuments'}
                className={`flex items-center text-xs px-2 py-1 rounded-full transition-colors ${
                  profile.privacyDocuments === 'PUBLIC' 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={profile.privacyDocuments === 'PUBLIC' ? 'Klikk for å gjøre privat' : 'Klikk for å gjøre offentlig'}
              >
                {saving === 'privacyDocuments' ? (
                  <LoadingSpinner className="w-3 h-3 mr-1" />
                ) : profile.privacyDocuments === 'PUBLIC' ? (
                  <EyeIcon className="w-3 h-3 mr-1" />
                ) : (
                  <EyeSlashIcon className="w-3 h-3 mr-1" />
                )}
                {profile.privacyDocuments === 'PUBLIC' ? 'Offentlig' : 'Privat'}
              </button>
            )}
          </div>
          <DocumentsList documents={profile.documents} />
        </div>
      )}

    </div>
  );
}
