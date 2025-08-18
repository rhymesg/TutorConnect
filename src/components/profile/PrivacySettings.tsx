'use client';

import { useState } from 'react';
import { User, PrivacySetting } from '@prisma/client';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  UserGroupIcon,
  ShieldCheckIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { updatePrivacySettingsSchema, UpdatePrivacySettingsInput } from '@/schemas/profile';

interface ProfileData extends User {
  completeness: {
    percentage: number;
    missingFields: string[];
  };
}

interface Props {
  profile: ProfileData;
  onSave: (data: UpdatePrivacySettingsInput) => Promise<void>;
  onCancel: () => void;
}

const privacyOptions = [
  {
    value: PrivacySetting.PUBLIC,
    label: 'Offentlig',
    description: 'Synlig for alle brukere',
    icon: EyeIcon,
  },
  {
    value: PrivacySetting.ON_REQUEST,
    label: 'På forespørsel',
    description: 'Synlig etter godkjent forespørsel',
    icon: UserGroupIcon,
  },
  {
    value: PrivacySetting.PRIVATE,
    label: 'Privat',
    description: 'Kun synlig for deg',
    icon: EyeSlashIcon,
  },
];

const privacyFields = [
  {
    key: 'privacyGender' as const,
    label: 'Kjønn',
    description: 'Kontroller hvem som kan se kjønnsinformasjon',
  },
  {
    key: 'privacyAge' as const,
    label: 'Alder/Fødselsår',
    description: 'Kontroller hvem som kan se aldersopplysninger',
  },
  {
    key: 'privacyDocuments' as const,
    label: 'Dokumenter og utdanning',
    description: 'Kontroller hvem som kan se utdanningsopplysninger og dokumenter',
  },
  {
    key: 'privacyContact' as const,
    label: 'Kontaktinformasjon',
    description: 'Kontroller hvem som kan se e-post og postnummer',
  },
];

export function PrivacySettings({ profile, onSave, onCancel }: Props) {
  const [formData, setFormData] = useState<UpdatePrivacySettingsInput>({
    privacyGender: profile.privacyGender,
    privacyAge: profile.privacyAge,
    privacyDocuments: profile.privacyDocuments,
    privacyContact: profile.privacyContact,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleFieldChange = (field: keyof UpdatePrivacySettingsInput, value: PrivacySetting) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear errors for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // Validate form data
      const validatedData = updatePrivacySettingsSchema.parse(formData);
      await onSave(validatedData);
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

  const getPrivacyOptionInfo = (value: PrivacySetting) => {
    return privacyOptions.find(opt => opt.value === value);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-8">
      <div className="flex items-start space-x-3">
        <ShieldCheckIcon className="h-6 w-6 text-blue-600 mt-1" />
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Personverninnstillinger
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Kontroller hvem som kan se dine personlige opplysninger. 
            Du kan endre disse innstillingene når som helst.
          </p>
        </div>
      </div>

      {/* General errors */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{errors.general[0]}</p>
        </div>
      )}

      {/* Privacy settings */}
      <div className="space-y-8">
        {privacyFields.map((field) => {
          const currentValue = formData[field.key];
          const currentOption = getPrivacyOptionInfo(currentValue);
          
          return (
            <div key={field.key} className="border-b border-gray-200 pb-8 last:border-b-0">
              <div className="mb-4">
                <h4 className="text-base font-medium text-gray-900">
                  {field.label}
                </h4>
                <p className="mt-1 text-sm text-gray-600">
                  {field.description}
                </p>
              </div>
              
              <div className="space-y-3">
                {privacyOptions.map((option) => {
                  const IconComponent = option.icon;
                  const isSelected = currentValue === option.value;
                  
                  return (
                    <label
                      key={option.value}
                      className={`relative flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-blue-200 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={field.key}
                        value={option.value}
                        checked={isSelected}
                        onChange={(e) => handleFieldChange(field.key, e.target.value as PrivacySetting)}
                        className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center">
                          <IconComponent className={`h-5 w-5 mr-2 ${
                            isSelected ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                          <span className={`text-sm font-medium ${
                            isSelected ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {option.label}
                          </span>
                        </div>
                        <p className={`mt-1 text-sm ${
                          isSelected ? 'text-blue-700' : 'text-gray-500'
                        }`}>
                          {option.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
              
              {errors[field.key] && (
                <p className="mt-2 text-sm text-red-600">{errors[field.key][0]}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Information box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Om personverninnstillinger:</p>
            <ul className="space-y-1 text-blue-700">
              <li>• <strong>Offentlig:</strong> Informasjonen er synlig for alle brukere</li>
              <li>• <strong>På forespørsel:</strong> Andre brukere kan sende deg en forespørsel om å se informasjonen</li>
              <li>• <strong>Privat:</strong> Kun du kan se informasjonen</li>
            </ul>
            <p className="mt-2 text-xs">
              Uansett innstilling vil navnet ditt og regionen din være synlig for andre brukere 
              slik at de kan finne og kontakte deg for undervisning.
            </p>
          </div>
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
            'Lagre innstillinger'
          )}
        </button>
      </div>
    </form>
  );
}