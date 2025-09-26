'use client';

import React from 'react';
import { Control, Controller, FieldErrors, UseFormRegister, UseFormWatch } from 'react-hook-form';
import { 
  BookOpen, 
  MapPin, 
  Clock, 
  Users, 
  DollarSign,
  X
} from 'lucide-react';

import FormField from '@/components/auth/FormField';
import FormSelect from '@/components/forms/FormSelect';
import FormTextarea from '@/components/forms/FormTextarea';
import FormCheckboxGroup from '@/components/forms/FormCheckboxGroup';
import LocationAutocomplete from '@/components/forms/LocationAutocomplete';

import { CreatePostInput, UpdatePostInput } from '@/schemas/post';
import { useLanguage, useLanguageText } from '@/contexts/LanguageContext';
import { getSubjectOptions, getSubjectLabelByLanguage } from '@/constants/subjects';
import { getAgeGroupOptions, getAgeGroupLabelByLanguage } from '@/constants/ageGroups';
import { getRegionOptions } from '@/constants/regions';

interface PostFormFieldsProps {
  control: Control<CreatePostInput | UpdatePostInput>;
  register: UseFormRegister<CreatePostInput | UpdatePostInput>;
  watch: UseFormWatch<CreatePostInput | UpdatePostInput>;
  setValue: (name: any, value: any, options?: any) => void;
  getValues: (name?: any) => any;
  errors: FieldErrors<CreatePostInput | UpdatePostInput>;
  mode: 'create' | 'edit';
}

function usePostFormCopy() {
  const { language } = useLanguage();
  const t = useLanguageText();

  const copy = {
    postType: {
      heading: t('Annonsetype', 'Post type'),
      teacherTitle: t('Tilbyr undervisning', 'Offers tutoring'),
      teacherDescription: t('Jeg er lærer og vil tilby mine tjenester', 'I am a tutor and want to offer my services'),
      studentTitle: t('Søker lærer', 'Seeking tutor'),
      studentDescription: t('Jeg er student og trenger hjelp', 'I am a student and need help'),
    },
    basic: {
      heading: t('Grunnleggende informasjon', 'Basic information'),
      title: {
        label: t('Tittel på annonsen', 'Post title'),
        placeholder: t('F.eks. Matematikk for videregående skole', 'E.g. Mathematics for high school'),
        help: t('Skriv en tydelig og beskrivende tittel', 'Write a clear and descriptive title'),
      },
      description: {
        label: t('Detaljert beskrivelse', 'Detailed description'),
        placeholder: t('Beskriv hva du tilbyr eller søker. Inkluder erfaring, undervisningsmetoder og andre relevante detaljer...', 'Describe what you offer or need. Include experience, teaching methods, and other relevant details...'),
        help: t('Jo mer informasjon du gir, desto lettere er det å finne den rette matchen', 'The more information you provide, the easier it is to find the right match'),
      },
      subject: {
        label: t('Fagområde', 'Subject area'),
        placeholder: t('Velg fag', 'Select subject'),
        help: t('Velg fagområdet du kan undervise i eller trenger hjelp med', 'Choose the subject you can teach or need help with'),
      },
      ageGroups: {
        label: t('Aldersgrupper', 'Age groups'),
        help: t('Velg hvilke aldersgrupper du kan undervise eller trenger hjelp for', 'Select the age groups you can teach or need support for'),
      },
    },
    location: {
      heading: t('Sted', 'Location'),
      region: {
        label: t('Fylke/Region', 'County/Region'),
        help: t('Velg området hvor du kan undervise eller ønsker undervisning', 'Choose the area where you can teach or want tutoring'),
        placeholder: t('Velg fylke', 'Select region'),
      },
      specific: {
        label: t('Spesifikt sted (valgfritt)', 'Specific location (optional)'),
        placeholder: t('F.eks. Oslo sentrum, hjemme hos meg, online', 'E.g. Oslo city centre, at my place, online'),
        help: t('Spesifiser hvor undervisningen kan foregå', 'Specify where the lessons can take place'),
      },
    },
    availability: {
      heading: t('Tilgjengelighet', 'Availability'),
      daysLabel: t('Tilgjengelige dager', 'Available days'),
      daysHelp: t('Velg hvilke dager du er tilgjengelig', 'Choose the days you are available'),
      timesLabel: t('Tilgjengelige tidspunkt', 'Available times'),
      timesHelp: t('Legg til konkrete tidspunkt du er tilgjengelig. Hold tidene korte (f.eks. 17:00).', 'Add specific times you are available. Keep entries short (e.g. 17:00).'),
      addTime: t('+ Legg til tid', '+ Add time'),
      removeTime: t('Fjern tid', 'Remove time'),
      scheduleLabel: t('Foretrukket timeplan (valgfritt)', 'Preferred schedule (optional)'),
      schedulePlaceholder: t('Beskriv din foretrukne timeplan eller spesielle ønsker...', 'Describe your preferred schedule or special requests...'),
      scheduleHelp: t('Gi mer informasjon om din tilgjengelighet', 'Provide more details about your availability'),
    },
    pricing: {
      heading: t('Prising', 'Pricing'),
      fixedLabel: t('Fast pris (NOK/time)', 'Fixed rate (NOK/hour)'),
      minLabel: t('Min pris (NOK/time)', 'Minimum rate (NOK/hour)'),
      maxLabel: t('Maks pris (NOK/time)', 'Maximum rate (NOK/hour)'),
      help: t('Angi enten en fast pris eller et prisområde. La stå tomt for "pris etter avtale"', 'Specify a fixed price or a range. Leave empty for "price on agreement"'),
    },
  };

  const dayOptions = language === 'no'
    ? [
        { value: 'MONDAY', label: 'Mandag' },
        { value: 'TUESDAY', label: 'Tirsdag' },
        { value: 'WEDNESDAY', label: 'Onsdag' },
        { value: 'THURSDAY', label: 'Torsdag' },
        { value: 'FRIDAY', label: 'Fredag' },
        { value: 'SATURDAY', label: 'Lørdag' },
        { value: 'SUNDAY', label: 'Søndag' },
      ]
    : [
        { value: 'MONDAY', label: 'Monday' },
        { value: 'TUESDAY', label: 'Tuesday' },
        { value: 'WEDNESDAY', label: 'Wednesday' },
        { value: 'THURSDAY', label: 'Thursday' },
        { value: 'FRIDAY', label: 'Friday' },
        { value: 'SATURDAY', label: 'Saturday' },
        { value: 'SUNDAY', label: 'Sunday' },
      ];

  return { language, copy, dayOptions, t };
}

