'use client';

import { useActionState, useState, useOptimistic, useRef } from 'react';
import { User, NorwegianRegion, Gender } from '@prisma/client';
import { 
  PhotoIcon, 
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';
import { FormField } from '@/components/auth/FormField';
import { FormError } from '@/components/auth/FormError';
import { RegionSelector } from '@/components/auth/RegionSelector';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { updateProfileAction, uploadProfileImageAction, type ProfileFormState } from '@/lib/actions/profile';
import { UpdateProfileInput } from '@/schemas/profile';

interface ProfileData extends User {
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
  onSave?: (profile: any) => void;
  onCancel: () => void;
}

export function ProfileEdit19({ profile, onSave, onCancel }: Props) {
  // React 19 useActionState for profile form handling
  const [profileState, submitProfileAction, isPending] = useActionState<ProfileFormState, FormData>(
    updateProfileAction,
    null
  );

  // React 19 useActionState for image upload
  const [imageState, submitImageAction, isImageUploading] = useActionState(
    uploadProfileImageAction,
    null
  );

  // React 19 useOptimistic for optimistic updates
  const [optimisticProfile, setOptimisticProfile] = useOptimistic<ProfileData, Partial<UpdateProfileInput>>(
    profile,
    (currentProfile, updates) => ({ ...currentProfile, ...updates })
  );

  const [profileImage, setProfileImage] = useState<string | null>(profile.profileImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Enhanced form submission with optimistic updates
  const handleSubmitWithOptimistic = (formData: FormData) => {
    // Optimistically update the profile data
    const optimisticUpdates = {
      name: formData.get('name') as string,
      region: formData.get('region') as NorwegianRegion,
      postalCode: formData.get('postalCode') as string || undefined,
      gender: formData.get('gender') as Gender || undefined,
      birthYear: formData.get('birthYear') ? Number(formData.get('birthYear')) : undefined,
      school: formData.get('school') as string || undefined,
      degree: formData.get('degree') as string || undefined,
      certifications: formData.get('certifications') as string || undefined,
      bio: formData.get('bio') as string || undefined,
    };
    
    setOptimisticProfile(optimisticUpdates);
    
    // Submit the action
    submitProfileAction(formData);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    
    // Submit image upload action
    submitImageAction(formData);
  };

  // Update profile image when upload succeeds
  if (imageState?.success && imageState.imageUrl && profileImage !== imageState.imageUrl) {
    setProfileImage(imageState.imageUrl);
  }

  // Handle successful profile update
  if (profileState?.success && profileState.profile && onSave) {
    onSave(profileState.profile);
  }

  const currentYear = new Date().getFullYear();
  const birthYearOptions = [];
  for (let year = currentYear - 13; year >= 1900; year--) {
    birthYearOptions.push(year);
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header with status indicators */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
              Rediger profil
            </h1>
            <p className="text-neutral-600">
              Oppdater din profilinformasjon og innstillinger
            </p>
          </div>

          {/* Status indicators */}
          <div className="flex items-center space-x-4 text-sm">
            {/* Form state */}
            {isPending && (
              <div className="flex items-center">
                <LoadingSpinner className="w-4 h-4 mr-1" />
                <span className="text-neutral-600">Lagrer...</span>
              </div>
            )}
            
            {profileState?.success && (
              <div className="flex items-center text-green-700">
                <CheckCircleIcon className="w-4 h-4 mr-1" />
                <span>Profil oppdatert</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* React 19 Form with Server Action */}
      <form action={handleSubmitWithOptimistic} className="space-y-8">
        {/* Enhanced Error Message */}
        {profileState?.error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">
                  Kunne ikke lagre profil
                </h3>
                <p className="text-sm text-red-700 mt-1">{profileState.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Image */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h3 className="text-lg font-medium text-neutral-900 mb-4">Profilbilde</h3>
          <div className="flex items-center space-x-6">
            <div className="shrink-0">
              {profileImage ? (
                <div className="relative">
                  <img 
                    className="h-20 w-20 object-cover rounded-full" 
                    src={profileImage} 
                    alt="Profil"
                  />
                  <button
                    type="button"
                    onClick={() => setProfileImage(null)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="h-20 w-20 rounded-full bg-neutral-200 flex items-center justify-center">
                  <PhotoIcon className="h-8 w-8 text-neutral-400" />
                </div>
              )}
            </div>
            
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImageUploading}
                className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-lg shadow-sm bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50"
              >
                {isImageUploading ? (
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                ) : (
                  <PhotoIcon className="h-4 w-4 mr-2" />
                )}
                {profileImage ? 'Endre bilde' : 'Last opp bilde'}
              </button>
              <p className="mt-1 text-xs text-neutral-500">
                PNG, JPG, GIF opptil 5MB
              </p>
              {imageState?.error && (
                <p className="mt-1 text-sm text-red-600">{imageState.error}</p>
              )}
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h3 className="text-lg font-medium text-neutral-900 mb-4">Grunnleggende informasjon</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Navn"
              name="name"
              type="text"
              defaultValue={optimisticProfile.name || ''}
              error={profileState?.fieldErrors?.name}
              required
              placeholder="Ditt fulle navn"
            />
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Region <span className="text-red-500">*</span>
              </label>
              <select
                name="region"
                defaultValue={optimisticProfile.region || ''}
                required
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
              >
                <option value="">Velg region</option>
                <option value="OSLO">Oslo</option>
                <option value="BERGEN">Bergen</option>
                <option value="TRONDHEIM">Trondheim</option>
                <option value="STAVANGER">Stavanger</option>
                <option value="KRISTIANSAND">Kristiansand</option>
                <option value="FREDRIKSTAD">Fredrikstad</option>
                <option value="DRAMMEN">Drammen</option>
                <option value="AKERSHUS">Akershus</option>
                <option value="VESTFOLD">Vestfold</option>
                <option value="ROGALAND">Rogaland</option>
                <option value="HORDALAND">Hordaland</option>
              </select>
              {profileState?.fieldErrors?.region && (
                <FormError error={profileState.fieldErrors.region} />
              )}
            </div>
            
            <FormField
              label="Postnummer"
              name="postalCode"
              type="text"
              defaultValue={optimisticProfile.postalCode || ''}
              error={profileState?.fieldErrors?.postalCode}
              placeholder="0000"
              maxLength={4}
            />
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Kjønn
              </label>
              <select
                name="gender"
                defaultValue={optimisticProfile.gender || ''}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
              >
                <option value="">Velg kjønn</option>
                <option value="MALE">Mann</option>
                <option value="FEMALE">Kvinne</option>
                <option value="OTHER">Annet</option>
                <option value="PREFER_NOT_TO_SAY">Ønsker ikke å oppgi</option>
              </select>
              {profileState?.fieldErrors?.gender && (
                <FormError error={profileState.fieldErrors.gender} />
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Fødselsår
              </label>
              <select
                name="birthYear"
                defaultValue={optimisticProfile.birthYear || ''}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
              >
                <option value="">Velg fødselsår</option>
                {birthYearOptions.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              {profileState?.fieldErrors?.birthYear && (
                <FormError error={profileState.fieldErrors.birthYear} />
              )}
            </div>
          </div>
        </div>

        {/* Education */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h3 className="text-lg font-medium text-neutral-900 mb-4">Utdanning</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Skole/Institusjon"
              name="school"
              type="text"
              defaultValue={optimisticProfile.school || ''}
              error={profileState?.fieldErrors?.school}
              placeholder="f.eks. Universitetet i Oslo"
            />
            
            <FormField
              label="Grad/Utdanning"
              name="degree"
              type="text"
              defaultValue={optimisticProfile.degree || ''}
              error={profileState?.fieldErrors?.degree}
              placeholder="f.eks. Bachelor i informatikk"
            />
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Sertifiseringer
            </label>
            <textarea
              name="certifications"
              defaultValue={optimisticProfile.certifications || ''}
              rows={4}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
              placeholder="Beskriv dine sertifiseringer, kurs og kvalifikasjoner..."
            />
            {profileState?.fieldErrors?.certifications && (
              <FormError error={profileState.fieldErrors.certifications} />
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h3 className="text-lg font-medium text-neutral-900 mb-4">Om meg</h3>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Biografi
            </label>
            <textarea
              name="bio"
              defaultValue={optimisticProfile.bio || ''}
              rows={6}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
              placeholder="Fortell litt om deg selv, din undervisningserfaring, og hva du tilbyr..."
              maxLength={1000}
            />
            <p className="mt-1 text-sm text-neutral-500">
              Maks 1000 tegn
            </p>
            {profileState?.fieldErrors?.bio && (
              <FormError error={profileState.fieldErrors.bio} />
            )}
          </div>
        </div>

        {/* Enhanced Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="text-sm text-neutral-600">
            <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-800 rounded-full text-xs font-medium">
              React 19 Actions
            </span>
            <span className="ml-2">Optimistiske oppdateringer aktivert</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              className="px-6 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50"
            >
              Avbryt
            </button>
            
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending && <LoadingSpinner className="w-4 h-4 mr-2" />}
              <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
              Lagre endringer
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}