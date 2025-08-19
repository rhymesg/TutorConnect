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
import { education, regions, forms } from '@/lib/translations';

interface PostFormFieldsProps {
  control: Control<CreatePostInput | UpdatePostInput>;
  register: UseFormRegister<CreatePostInput | UpdatePostInput>;
  watch: UseFormWatch<CreatePostInput | UpdatePostInput>;
  setValue: (name: any, value: any, options?: any) => void;
  getValues: (name?: any) => any;
  errors: FieldErrors<CreatePostInput | UpdatePostInput>;
  mode: 'create' | 'edit';
}

function PostTypeField({ control, errors }: Pick<PostFormFieldsProps, 'control' | 'errors'>) {
  return (
    <div>
      <h3 className="text-lg font-medium text-neutral-900 mb-4 flex items-center">
        <Users className="w-5 h-5 mr-2" />
        {forms.no.postType}
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
  );
}

function BasicInfoFields({ register, control, errors }: Pick<PostFormFieldsProps, 'register' | 'control' | 'errors'>) {
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

  return (
    <div>
      <h3 className="text-lg font-medium text-neutral-900 mb-4 flex items-center">
        <BookOpen className="w-5 h-5 mr-2" />
        Grunnleggende informasjon
      </h3>
      <div className="space-y-6">
        <FormField
          label={forms.no.titleLabel}
          name="title"
          required
          maxLength={100}
          placeholder={forms.no.titlePlaceholder}
          {...register('title')}
          error={errors.title?.message}
          helperText={forms.no.titleHelp}
        />

        <FormTextarea
          label={forms.no.descriptionLabel}
          name="description"
          required
          rows={6}
          maxLength={2000}
          showCharCount
          placeholder={forms.no.descriptionPlaceholder}
          {...register('description')}
          error={errors.description?.message}
          helperText={forms.no.descriptionHelp}
        />

        <FormSelect
          label={forms.no.subjectLabel}
          name="subject"
          required
          {...register('subject')}
          error={errors.subject?.message}
          helperText={forms.no.subjectHelp}
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
              label={forms.no.ageGroupsLabel}
              name="ageGroups"
              options={ageGroupOptions}
              value={field.value}
              onChange={field.onChange}
              required
              maxSelections={4}
              error={errors.ageGroups?.message}
              helperText={forms.no.ageGroupsHelp}
            />
          )}
        />
      </div>
    </div>
  );
}

function LocationFields({ register, errors }: Pick<PostFormFieldsProps, 'register' | 'errors'>) {
  return (
    <div>
      <h3 className="text-lg font-medium text-neutral-900 mb-4 flex items-center">
        <MapPin className="w-5 h-5 mr-2" />
        Sted
      </h3>
      <div className="space-y-6">
        <FormSelect
          label={forms.no.locationLabel}
          name="location"
          required
          {...register('location')}
          error={errors.location?.message}
          helperText={forms.no.locationHelp}
        >
          <option value="">{forms.no.locationPlaceholder}</option>
          {regions.counties.map(county => (
            <option key={county} value={county}>
              {county}
            </option>
          ))}
        </FormSelect>

        <Controller
          name="specificLocation"
          control={control}
          render={({ field }) => (
            <LocationAutocomplete
              label={forms.no.specificLocationLabel}
              name="specificLocation"
              value={field.value || ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder={forms.no.specificLocationPlaceholder}
              error={errors.specificLocation?.message}
              helperText={forms.no.specificLocationHelp}
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

  return (
    <div>
      <h3 className="text-lg font-medium text-neutral-900 mb-4 flex items-center">
        <Clock className="w-5 h-5 mr-2" />
        {forms.no.availabilityLabel}
      </h3>
      <div className="space-y-6">
        <Controller
          name="availableDays"
          control={control}
          render={({ field }) => (
            <FormCheckboxGroup
              label={forms.no.availableDaysLabel}
              name="availableDays"
              options={dayOptions}
              value={field.value}
              onChange={field.onChange}
              required
              layout="grid"
              gridCols={3}
              error={errors.availableDays?.message}
              helperText={forms.no.availableDaysHelp}
            />
          )}
        />

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-3">
            {forms.no.availableTimesLabel} <span className="text-red-500">*</span>
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
                    title="Fjern tid"
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
          <p className="text-sm text-neutral-500 mt-2">{forms.no.availableTimesHelp}</p>
          {errors.availableTimes && <p className="text-red-600 text-sm mt-2">{errors.availableTimes.message}</p>}
        </div>

        <FormTextarea
          label={forms.no.scheduleLabel}
          name="preferredSchedule"
          rows={3}
          maxLength={500}
          placeholder={forms.no.schedulePlaceholder}
          {...register('preferredSchedule')}
          error={errors.preferredSchedule?.message}
          helperText={forms.no.scheduleHelp}
        />
      </div>
    </div>
  );
}

function PricingFields({ register, errors }: Pick<PostFormFieldsProps, 'register' | 'errors'>) {
  return (
    <div>
      <h3 className="text-lg font-medium text-neutral-900 mb-4 flex items-center">
        <DollarSign className="w-5 h-5 mr-2" />
        {forms.no.pricingLabel}
      </h3>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            label={forms.no.fixedRateLabel}
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
            label={forms.no.minRateLabel}
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
            label={forms.no.maxRateLabel}
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
          {forms.no.pricingHelp}
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