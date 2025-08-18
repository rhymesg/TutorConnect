'use client';

import { useState, useRef } from 'react';
import { 
  CloudArrowUpIcon, 
  DocumentTextIcon,
  XMarkIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import { useApiCall } from '@/hooks/useApiCall';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface Props {
  onUploadComplete?: (document: any) => void;
  onClose?: () => void;
}

const documentTypes = [
  { value: 'EDUCATION_CERTIFICATE', label: 'Utdanningsbevis' },
  { value: 'ID_DOCUMENT', label: 'Legitimasjon (Pass/Førerkort)' },
  { value: 'TEACHING_CERTIFICATE', label: 'Undervisningssertifikat' },
  { value: 'PROFESSIONAL_REFERENCE', label: 'Faglig referanse' },
  { value: 'BACKGROUND_CHECK', label: 'Politiattest' },
  { value: 'OTHER', label: 'Annet dokument' },
];

export function DocumentUpload({ onUploadComplete, onClose }: Props) {
  const [selectedType, setSelectedType] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { execute: uploadDocument, loading: uploading } = useApiCall();

  const handleFileSelect = (file: File) => {
    // Validate file
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setErrors({ file: ['Filen må være mindre enn 10MB'] });
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      setErrors({ 
        file: ['Kun PDF, Word-dokumenter og bilder er tillatt'] 
      });
      return;
    }

    setSelectedFile(file);
    setErrors(prev => ({ ...prev, file: [] }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedType || !selectedFile) {
      setErrors({
        type: !selectedType ? ['Dokumenttype er påkrevd'] : [],
        file: !selectedFile ? ['Fil er påkrevd'] : [],
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('documentType', selectedType);
      if (description) {
        formData.append('description', description);
      }

      const response = await uploadDocument('/api/profile/documents', {
        method: 'POST',
        body: formData,
      });

      if (response?.success) {
        setUploadSuccess(true);
        onUploadComplete?.(response.data);
        
        // Reset form after delay
        setTimeout(() => {
          setSelectedType('');
          setSelectedFile(null);
          setDescription('');
          setUploadSuccess(false);
          onClose?.();
        }, 2000);
      }
    } catch (error) {
      console.error('Document upload error:', error);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (uploadSuccess) {
    return (
      <div className="p-6 text-center">
        <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">
          Dokument lastet opp!
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Dokumentet ditt er lastet opp og venter på godkjenning.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Last opp dokument
        </h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Document type selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Dokumenttype <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Velg dokumenttype</option>
          {documentTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {errors.type && (
          <p className="mt-1 text-sm text-red-600">{errors.type[0]}</p>
        )}
      </div>

      {/* File upload area */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fil <span className="text-red-500">*</span>
        </label>
        
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center ${
            dragOver 
              ? 'border-blue-400 bg-blue-50' 
              : selectedFile
              ? 'border-green-300 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          {selectedFile ? (
            <div className="space-y-2">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="inline-flex items-center text-sm text-red-600 hover:text-red-800"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Fjern fil
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-blue-600 cursor-pointer">
                    Klikk for å velge fil
                  </span> eller dra og slipp
                </p>
                <p className="text-xs text-gray-500">
                  PDF, Word, eller bildefiler opptil 10MB
                </p>
              </div>
            </div>
          )}
        </div>
        
        {errors.file && (
          <p className="mt-1 text-sm text-red-600">{errors.file[0]}</p>
        )}
      </div>

      {/* Optional description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Beskrivelse (valgfritt)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Legg til en beskrivelse av dokumentet..."
          maxLength={500}
        />
        <p className="mt-1 text-xs text-gray-500">
          {description.length}/500 tegn
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end space-x-3">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Avbryt
          </button>
        )}
        
        <button
          type="submit"
          disabled={uploading || !selectedType || !selectedFile}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {uploading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Laster opp...
            </>
          ) : (
            <>
              <CloudArrowUpIcon className="h-4 w-4 mr-2" />
              Last opp dokument
            </>
          )}
        </button>
      </div>
    </form>
  );
}