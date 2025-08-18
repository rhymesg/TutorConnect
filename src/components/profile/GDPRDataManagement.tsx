'use client';

import { useState } from 'react';
import { 
  ShieldCheckIcon, 
  DocumentArrowDownIcon, 
  ExclamationTriangleIcon,
  TrashIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';
import { useApiCall } from '@/hooks/useApiCall';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface Props {
  onClose?: () => void;
}

export function GDPRDataManagement({ onClose }: Props) {
  const [confirmDelete, setConfirmDelete] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([]);
  
  const { execute: downloadData, loading: downloadLoading } = useApiCall();
  const { execute: deleteAccount, loading: deleteLoading } = useApiCall();

  const dataTypes = [
    {
      id: 'profile',
      label: 'Profilinformasjon',
      description: 'Navn, e-post, region, utdanning, biografi',
      required: true,
    },
    {
      id: 'posts',
      label: 'Innlegg og annonser',
      description: 'Dine læringsannonser og søk etter lærere',
      required: false,
    },
    {
      id: 'messages',
      label: 'Meldinger og samtaler',
      description: 'Chat-meldinger og samtalehistorikk',
      required: false,
    },
    {
      id: 'appointments',
      label: 'Avtaler og møter',
      description: 'Planlagte undervisningstimer og møter',
      required: false,
    },
    {
      id: 'documents',
      label: 'Opplastede dokumenter',
      description: 'Sertifikater, bevis og andre dokumenter',
      required: false,
    },
  ];

  const handleDataTypeToggle = (dataTypeId: string) => {
    const dataType = dataTypes.find(dt => dt.id === dataTypeId);
    if (dataType?.required) return; // Can't deselect required data
    
    setSelectedDataTypes(prev => 
      prev.includes(dataTypeId)
        ? prev.filter(id => id !== dataTypeId)
        : [...prev, dataTypeId]
    );
  };

  const handleDownloadData = async () => {
    try {
      const response = await downloadData('/api/profile/gdpr', {
        method: 'POST',
        data: { 
          action: 'export',
          dataTypes: selectedDataTypes.length ? selectedDataTypes : dataTypes.map(dt => dt.id)
        },
      });

      if (response?.success) {
        // Create and download file
        const blob = new Blob([JSON.stringify(response.data, null, 2)], {
          type: 'application/json'
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tutorconnect-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Data download error:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmDelete !== 'SLETT KONTO') return;

    try {
      const response = await deleteAccount('/api/profile', {
        method: 'DELETE',
        data: { confirmEmail: confirmDelete }
      });

      if (response?.success) {
        // Redirect to confirmation page
        window.location.href = '/auth/account-deleted';
      }
    } catch (error) {
      console.error('Account deletion error:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="flex items-start space-x-3">
        <ShieldCheckIcon className="h-6 w-6 text-blue-600 mt-1" />
        <div>
          <h2 className="text-lg font-medium text-gray-900">
            GDPR - Personvernsinnstillinger
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Administrer dine personvernrettigheter i henhold til GDPR (General Data Protection Regulation).
          </p>
        </div>
      </div>

      {/* Data Export Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-base font-medium text-gray-900 mb-4 flex items-center">
          <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
          Last ned dine data
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          Du har rett til å få en kopi av alle personopplysninger vi har registrert om deg. 
          Velg hvilke datatyper du ønsker å laste ned.
        </p>

        <div className="space-y-3 mb-6">
          {dataTypes.map((dataType) => (
            <label
              key={dataType.id}
              className={`relative flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedDataTypes.includes(dataType.id) || dataType.required
                  ? 'border-blue-200 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              } ${dataType.required ? 'opacity-75' : ''}`}
            >
              <input
                type="checkbox"
                checked={selectedDataTypes.includes(dataType.id) || dataType.required}
                onChange={() => handleDataTypeToggle(dataType.id)}
                disabled={dataType.required}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="ml-3 flex-1">
                <span className="text-sm font-medium text-gray-900">
                  {dataType.label}
                  {dataType.required && <span className="text-blue-600 ml-1">(påkrevd)</span>}
                </span>
                <p className="text-sm text-gray-500">{dataType.description}</p>
              </div>
            </label>
          ))}
        </div>

        <button
          onClick={handleDownloadData}
          disabled={downloadLoading}
          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {downloadLoading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Forbereder nedlasting...
            </>
          ) : (
            <>
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Last ned mine data
            </>
          )}
        </button>
      </div>

      {/* Data Rights Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">Dine rettigheter under GDPR:</p>
            <ul className="space-y-1 text-blue-700">
              <li>• <strong>Rett til innsyn:</strong> Se hvilke data vi har om deg</li>
              <li>• <strong>Rett til retting:</strong> Korrigere feil i dine data</li>
              <li>• <strong>Rett til sletting:</strong> Få slettet dine personopplysninger</li>
              <li>• <strong>Rett til dataportabilitet:</strong> Få dine data i et strukturert format</li>
              <li>• <strong>Rett til å begrense behandling:</strong> Begrense hvordan vi bruker dine data</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Account Deletion Section */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-base font-medium text-red-900 mb-4 flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
          Slett konto permanent
        </h3>
        
        <p className="text-sm text-red-700 mb-4">
          <strong>Advarsel:</strong> Dette vil permanent slette kontoen din og alle tilhørende data. 
          Denne handlingen kan ikke angres.
        </p>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-red-700 mb-2">
              Følgende data vil bli slettet permanent:
            </p>
            <ul className="text-sm text-red-600 space-y-1 ml-4">
              <li>• Alle profildata og personopplysninger</li>
              <li>• Alle innlegg og annonser</li>
              <li>• Samtalehistorikk og meldinger</li>
              <li>• Planlagte og gjennomførte avtaler</li>
              <li>• Opplastede dokumenter og filer</li>
            </ul>
          </div>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Slett konto permanent
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-red-700 mb-2">
                  Skriv "SLETT KONTO" for å bekrefte:
                </label>
                <input
                  type="text"
                  value={confirmDelete}
                  onChange={(e) => setConfirmDelete(e.target.value)}
                  className="block w-full border-red-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"
                  placeholder="SLETT KONTO"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setConfirmDelete('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={confirmDelete !== 'SLETT KONTO' || deleteLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {deleteLoading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Sletter...
                    </>
                  ) : (
                    <>
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Slett konto permanent
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div className="text-center text-sm text-gray-500">
        <p>
          Har du spørsmål om personvern eller GDPR? 
          <a href="/contact" className="text-blue-600 hover:text-blue-800 ml-1">
            Kontakt oss
          </a>
        </p>
      </div>

      {onClose && (
        <div className="text-center">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Lukk
          </button>
        </div>
      )}
    </div>
  );
}