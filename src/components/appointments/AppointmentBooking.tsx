'use client';

import { useState, useCallback, useEffect } from 'react';
import { format, addDays, parseISO, startOfDay, isAfter, isBefore } from 'date-fns';
import { nb } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon, 
  UserIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

import { FormSelect } from '../forms/FormSelect';
import { FormTextarea } from '../forms/FormTextarea';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';
import { 
  createAppointmentSchema,
  MeetingType,
  LocationType,
  DurationOptions,
  formatNorwegianCurrency
} from '../../schemas/appointments';
import { useAppointments } from '../../hooks/useAppointments';
import type { 
  CreateAppointmentInput,
  AppointmentFormData, 
  TimeSlot,
  AppointmentConflict 
} from '../../types/appointments';

interface AppointmentBookingProps {
  chatId: string;
  participantName: string;
  participantType: 'TEACHER' | 'STUDENT';
  subject?: string;
  initialDate?: string;
  initialTime?: string;
  onSuccess?: (appointment: any) => void;
  onCancel?: () => void;
  className?: string;
}

interface BookingStep {
  id: string;
  title: string;
  description: string;
}

const BOOKING_STEPS: BookingStep[] = [
  {
    id: 'datetime',
    title: 'Velg dato og tid',
    description: 'Finn et passende tidspunkt for timen',
  },
  {
    id: 'details',
    title: 'Detaljer',
    description: 'Legg til informasjon om timen',
  },
  {
    id: 'confirm',
    title: 'Bekreft',
    description: 'Gjennomgå og bekreft bookingen',
  },
];

// Generate time slots for a day (Norwegian business hours)
function generateTimeSlots(date: Date): string[] {
  const slots: string[] = [];
  const dayOfWeek = date.getDay();
  
  // Different hours for different days
  let startHour = 8;
  let endHour = 20;
  
  // Weekend hours
  if (dayOfWeek === 0) { // Sunday
    startHour = 10;
    endHour = 18;
  } else if (dayOfWeek === 6) { // Saturday
    startHour = 9;
    endHour = 17;
  }
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }
  }
  
  return slots;
}

