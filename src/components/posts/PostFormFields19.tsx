'use client';

import { useState } from 'react';
import { PostWithDetails } from '@/types/database';
import FormField from '../auth/FormField';
import FormError from '../auth/FormError';

interface PostFormFields19Props {
  defaultValues?: PostWithDetails | any;
  errors?: Record<string, string>;
}

export default function PostFormFields19({ defaultValues, errors }: PostFormFields19Props) {
  const [formData, setFormData] = useState(defaultValues || {});

  // Norwegian regions for location selector
  const norwegianRegions = [
    { value: 'OSLO', label: 'Oslo' },
    { value: 'BERGEN', label: 'Bergen' },
    { value: 'TRONDHEIM', label: 'Trondheim' },
    { value: 'STAVANGER', label: 'Stavanger' },
    { value: 'KRISTIANSAND', label: 'Kristiansand' },
    { value: 'FREDRIKSTAD', label: 'Fredrikstad' },
    { value: 'DRAMMEN', label: 'Drammen' },
    { value: 'AKERSHUS', label: 'Akershus' },
    { value: 'VESTFOLD', label: 'Vestfold' },
    { value: 'ROGALAND', label: 'Rogaland' },
    { value: 'HORDALAND', label: 'Hordaland' },
  ];

  // Subjects
  const subjects = [
    { value: 'MATHEMATICS', label: 'Matematikk' },
    { value: 'ENGLISH', label: 'Engelsk' },
    { value: 'NORWEGIAN', label: 'Norsk' },
    { value: 'SCIENCE', label: 'Naturfag' },
    { value: 'PHYSICS', label: 'Fysikk' },
    { value: 'CHEMISTRY', label: 'Kjemi' },
    { value: 'BIOLOGY', label: 'Biologi' },
    { value: 'HISTORY', label: 'Historie' },
    { value: 'PROGRAMMING', label: 'Programmering' },
    { value: 'OTHER', label: 'Annet' },
  ];

  // Age groups
  const ageGroups = [
    { value: 'CHILDREN_7_12', label: 'Barn (7-12 år)' },
    { value: 'TEENAGERS_13_15', label: 'Ungdom (13-15 år)' },
    { value: 'YOUTH_16_18', label: 'Ungdom (16-18 år)' },
    { value: 'ADULTS_19_PLUS', label: 'Voksne (19+ år)' },
  ];

  // Available days
  const availableDays = [
    { value: 'monday', label: 'Mandag' },
    { value: 'tuesday', label: 'Tirsdag' },
    { value: 'wednesday', label: 'Onsdag' },
    { value: 'thursday', label: 'Torsdag' },
    { value: 'friday', label: 'Fredag' },
    { value: 'saturday', label: 'Lørdag' },
    { value: 'sunday', label: 'Søndag' },
  ];

  return (
    <div className="space-y-6">
      {/* Post Type */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Type annonse *
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center p-4 border border-neutral-300 rounded-lg hover:bg-neutral-50 cursor-pointer">
            <input
              type="radio"
              name="type"
              value="TEACHER"
              defaultChecked={defaultValues?.type === 'TEACHER'}
              className="mr-3 h-4 w-4 text-brand-600"
            />
            <div>
              <div className="font-medium text-neutral-900">Jeg tilbyr undervisning</div>
              <div className="text-sm text-neutral-500">Som lærer/tutor</div>
            </div>
          </label>
          <label className="flex items-center p-4 border border-neutral-300 rounded-lg hover:bg-neutral-50 cursor-pointer">
            <input
              type="radio"
              name="type"
              value="STUDENT"
              defaultChecked={defaultValues?.type === 'STUDENT'}
              className="mr-3 h-4 w-4 text-brand-600"
            />
            <div>
              <div className="font-medium text-neutral-900">Jeg søker lærer</div>
              <div className="text-sm text-neutral-500">Som student</div>
            </div>
          </label>
        </div>
        {errors?.type && <FormError error={errors.type} />}
      </div>

      {/* Title */}
      <FormField
        label="Tittel *"
        name="title"
        type="text"
        placeholder="Kort, beskrivende tittel for annonsen din"
        defaultValue={defaultValues?.title}
        required
        error={errors?.title}
      />

      {/* Subject */}
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-neutral-700 mb-2">
          Fag *
        </label>
        <select
          name="subject"
          id="subject"
          defaultValue={defaultValues?.subject}
          required
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
        >
          <option value="">Velg fag</option>
          {subjects.map((subject) => (
            <option key={subject.value} value={subject.value}>
              {subject.label}
            </option>
          ))}
        </select>
        {errors?.subject && <FormError error={errors.subject} />}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-2">
          Beskrivelse *
        </label>
        <textarea
          name="description"
          id="description"
          rows={6}
          defaultValue={defaultValues?.description}
          placeholder="Beskriv din erfaring, undervisningsmetoder, og hva du kan tilby..."
          required
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
        />
        {errors?.description && <FormError error={errors.description} />}
      </div>

      {/* Age Groups */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Aldersgrupper *
        </label>
        <div className="grid grid-cols-2 gap-3">
          {ageGroups.map((group) => (
            <label key={group.value} className="flex items-center">
              <input
                type="checkbox"
                name="ageGroups"
                value={group.value}
                defaultChecked={defaultValues?.ageGroups?.includes(group.value)}
                className="h-4 w-4 text-brand-600 border-neutral-300 rounded focus:ring-brand-500"
              />
              <span className="ml-2 text-sm text-neutral-700">{group.label}</span>
            </label>
          ))}
        </div>
        {errors?.ageGroups && <FormError error={errors.ageGroups} />}
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-neutral-700 mb-2">
          Lokasjon *
        </label>
        <select
          name="location"
          id="location"
          defaultValue={defaultValues?.location}
          required
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
        >
          <option value="">Velg region</option>
          {norwegianRegions.map((region) => (
            <option key={region.value} value={region.value}>
              {region.label}
            </option>
          ))}
        </select>
        {errors?.location && <FormError error={errors.location} />}
      </div>

      {/* Specific Location */}
      <FormField
        label="Spesifikk lokasjon"
        name="specificLocation"
        type="text"
        placeholder="F.eks. Sentrum, Grünerløkka, etc."
        defaultValue={defaultValues?.specificLocation}
        error={errors?.specificLocation}
      />

      {/* Available Days */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Tilgjengelige dager
        </label>
        <div className="grid grid-cols-2 gap-3">
          {availableDays.map((day) => (
            <label key={day.value} className="flex items-center">
              <input
                type="checkbox"
                name="availableDays"
                value={day.value}
                defaultChecked={defaultValues?.availableDays?.includes(day.value)}
                className="h-4 w-4 text-brand-600 border-neutral-300 rounded focus:ring-brand-500"
              />
              <span className="ml-2 text-sm text-neutral-700">{day.label}</span>
            </label>
          ))}
        </div>
        {errors?.availableDays && <FormError error={errors.availableDays} />}
      </div>

      {/* Hourly Rate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Timelønn (NOK)"
          name="hourlyRate"
          type="number"
          placeholder="500"
          defaultValue={defaultValues?.hourlyRate}
          error={errors?.hourlyRate}
          min={0}
          step={50}
        />
        <div className="text-sm text-neutral-500 pt-8">
          <p>Eller angi et prisintervall:</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Fra (NOK)"
          name="hourlyRateMin"
          type="number"
          placeholder="300"
          defaultValue={defaultValues?.hourlyRateMin}
          error={errors?.hourlyRateMin}
          min={0}
          step={50}
        />
        <FormField
          label="Til (NOK)"
          name="hourlyRateMax"
          type="number"
          placeholder="700"
          defaultValue={defaultValues?.hourlyRateMax}
          error={errors?.hourlyRateMax}
          min={0}
          step={50}
        />
      </div>

      {/* Preferred Schedule */}
      <div>
        <label htmlFor="preferredSchedule" className="block text-sm font-medium text-neutral-700 mb-2">
          Foretrukket tidspunkt
        </label>
        <textarea
          name="preferredSchedule"
          id="preferredSchedule"
          rows={3}
          defaultValue={defaultValues?.preferredSchedule}
          placeholder="F.eks. Formiddager, ettermiddager på ukedager, helger..."
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
        />
        {errors?.preferredSchedule && <FormError error={errors.preferredSchedule} />}
      </div>
    </div>
  );
}