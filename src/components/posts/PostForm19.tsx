'use client';

import { useActionState, useState, useOptimistic, useEffect } from 'react';
import { 
  Save, 
  AlertTriangle,
  CheckCircle,
  Eye,
  Wifi,
  WifiOff,
  X,
  Trash2
} from 'lucide-react';

import { LoadingSpinner } from '@/components/ui';
import { createPostAction, updatePostAction, type PostFormState } from '@/lib/actions/posts';
import PostFormFields19 from './PostFormFields19';
import { PostWithDetails } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, useLanguageText } from '@/contexts/LanguageContext';
import { getSubjectLabelByLanguage } from '@/constants/subjects';
import { getRegionLabel } from '@/constants/regions';

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
  const { accessToken } = useAuth();
  const [showPreview, setShowPreview] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { language } = useLanguage();
  const t = useLanguageText();

  const headerTitle = mode === 'create'
    ? t('Opprett ny annonse', 'Create new listing')
    : t('Rediger annonse', 'Edit listing');

  const headerSubtitle = mode === 'create'
    ? t('Lag en annonse for å tilby undervisning eller finne en lærer', 'Create a listing to offer tutoring or find a tutor')
    : t('Oppdater informasjonen i annonsen din', 'Update the information in your listing');

  const savingStateLabel = mode === 'create'
    ? t('Oppretter...', 'Creating...')
    : t('Lagrer...', 'Saving...');
  const saveErrorLabel = mode === 'create'
    ? t('Kunne ikke opprette annonse', 'Could not create post')
    : t('Kunne ikke lagre endringer', 'Could not save changes');
  const networkHint = t('Sjekk internettforbindelsen din og prøv igjen.', 'Check your internet connection and try again.');
  const showPreviewLabel = t('Vis forhåndsvisning', 'Show preview');
  const hidePreviewLabel = t('Skjul forhåndsvisning', 'Hide preview');
  const cancelLabel = t('Avbryt', 'Cancel');
  const submitLabel = mode === 'create'
    ? t('Publiser annonse', 'Publish listing')
    : t('Lagre endringer', 'Save changes');
  const previewHeading = t('Forhåndsvisning', 'Preview');
  const previewSavingLabel = t('Lagrer...', 'Saving...');
  const previewEmptyMessage = t('Fyll ut tittelen og beskrivelsen for å se forhåndsvisning', 'Fill in the title and description to see a preview');
  const tutorBadgeLabel = t('Lærer tilbyr', 'Tutor offering');
  const studentBadgeLabel = t('Student søker', 'Student seeking');
  const pauseLabel = t('Sett på pause', 'Pause listing');
  const pauseTooltip = t('Når annonsen er pauset, blir den skjult fra listen og du mottar ingen nye meldinger.', 'While paused, the listing is hidden and you will not receive new messages.');
  const activateLabel = t('Gjør aktiv', 'Activate listing');
  const activateTooltip = t('Når annonsen er aktiv, vises den i listen og du kan motta nye meldinger.', 'When active, the listing appears in search and you can receive new messages.');
  const offlineError = t('Nettverksfeil oppstod.', 'A network error occurred.');
  const unknownErrorLabel = t('Feil', 'Error');
  const tipsTitle = t('Tips for en god annonse', 'Tips for a great listing');
  const tipsList = [
    t('Skriv en klar og beskrivende tittel', 'Write a clear and descriptive title'),
    t('Beskriv din erfaring og undervisningsmetoder', 'Describe your experience and teaching approach'),
    t('Vær spesifikk om tilgjengelighet', 'Be specific about your availability'),
    t('Sett en realistisk pris', 'Set a realistic price'),
    t('Oppdater profilen din før du publiserer', 'Update your profile before publishing'),
  ];
  const deleteTitle = t('Slett annonse?', 'Delete listing?');
  const deleteMessage = t('Er du sikker på at du vil slette denne annonsen? Denne handlingen kan ikke angres.', 'Are you sure you want to delete this listing? This action cannot be undone.');
  const deleteTip = t('Tips:', 'Tip:');
  const deleteTipBody = t('Hvis du bare vil skjule annonsen midlertidig, bruk "Sett på pause" i stedet.', 'If you only want to hide the listing temporarily, use "Pause listing" instead.');
  const deleteCancelLabel = t('Avbryt', 'Cancel');
  const deleteConfirmLabel = t('Slett', 'Delete');


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

  // Handle successful form submission
  useEffect(() => {
    if (state?.success && state?.post && onSuccess) {
      console.log('Form submission successful, calling onSuccess');
      onSuccess(state.post);
    }
  }, [state?.success, state?.post, onSuccess]);
  
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

  // Handle post deletion
  const handleDeletePost = async () => {
    if (!post?.id) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': accessToken ? `Bearer ${accessToken}` : ''
        }
      });

      if (response.ok) {
        // Redirect to user's posts page after successful deletion
        window.location.href = '/profile/posts';
      } else {
        const error = await response.json();
        alert(`${unknownErrorLabel}: ${error.error || t('Kunne ikke slette annonse', 'Failed to delete listing')}`);
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert(offlineError);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Preview component with optimistic data
  const PostPreview = () => {
    const previewData = optimisticFormData;
    
    if (!previewData.title || !previewData.description) {
      return (
        <div className="bg-neutral-50 rounded-xl p-6 text-center">
          <p className="text-neutral-500">{previewEmptyMessage}</p>
        </div>
      );
    }

    const subjectLabel = previewData.subject
      ? getSubjectLabelByLanguage(language, previewData.subject)
      : '';

    return (
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            previewData.type === 'TEACHER' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {previewData.type === 'TEACHER' ? tutorBadgeLabel : studentBadgeLabel}
          </span>
          {isPending && (
            <div className="flex items-center text-sm text-orange-600">
              <LoadingSpinner className="w-4 h-4 mr-1" />
              <span>{previewSavingLabel}</span>
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
              {subjectLabel || previewData.subject}
            </span>
          </div>
        )}

        <div className="text-sm text-neutral-500 space-y-1">
          {previewData.location && (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              {getRegionLabel(previewData.location)}
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
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">{headerTitle}</h1>
            <p className="text-neutral-600">{headerSubtitle}</p>
          </div>

          {/* Status indicators */}
          <div className="flex items-center space-x-4 text-sm">
            {/* Form state */}
            {isPending && (
              <div className="flex items-center">
                <LoadingSpinner className="w-4 h-4 mr-1" />
                <span className="text-neutral-600">{savingStateLabel}</span>
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
                      {saveErrorLabel}
                    </h3>
                    <p className="text-sm text-red-700 mt-1">{state.error}</p>
                  </div>
                </div>
                {!isOnline && (
                  <p className="text-sm text-red-700 mt-2">
                    {networkHint}
                  </p>
                )}
              </div>
            )}

            {/* Enhanced Actions */}
            <div className="flex items-center justify-between pt-6">
              <div className="flex items-center space-x-4">
                {mode === 'edit' ? (
                  <>
                    <div className="flex items-center space-x-3">
                      {post?.status === 'AKTIV' || !post?.status ? (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/posts/${post?.id}/status`, {
                                method: 'PATCH',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': accessToken ? `Bearer ${accessToken}` : ''
                                },
                                body: JSON.stringify({ status: 'PAUSET' })
                              });

                              if (response.ok) {
                                await response.json();
                                window.location.reload();
                              } else {
                                const error = await response.json();
                                alert(`${unknownErrorLabel}: ${error.error}`);
                              }
                            } catch (error) {
                              alert(offlineError);
                            }
                          }}
                          title={pauseTooltip}
                          className="inline-flex items-center px-4 py-2 text-sm rounded-lg font-medium bg-white text-red-600 border border-red-300 hover:bg-red-50"
                        >
                          {pauseLabel}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/posts/${post?.id}/status`, {
                                method: 'PATCH',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': accessToken ? `Bearer ${accessToken}` : ''
                                },
                                body: JSON.stringify({ status: 'AKTIV' })
                              });

                              if (response.ok) {
                                await response.json();
                                window.location.reload();
                              } else {
                                const error = await response.json();
                                alert(`${unknownErrorLabel}: ${error.error}`);
                              }
                            } catch (error) {
                              alert(offlineError);
                            }
                          }}
                          title={activateTooltip}
                          className="inline-flex items-center px-4 py-2 text-sm rounded-lg font-medium bg-white text-blue-600 border border-blue-300 hover:bg-blue-50"
                        >
                          {activateLabel}
                        </button>
                      )}
                    
                    {/* Delete button - hidden but kept for future use */}
                    {false && (
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={isDeleting}
                        title="Slett annonse"
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="inline-flex items-center px-4 py-2 text-sm text-neutral-600 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {showPreview ? hidePreviewLabel : showPreviewLabel}
                  </button>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isPending}
                  className="px-6 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50"
                >
                  {cancelLabel}
                </button>
                
                <button
                  type="submit"
                  disabled={isPending || !isOnline}
                  className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending && <LoadingSpinner className="w-4 h-4 mr-2" />}
                  <Save className="w-4 h-4 mr-2" />
                  {submitLabel}
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
                  <h3 className="text-lg font-medium text-neutral-900">{previewHeading}</h3>
                  {isPending && (
                    <span className="inline-flex items-center px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                      <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-1 animate-pulse"></div>
                      {previewSavingLabel}
                    </span>
                  )}
                </div>
                <PostPreview />
              </div>
            ) : (
              <div className="bg-neutral-50 rounded-xl p-6">
                <h3 className="text-lg font-medium text-neutral-900 mb-4">{tipsTitle}</h3>
                <div className="space-y-4 text-sm text-neutral-600">
                  {tipsList.map((tip) => (
                    <div key={tip} className="flex items-start">
                      <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {deleteTitle}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {deleteMessage}
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-700">
                  <strong>{deleteTip}</strong> {deleteTipBody}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                >
                  {deleteCancelLabel}
                </button>
                <button
                  onClick={handleDeletePost}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {deleteConfirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