export function AppointmentBooking({
  chatId,
  participantName,
  participantType,
  subject,
  initialDate,
  initialTime,
  onSuccess,
  onCancel,
  className = '',
}: AppointmentBookingProps) {
  const [currentStep, setCurrentStep] = useState<string>('datetime');
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    initialDate ? parseISO(initialDate) : null
  );
  const [selectedTime, setSelectedTime] = useState<string>(initialTime || '');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [conflicts, setConflicts] = useState<AppointmentConflict[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  const { createAppointment, loading } = useAppointments();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(createAppointmentSchema.omit({ chatId: true })),
    defaultValues: {
      duration: 60,
      location: 'Video call',
      locationType: 'ONLINE',
      meetingType: 'ONE_ON_ONE',
      notes: '',
    },
  });

  const watchedDuration = watch('duration');

  // Generate available dates (next 30 days, excluding past dates)
  const availableDates = Array.from({ length: 30 }, (_, i) => {
    const date = addDays(new Date(), i + 1); // Start from tomorrow
    return date;
  }).filter(date => {
    const dayOfWeek = date.getDay();
    // Exclude Sundays for most bookings, but allow for specific cases
    return dayOfWeek !== 0 || participantType === 'STUDENT';
  });

  // Check availability when date or duration changes
  useEffect(() => {
    if (selectedDate && watchedDuration) {
      checkAvailability(selectedDate, watchedDuration);
    }
  }, [selectedDate, watchedDuration]);

  const checkAvailability = async (date: Date, duration: number) => {
    setIsCheckingAvailability(true);
    try {
      // This would call the BE-006 availability API
      // For now, we'll generate mock availability
      const timeSlots = generateTimeSlots(date);
      const availableTimeSlots: TimeSlot[] = timeSlots.map(time => ({
        start: `${format(date, 'yyyy-MM-dd')}T${time}:00.000Z`,
        end: new Date(
          new Date(`${format(date, 'yyyy-MM-dd')}T${time}:00.000Z`).getTime() + duration * 60000
        ).toISOString(),
        available: Math.random() > 0.3, // Mock availability
        reason: Math.random() > 0.7 ? 'Opptatt' : undefined,
      }));
      
      setAvailableSlots(availableTimeSlots);
    } catch (error) {
      console.error('Error checking availability:', error);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(''); // Reset time selection
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleNextStep = () => {
    const stepIndex = BOOKING_STEPS.findIndex(step => step.id === currentStep);
    if (stepIndex < BOOKING_STEPS.length - 1) {
      setCurrentStep(BOOKING_STEPS[stepIndex + 1].id);
    }
  };

  const handlePrevStep = () => {
    const stepIndex = BOOKING_STEPS.findIndex(step => step.id === currentStep);
    if (stepIndex > 0) {
      setCurrentStep(BOOKING_STEPS[stepIndex - 1].id);
    }
  };

  const handleBookingSubmit = async (data: AppointmentFormData) => {
    if (!selectedDate || !selectedTime) return;

    try {
      const appointmentData: CreateAppointmentInput = {
        chatId,
        dateTime: `${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}:00.000Z`,
        duration: data.duration,
        location: data.location,
        locationType: data.locationType,
        meetingType: data.meetingType,
        notes: data.notes,
        agenda: data.agenda,
        price: data.price,
        isTrialLesson: data.isTrialLesson || false,
        preparationMaterials: data.preparationMaterials || [],
        requiredMaterials: data.requiredMaterials || [],
      };

      const appointment = await createAppointment(appointmentData);
      
      if (onSuccess) {
        onSuccess(appointment);
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'datetime':
        return selectedDate && selectedTime;
      case 'details':
        return !errors.duration && !errors.location;
      case 'confirm':
        return true;
      default:
        return false;
    }
  };

  const renderDateTimeStep = () => (
    <div className="space-y-6">
      {/* Date selection */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Velg dato</h3>
        <div className="grid grid-cols-7 gap-2">
          {availableDates.slice(0, 14).map(date => (
            <button
              key={date.toISOString()}
              onClick={() => handleDateSelect(date)}
              className={`p-3 text-center rounded-lg border transition-colors ${
                selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-neutral-900 border-neutral-300 hover:border-brand-300 hover:bg-brand-50'
              }`}
            >
              <div className="text-xs font-medium">
                {format(date, 'EEE', { locale: nb })}
              </div>
              <div className="text-lg font-semibold">
                {format(date, 'd')}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Time selection */}
      {selectedDate && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">
              Velg tidspunkt for {format(selectedDate, 'd. MMMM', { locale: nb })}
            </h3>
            {isCheckingAvailability && <LoadingSpinner size="sm" />}
          </div>
          
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {availableSlots.map(slot => {
              const time = format(parseISO(slot.start), 'HH:mm');
              return (
                <button
                  key={slot.start}
                  onClick={() => slot.available && handleTimeSelect(time)}
                  disabled={!slot.available}
                  className={`p-3 text-center rounded-lg border transition-colors ${
                    selectedTime === time
                      ? 'bg-brand-600 text-white border-brand-600'
                      : slot.available
                      ? 'bg-white text-neutral-900 border-neutral-300 hover:border-brand-300 hover:bg-brand-50'
                      : 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed'
                  }`}
                  title={slot.reason || undefined}
                >
                  {time}
                </button>
              );
            })}
          </div>

          {availableSlots.length === 0 && !isCheckingAvailability && (
            <div className="text-center py-8 text-neutral-500">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
              <p>Ingen tilgjengelige tidspunkt denne dagen</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderDetailsStep = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-neutral-900">Detaljer for timen</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Duration */}
        <FormSelect
          label="Varighet"
          {...register('duration', { valueAsNumber: true })}
          error={errors.duration?.message}
          options={DurationOptions.map(d => ({ value: d.toString(), label: `${d} minutter` }))}
        />

        {/* Meeting type */}
        <FormSelect
          label="Type møte"
          {...register('meetingType')}
          error={errors.meetingType?.message}
          options={Object.entries(MeetingType).map(([key, value]) => ({
            value,
            label: key === 'ONE_ON_ONE' ? 'En-til-en' : 
                   key === 'GROUP' ? 'Gruppe' : 
                   key === 'TRIAL' ? 'Prøvetime' : value
          }))}
        />

        {/* Location type */}
        <FormSelect
          label="Sted"
          {...register('locationType')}
          error={errors.locationType?.message}
          options={Object.entries(LocationType).map(([key, value]) => ({
            value,
            label: key === 'ONLINE' ? 'Online/video' : 
                   key === 'IN_PERSON' ? 'Fysisk møte' :
                   key === 'PHONE' ? 'Telefon' : value
          }))}
        />

        {/* Price */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700">
            Pris (NOK)
          </label>
          <input
            type="number"
            {...register('price', { valueAsNumber: true })}
            className="block w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500"
            placeholder="f.eks. 500"
          />
          {errors.price && <ErrorMessage message={errors.price.message} />}
        </div>
      </div>

      {/* Location details */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-700">
          Spesifik lokasjon
        </label>
        <input
          type="text"
          {...register('location')}
          className="block w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500"
          placeholder="f.eks. Biblioteket, rom 201"
        />
        {errors.location && <ErrorMessage message={errors.location.message} />}
      </div>

      {/* Notes */}
      <FormTextarea
        label="Notater"
        {...register('notes')}
        error={errors.notes?.message}
        rows={3}
        placeholder="Eventuelle spesielle ønsker eller informasjon..."
      />

      {/* Special options */}
      <div className="space-y-3">
        <label className="flex items-center">
          <input
            type="checkbox"
            {...register('isTrialLesson')}
            className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-neutral-300 rounded"
          />
          <span className="ml-2 text-sm text-neutral-700">Dette er en prøvetime</span>
        </label>
      </div>
    </div>
  );

  const renderConfirmStep = () => {
    const formData = watch();
    
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-neutral-900">Bekreft booking</h3>
        
        <div className="bg-neutral-50 rounded-lg p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <UserIcon className="h-5 w-5 text-neutral-400" />
            <div>
              <div className="font-medium">
                {subject ? `${subject} med ${participantName}` : `Møte med ${participantName}`}
              </div>
              <div className="text-sm text-neutral-600">
                {participantType === 'TEACHER' ? 'Lærer' : 'Elev'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <CalendarIcon className="h-5 w-5 text-neutral-400" />
            <div>
              <div className="font-medium">
                {selectedDate && format(selectedDate, 'EEEE d. MMMM yyyy', { locale: nb })}
              </div>
              <div className="text-sm text-neutral-600">
                {selectedTime} ({formData.duration} minutter)
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <MapPinIcon className="h-5 w-5 text-neutral-400" />
            <div>
              <div className="font-medium">{formData.location}</div>
              <div className="text-sm text-neutral-600">
                {formData.locationType === 'ONLINE' ? 'Online/video' : 
                 formData.locationType === 'IN_PERSON' ? 'Fysisk møte' : 'Telefon'}
              </div>
            </div>
          </div>
          
          {formData.price && (
            <div className="flex items-center space-x-3">
              <div className="h-5 w-5 flex items-center justify-center text-neutral-400 text-sm">
                kr
              </div>
              <div className="font-medium text-lg">
                {formatNorwegianCurrency(formData.price)}
              </div>
            </div>
          )}
          
          {formData.notes && (
            <div className="pt-3 border-t border-neutral-200">
              <div className="text-sm font-medium text-neutral-700 mb-1">Notater:</div>
              <div className="text-sm text-neutral-600">{formData.notes}</div>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-1">Viktig å vite:</div>
              <ul className="space-y-1 text-sm">
                <li>• Avtalen må bekreftes av begge parter</li>
                <li>• Du kan avlyse frem til 2 timer før avtalt tid</li>
                <li>• {participantName} vil motta en melding om den nye avtalen</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {BOOKING_STEPS.map((step, index) => {
            const isCurrent = step.id === currentStep;
            const isCompleted = BOOKING_STEPS.findIndex(s => s.id === currentStep) > index;
            
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  isCurrent
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : isCompleted
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-neutral-300 bg-white text-neutral-400'
                }`}>
                  {isCompleted ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                
                <div className="ml-3 flex-1">
                  <div className={`text-sm font-medium ${
                    isCurrent ? 'text-brand-600' : isCompleted ? 'text-green-600' : 'text-neutral-400'
                  }`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {step.description}
                  </div>
                </div>
                
                {index < BOOKING_STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 ${
                    isCompleted ? 'bg-green-500' : 'bg-neutral-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
        {currentStep === 'datetime' && renderDateTimeStep()}
        {currentStep === 'details' && renderDetailsStep()}
        {currentStep === 'confirm' && renderConfirmStep()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div>
          {currentStep !== 'datetime' && (
            <button
              onClick={handlePrevStep}
              className="flex items-center px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50"
            >
              <ChevronLeftIcon className="h-4 w-4 mr-2" />
              Tilbake
            </button>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50"
            >
              Avbryt
            </button>
          )}
          
          {currentStep !== 'confirm' ? (
            <button
              onClick={handleNextStep}
              disabled={!canProceed()}
              className="flex items-center px-6 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:bg-neutral-300 rounded-lg transition-colors"
            >
              Neste
              <ChevronRightIcon className="h-4 w-4 ml-2" />
            </button>
          ) : (
            <button
              onClick={handleSubmit(handleBookingSubmit)}
              disabled={loading || !canProceed()}
              className="flex items-center px-6 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:bg-neutral-300 rounded-lg transition-colors"
            >
              {loading && <LoadingSpinner size="sm" className="mr-2" />}
              Bekreft booking
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AppointmentBooking;