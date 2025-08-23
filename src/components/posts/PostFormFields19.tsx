'use client';

import React, { useState } from 'react';
import { PostWithDetails } from '@/types/database';
import FormField from '../auth/FormField';
import FormError from '../auth/FormError';
import { getSubjectOptions } from '@/constants/subjects';
import { getAgeGroupOptions } from '@/constants/ageGroups';

interface PostFormFields19Props {
  defaultValues?: PostWithDetails | any;
  errors?: Record<string, string>;
}

export default function PostFormFields19({ defaultValues, errors }: PostFormFields19Props) {
  const [postType, setPostType] = useState(defaultValues?.type || 'TEACHER');
  const [selectedLocation, setSelectedLocation] = useState(defaultValues?.location || '');
  const [postnummer, setPostnummer] = useState(defaultValues?.postnummer || '');

  // defaultValues가 변경될 때마다 state 업데이트
  React.useEffect(() => {
    if (defaultValues?.location) {
      setSelectedLocation(defaultValues.location);
    }
    if (defaultValues?.postnummer) {
      setPostnummer(defaultValues.postnummer);
    }
  }, [defaultValues]);

  // Debug logs removed for production

  // Norwegian regions for location selector (Prisma enum과 일치)
  const norwegianRegions = [
    { value: 'OSLO', label: 'Oslo' },
    { value: 'BERGEN', label: 'Bergen' },
    { value: 'TRONDHEIM', label: 'Trondheim' },
    { value: 'STAVANGER', label: 'Stavanger' },
    { value: 'KRISTIANSAND', label: 'Kristiansand' },
    { value: 'FREDRIKSTAD', label: 'Fredrikstad' },
    { value: 'SANDNES', label: 'Sandnes' },
    { value: 'TROMSOE', label: 'Tromsø' },
    { value: 'DRAMMEN', label: 'Drammen' },
    { value: 'ASKER', label: 'Asker' },
    { value: 'BAERUM', label: 'Bærum' },
    { value: 'AKERSHUS', label: 'Akershus' },
    { value: 'OESTFOLD', label: 'Østfold' },
    { value: 'BUSKERUD', label: 'Buskerud' },
    { value: 'VESTFOLD', label: 'Vestfold' },
  ];

  // Subjects from centralized constants
  const subjects = getSubjectOptions();

  // Age groups from centralized constants
  const ageGroups = getAgeGroupOptions();

  const [selectedSubject, setSelectedSubject] = useState(defaultValues?.subject || '');
  const [customSubject, setCustomSubject] = useState(defaultValues?.customSubject || '');

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
      {/* Post Type - Teacher or Student */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          Jeg er en... *
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center p-4 border border-neutral-300 rounded-lg hover:bg-neutral-50 cursor-pointer">
            <input
              type="radio"
              name="type"
              value="TEACHER"
              checked={postType === 'TEACHER'}
              onChange={(e) => setPostType(e.target.value)}
              className="mr-3 h-4 w-4 text-brand-600"
            />
            <div>
              <div className="font-medium text-neutral-900">Lærer</div>
              <div className="text-sm text-neutral-500">Jeg tilbyr undervisning</div>
            </div>
          </label>
          <label className="flex items-center p-4 border border-neutral-300 rounded-lg hover:bg-neutral-50 cursor-pointer">
            <input
              type="radio"
              name="type"
              value="STUDENT"
              checked={postType === 'STUDENT'}
              onChange={(e) => setPostType(e.target.value)}
              className="mr-3 h-4 w-4 text-brand-600"
            />
            <div>
              <div className="font-medium text-neutral-900">Student</div>
              <div className="text-sm text-neutral-500">Jeg søker lærer</div>
            </div>
          </label>
        </div>
        {errors?.type && <FormError error={errors.type} />}
      </div>

      {/* Subject */}
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-neutral-700 mb-2">
          Fag *
        </label>
        <select
          name="subject"
          id="subject"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
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
        
        {/* Custom subject input when "other" is selected */}
        {selectedSubject === 'other' && (
          <div className="mt-3">
            <FormField
              label="Spesifiser fag"
              name="customSubject"
              type="text"
              placeholder="Skriv inn fagområdet"
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              required
              error={errors?.customSubject}
              maxLength={50}
            />
          </div>
        )}
      </div>

      {/* Age Groups */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          {postType === 'TEACHER' ? 'Aldersgrupper jeg kan undervise *' : 'Min aldersgruppe *'}
        </label>
        <div className="grid grid-cols-2 gap-3">
          {ageGroups.map((ageGroup) => (
            <label key={ageGroup.value} className="flex items-center p-3 border border-neutral-300 rounded-lg hover:bg-neutral-50 cursor-pointer">
              <input
                type={postType === 'STUDENT' ? "radio" : "checkbox"}
                name="ageGroups"
                value={ageGroup.value}
                defaultChecked={defaultValues?.ageGroups?.includes(ageGroup.value)}
                className="h-4 w-4 text-brand-600 border-neutral-300 rounded focus:ring-brand-500"
              />
              <span className="ml-2 text-sm text-neutral-700">{ageGroup.label}</span>
            </label>
          ))}
        </div>
        {errors?.ageGroups && <FormError error={errors.ageGroups} />}
      </div>

      {/* Location/Region */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-neutral-700 mb-2">
          Region *
        </label>
        <select
          name="location"
          id="location"
          value={selectedLocation}
          onChange={(e) => {
            setSelectedLocation(e.target.value);
          }}
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

      {/* Postnummer */}
      <div>
        <label htmlFor="postnummer" className="block text-sm font-medium text-neutral-700 mb-2">
          Postnummer
        </label>
        <input
          type="text"
          name="postnummer"
          id="postnummer"
          value={postType === 'STUDENT' ? postnummer : ''}
          onChange={(e) => setPostnummer(e.target.value)}
          placeholder={postType === 'STUDENT' ? "Fra profilen din" : "Ikke oppgitt"}
          maxLength={4}
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
        />
        {errors?.postnummer && <FormError error={errors.postnummer} />}
      </div>


      {/* Available Days */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          Tilgjengelige dager *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {availableDays.map((day) => (
            <label key={day.value} className="flex items-center p-3 border border-neutral-300 rounded-lg hover:bg-neutral-50 cursor-pointer">
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

      {/* Available Time Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startTime" className="block text-sm font-medium text-neutral-700 mb-2">
            Tilgjengelig fra tid *
          </label>
          <input
            type="time"
            name="startTime"
            id="startTime"
            defaultValue={defaultValues?.startTime || '09:00'}
            required
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
          />
          {errors?.startTime && <FormError error={errors.startTime} />}
        </div>
        <div>
          <label htmlFor="endTime" className="block text-sm font-medium text-neutral-700 mb-2">
            Tilgjengelig til tid *
          </label>
          <input
            type="time"
            name="endTime"
            id="endTime"
            defaultValue={defaultValues?.endTime || '17:00'}
            required
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
          />
          {errors?.endTime && <FormError error={errors.endTime} />}
        </div>
      </div>

      {/* Price Range - Different logic for Teacher vs Student */}
      {postType === 'TEACHER' ? (
        <div>
          <label htmlFor="hourlyRate" className="block text-sm font-medium text-neutral-700 mb-2">
            Timelønn (NOK) *
          </label>
          <input
            type="number"
            name="hourlyRate"
            id="hourlyRate"
            placeholder="300"
            defaultValue={defaultValues?.hourlyRate || 300}
            required
            min={0}
            step={50}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
          />
          <p className="text-sm text-neutral-500 mt-1">Lærere setter fast pris per time</p>
          {errors?.hourlyRate && <FormError error={errors.hourlyRate} />}
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Prisområde (NOK per time) *
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <input
                type="number"
                name="hourlyRateMin"
                placeholder="200"
                defaultValue={defaultValues?.hourlyRateMin || 200}
                required
                min={0}
                step={50}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
              />
              <p className="text-xs text-neutral-500 mt-1">Minimum pris</p>
            </div>
            <div>
              <input
                type="number"
                name="hourlyRateMax"
                placeholder="400"
                defaultValue={defaultValues?.hourlyRateMax || 400}
                required
                min={0}
                step={50}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
              />
              <p className="text-xs text-neutral-500 mt-1">Maksimum pris</p>
            </div>
          </div>
          <p className="text-sm text-neutral-500 mt-1">Studenter kan angi prisområde</p>
          {errors?.hourlyRateMin && <FormError error={errors.hourlyRateMin} />}
          {errors?.hourlyRateMax && <FormError error={errors.hourlyRateMax} />}
        </div>
      )}

      {/* Title */}
      <FormField
        label="Tittel"
        name="title"
        type="text"
        placeholder="Kort, beskrivende tittel for annonsen din"
        defaultValue={defaultValues?.title}
        required
        error={errors?.title}
        maxLength={100}
      />

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
          placeholder={postType === 'TEACHER' 
            ? "Beskriv din erfaring, undervisningsmetoder og hva du kan tilby..." 
            : "Beskriv hva du søker etter, ditt nivå, spesielle behov og forventninger..."
          }
          required
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
        />
        <p className="text-sm text-neutral-500 mt-1">
          Jo mer detaljert beskrivelse, desto lettere å finne riktig match
        </p>
        {errors?.description && <FormError error={errors.description} />}
      </div>
    </div>
  );
}