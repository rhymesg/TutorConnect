'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, ClockIcon, MapPinIcon, UserGroupIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { FormSelect } from '../forms/FormSelect';
import { FormTextarea } from '../forms/FormTextarea';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';
import { 
  createAppointmentSchema,
  MeetingType,
  LocationType,
  RecurringPattern,
  DurationOptions,
  ReminderOptions,
  validateNorwegianBusinessHours,
  validateAdvanceNotice,
  validateRecurringPattern,
  formatNorwegianCurrency,
  formatNorwegianDateTime,
  generateAppointmentTitle
} from '../../schemas/appointments';
import type { 
  AppointmentFormData, 
  AppointmentModalProps,
  TimeSlot,
  AppointmentConflict 
} from '../../types/appointments';

interface AppointmentCreateModalProps extends Omit<AppointmentModalProps, 'mode'> {
  mode: 'create' | 'edit';
  availableTimeSlots?: TimeSlot[];
  onCheckAvailability?: (date: string, duration: number) => Promise<TimeSlot[]>;
  participantName?: string;
  participantType?: 'TEACHER' | 'STUDENT';
  subject?: string;
}

export function AppointmentCreateModal({
  isOpen,
  onClose,
  mode,
  appointment,
  chatId,
  initialData,
  onSuccess,
  availableTimeSlots = [],
  onCheckAvailability,
  participantName,
  participantType,
  subject,
}: AppointmentCreateModalProps) {
  const [currentStep, setCurrentStep] = useState<'datetime' | 'details' | 'confirmation'>('datetime');
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeSlot[]>([]);
  const [conflicts, setConflicts] = useState<AppointmentConflict[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
    trigger,
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(createAppointmentSchema.omit({ chatId: true })),
    defaultValues: {
      duration: 60,
      locationType: LocationType.ONLINE,
      meetingType: MeetingType.REGULAR_LESSON,
      currency: 'NOK',
      isRecurring: false,
      recurringPattern: RecurringPattern.NONE,
      reminderTime: 60,
      specialRate: false,
      isTrialLesson: false,
      ...initialData,
    },
  });

  const watchedDate = watch('date');
  const watchedTime = watch('time');
  const watchedDuration = watch('duration');
  const watchedIsRecurring = watch('isRecurring');
  const watchedLocationType = watch('locationType');
  const watchedMeetingType = watch('meetingType');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && appointment) {
        const appointmentDate = new Date(appointment.dateTime);
        reset({
          date: appointmentDate.toISOString().split('T')[0],
          time: appointmentDate.toTimeString().slice(0, 5),
          duration: appointment.duration,
          locationType: appointment.locationType || LocationType.ONLINE,
          location: appointment.location,
          specificLocation: appointment.specificLocation || '',
          meetingType: appointment.meetingType || MeetingType.REGULAR_LESSON,
          notes: appointment.notes || '',
          agenda: appointment.agenda || '',
          reminderTime: appointment.reminderTime || 60,
          price: appointment.price || undefined,
          specialRate: appointment.specialRate || false,
          isTrialLesson: appointment.isTrialLesson || false,
          isRecurring: appointment.isRecurring || false,
          recurringPattern: appointment.recurringPattern || RecurringPattern.NONE,
          preparationMaterials: appointment.preparationMaterials || [],
          requiredMaterials: appointment.requiredMaterials || [],
        });
      } else {
        reset({
          duration: 60,
          locationType: LocationType.ONLINE,
          meetingType: MeetingType.REGULAR_LESSON,
          currency: 'NOK',
          isRecurring: false,
          recurringPattern: RecurringPattern.NONE,
          reminderTime: 60,
          specialRate: false,
          isTrialLesson: false,
          ...initialData,
        });
      }
      setCurrentStep('datetime');
      setConflicts([]);
    }
  }, [isOpen, mode, appointment, initialData, reset]);

  // Check availability when date/time/duration changes
  useEffect(() => {
    if (watchedDate && watchedTime && watchedDuration && onCheckAvailability) {
      const debounceTimer = setTimeout(async () => {
        setIsCheckingAvailability(true);
        try {
          const dateTime = `${watchedDate}T${watchedTime}:00`;
          const timeSlots = await onCheckAvailability(watchedDate, watchedDuration);
          setSelectedTimeSlots(timeSlots);
          
          // Validate business hours and advance notice
          const businessHoursValidation = validateNorwegianBusinessHours(dateTime);
          const advanceNoticeValidation = validateAdvanceNotice(dateTime);
          
          const newConflicts: AppointmentConflict[] = [];
          
          if (!businessHoursValidation.isValid) {
            newConflicts.push({
              type: 'business_hours',
              severity: 'error',
              message: businessHoursValidation.reason || 'Outside business hours',
            });
          }
          
          if (!advanceNoticeValidation.isValid) {
            newConflicts.push({
              type: 'buffer_violation',
              severity: 'warning',
              message: advanceNoticeValidation.reason || 'Short notice appointment',
            });
          }
          
          setConflicts(newConflicts);
        } catch (error) {
          console.error('Error checking availability:', error);
        } finally {
          setIsCheckingAvailability(false);
        }
      }, 500);

      return () => clearTimeout(debounceTimer);
    }
  }, [watchedDate, watchedTime, watchedDuration, onCheckAvailability]);

  // Generate automatic location based on type
  useEffect(() => {
    if (watchedLocationType) {
      let defaultLocation = '';
      switch (watchedLocationType) {
        case LocationType.ONLINE:
          defaultLocation = 'Videomøte (link sendes før møtet)';
          break;
        case LocationType.STUDENT_PLACE:
          defaultLocation = 'Hos eleven';
          break;
        case LocationType.TUTOR_PLACE:
          defaultLocation = 'Hos lærer';
          break;
        case LocationType.LIBRARY:
          defaultLocation = 'Bibliotek';
          break;
        case LocationType.CAFE:
          defaultLocation = 'Kafé';
          break;
        case LocationType.PUBLIC_LOCATION:
          defaultLocation = 'Offentlig sted';
          break;
        default:
          defaultLocation = '';
      }
      setValue('location', defaultLocation);
    }
  }, [watchedLocationType, setValue]);

  const handleNext = async () => {
    if (currentStep === 'datetime') {
      const isValid = await trigger(['date', 'time', 'duration', 'locationType', 'location']);
      if (isValid && conflicts.filter(c => c.severity === 'error').length === 0) {
        setCurrentStep('details');
      }
    } else if (currentStep === 'details') {
      const isValid = await trigger();
      if (isValid) {
        setCurrentStep('confirmation');
      }
    }
  };

  const handleBack = () => {
    if (currentStep === 'details') {
      setCurrentStep('datetime');
    } else if (currentStep === 'confirmation') {
      setCurrentStep('details');
    }
  };

  const onSubmit = async (data: AppointmentFormData) => {
    if (!chatId) {
      console.error('Chat ID is required for appointment creation');
      return;
    }

    setIsSubmitting(true);
    try {
      const dateTime = `${data.date}T${data.time}:00.000Z`;
      
      // Validate recurring pattern if applicable
      if (data.isRecurring && data.recurringPattern !== RecurringPattern.NONE) {
        const recurringValidation = validateRecurringPattern(
          data.recurringPattern!,
          dateTime,
          data.recurringEndDate
        );
        
        if (!recurringValidation.isValid) {
          setConflicts([{
            type: 'buffer_violation',
            severity: 'error',
            message: recurringValidation.reason || 'Invalid recurring pattern',
          }]);
          setIsSubmitting(false);
          return;
        }
      }

      const appointmentData = {
        chatId,
        dateTime,
        duration: data.duration,
        locationType: data.locationType,
        location: data.location,
        specificLocation: data.specificLocation,
        meetingType: data.meetingType,
        notes: data.notes,
        agenda: data.agenda,
        isRecurring: data.isRecurring,
        recurringPattern: data.isRecurring ? data.recurringPattern : RecurringPattern.NONE,
        recurringEndDate: data.isRecurring ? data.recurringEndDate : undefined,
        reminderTime: data.reminderTime,
        price: data.price,
        currency: data.currency || 'NOK',
        specialRate: data.specialRate,
        isTrialLesson: data.isTrialLesson,
        preparationMaterials: data.preparationMaterials || [],
        requiredMaterials: data.requiredMaterials || [],
      };

      // Here you would call your API
      console.log('Creating appointment:', appointmentData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const createdAppointment = {
        id: Math.random().toString(36).substr(2, 9),
        ...appointmentData,
        status: 'PENDING' as const,
        teacherReady: false,
        studentReady: false,
        bothCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      onSuccess?.(createdAppointment);
      onClose();
    } catch (error) {
      console.error('Error creating appointment:', error);
      setConflicts([{
        type: 'overlap',
        severity: 'error',
        message: 'Det oppstod en feil ved opprettelse av avtalen. Prøv igjen.',
      }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generatePreviewTitle = () => {
    return generateAppointmentTitle(
      watchedMeetingType || MeetingType.REGULAR_LESSON,
      subject,
      participantName
    );
  };

  const generatePreviewDateTime = () => {
    if (watchedDate && watchedTime) {
      const dateTime = `${watchedDate}T${watchedTime}:00`;
      return formatNorwegianDateTime(dateTime);
    }
    return null;
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getBusinessHoursForDate = (date: string) => {
    const d = new Date(date);
    const day = d.getDay();
    
    if (day === 0) return { start: '10:00', end: '18:00' }; // Sunday
    if (day === 6) return { start: '09:00', end: '18:00' }; // Saturday
    return { start: '08:00', end: '21:00' }; // Weekdays
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <div>
              <Dialog.Title className="text-lg font-semibold text-neutral-900">
                {mode === 'edit' ? 'Rediger avtale' : 'Ny avtale'}
              </Dialog.Title>
              {participantName && (
                <p className="text-sm text-neutral-600 mt-1">
                  Med {participantName}
                  {subject && ` - ${subject}`}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 transition-colors"
              aria-label="Lukk"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Progress indicator */}
          <div className="px-6 py-4 border-b border-neutral-100">
            <div className="flex items-center justify-between text-sm">
              <div className={`flex items-center ${currentStep === 'datetime' ? 'text-brand-600 font-medium' : 'text-neutral-500'}`}>
                <CalendarIcon className="h-4 w-4 mr-1" />
                Dato & tid
              </div>
              <div className={`flex items-center ${currentStep === 'details' ? 'text-brand-600 font-medium' : 'text-neutral-500'}`}>
                <MapPinIcon className="h-4 w-4 mr-1" />
                Detaljer
              </div>
              <div className={`flex items-center ${currentStep === 'confirmation' ? 'text-brand-600 font-medium' : 'text-neutral-500'}`}>
                <UserGroupIcon className="h-4 w-4 mr-1" />
                Bekreft
              </div>
            </div>
            <div className="mt-2 bg-neutral-200 rounded-full h-1">
              <div 
                className="bg-brand-600 h-1 rounded-full transition-all duration-300"
                style={{ 
                  width: currentStep === 'datetime' ? '33%' : 
                         currentStep === 'details' ? '66%' : '100%' 
                }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Date & Time */}
            {currentStep === 'datetime' && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-neutral-700 mb-2">
                      Dato *
                    </label>
                    <input
                      {...register('date', { required: 'Dato er påkrevd' })}
                      type="date"
                      min={getTomorrowDate()}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    />
                    {errors.date && (
                      <p className="text-sm text-red-600 mt-1">{errors.date.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="time" className="block text-sm font-medium text-neutral-700 mb-2">
                      Tid *
                    </label>
                    <input
                      {...register('time', { required: 'Tid er påkrevd' })}
                      type="time"
                      step="900" // 15 minute intervals
                      min={watchedDate ? getBusinessHoursForDate(watchedDate).start : '08:00'}
                      max={watchedDate ? getBusinessHoursForDate(watchedDate).end : '21:00'}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    />
                    {errors.time && (
                      <p className="text-sm text-red-600 mt-1">{errors.time.message}</p>
                    )}
                  </div>
                </div>

                <FormSelect
                  {...register('duration')}
                  label="Varighet"
                  required
                  error={errors.duration?.message}
                >
                  {DurationOptions.map(duration => (
                    <option key={duration} value={duration}>
                      {duration === 30 ? '30 minutter' :
                       duration === 60 ? '1 time' :
                       duration === 90 ? '1.5 timer' :
                       duration === 120 ? '2 timer' :
                       duration === 150 ? '2.5 timer' :
                       duration === 180 ? '3 timer' :
                       duration === 240 ? '4 timer' :
                       `${duration} minutter`}
                    </option>
                  ))}
                </FormSelect>

                <FormSelect
                  {...register('locationType')}
                  label="Møtested"
                  required
                  error={errors.locationType?.message}
                >
                  <option value={LocationType.ONLINE}>Videomøte</option>
                  <option value={LocationType.STUDENT_PLACE}>Hos eleven</option>
                  <option value={LocationType.TUTOR_PLACE}>Hos lærer</option>
                  <option value={LocationType.LIBRARY}>Bibliotek</option>
                  <option value={LocationType.CAFE}>Kafé</option>
                  <option value={LocationType.PUBLIC_LOCATION}>Offentlig sted</option>
                </FormSelect>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-neutral-700 mb-2">
                    Stedsbeskrivelse *
                  </label>
                  <input
                    {...register('location', { required: 'Stedsbeskrivelse er påkrevd' })}
                    type="text"
                    placeholder="F.eks. Zoom-link, adresse, eller møtepunkt"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                  {errors.location && (
                    <p className="text-sm text-red-600 mt-1">{errors.location.message}</p>
                  )}
                </div>

                {/* Availability check indicator */}
                {isCheckingAvailability && (
                  <div className="flex items-center text-sm text-neutral-600">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Sjekker tilgjengelighet...
                  </div>
                )}

                {/* Conflicts display */}
                {conflicts.length > 0 && (
                  <div className="space-y-2">
                    {conflicts.map((conflict, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg text-sm ${
                          conflict.severity === 'error' 
                            ? 'bg-red-50 text-red-700 border border-red-200' 
                            : conflict.severity === 'warning'
                            ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {conflict.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Details */}
            {currentStep === 'details' && (
              <div className="p-6 space-y-6">
                <FormSelect
                  {...register('meetingType')}
                  label="Type møte"
                  required
                  error={errors.meetingType?.message}
                >
                  <option value={MeetingType.FIRST_MEETING}>Første møte</option>
                  <option value={MeetingType.REGULAR_LESSON}>Ordinær undervisning</option>
                  <option value={MeetingType.TRIAL_LESSON}>Prøvetime</option>
                  <option value={MeetingType.EXAM_PREP}>Eksamensforberedelse</option>
                  <option value={MeetingType.CONSULTATION}>Konsultasjon</option>
                  <option value={MeetingType.INTENSIVE_SESSION}>Intensivkurs</option>
                  <option value={MeetingType.GROUP_LESSON}>Gruppetime</option>
                  <option value={MeetingType.REVIEW_SESSION}>Repetisjon</option>
                </FormSelect>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-neutral-700 mb-2">
                      Pris (NOK)
                    </label>
                    <input
                      {...register('price', { 
                        valueAsNumber: true,
                        min: { value: 0, message: 'Pris kan ikke være negativ' }
                      })}
                      type="number"
                      step="50"
                      min="0"
                      placeholder="f.eks. 500"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    />
                    {errors.price && (
                      <p className="text-sm text-red-600 mt-1">{errors.price.message}</p>
                    )}
                  </div>

                  <FormSelect
                    {...register('reminderTime')}
                    label="Påminnelse"
                  >
                    {ReminderOptions.map(minutes => (
                      <option key={minutes} value={minutes}>
                        {minutes === 15 ? '15 minutter før' :
                         minutes === 30 ? '30 minutter før' :
                         minutes === 60 ? '1 time før' :
                         minutes === 120 ? '2 timer før' :
                         minutes === 1440 ? '1 dag før' :
                         minutes === 2880 ? '2 dager før' :
                         `${minutes} minutter før`}
                      </option>
                    ))}
                  </FormSelect>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      {...register('isTrialLesson')}
                      type="checkbox"
                      className="rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="ml-2 text-sm text-neutral-700">Dette er en prøvetime</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      {...register('specialRate')}
                      type="checkbox"
                      className="rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="ml-2 text-sm text-neutral-700">Spesialpris for denne timen</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      {...register('isRecurring')}
                      type="checkbox"
                      className="rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="ml-2 text-sm text-neutral-700">Gjentakende avtale</span>
                  </label>
                </div>

                {watchedIsRecurring && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormSelect
                      {...register('recurringPattern')}
                      label="Hyppighet"
                      required={watchedIsRecurring}
                    >
                      <option value={RecurringPattern.WEEKLY}>Ukentlig</option>
                      <option value={RecurringPattern.BI_WEEKLY}>Annenhver uke</option>
                      <option value={RecurringPattern.MONTHLY}>Månedlig</option>
                    </FormSelect>

                    <div>
                      <label htmlFor="recurringEndDate" className="block text-sm font-medium text-neutral-700 mb-2">
                        Sluttdato
                      </label>
                      <input
                        {...register('recurringEndDate')}
                        type="date"
                        min={watchedDate}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      />
                    </div>
                  </div>
                )}

                <FormTextarea
                  {...register('agenda')}
                  label="Agenda/pensum"
                  placeholder="Hva skal dere gå gjennom i denne timen?"
                  rows={3}
                  maxLength={1000}
                  showCharCount
                />

                <FormTextarea
                  {...register('notes')}
                  label="Notater"
                  placeholder="Ekstra informasjon om timen..."
                  rows={3}
                  maxLength={1000}
                  showCharCount
                />
              </div>
            )}

            {/* Step 3: Confirmation */}
            {currentStep === 'confirmation' && (
              <div className="p-6 space-y-6">
                <div className="bg-neutral-50 rounded-lg p-4">
                  <h3 className="font-medium text-neutral-900 mb-3">Oppsummering</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium">Tittel:</span>
                      <span className="ml-2 text-neutral-700">{generatePreviewTitle()}</span>
                    </div>

                    {generatePreviewDateTime() && (
                      <div>
                        <span className="font-medium">Dato og tid:</span>
                        <span className="ml-2 text-neutral-700">
                          {generatePreviewDateTime()?.full}
                        </span>
                      </div>
                    )}

                    <div>
                      <span className="font-medium">Varighet:</span>
                      <span className="ml-2 text-neutral-700">
                        {watchedDuration === 60 ? '1 time' : 
                         watchedDuration === 90 ? '1.5 timer' :
                         watchedDuration === 120 ? '2 timer' :
                         `${watchedDuration} minutter`}
                      </span>
                    </div>

                    <div>
                      <span className="font-medium">Sted:</span>
                      <span className="ml-2 text-neutral-700">{watch('location')}</span>
                    </div>

                    {watch('price') && (
                      <div>
                        <span className="font-medium">Pris:</span>
                        <span className="ml-2 text-neutral-700">
                          {formatNorwegianCurrency(watch('price')!)}
                        </span>
                      </div>
                    )}

                    {watch('agenda') && (
                      <div>
                        <span className="font-medium">Agenda:</span>
                        <span className="ml-2 text-neutral-700">{watch('agenda')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <ClockIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-900">
                        Viktig informasjon
                      </h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Avtalen må bekreftes av begge parter før den blir endelig. 
                        Du vil motta en påminnelse {watch('reminderTime') === 60 ? '1 time' : 
                        watch('reminderTime') === 1440 ? '1 dag' : 
                        `${watch('reminderTime')} minutter`} før møtet.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-between items-center p-6 border-t border-neutral-200 bg-neutral-50">
              {currentStep !== 'datetime' && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                >
                  Tilbake
                </button>
              )}

              <div className="flex space-x-3 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                >
                  Avbryt
                </button>

                {currentStep !== 'confirmation' ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={isCheckingAvailability || conflicts.some(c => c.severity === 'error')}
                    className="px-4 py-2 text-sm font-medium text-white bg-brand-600 border border-transparent rounded-lg hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Neste
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-brand-600 border border-transparent rounded-lg hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isSubmitting && <LoadingSpinner size="sm" color="white" className="mr-2" />}
                    {mode === 'edit' ? 'Oppdater avtale' : 'Opprett avtale'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

export default AppointmentCreateModal;