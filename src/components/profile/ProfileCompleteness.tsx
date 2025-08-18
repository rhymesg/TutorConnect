'use client';

import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface Props {
  completeness: {
    percentage: number;
    missingFields: string[];
  };
  onEditClick: () => void;
}

const fieldLabels: Record<string, string> = {
  name: 'Navn',
  region: 'Region',
  bio: 'Biografi',
  postalCode: 'Postnummer',
  school: 'Skole/Institusjon',
  degree: 'Grad/Utdanning',
  certifications: 'Sertifiseringer',
  profileImage: 'Profilbilde',
};

export function ProfileCompleteness({ completeness, onEditClick }: Props) {
  const { percentage, missingFields } = completeness;
  const isComplete = percentage >= 100;

  if (isComplete) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start">
          <CheckCircleIcon className="h-6 w-6 text-green-600 mt-0.5 mr-3" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-green-800">
              Profilen din er fullført!
            </h3>
            <p className="mt-1 text-sm text-green-700">
              Gratulerer! Du har fylt ut all nødvendig informasjon i profilen din.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <div className="flex items-start">
        <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 mt-0.5 mr-3" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-amber-800">
              Profilen din er {percentage}% fullført
            </h3>
            <button
              onClick={onEditClick}
              className="text-sm font-medium text-amber-700 hover:text-amber-800 underline"
            >
              Fullfør profil
            </button>
          </div>
          
          <div className="mt-2">
            <div className="bg-amber-200 rounded-full h-2">
              <div
                className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
          
          {missingFields.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-amber-700 mb-2">
                Manglende informasjon:
              </p>
              <div className="flex flex-wrap gap-2">
                {missingFields.map((field) => (
                  <span
                    key={field}
                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800"
                  >
                    {fieldLabels[field] || field}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <p className="mt-3 text-xs text-amber-600">
            En fullført profil gjør det lettere for andre brukere å finne og stole på deg.
          </p>
        </div>
      </div>
    </div>
  );
}