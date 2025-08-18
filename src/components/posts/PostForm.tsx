'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  BookOpen, 
  MapPin, 
  Clock, 
  Users, 
  DollarSign, 
  Save, 
  X, 
  ImageIcon,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Eye
} from 'lucide-react';

import FormField from '@/components/auth/FormField';
import FormSelect from '@/components/forms/FormSelect';
import FormTextarea from '@/components/forms/FormTextarea';
import FormCheckboxGroup from '@/components/forms/FormCheckboxGroup';
import { LoadingSpinner, ErrorMessage } from '@/components/ui';

import { CreatePostSchema, UpdatePostSchema, type CreatePostInput, type UpdatePostInput } from '@/schemas/post';
import { PostWithDetails, PostType, Subject, AgeGroup, NorwegianRegion } from '@/types/database';
import { education, regions, forms, actions, posts } from '@/lib/translations';
import { useApiCall } from '@/hooks/useApiCall';

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
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const { apiCall, isLoading } = useApiCall();

  // Form setup
  const schema = mode === 'create' ? CreatePostSchema : UpdatePostSchema;
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors, isValid, isDirty }
  } = useForm<CreatePostInput | UpdatePostInput>({
    resolver: zodResolver(schema),
    defaultValues: post ? {
      type: post.type,
      subject: post.subject,
      ageGroups: post.ageGroups,
      title: post.title,
      description: post.description,
      availableDays: post.availableDays,
      availableTimes: post.availableTimes,
      preferredSchedule: post.preferredSchedule || undefined,
      location: post.location,
      specificLocation: post.specificLocation || undefined,
      hourlyRate: post.hourlyRate ? Number(post.hourlyRate) : undefined,
      hourlyRateMin: post.hourlyRateMin ? Number(post.hourlyRateMin) : undefined,
      hourlyRateMax: post.hourlyRateMax ? Number(post.hourlyRateMax) : undefined,
    } : {
      type: 'TUTOR_OFFERING' as PostType,
      ageGroups: [],
      availableDays: [],
      availableTimes: ['09:00'],
    }
  });

  // Watch form values for preview
  const watchedValues = watch();
  const selectedType = watch('type');
  const selectedSubject = watch('subject');

  // Submit handler
  const onSubmit = async (data: CreatePostInput | UpdatePostInput) => {
    try {
      setSubmitError(null);
      
      const endpoint = mode === 'create' ? '/api/posts' : `/api/posts/${post!.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await apiCall<PostWithDetails>({
        method,
        endpoint,
        data,
      });

      if (response.success && response.data) {
        onSuccess?.(response.data);
      } else {
        throw new Error(response.error || `Failed to ${mode} post`);
      }
    } catch (error) {
      console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} post:`, error);
      setSubmitError(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  // Subject options
  const subjectOptions = Object.entries(education.no.subjects).map(([key, name]) => ({
    value: key.toUpperCase(),
    label: name,
  }));

  // Age group options
  const ageGroupOptions = [
    { value: 'ELEMENTARY', label: education.no.levels.elementary },
    { value: 'MIDDLE_SCHOOL', label: education.no.levels.middleSchool },
    { value: 'HIGH_SCHOOL', label: education.no.levels.highSchool },
    { value: 'UNIVERSITY', label: education.no.levels.university },
    { value: 'ADULT', label: education.no.levels.adult },
  ];

  // Day options
  const dayOptions = [
    { value: 'MONDAY', label: 'Mandag' },
    { value: 'TUESDAY', label: 'Tirsdag' },
    { value: 'WEDNESDAY', label: 'Onsdag' },
    { value: 'THURSDAY', label: 'Torsdag' },
    { value: 'FRIDAY', label: 'Fredag' },
    { value: 'SATURDAY', label: 'Lørdag' },
    { value: 'SUNDAY', label: 'Søndag' },
  ];

  // Time slot helpers
  const addTimeSlot = () => {
    const currentTimes = getValues('availableTimes') || [];
    if (currentTimes.length < 10) {
      setValue('availableTimes', [...currentTimes, '09:00'], { shouldValidate: true });
    }
  };

  const removeTimeSlot = (index: number) => {
    const currentTimes = getValues('availableTimes') || [];
    setValue('availableTimes', currentTimes.filter((_, i) => i !== index), { shouldValidate: true });
  };

  const updateTimeSlot = (index: number, value: string) => {
    const currentTimes = getValues('availableTimes') || [];
    const newTimes = [...currentTimes];
    newTimes[index] = value;
    setValue('availableTimes', newTimes, { shouldValidate: true });
  };

  // Preview component
  const PostPreview = () => {
    const data = watchedValues as CreatePostInput;
    if (!data.title || !data.description) return null;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            data.type === 'TUTOR_OFFERING' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {data.type === 'TUTOR_OFFERING' ? 'Tilbyr undervisning' : 'Søker lærer'}
          </span>
        </div>
        
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          {data.title}
        </h3>
        
        <p className="text-sm text-neutral-600 mb-4">
          {data.description}
        </p>

        {data.subject && (
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-brand-50 text-brand-700 text-xs font-medium">
              {education.no.subjects[data.subject.toLowerCase() as keyof typeof education.no.subjects] || data.subject}
            </span>
          </div>
        )}

        <div className="text-sm text-neutral-500 space-y-1">
          {data.location && (
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              {data.location}
            </div>
          )}
          {(data.hourlyRate || data.hourlyRateMin || data.hourlyRateMax) && (
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              {data.hourlyRate 
                ? `${data.hourlyRate} NOK/time`
                : `${data.hourlyRateMin || 0} - ${data.hourlyRateMax || 0} NOK/time`
              }
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Header */}
      <div className="mb-8">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Post Type */}
            <div>
              <h3 className="text-lg font-medium text-neutral-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Type annonse
              </h3>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className={`
                      relative flex items-center p-4 rounded-lg border cursor-pointer transition-all
                      ${field.value === 'TUTOR_OFFERING'
                        ? 'bg-green-50 border-green-200 ring-2 ring-green-200'
                        : 'bg-white border-neutral-200 hover:border-neutral-300'
                      }
                    `}>
                      <input
                        type="radio"
                        value="TUTOR_OFFERING"
                        checked={field.value === 'TUTOR_OFFERING'}
                        onChange={() => field.onChange('TUTOR_OFFERING')}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-neutral-900">Tilbyr undervisning</div>
                        <div className="text-sm text-neutral-500">Jeg er lærer og vil tilby mine tjenester</div>
                      </div>
                    </label>
                    
                    <label className={`
                      relative flex items-center p-4 rounded-lg border cursor-pointer transition-all
                      ${field.value === 'STUDENT_SEEKING'
                        ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-200'
                        : 'bg-white border-neutral-200 hover:border-neutral-300'
                      }
                    `}>
                      <input
                        type="radio"
                        value="STUDENT_SEEKING"
                        checked={field.value === 'STUDENT_SEEKING'}
                        onChange={() => field.onChange('STUDENT_SEEKING')}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-neutral-900">Søker lærer</div>
                        <div className="text-sm text-neutral-500">Jeg er student og trenger hjelp</div>
                      </div>
                    </label>
                  </div>
                )}
              />
              {errors.type && <p className="text-red-600 text-sm mt-2">{errors.type.message}</p>}
            </div>

            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-neutral-900 mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Grunnleggende informasjon
              </h3>
              <div className="space-y-6">
                <FormField
                  label={forms.no.title}
                  name="title"
                  required
                  maxLength={100}
                  placeholder="F.eks. Matematikk for videregående skole"
                  {...register('title')}
                  error={errors.title?.message}
                />

                <FormTextarea
                  label={forms.no.description}
                  name="description"
                  required
                  rows={6}
                  maxLength={2000}
                  showCharCount
                  placeholder="Beskriv hva du tilbyr eller søker etter. Inkluder erfaring, undervisningsmetoder, og andre relevante detaljer..."
                  {...register('description')}
                  error={errors.description?.message}
                />

                <FormSelect
                  label={forms.no.subject}
                  name="subject"
                  required
                  {...register('subject')}
                  error={errors.subject?.message}
                >
                  <option value="">Velg fag</option>
                  {subjectOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </FormSelect>

                <Controller
                  name="ageGroups"
                  control={control}
                  render={({ field }) => (
                    <FormCheckboxGroup
                      label="Aldersgrupper"
                      name="ageGroups"
                      options={ageGroupOptions}
                      value={field.value}
                      onChange={field.onChange}
                      required
                      maxSelections={4}
                      error={errors.ageGroups?.message}
                      helperText="Velg hvilke aldersgrupper du kan undervise eller trenger hjelp for"
                    />
                  )}
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <h3 className="text-lg font-medium text-neutral-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Sted
              </h3>
              <div className="space-y-6">
                <FormSelect
                  label="Fylke/Region"
                  name="location"
                  required
                  {...register('location')}
                  error={errors.location?.message}
                >
                  <option value="">Velg fylke</option>
                  {regions.counties.map(county => (
                    <option key={county} value={county}>
                      {county}
                    </option>
                  ))}
                </FormSelect>

                <FormField
                  label="Spesifikt sted (valgfritt)"
                  name="specificLocation"
                  maxLength={200}
                  placeholder="F.eks. Oslo sentrum, hjemme hos meg, online"
                  {...register('specificLocation')}
                  error={errors.specificLocation?.message}
                  helperText="Spesifiser hvor undervisningen kan foregå"
                />
              </div>
            </div>

            {/* Availability */}
            <div>
              <h3 className="text-lg font-medium text-neutral-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Tilgjengelighet
              </h3>
              <div className="space-y-6">
                <Controller
                  name="availableDays"
                  control={control}
                  render={({ field }) => (
                    <FormCheckboxGroup
                      label="Tilgjengelige dager"
                      name="availableDays"
                      options={dayOptions}
                      value={field.value}
                      onChange={field.onChange}
                      required
                      layout="grid"
                      gridCols={3}
                      error={errors.availableDays?.message}
                    />
                  )}
                />

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    Tilgjengelige tider <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    {(watch('availableTimes') || ['09:00']).map((time, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <input
                          type="time"
                          value={time}
                          onChange={(e) => updateTimeSlot(index, e.target.value)}
                          className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                        />
                        {(watch('availableTimes')?.length || 0) > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTimeSlot(index)}
                            className="p-2 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {(watch('availableTimes')?.length || 0) < 10 && (
                      <button
                        type="button"
                        onClick={addTimeSlot}
                        className="text-brand-600 hover:text-brand-700 text-sm font-medium"
                      >
                        + Legg til tid
                      </button>
                    )}
                  </div>
                  {errors.availableTimes && <p className="text-red-600 text-sm mt-2">{errors.availableTimes.message}</p>}
                </div>

                <FormTextarea
                  label="Foretrukket timeplan (valgfritt)"
                  name="preferredSchedule"
                  rows={3}
                  maxLength={500}
                  placeholder="Beskriv din foretrukne timeplan eller spesielle ønsker..."
                  {...register('preferredSchedule')}
                  error={errors.preferredSchedule?.message}
                />
              </div>
            </div>

            {/* Pricing */}
            <div>
              <h3 className="text-lg font-medium text-neutral-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Pris
              </h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    label="Fast pris (NOK/time)"
                    name="hourlyRate"
                    type="number"
                    min={0}
                    max={10000}
                    step={10}
                    placeholder="500"
                    {...register('hourlyRate', { valueAsNumber: true })}
                    error={errors.hourlyRate?.message}
                  />
                  <FormField
                    label="Min pris (NOK/time)"
                    name="hourlyRateMin"
                    type="number"
                    min={0}
                    max={10000}
                    step={10}
                    placeholder="300"
                    {...register('hourlyRateMin', { valueAsNumber: true })}
                    error={errors.hourlyRateMin?.message}
                  />
                  <FormField
                    label="Maks pris (NOK/time)"
                    name="hourlyRateMax"
                    type="number"
                    min={0}
                    max={10000}
                    step={10}
                    placeholder="800"
                    {...register('hourlyRateMax', { valueAsNumber: true })}
                    error={errors.hourlyRateMax?.message}
                  />
                </div>
                <p className="text-sm text-neutral-500">
                  Angi enten en fast pris eller et prisområde. La stå tomt for "pris etter avtale".
                </p>
              </div>
            </div>

            {/* Error Message */}
            {submitError && (
              <ErrorMessage 
                message={submitError}
                className="rounded-lg"
              />
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t">
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="inline-flex items-center px-4 py-2 text-sm text-neutral-600 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {showPreview ? 'Skjul forhåndsvisning' : 'Forhåndsvisning'}
                </button>
              </div>
              
              <div className="flex items-center space-x-3">
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="px-6 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50"
                  >
                    {actions.no.cancel}
                  </button>
                )}
                
                <button
                  type="submit"
                  disabled={isLoading || !isValid}
                  className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading && <LoadingSpinner className="w-4 h-4 mr-2" />}
                  <Save className="w-4 h-4 mr-2" />
                  {mode === 'create' ? 'Publiser annonse' : 'Lagre endringer'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Preview Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            {showPreview && (
              <div>
                <h3 className="text-lg font-medium text-neutral-900 mb-4">Forhåndsvisning</h3>
                <PostPreview />
              </div>
            )}
            
            {!showPreview && (
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
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}