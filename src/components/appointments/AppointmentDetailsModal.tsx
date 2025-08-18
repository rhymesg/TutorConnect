'use client';

import { useState, useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import { 
  XMarkIcon, 
  ClockIcon, 
  MapPinIcon, 
  UserIcon, 
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XCircleIcon,
  DocumentTextIcon,
  LinkIcon,
  StarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import { nb } from 'date-fns/locale';

import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';
import { 
  formatNorwegianDateTime, 
  formatNorwegianCurrency,
  MeetingType,
  LocationType 
} from '../../schemas/appointments';
import type { 
  Appointment, 
  AppointmentModalProps,
  AppointmentAction,
  MeetingLink,
  OnlineSessionInfo 
} from '../../types/appointments';

interface AppointmentDetailsModalProps extends Omit<AppointmentModalProps, 'mode'> {
  mode: 'view';
  onEdit?: (appointment: Appointment) => void;
  onReschedule?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
  onConfirm?: (appointment: Appointment) => void;
  onComplete?: (appointment: Appointment) => void;
  onMarkReady?: (appointment: Appointment, ready: boolean) => void;
  onContactParticipant?: (appointment: Appointment) => void;
  onExportCalendar?: (appointment: Appointment) => void;
  onGenerateMeetingLink?: (appointment: Appointment) => Promise<MeetingLink>;
  currentUserId?: string;
  isLoading?: boolean;
}

export function AppointmentDetailsModal({
  isOpen,
  onClose,
  appointment,
  onEdit,
  onReschedule,
  onCancel,
  onConfirm,
  onComplete,
  onMarkReady,
  onContactParticipant,
  onExportCalendar,
  onGenerateMeetingLink,
  currentUserId,
  isLoading = false,
}: AppointmentDetailsModalProps) {
  const [actionLoading, setActionLoading] = useState<AppointmentAction | null>(null);
  const [meetingLink, setMeetingLink] = useState<MeetingLink | null>(null);
  const [showCancellationForm, setShowCancellationForm] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  if (!appointment) return null;

  // Determine current user role in appointment
  const currentUserParticipant = appointment.chat?.participants?.find(
    p => p.user.id === currentUserId
  );
  const otherParticipant = appointment.chat?.participants?.find(
    p => p.user.id !== currentUserId
  );
  const isTeacher = appointment.chat?.relatedPost?.type === 'TEACHER' 
    ? currentUserParticipant?.user.id === appointment.chat.relatedPost.userId
    : otherParticipant?.user.id === appointment.chat?.relatedPost?.userId;

  // Format appointment details
  const appointmentDateTime = useMemo(() => {
    return formatNorwegianDateTime(appointment.dateTime);
  }, [appointment.dateTime]);

  const appointmentEndTime = useMemo(() => {
    const endDate = new Date(new Date(appointment.dateTime).getTime() + appointment.duration * 60000);
    return format(endDate, 'HH:mm');
  }, [appointment.dateTime, appointment.duration]);

  const statusConfig = useMemo(() => {
    switch (appointment.status) {
      case 'PENDING':
        return {
          label: 'Venter på bekreftelse',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: ClockIcon,
        };
      case 'CONFIRMED':
        return {
          label: 'Bekreftet',
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckIcon,
        };
      case 'COMPLETED':
        return {
          label: 'Fullført',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: CheckIcon,
        };
      case 'CANCELLED':
        return {
          label: 'Kansellert',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: XCircleIcon,
        };
      default:
        return {
          label: appointment.status,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: ClockIcon,
        };
    }
  }, [appointment.status]);

  const canEdit = appointment.status === 'PENDING' || appointment.status === 'CONFIRMED';
  const canCancel = appointment.status === 'PENDING' || appointment.status === 'CONFIRMED';
  const canConfirm = appointment.status === 'PENDING';
  const canComplete = appointment.status === 'CONFIRMED' && new Date(appointment.dateTime) < new Date();
  const canMarkReady = appointment.status === 'CONFIRMED' && new Date(appointment.dateTime).getTime() - Date.now() < 24 * 60 * 60 * 1000; // Within 24 hours

  const handleAction = async (action: AppointmentAction, handler?: () => void | Promise<void>) => {
    if (!handler) return;
    
    setActionLoading(action);
    try {
      await handler();
    } catch (error) {
      console.error(`Error performing action ${action}:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateMeetingLink = async () => {
    if (!onGenerateMeetingLink) return;
    
    setActionLoading('share_meeting_link');
    try {
      const link = await onGenerateMeetingLink(appointment);
      setMeetingLink(link);
    } catch (error) {
      console.error('Error generating meeting link:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelAppointment = async () => {
    if (!onCancel || !cancellationReason.trim()) return;
    
    setActionLoading('cancel');
    try {
      await onCancel({ ...appointment, cancellationReason });
      setShowCancellationForm(false);
      setCancellationReason('');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getMeetingTypeLabel = (type?: string) => {
    switch (type) {
      case MeetingType.FIRST_MEETING: return 'Første møte';
      case MeetingType.REGULAR_LESSON: return 'Ordinær undervisning';
      case MeetingType.TRIAL_LESSON: return 'Prøvetime';
      case MeetingType.EXAM_PREP: return 'Eksamensforberedelse';
      case MeetingType.CONSULTATION: return 'Konsultasjon';
      case MeetingType.INTENSIVE_SESSION: return 'Intensivkurs';
      case MeetingType.GROUP_LESSON: return 'Gruppetime';
      case MeetingType.REVIEW_SESSION: return 'Repetisjon';
      default: return 'Avtale';
    }
  };

  const getLocationTypeLabel = (type?: string) => {
    switch (type) {
      case LocationType.ONLINE: return 'Videomøte';
      case LocationType.STUDENT_PLACE: return 'Hos eleven';
      case LocationType.TUTOR_PLACE: return 'Hos lærer';
      case LocationType.LIBRARY: return 'Bibliotek';
      case LocationType.CAFE: return 'Kafé';
      case LocationType.PUBLIC_LOCATION: return 'Offentlig sted';
      default: return 'Ikke spesifisert';
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-neutral-200">
            <div className="flex-1">
              <Dialog.Title className="text-xl font-semibold text-neutral-900 mb-2">
                {getMeetingTypeLabel(appointment.meetingType)}
                {appointment.chat?.relatedPost?.subject && ` - ${appointment.chat.relatedPost.subject}`}
              </Dialog.Title>
              
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusConfig.color}`}>
                  <statusConfig.icon className="h-4 w-4 mr-1" />
                  {statusConfig.label}
                </span>
                
                {appointment.isTrialLesson && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                    Prøvetime
                  </span>
                )}
                
                {appointment.specialRate && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                    Spesialpris
                  </span>
                )}
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 transition-colors ml-4"
              aria-label="Lukk"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Date and Time */}
            <div className="bg-neutral-50 rounded-lg p-4">
              <div className="flex items-center text-lg font-medium text-neutral-900 mb-2">
                <CalendarIcon className="h-5 w-5 mr-2 text-brand-600" />
                {appointmentDateTime.full}
              </div>
              <div className="text-sm text-neutral-600 ml-7">
                {appointmentDateTime.time} - {appointmentEndTime} ({appointment.duration} minutter)
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start">
              <MapPinIcon className="h-5 w-5 text-neutral-400 mt-0.5 mr-3" />
              <div>
                <div className="font-medium text-neutral-900">
                  {getLocationTypeLabel(appointment.locationType)}
                </div>
                <div className="text-neutral-600 mt-1">{appointment.location}</div>
                {appointment.specificLocation && (
                  <div className="text-sm text-neutral-500 mt-1">{appointment.specificLocation}</div>
                )}
              </div>
            </div>

            {/* Participant Information */}
            {otherParticipant && (
              <div className="flex items-start">
                <UserIcon className="h-5 w-5 text-neutral-400 mt-0.5 mr-3" />
                <div>
                  <div className="font-medium text-neutral-900">{otherParticipant.user.name}</div>
                  <div className="text-sm text-neutral-600">
                    {isTeacher ? 'Elev' : 'Lærer'}
                  </div>
                  {appointment.chat?.relatedPost && (
                    <div className="text-sm text-neutral-500 mt-1">
                      Fag: {appointment.chat.relatedPost.subject}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Price */}
            {appointment.price && (
              <div className="flex items-center">
                <span className="text-lg font-semibold text-neutral-900">
                  {formatNorwegianCurrency(appointment.price)}
                </span>
                {appointment.specialRate && (
                  <span className="ml-2 text-sm text-purple-600 font-medium">
                    (Spesialpris)
                  </span>
                )}
              </div>
            )}

            {/* Meeting Link for Online Sessions */}
            {appointment.locationType === LocationType.ONLINE && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-blue-900">Videomøte</h4>
                  {!meetingLink && onGenerateMeetingLink && (
                    <button
                      onClick={handleGenerateMeetingLink}
                      disabled={actionLoading === 'share_meeting_link'}
                      className="flex items-center px-3 py-1 text-sm font-medium text-blue-700 hover:text-blue-800 disabled:opacity-50"
                    >
                      {actionLoading === 'share_meeting_link' ? (
                        <LoadingSpinner size="sm" className="mr-2" />
                      ) : (
                        <LinkIcon className="h-4 w-4 mr-2" />
                      )}
                      Generer møtelink
                    </button>
                  )}
                </div>
                
                {meetingLink && (
                  <div className="space-y-2">
                    <div className="bg-white rounded p-3 border border-blue-200">
                      <div className="text-sm font-mono break-all text-blue-800">
                        {meetingLink.url}
                      </div>
                      {meetingLink.meetingId && (
                        <div className="text-xs text-blue-600 mt-1">
                          Møte-ID: {meetingLink.meetingId}
                        </div>
                      )}
                      {meetingLink.passcode && (
                        <div className="text-xs text-blue-600">
                          Passcode: {meetingLink.passcode}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-blue-700">
                      Møtelinken vil bli tilgjengelig 15 minutter før møtet starter.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Agenda/Notes */}
            {(appointment.agenda || appointment.notes) && (
              <div className="space-y-4">
                {appointment.agenda && (
                  <div>
                    <h4 className="font-medium text-neutral-900 mb-2 flex items-center">
                      <DocumentTextIcon className="h-4 w-4 mr-2" />
                      Agenda
                    </h4>
                    <div className="bg-neutral-50 rounded-lg p-3 text-sm text-neutral-700">
                      {appointment.agenda}
                    </div>
                  </div>
                )}
                
                {appointment.notes && (
                  <div>
                    <h4 className="font-medium text-neutral-900 mb-2">Notater</h4>
                    <div className="bg-neutral-50 rounded-lg p-3 text-sm text-neutral-700">
                      {appointment.notes}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Preparation Materials */}
            {(appointment.preparationMaterials?.length || appointment.requiredMaterials?.length) && (
              <div className="space-y-4">
                {appointment.preparationMaterials?.length && (
                  <div>
                    <h4 className="font-medium text-neutral-900 mb-2">Forberedelsesmateriale</h4>
                    <ul className="bg-neutral-50 rounded-lg p-3 space-y-1">
                      {appointment.preparationMaterials.map((material, index) => (
                        <li key={index} className="text-sm text-neutral-700 flex items-center">
                          <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full mr-2 flex-shrink-0" />
                          {material}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {appointment.requiredMaterials?.length && (
                  <div>
                    <h4 className="font-medium text-neutral-900 mb-2">Påkrevd utstyr</h4>
                    <ul className="bg-neutral-50 rounded-lg p-3 space-y-1">
                      {appointment.requiredMaterials.map((material, index) => (
                        <li key={index} className="text-sm text-neutral-700 flex items-center">
                          <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full mr-2 flex-shrink-0" />
                          {material}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Readiness Status */}
            {canMarkReady && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-medium text-amber-900 mb-3">Møtestatus</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-800">
                      {isTeacher ? 'Lærer klar:' : 'Du (lærer):'}
                    </span>
                    <span className={`font-medium ${appointment.teacherReady ? 'text-green-600' : 'text-amber-600'}`}>
                      {appointment.teacherReady ? 'Klar' : 'Ikke klar'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-amber-800">
                      {isTeacher ? 'Du (elev):' : 'Elev klar:'}
                    </span>
                    <span className={`font-medium ${appointment.studentReady ? 'text-green-600' : 'text-amber-600'}`}>
                      {appointment.studentReady ? 'Klar' : 'Ikke klar'}
                    </span>
                  </div>
                </div>
                
                {onMarkReady && (
                  <div className="mt-3 pt-3 border-t border-amber-200">
                    <button
                      onClick={() => handleAction('mark_ready', () => 
                        onMarkReady(appointment, !((isTeacher && appointment.teacherReady) || (!isTeacher && appointment.studentReady)))
                      )}
                      disabled={actionLoading === 'mark_ready'}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        (isTeacher && appointment.teacherReady) || (!isTeacher && appointment.studentReady)
                          ? 'text-amber-700 bg-amber-100 hover:bg-amber-200'
                          : 'text-white bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {actionLoading === 'mark_ready' ? (
                        <LoadingSpinner size="sm" color="white" className="mr-2" />
                      ) : (
                        <CheckIcon className="h-4 w-4 mr-2" />
                      )}
                      {(isTeacher && appointment.teacherReady) || (!isTeacher && appointment.studentReady)
                        ? 'Marker som ikke klar'
                        : 'Marker som klar'
                      }
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Cancellation Reason */}
            {appointment.status === 'CANCELLED' && appointment.cancellationReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="ml-3">
                    <h4 className="font-medium text-red-900">Avlysningsgrunn</h4>
                    <p className="text-sm text-red-700 mt-1">{appointment.cancellationReason}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Cancellation Form */}
            {showCancellationForm && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-900 mb-3">Avlys avtale</h4>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Grunn for avlysning..."
                  className="w-full p-3 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  rows={3}
                />
                <div className="flex justify-end space-x-3 mt-3">
                  <button
                    onClick={() => setShowCancellationForm(false)}
                    className="px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50"
                  >
                    Avbryt
                  </button>
                  <button
                    onClick={handleCancelAppointment}
                    disabled={!cancellationReason.trim() || actionLoading === 'cancel'}
                    className="px-3 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {actionLoading === 'cancel' && <LoadingSpinner size="sm" color="white" className="mr-2" />}
                    Bekreft avlysning
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center p-6 border-t border-neutral-200 bg-neutral-50">
            <div className="flex space-x-3">
              {onContactParticipant && otherParticipant && (
                <button
                  onClick={() => handleAction('contact_participant', () => onContactParticipant(appointment))}
                  disabled={actionLoading === 'contact_participant'}
                  className="flex items-center px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50"
                >
                  {actionLoading === 'contact_participant' ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                  )}
                  Kontakt {otherParticipant.user.name}
                </button>
              )}

              {onExportCalendar && (
                <button
                  onClick={() => handleAction('export_calendar', () => onExportCalendar(appointment))}
                  disabled={actionLoading === 'export_calendar'}
                  className="flex items-center px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50"
                >
                  {actionLoading === 'export_calendar' ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <CalendarIcon className="h-4 w-4 mr-2" />
                  )}
                  Eksporter
                </button>
              )}
            </div>

            <div className="flex space-x-3">
              {canConfirm && onConfirm && (
                <button
                  onClick={() => handleAction('confirm', () => onConfirm(appointment))}
                  disabled={actionLoading === 'confirm'}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700"
                >
                  {actionLoading === 'confirm' ? (
                    <LoadingSpinner size="sm" color="white" className="mr-2" />
                  ) : (
                    <CheckIcon className="h-4 w-4 mr-2" />
                  )}
                  Bekreft
                </button>
              )}

              {canEdit && onEdit && (
                <button
                  onClick={() => handleAction('edit', () => onEdit(appointment))}
                  disabled={actionLoading === 'edit'}
                  className="flex items-center px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50"
                >
                  {actionLoading === 'edit' ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <PencilIcon className="h-4 w-4 mr-2" />
                  )}
                  Rediger
                </button>
              )}

              {canComplete && onComplete && (
                <button
                  onClick={() => handleAction('complete', () => onComplete(appointment))}
                  disabled={actionLoading === 'complete'}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700"
                >
                  {actionLoading === 'complete' ? (
                    <LoadingSpinner size="sm" color="white" className="mr-2" />
                  ) : (
                    <CheckIcon className="h-4 w-4 mr-2" />
                  )}
                  Marker fullført
                </button>
              )}

              {canCancel && onCancel && !showCancellationForm && (
                <button
                  onClick={() => setShowCancellationForm(true)}
                  className="flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50"
                >
                  <XCircleIcon className="h-4 w-4 mr-2" />
                  Avlys
                </button>
              )}
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

export default AppointmentDetailsModal;