'use client';

import { useState, useEffect, useMemo } from 'react';
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
import dynamic from 'next/dynamic';

const PostFormFields = dynamic(() => import('./PostFormFields'), {
  ssr: false,
  loading: () => <div className="animate-pulse h-96 bg-neutral-100 rounded-lg" />
});

import { CreatePostFormSchema, UpdatePostFormSchema, type CreatePostFormInput, type UpdatePostFormInput } from '@/schemas/post-form';
import { PostWithDetails } from '@/types/database';
import { usePostForm } from '@/hooks/usePostForm';
import { getRegionLabel } from '@/constants/regions';
import { createOsloFormatter } from '@/lib/datetime';
import { useLanguage, useLanguageText } from '@/contexts/LanguageContext';
import { getSubjectLabelByLanguage } from '@/constants/subjects';

interface PostFormProps {
  mode: 'create' | 'edit';
  post?: PostWithDetails;
  onSuccess?: (post: PostWithDetails) => void;
  onCancel?: () => void;
  className?: string;
}

export default function PostForm({ 
  mode, 
  post, 
  onSuccess, 
  onCancel, 
  className = '' 
}: PostFormProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const { language } = useLanguage();
  const t = useLanguageText();
  const locale = language === 'no' ? 'nb-NO' : 'en-GB';
  const currencyFormatter = useMemo(() => new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }), [locale]);

  const formatCurrency = (value: number) => currencyFormatter.format(value);

  const headerTitle = mode === 'create'
    ? t('Opprett ny annonse', 'Create new listing')
    : t('Rediger annonse', 'Edit listing');

  const headerSubtitle = mode === 'create'
    ? t('Lag en annonse for å tilby undervisning eller finne en lærer', 'Create a listing to offer tutoring or find a tutor')
    : t('Oppdater informasjonen i annonsen din', 'Update the information in your listing');

  const onlineLabel = t('Tilkoblet', 'Online');
  const offlineLabel = t('Frakoblet', 'Offline');
  const savingLabel = t('Lagrer...', 'Saving...');
  const unsavedLabel = t('Ikke lagret', 'Not saved');
  const savedLabel = t('Lagret', 'Saved');
  const autoSaveBadgeLabel = unsavedLabel;
  const errorCreateLabel = t('Kunne ikke opprette annonse', 'Could not create post');
  const errorSaveLabel = t('Kunne ikke lagre endringer', 'Could not save changes');
  const networkHint = t('Sjekk internettforbindelsen din og prøv igjen.', 'Check your internet connection and try again.');
  const showPreviewLabel = t('Vis forhåndsvisning', 'Show preview');
  const hidePreviewLabel = t('Skjul forhåndsvisning', 'Hide preview');
  const saveDraftLabel = t('Lagre utkast', 'Save draft');
  const cancelLabel = t('Avbryt', 'Cancel');
  const submitLabel = mode === 'create'
    ? t('Publiser annonse', 'Publish listing')
    : t('Lagre endringer', 'Save changes');
  const previewHeading = t('Forhåndsvisning', 'Preview');
  const previewTipsTitle = t('Tips for en god annonse', 'Tips for a great listing');
  const autoSaveTitle = t('Automatisk lagring aktivert', 'Auto-save enabled');
  const autoSaveBody = t('Dine endringer lagres automatisk mens du skriver.', 'Your changes are saved automatically as you type.');
  const previewEmptyMessage = t('Fyll ut tittelen og beskrivelsen for å se forhåndsvisning', 'Fill in the title and description to see a preview');
  const tipsList = [
    t('Skriv en klar og beskrivende tittel', 'Write a clear and descriptive title'),
    t('Beskriv din erfaring og undervisningsmetoder', 'Describe your experience and teaching approach'),
    t('Vær spesifikk om tilgjengelighet', 'Be specific about your availability'),
    t('Sett en realistisk pris', 'Set a realistic price'),
    t('Inkluder dine kvalifikasjoner', 'Include your qualifications'),
  ];

  // Use enhanced form hook
  const {
    form,
    isSubmitting,
    submitError,
    isDirty,
    isValid,
    isAutoSaving,
    lastSaved,
    handleSubmit: onSubmit,
    handleCancel,
    clearError,
    saveDraft,
    previewData
  } = usePostForm({
    mode,
    post,
    onSuccess,
    onCancel,
    autoSave: mode === 'create', // Only auto-save for new posts
    autoSaveDelay: 3000
  });

  const lastSavedFormatter = useMemo(
    () =>
      createOsloFormatter(locale, {
        hour: '2-digit',
        minute: '2-digit',
      }),
    [locale]
  );

  const { control, register, watch, setValue, getValues, formState: { errors } } = form;

  // Network status
  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Preview component with enhanced data
  const PostPreview = () => {
    if (!previewData || !previewData.title || !previewData.description) {
      return (
        <div className="bg-neutral-50 rounded-xl p-6 text-center">
          <p className="text-neutral-500">{previewEmptyMessage}</p>
        </div>
      );
    }

    const typeLabel = previewData.type === 'TEACHER'
      ? t('Tilbyr undervisning', 'Offers tutoring')
      : t('Søker lærer', 'Seeking tutor');

    const subjectLabel = previewData.subject
      ? getSubjectLabelByLanguage(language, previewData.subject)
      : '';

    const formatDaySummary = (days: string[]) => {
      if (!days.length) {
        return '';
      }
      if (days.length === 7) {
        return t('Alle dager', 'All days');
      }
      return `${days.length} ${language === 'no' ? 'dager i uken' : 'days per week'}`;
    };

    const formatPreviewRate = () => {
      if (previewData.type === 'TEACHER') {
        return previewData.hourlyRate
          ? `${formatCurrency(previewData.hourlyRate)} ${language === 'no' ? 'per time' : 'per hour'}`
          : t('Pris etter avtale', 'Price negotiable');
      }

      if (previewData.hourlyRateMin && previewData.hourlyRateMax) {
        return `${formatCurrency(previewData.hourlyRateMin)} - ${formatCurrency(previewData.hourlyRateMax)} ${language === 'no' ? 'per time' : 'per hour'}`;
      }

      if (previewData.hourlyRateMin) {
        return `${language === 'no' ? 'Fra' : 'From'} ${formatCurrency(previewData.hourlyRateMin)} ${language === 'no' ? 'per time' : 'per hour'}`;
      }

      if (previewData.hourlyRateMax) {
        return `${language === 'no' ? 'Opptil' : 'Up to'} ${formatCurrency(previewData.hourlyRateMax)} ${language === 'no' ? 'per time' : 'per hour'}`;
      }

      return t('Pris etter avtale', 'Price negotiable');
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            previewData.type === 'TEACHER' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {typeLabel}
          </span>
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
              {previewData.specificLocation && ` • ${previewData.specificLocation}`}
            </div>
          )}
          {(previewData.hourlyRate || previewData.hourlyRateMin || previewData.hourlyRateMax) && (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 15h2c0 1.08.81 2 2 2h2c1.19 0 2-.92 2-2s-.81-2-2-2h-2c-1.19 0-2-.92-2-2s.81-2 2-2h2c1.08 0 2 .81 2 2h2c0-1.08-.81-2-2-2V7h-2v2h-2c-1.19 0-2 .92-2 2s.81 2 2 2h2c1.19 0 2 .92 2 2s-.81 2-2 2h-2c-1.08 0-2-.81-2-2H7v2h2v2H7v-2z"/>
              </svg>
              {formatPreviewRate()}
            </div>
          )}
          {previewData.availableDays && previewData.availableDays.length > 0 && (
            <div className="flex items-center">
              <ClockIcon className="w-4 h-4 mr-2" />
              <span className="text-xs">
                {formatDaySummary(previewData.availableDays)}
              </span>
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
              {headerTitle}
            </h1>
            <p className="text-neutral-600">
              {headerSubtitle}
            </p>
          </div>

          {/* Status indicators */}
          <div className="flex items-center space-x-4 text-sm">
            {/* Network status */}
            <div className="flex items-center">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-600 mr-1" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-600 mr-1" />
              )}
              <span className={isOnline ? 'text-green-700' : 'text-red-700'}>
                {isOnline ? onlineLabel : offlineLabel}
              </span>
            </div>

            {/* Auto-save status */}
            {mode === 'create' && (
              <div className="flex items-center">
                {isAutoSaving ? (
                  <>
                    <LoadingSpinner className="w-4 h-4 mr-1" />
                    <span className="text-neutral-600">{savingLabel}</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-green-700">
                      {savedLabel} {lastSavedFormatter.format(lastSaved)}
                    </span>
                  </>
                ) : isDirty ? (
                  <>
                    <ClockIcon className="w-4 h-4 text-orange-600 mr-1" />
                    <span className="text-orange-700">{unsavedLabel}</span>
                  </>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Use the new PostFormFields component */}
            <PostFormFields
              control={control}
              register={register}
              watch={watch}
              setValue={setValue}
              getValues={getValues}
              errors={errors}
              mode={mode}
            />

            {/* Enhanced Error Message */}
            {submitError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-800">
                      {mode === 'create' ? errorCreateLabel : errorSaveLabel}
                    </h3>
                    <p className="text-sm text-red-700 mt-1">{submitError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={clearError}
                    className="text-red-600 hover:text-red-800 ml-3"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {!isOnline && (
                  <p className="text-sm text-red-700 mt-2">
                    {networkHint}
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
                  {showPreview ? hidePreviewLabel : showPreviewLabel}
                </button>

                {mode === 'create' && isDirty && (
                  <button
                    type="button"
                    onClick={saveDraft}
                    disabled={isAutoSaving}
                    className="inline-flex items-center px-4 py-2 text-sm text-neutral-600 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50"
                  >
                    {isAutoSaving ? (
                      <LoadingSpinner className="w-4 h-4 mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {saveDraftLabel}
                  </button>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="px-6 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50"
                >
                  {cancelLabel}
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting || !isValid || !isOnline}
                  className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting && <LoadingSpinner className="w-4 h-4 mr-2" />}
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
                  {isDirty && (
                    <span className="inline-flex items-center px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                      <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-1"></div>
                      {autoSaveBadgeLabel}
                    </span>
                  )}
                </div>
                <PostPreview />
              </div>
            ) : (
              <div className="bg-neutral-50 rounded-xl p-6">
                <h3 className="text-lg font-medium text-neutral-900 mb-4">{previewTipsTitle}</h3>
                <div className="space-y-4 text-sm text-neutral-600">
                  {tipsList.map((tip) => (
                    <div key={tip} className="flex items-start">
                      <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
                
                {mode === 'create' && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium mb-1">{autoSaveTitle}</p>
                    <p className="text-xs text-blue-600">
                      {autoSaveBody}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
