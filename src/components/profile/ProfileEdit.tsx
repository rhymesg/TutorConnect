'use client';

import { useState, useRef } from 'react';
import { User, NorwegianRegion, Gender } from '@prisma/client';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { FormField } from '@/components/auth/FormField';
import { FormError } from '@/components/auth/FormError';
import { RegionSelector } from '@/components/auth/RegionSelector';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useApiCall } from '@/hooks/useApiCall';
import { updateProfileSchema, UpdateProfileInput } from '@/schemas/profile';
import { norwegianEducationLevels, norwegianSubjects } from '@/utils/norwegian-validation';

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
  onSave: (data: UpdateProfileInput) => Promise<void>;
  onCancel: () => void;
}

export function ProfileEdit({ profile, onSave, onCancel }: Props) {
  const [formData, setFormData] = useState<UpdateProfileInput>({
    name: profile.name || '',
    region: profile.region,
    postalCode: profile.postalCode || '',
    gender: profile.gender,
    birthYear: profile.birthYear,
    school: profile.school || '',
    degree: profile.degree || '',
    certifications: profile.certifications || '',
    bio: profile.bio || '',
  });
  
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(profile.profileImage);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { execute: uploadImage, loading: uploadingImage } = useApiCall();

  const handleInputChange = (field: keyof UpdateProfileInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific errors when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setErrors(prev => ({ 
        ...prev, 
        profileImage: ['Bildet må være mindre enn 5MB'] 
      }));
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ 
        ...prev, 
        profileImage: ['Kun bildefiler er tillatt'] 
      }));
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await uploadImage('/api/profile/image', {
        method: 'POST',
        body: formData,
      });

      if (response?.success) {
        setProfileImage(response.data.imageUrl);
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.profileImage;
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Image upload error:', error);
      setErrors(prev => ({ 
        ...prev, 
        profileImage: ['Kunne ikke laste opp bilde. Prøv igjen.'] 
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // Validate form data
      const validatedData = updateProfileSchema.parse(formData);
      
      // Include profile image if changed
      const dataToSave = profileImage !== profile.profileImage 
        ? { ...validatedData, profileImage }
        : validatedData;

      await onSave(dataToSave);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const fieldErrors: Record<string, string[]> = {};
        error.errors.forEach((err: any) => {
          const field = err.path[0];
          if (!fieldErrors[field]) fieldErrors[field] = [];
          fieldErrors[field].push(err.message);
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: ['En feil oppstod. Prøv igjen.'] });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const birthYearOptions = [];
  for (let year = currentYear; year >= currentYear - 100; year--) {
    birthYearOptions.push(year);
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-8">
      {/* General errors */}
      {errors.general && <FormError errors={errors.general} />}

      {/* Profile Image */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Profilbilde</h3>
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
              <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                <PhotoIcon className="h-8 w-8 text-gray-400" />
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
              disabled={uploadingImage}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {uploadingImage ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <PhotoIcon className="h-4 w-4 mr-2" />
              )}
              {profileImage ? 'Endre bilde' : 'Last opp bilde'}
            </button>
            <p className="mt-1 text-xs text-gray-500">
              PNG, JPG, GIF opptil 5MB
            </p>
          </div>
        </div>
        {errors.profileImage && <FormError errors={errors.profileImage} />}
      </div>

      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Grunnleggende informasjon</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Navn"
            name="name"
            type="text"
            value={formData.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            error={errors.name?.[0]}
            required
            placeholder="Ditt fulle navn"
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Region <span className="text-red-500">*</span>
            </label>
            <RegionSelector
              value={formData.region || ''}
              onChange={(value) => handleInputChange('region', value)}
              error={errors.region?.[0]}
            />
          </div>
          
          <FormField
            label="Postnummer"
            name="postalCode"
            type="text"
            value={formData.postalCode || ''}
            onChange={(e) => handleInputChange('postalCode', e.target.value)}
            error={errors.postalCode?.[0]}
            placeholder="0000"
            maxLength={4}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kjønn
            </label>
            <select
              value={formData.gender || ''}
              onChange={(e) => handleInputChange('gender', e.target.value === '' ? null : e.target.value || undefined)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Velg kjønn</option>
              <option value="MALE">Mann</option>
              <option value="FEMALE">Kvinne</option>
              <option value="OTHER">Annet</option>
            </select>
            {errors.gender && <FormError errors={errors.gender} />}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fødselsår
            </label>
            <select
              value={formData.birthYear || ''}
              onChange={(e) => handleInputChange('birthYear', e.target.value === '' ? null : (e.target.value ? parseInt(e.target.value) : undefined))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Velg fødselsår</option>
              {birthYearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            {errors.birthYear && <FormError errors={errors.birthYear} />}
          </div>
        </div>
      </div>

      {/* Education */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Utdanning</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Skole/Institusjon"
            name="school"
            type="text"
            value={formData.school || ''}
            onChange={(e) => handleInputChange('school', e.target.value)}
            error={errors.school?.[0]}
            placeholder="f.eks. Universitetet i Oslo"
          />
          
          <FormField
            label="Grad/Utdanning"
            name="degree"
            type="text"
            value={formData.degree || ''}
            onChange={(e) => handleInputChange('degree', e.target.value)}
            error={errors.degree?.[0]}
            placeholder="f.eks. Bachelor i informatikk"
          />
        </div>
        
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sertifiseringer
          </label>
          <textarea
            value={formData.certifications || ''}
            onChange={(e) => handleInputChange('certifications', e.target.value)}
            rows={4}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Beskriv dine sertifiseringer, kurs og kvalifikasjoner..."
          />
          {errors.certifications && <FormError errors={errors.certifications} />}
        </div>
      </div>

      {/* Bio */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Om meg</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Biografi
          </label>
          <textarea
            value={formData.bio || ''}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            rows={6}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Fortell litt om deg selv, din undervisningserfaring, og hva du tilbyr..."
          />
          <p className="mt-1 text-sm text-gray-500">
            {(formData.bio || '').length}/1000 tegn
          </p>
          {errors.bio && <FormError errors={errors.bio} />}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          Avbryt
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Lagrer...
            </>
          ) : (
            'Lagre endringer'
          )}
        </button>
      </div>
    </form>
  );
}