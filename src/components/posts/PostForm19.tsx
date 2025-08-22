'use client';

import { useActionState, useState, useOptimistic } from 'react';
import { 
  Save, 
  AlertTriangle,
  CheckCircle,
  Eye,
  Clock as ClockIcon,
  Wifi,
  WifiOff,
  X
} from 'lucide-react';

import { LoadingSpinner, ErrorMessage } from '@/components/ui';
import { createPostAction, updatePostAction, type PostFormState } from '@/lib/actions/posts';
import PostFormFields19 from './PostFormFields19';
import { PostWithDetails } from '@/types/database';
import { education, forms, actions, posts } from '@/lib/translations';

interface PostForm19Props {
  mode: 'create' | 'edit';
  post?: PostWithDetails;
  defaultValues?: any; // For create mode default values from profile
  onSuccess?: (post: PostWithDetails) => void;
  onCancel?: () => void;
  className?: string;
}

export default function PostForm19({ 
  mode, 
  post, 
  defaultValues,
  onSuccess, 
  onCancel, 
  className = '' 
}: PostForm19Props) {
  const [showPreview, setShowPreview] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // React 19 useActionState for form handling
  const [state, submitAction, isPending] = useActionState<PostFormState, FormData>(
    mode === 'create' 
      ? createPostAction 
      : (prevState: PostFormState, formData: FormData) => updatePostAction(post?.id || '', prevState, formData),
    null
  );

  // React 19 useOptimistic for optimistic updates
  const [optimisticFormData, setOptimisticFormData] = useOptimistic<any, any>(
    post || {},
    (currentState, newData) => ({ ...currentState, ...newData })
  );

  // Network status tracking
  const updateOnlineStatus = () => setIsOnline(navigator.onLine);
  
  // Enhanced form submission with optimistic updates
  const handleSubmitWithOptimistic = (formData: FormData) => {
    // Optimistically update the form data
    const newData = {
      title: formData.get('title'),
      description: formData.get('description'),
      subject: formData.get('subject'),
      type: formData.get('type'),
      location: formData.get('location'),
    };
    
    setOptimisticFormData(newData);
    
    // Submit the action
    submitAction(formData);
  };

  // Preview component with optimistic data
  const PostPreview = () => {
    const previewData = optimisticFormData;
    
    if (!previewData.title || !previewData.description) {
      return (
        <div className="bg-neutral-50 rounded-xl p-6 text-center">
          <p className="text-neutral-500">Fyll ut tittelen og beskrivelsen for å se forhåndsvisning</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            previewData.type === 'TEACHER' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {previewData.type === 'TEACHER' ? 'Lærer tilbyr' : 'Student søker'}
          </span>
          {isPending && (
            <div className="flex items-center text-sm text-orange-600">
              <LoadingSpinner className="w-4 h-4 mr-1" />
              <span>Lagrer...</span>
            </div>
          )}
        </div>
        
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          {previewData.title}
        </h3>
        
        <p className="text-sm text-neutral-600 mb-4 line-clamp-3">
          {previewData.description}
        </p>

        {previewData.subject && (
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-brand-50 text-brand-700 text-xs font-medium">
              {education.no.subjects[previewData.subject.toLowerCase() as keyof typeof education.no.subjects] || previewData.subject}
            </span>
          </div>
        )}

        <div className="text-sm text-neutral-500 space-y-1">
          {previewData.location && (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              {previewData.location}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Header with status indicators */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
              {mode === 'create' ? 'Opprett ny annonse' : 'Rediger annonse'}
            </h1>
            <p className="text-neutral-600">
              {mode === 'create' 
                ? 'Lag en annonse for å tilby undervisning eller finne en lærer'
                : 'Oppdater informasjonen i annonsen din'
              }
            </p>
          </div>

          {/* Status indicators */}
          <div className="flex items-center space-x-4 text-sm">
            {/* Form state */}
            {isPending && (
              <div className="flex items-center">
                <LoadingSpinner className="w-4 h-4 mr-1" />
                <span className="text-neutral-600">
                  {mode === 'create' ? 'Oppretter...' : 'Lagrer...'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          {/* React 19 Form with Server Action */}
          <form action={handleSubmitWithOptimistic} className="space-y-8">
            {/* Form Fields */}
            <PostFormFields19 
              defaultValues={post || defaultValues}
              errors={state?.fieldErrors}
            />

            {/* Enhanced Error Message */}
            {state?.error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-800">
                      {mode === 'create' ? 'Kunne ikke opprette annonse' : 'Kunne ikke lagre endringer'}
                    </h3>
                    <p className="text-sm text-red-700 mt-1">{state.error}</p>
                  </div>
                </div>
                {!isOnline && (
                  <p className="text-sm text-red-700 mt-2">
                    Sjekk internettforbindelsen din og prøv igjen.
                  </p>
                )}
              </div>
            )}

            {/* Enhanced Actions */}
            <div className="flex items-center justify-between pt-6 border-t">
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="inline-flex items-center px-4 py-2 text-sm text-neutral-600 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {showPreview ? actions.no.hidePreview : actions.no.preview}
                </button>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isPending}
                  className="px-6 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50"
                >
                  {actions.no.cancel}
                </button>
                
                <button
                  type="submit"
                  disabled={isPending || !isOnline}
                  className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending && <LoadingSpinner className="w-4 h-4 mr-2" />}
                  <Save className="w-4 h-4 mr-2" />
                  {mode === 'create' ? actions.no.publishPost : actions.no.saveChanges}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Enhanced Preview Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            {showPreview ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-neutral-900">Forhåndsvisning</h3>
                  {isPending && (
                    <span className="inline-flex items-center px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                      <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-1 animate-pulse"></div>
                      Lagrer
                    </span>
                  )}
                </div>
                <PostPreview />
              </div>
            ) : (
              <div className="bg-neutral-50 rounded-xl p-6">
                <h3 className="text-lg font-medium text-neutral-900 mb-4">Tips for en god annonse</h3>
                <div className="space-y-4 text-sm text-neutral-600">
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                    <span>Skriv en klar og beskrivende tittel</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                    <span>Beskriv din erfaring og undervisningsmetoder</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                    <span>Vær spesifikk om tilgjengelighet</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                    <span>Sett en realistisk pris</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                    <span>Oppdater profilen din før du publiserer</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}