function PostTypeField({ control, errors }: Pick<PostFormFieldsProps, 'control' | 'errors'>) {
  const { copy } = usePostFormCopy();
  return (
    <div>
      <h3 className="text-lg font-medium text-neutral-900 mb-4 flex items-center">
        <Users className="w-5 h-5 mr-2" />
        {copy.postType.heading}
      </h3>
      <Controller
        name="type"
        control={control}
        render={({ field }) => (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className={`
              relative flex items-center p-4 rounded-lg border cursor-pointer transition-all
              ${field.value === 'TEACHER'
                ? 'bg-green-50 border-green-200 ring-2 ring-green-200'
                : 'bg-white border-neutral-200 hover:border-neutral-300'
              }
            `}>
              <input
                type="radio"
                value="TEACHER"
                checked={field.value === 'TEACHER'}
                onChange={() => field.onChange('TEACHER')}
                className="sr-only"
              />
              <div className="flex-1">
                <div className="font-medium text-neutral-900">{copy.postType.teacherTitle}</div>
                <div className="text-sm text-neutral-500">{copy.postType.teacherDescription}</div>
              </div>
            </label>
            
            <label className={`
              relative flex items-center p-4 rounded-lg border cursor-pointer transition-all
              ${field.value === 'STUDENT'
                ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-200'
                : 'bg-white border-neutral-200 hover:border-neutral-300'
              }
            `}>
              <input
                type="radio"
                value="STUDENT"
                checked={field.value === 'STUDENT'}
                onChange={() => field.onChange('STUDENT')}
                className="sr-only"
              />
              <div className="flex-1">
                <div className="font-medium text-neutral-900">{copy.postType.studentTitle}</div>
                <div className="text-sm text-neutral-500">{copy.postType.studentDescription}</div>
              </div>
            </label>
          </div>
        )}
      />
      {errors.type && <p className="text-red-600 text-sm mt-2">{errors.type.message}</p>}
    </div>
  );
}

function BasicInfoFields({ register, control, errors }: Pick<PostFormFieldsProps, 'register' | 'control' | 'errors'>) {
  const { language, copy } = usePostFormCopy();

  const subjectOptions = getSubjectOptions().map((option) => ({
    value: option.value,
    label: getSubjectLabelByLanguage(language, option.value),
  }));

  const ageGroupOptions = getAgeGroupOptions().map((option) => ({
    value: option.value,
    label: getAgeGroupLabelByLanguage(language, option.value),
  }));

  return (
    <div>
      <h3 className="text-lg font-medium text-neutral-900 mb-4 flex items-center">
        <BookOpen className="w-5 h-5 mr-2" />
        {copy.basic.heading}
      </h3>
      <div className="space-y-6">
        <FormField
          label={copy.basic.title.label}
          name="title"
          required
          maxLength={100}
          placeholder={copy.basic.title.placeholder}
          {...register('title')}
          error={errors.title?.message}
          helperText={copy.basic.title.help}
        />

        <FormTextarea
          label={copy.basic.description.label}
          name="description"
          required
          rows={6}
          maxLength={2000}
          showCharCount
          placeholder={copy.basic.description.placeholder}
          {...register('description')}
          error={errors.description?.message}
          helperText={copy.basic.description.help}
        />

        <FormSelect
          label={copy.basic.subject.label}
          name="subject"
          required
          {...register('subject')}
          error={errors.subject?.message}
          helperText={copy.basic.subject.help}
        >
          <option value="">{copy.basic.subject.placeholder}</option>
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
              label={copy.basic.ageGroups.label}
              name="ageGroups"
              options={ageGroupOptions}
              value={field.value}
              onChange={field.onChange}
              required
              maxSelections={4}
              error={errors.ageGroups?.message}
              helperText={copy.basic.ageGroups.help}
            />
          )}
        />
      </div>
    </div>
  );
}

