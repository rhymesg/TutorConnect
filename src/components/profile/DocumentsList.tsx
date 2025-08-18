'use client';

import { 
  DocumentTextIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  XCircleIcon,
  ArrowDownTrayIcon 
} from '@heroicons/react/24/outline';
import { formatters } from '@/lib/translations';

interface Document {
  id: string;
  documentType: string;
  fileName: string;
  verificationStatus: string;
  uploadedAt: string;
}

interface Props {
  documents: Document[];
  allowDownload?: boolean;
}

export function DocumentsList({ documents, allowDownload = false }: Props) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'PENDING':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'REJECTED':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'Verifisert';
      case 'PENDING':
        return 'Venter på godkjenning';
      case 'REJECTED':
        return 'Avvist';
      default:
        return 'Ukjent status';
    }
  };

  const getDocumentTypeText = (type: string) => {
    const typeMap = {
      EDUCATION_CERTIFICATE: 'Utdanningsbevis',
      ID_DOCUMENT: 'Legitimasjon',
      TEACHING_CERTIFICATE: 'Undervisningssertifikat',
      PROFESSIONAL_REFERENCE: 'Faglig referanse',
      BACKGROUND_CHECK: 'Politiattest',
      OTHER: 'Annet dokument'
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  const handleDownload = (document: Document) => {
    // TODO: Implement document download
    console.log('Download document:', document.id);
  };

  if (!documents.length) {
    return (
      <div className="text-center py-8">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          Ingen dokumenter lastet opp
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Dokumenter du laster opp vil vises her.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map((document) => (
        <div
          key={document.id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <DocumentTextIcon className="h-6 w-6 text-gray-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  {getDocumentTypeText(document.documentType)}
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  {document.fileName}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Lastet opp: {formatters.date(new Date(document.uploadedAt))}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                {getStatusIcon(document.verificationStatus)}
                <span className={`text-xs font-medium ${
                  document.verificationStatus === 'VERIFIED' 
                    ? 'text-green-600' 
                    : document.verificationStatus === 'PENDING'
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}>
                  {getStatusText(document.verificationStatus)}
                </span>
              </div>
              
              {allowDownload && (
                <button
                  onClick={() => handleDownload(document)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Last ned dokument"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}