'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Language } from '@/lib/translations';
import { Message } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';
import AppointmentCard from './AppointmentCard';

interface AppointmentResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message;
  language: Language;
  onAccept: () => Promise<void>;
  onReject: () => Promise<void>;
  onCompleted?: () => Promise<void>;
  onNotCompleted?: () => Promise<void>;
  error?: string | null;
}

export default function AppointmentResponseModal({
  isOpen,
  onClose,
  message,
  language,
  onAccept,
  onReject,
  onCompleted,
  onNotCompleted,
  error
}: AppointmentResponseModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();

  const status = message.appointment?.status || 'PENDING';
  const isWaitingToComplete = status === 'WAITING_TO_COMPLETE';
  const isOwnRequest = message.senderId === user?.id; // Check if current user sent the appointment request
  
  const t = language === 'no' ? {
    // Original appointment request texts
    title: 'Avtaleforespørsel',
    proposedTime: 'Foreslått tid',
    accept: 'Godta',
    reject: 'Avslå',
    cancel: 'Lukk',
    from: 'Fra',
    location: 'Sted',
    alreadyResponded: 'Du har allerede svart på denne avtalen',
    
    // For the person who made the request
    yourRequest: 'Din avtaleforespørsel',
    youProposed: 'Du foreslo denne timen',
    
    // Completion confirmation texts
    completionTitle: 'Avtale fullført?',
    completionQuestion: 'Ble denne avtalen gjennomført som planlagt?',
    completed: 'Ja, gjennomført',
    notCompleted: 'Nei, ikke gjennomført',
    appointmentDetails: 'Avtaledetaljer',
    waitingForOther: 'Venter på svar fra den andre parten',
    bothConfirmed: 'Begge parter har bekreftet at avtalen ble gjennomført',
    yourResponse: 'Du har svart:',
    responseCompleted: 'Gjennomført',
    responseNotCompleted: 'Ikke gjennomført',
    
    // Status labels
    pending: 'Venter på svar',
    confirmed: 'Bekreftet',
    cancelled: 'Avbrutt',
    waiting_to_complete: 'Venter på fullføring',
    completed_status: 'Fullført'
  } : {
    // Original appointment request texts
    title: 'Appointment Request',
    proposedTime: 'Proposed time',
    accept: 'Accept',
    reject: 'Reject', 
    cancel: 'Close',
    from: 'From',
    location: 'Location',
    alreadyResponded: 'You have already responded to this appointment',
    
    // For the person who made the request
    yourRequest: 'Your Appointment Request',
    youProposed: 'You proposed this time',
    
    // Completion confirmation texts
    completionTitle: 'Appointment Completed?',
    completionQuestion: 'Was this appointment completed as planned?',
    completed: 'Yes, completed',
    notCompleted: 'No, not completed',
    appointmentDetails: 'Appointment Details',
    waitingForOther: 'Waiting for response from the other party',
    bothConfirmed: 'Both parties confirmed the appointment was completed',
    yourResponse: 'Your response:',
    responseCompleted: 'Completed',
    responseNotCompleted: 'Not completed',
    
    // Status labels
    pending: 'Pending',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    waiting_to_complete: 'Waiting to complete',
    completed_status: 'Completed'
  };

  if (!isOpen) return null;

  // Parse appointment data
  let appointmentData;
  try {
    appointmentData = JSON.parse(message.content);
  } catch {
    appointmentData = message.appointment || {};
  }

  // Check if current user is the teacher (post owner)
  const isTeacher = message.appointment?.chat?.relatedPost?.userId === user?.id;
  
  // Check if current user has already responded
  const userHasResponded = isTeacher 
    ? message.appointment?.teacherReady 
    : message.appointment?.studentReady;
    
  // Check if other party has responded
  const otherPartyResponded = isTeacher
    ? message.appointment?.studentReady
    : message.appointment?.teacherReady;


  const handleAccept = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await onAccept();
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await onReject();
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleted = async () => {
    if (isProcessing || !onCompleted) return;
    setIsProcessing(true);
    try {
      await onCompleted();
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNotCompleted = async () => {
    if (isProcessing || !onNotCompleted) return;
    setIsProcessing(true);
    try {
      await onNotCompleted();
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsProcessing(false);
    }
  };

  const isAlreadyResponded = status !== 'PENDING' && status !== 'WAITING_TO_COMPLETE';
  const isCompleted = status === 'COMPLETED';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {isWaitingToComplete 
                ? t.completionTitle 
                : isOwnRequest 
                  ? t.yourRequest 
                  : t.title
              }
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Appointment Details */}
          <AppointmentCard
            appointmentData={appointmentData}
            status={status}
            language={language}
            title={isWaitingToComplete ? t.appointmentDetails : t.proposedTime}
            statusPosition="top"
            className="mb-4"
          />

          {/* Status Messages - All in consistent position */}
          <div className="mb-4">
            {/* Completion question for waiting to complete status */}
            {isWaitingToComplete && !userHasResponded && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm mb-3">
                {t.completionQuestion}
              </div>
            )}
            
            {/* User's response if they already answered */}
            {isWaitingToComplete && userHasResponded && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-3">
                <strong>{t.yourResponse}</strong> {userHasResponded === true ? t.responseCompleted : t.responseNotCompleted}
                {otherPartyResponded ? null : ` (${t.waitingForOther})`}
              </div>
            )}

            {/* Message for person who made the request */}
            {!isWaitingToComplete && isOwnRequest && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm mb-3">
                {t.youProposed}
              </div>
            )}


            {/* Already responded message */}
            {isAlreadyResponded && !isWaitingToComplete && !isCompleted && !isOwnRequest && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm mb-3">
                {t.alreadyResponded}
              </div>
            )}

            {/* Both confirmed completion message */}
            {isCompleted && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-3">
                {t.bothConfirmed}
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {isWaitingToComplete && !isCompleted ? (
              <>
                <button
                  onClick={handleCompleted}
                  disabled={isProcessing || userHasResponded}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  {t.completed}
                </button>
                <button
                  onClick={handleNotCompleted}
                  disabled={isProcessing || userHasResponded}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <X className="h-4 w-4" />
                  {t.notCompleted}
                </button>
              </>
            ) : !isAlreadyResponded && !isWaitingToComplete && !isCompleted && !isOwnRequest ? (
              <>
                <button
                  onClick={handleAccept}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  {t.accept}
                </button>
                <button
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <X className="h-4 w-4" />
                  {t.reject}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                {t.cancel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}