function LocationFields({ control, register, errors }: Pick<PostFormFieldsProps, 'control' | 'register' | 'errors'>) {
  const { copy } = usePostFormCopy();
  return (
    <div>
      <h3 className="text-lg font-medium text-neutral-900 mb-4 flex items-center">
        <MapPin className="w-5 h-5 mr-2" />
        {copy.location.heading}
      </h3>
      <div className="space-y-6">
        <FormSelect
          label={copy.location.region.label}
          name="location"
          required
          {...register('location')}
          error={errors.location?.message}
          helperText={copy.location.region.help}
        >
          <option value="">{copy.location.region.placeholder}</option>
          {getRegionOptions().map(region => (
            <option key={region.value} value={region.value}>
              {region.label}
            </option>
          ))}
        </FormSelect>

        <Controller
          name="specificLocation"
          control={control}
          render={({ field }) => (
            <LocationAutocomplete
              label={copy.location.specific.label}
              name="specificLocation"
              value={field.value || ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder={copy.location.specific.placeholder}
              error={errors.specificLocation?.message}
              helperText={copy.location.specific.help}
            />
          )}
        />
      </div>
    </div>
  );
}

function AvailabilityFields({ 
  control, 
  register, 
  watch, 
  setValue, 
  getValues, 
  errors 
}: Pick<PostFormFieldsProps, 'control' | 'register' | 'watch' | 'setValue' | 'getValues' | 'errors'>) {
  const { copy, dayOptions } = usePostFormCopy();

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

  return (
    <div>
      <h3 className="text-lg font-medium text-neutral-900 mb-4 flex items-center">
        <Clock className="w-5 h-5 mr-2" />
        {copy.availability.heading}
      </h3>
      <div className="space-y-6">
        <Controller
          name="availableDays"
          control={control}
          render={({ field }) => (
            <FormCheckboxGroup
              label={copy.availability.daysLabel}
              name="availableDays"
              options={dayOptions}
              value={field.value}
              onChange={field.onChange}
              required
              layout="grid"
              gridCols={3}
              error={errors.availableDays?.message}
              helperText={copy.availability.daysHelp}
            />
          )}
        />

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-3">
            {copy.availability.timesLabel} <span className="text-red-500">*</span>
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
                    title={copy.availability.removeTime}
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
                {copy.availability.addTime}
              </button>
            )}
          </div>
          <p className="text-sm text-neutral-500 mt-2">{copy.availability.timesHelp}</p>
          {errors.availableTimes && <p className="text-red-600 text-sm mt-2">{errors.availableTimes.message}</p>}
        </div>

        <FormTextarea
          label={copy.availability.scheduleLabel}
          name="preferredSchedule"
          rows={3}
          maxLength={500}
          placeholder={copy.availability.schedulePlaceholder}
          {...register('preferredSchedule')}
          error={errors.preferredSchedule?.message}
          helperText={copy.availability.scheduleHelp}
        />
      </div>
    </div>
  );
}

function PricingFields({ register, errors }: Pick<PostFormFieldsProps, 'register' | 'errors'>) {
  const { copy } = usePostFormCopy();
  return (
    <div>
      <h3 className="text-lg font-medium text-neutral-900 mb-4 flex items-center">
        <DollarSign className="w-5 h-5 mr-2" />
        {copy.pricing.heading}
      </h3>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            label={copy.pricing.fixedLabel}
            name="hourlyRate"
            type="number"
            min={0}
            max={1500}
            step={10}
            placeholder="500"
            {...register('hourlyRate', { valueAsNumber: true })}
            error={errors.hourlyRate?.message}
          />
          <FormField
            label={copy.pricing.minLabel}
            name="hourlyRateMin"
            type="number"
            min={0}
            max={1500}
            step={10}
            placeholder="300"
            {...register('hourlyRateMin', { valueAsNumber: true })}
            error={errors.hourlyRateMin?.message}
          />
          <FormField
            label={copy.pricing.maxLabel}
            name="hourlyRateMax"
            type="number"
            min={0}
            max={1500}
            step={10}
            placeholder="800"
            {...register('hourlyRateMax', { valueAsNumber: true })}
            error={errors.hourlyRateMax?.message}
          />
        </div>
        <p className="text-sm text-neutral-500">
          {copy.pricing.help}
        </p>
      </div>
    </div>
  );
}

export default function PostFormFields(props: PostFormFieldsProps) {
  return (
    <div className="space-y-8">
      <PostTypeField {...props} />
      <BasicInfoFields {...props} />
      <LocationFields {...props} />
      <AvailabilityFields {...props} />
      <PricingFields {...props} />
    </div>
  );
}
