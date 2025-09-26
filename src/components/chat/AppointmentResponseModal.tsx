'use client';

import { useState } from 'react';
import { Check, X, Trash2 } from 'lucide-react';
import { Message } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, useLanguageText } from '@/contexts/LanguageContext';
import AppointmentCard from './AppointmentCard';

interface AppointmentResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message;
  onAccept: () => Promise<void>;
  onReject: () => Promise<void>;
  onCompleted?: () => Promise<void>;
  onNotCompleted?: () => Promise<void>;
  onDelete?: () => Promise<void>;
  error?: string | null;
}

export default function AppointmentResponseModal({
  isOpen,
  onClose,
  message,
  onAccept,
  onReject,
  onCompleted,
  onNotCompleted,
  onDelete,
  error,
}: AppointmentResponseModalProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const translate = useLanguageText();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const appointmentStatus = message.appointment?.status || 'PENDING';
  const isWaitingToComplete = appointmentStatus === 'WAITING_TO_COMPLETE';
  const isOwnRequest = message.senderId === user?.id;

  const labels = {
    title: translate('Avtaleforespørsel', 'Appointment Request'),
    proposedTime: translate('Foreslått tid', 'Proposed time'),
    accept: translate('Godta', 'Accept'),
    reject: translate('Avslå', 'Decline'),
    close: translate('Lukk', 'Close'),
    from: translate('Fra', 'From'),
    location: translate('Sted', 'Location'),
    alreadyResponded: translate('Du har allerede svart på denne avtalen', 'You have already responded to this appointment'),
    yourRequest: translate('Din avtaleforespørsel', 'Your appointment request'),
    youProposed: translate('Du foreslo denne timen', 'You proposed this time'),
    completionTitle: translate('Avtale fullført?', 'Appointment completed?'),
    completionQuestion: translate('Ble denne avtalen gjennomført som planlagt?', 'Was this appointment completed as planned?'),
    completed: translate('Ja, gjennomført', 'Yes, completed'),
    notCompleted: translate('Nei, ikke gjennomført', 'No, not completed'),
    appointmentDetails: translate('Avtaledetaljer', 'Appointment details'),
    waitingForOther: translate('Venter på svar fra den andre parten', 'Waiting for response from the other party'),
    bothConfirmed: translate('Begge parter har bekreftet at avtalen ble gjennomført', 'Both parties confirmed the appointment was completed'),
    yourResponse: translate('Du har svart:', 'You responded:'),
    responseCompleted: translate('Gjennomført', 'Completed'),
    responseNotCompleted: translate('Ikke gjennomført', 'Not completed'),
    delete: translate('Slett', 'Delete'),
    deleteConfirm: translate('Er du sikker på at du vil slette denne avtalen?', 'Are you sure you want to delete this appointment?'),
    deleteWarning: translate('Denne handlingen kan ikke angres.', 'This action cannot be undone.'),
    confirmDelete: translate('Ja, slett', 'Yes, delete'),
    cancelDelete: translate('Avbryt', 'Cancel'),
    processing: translate('Behandler...', 'Processing...'),
    waitingToComplete: translate('Venter på fullføring', 'Waiting to complete'),
    completedStatus: translate('Fullført', 'Completed'),
  };

  if (!isOpen) {
    return null;
  }

  let appointmentData: any = {};
  try {
    appointmentData = JSON.parse(message.content);
  } catch {
    appointmentData = message.appointment || {};
  }

  const isTeacher = message.appointment?.chat?.relatedPost?.userId === user?.id;
  const userHasResponded = isTeacher ? message.appointment?.teacherReady : message.appointment?.studentReady;
  const otherPartyResponded = isTeacher ? message.appointment?.studentReady : message.appointment?.teacherReady;

  const wrapAction = async (action: (() => Promise<void>) | undefined) => {
    if (!action || isProcessing) return;
    setIsProcessing(true);
    try {
      await action();
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || isProcessing) return;
    setIsProcessing(true);
    try {
      await onDelete();
      onClose();
    } finally {
      setIsProcessing(false);
      setShowDeleteConfirmation(false);
    }
  };

  const statusLabels: Record<string, string> = {
    PENDING: translate('Venter på svar', 'Pending'),
    CONFIRMED: translate('Bekreftet', 'Confirmed'),
    CANCELLED: translate('Avbrutt', 'Cancelled'),
    WAITING_TO_COMPLETE: labels.waitingToComplete,
    COMPLETED: labels.completedStatus,
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{labels.title}</h2>
            <p className="text-sm text-gray-500">
              {labels.from} {message.sender?.name || message.relatedPost?.user?.name || ''}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <AppointmentCard
            appointmentData={appointmentData}
            status={appointmentStatus}
            title={isWaitingToComplete ? labels.appointmentDetails : labels.proposedTime}
            statusPosition="top"
            className="mb-4"
          />

          <div className="space-y-3">
            {isWaitingToComplete && !userHasResponded && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                {labels.completionQuestion}
              </div>
            )}

            {isWaitingToComplete && userHasResponded && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                <strong>{labels.yourResponse}</strong> {userHasResponded ? labels.responseCompleted : labels.responseNotCompleted}
                {!otherPartyResponded && ` (${labels.waitingForOther})`}
              </div>
            )}

            {!isWaitingToComplete && isOwnRequest && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm">
                {labels.youProposed}
              </div>
            )}

            {!isWaitingToComplete && !isOwnRequest && userHasResponded && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm">
                {labels.alreadyResponded}
              </div>
            )}

            {appointmentStatus === 'COMPLETED' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {labels.bothConfirmed}
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{translate('Status:', 'Status:')}</span>
              <span className="font-medium">{statusLabels[appointmentStatus] || appointmentStatus}</span>
            </div>

            <div className="flex gap-2">
              {isWaitingToComplete && !userHasResponded && (
                <>
                  <button
                    onClick={() => wrapAction(onCompleted)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                    disabled={isProcessing}
                  >
                    {isProcessing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="h-4 w-4" />}
                    {isProcessing ? labels.processing : labels.completed}
                  </button>
                  <button
                    onClick={() => wrapAction(onNotCompleted)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 text-sm rounded-lg hover:bg-gray-300 disabled:opacity-50"
                    disabled={isProcessing}
                  >
                    <X className="h-4 w-4" />
                    {labels.notCompleted}
                  </button>
                </>
              )}

              {!isWaitingToComplete && !userHasResponded && (
                <>
                  <button
                    onClick={() => wrapAction(onAccept)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                    disabled={isProcessing}
                  >
                    <Check className="h-4 w-4" />
                    {isProcessing ? labels.processing : labels.accept}
                  </button>
                  <button
                    onClick={() => wrapAction(onReject)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                    disabled={isProcessing}
                  >
                    <X className="h-4 w-4" />
                    {labels.reject}
                  </button>
                </>
              )}

              {!isWaitingToComplete && isOwnRequest && onDelete && (
                <button
                  onClick={() => setShowDeleteConfirmation(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 disabled:opacity-50"
                  disabled={isProcessing}
                >
                  <Trash2 className="h-4 w-4" />
                  {labels.delete}
                </button>
              )}

              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                disabled={isProcessing}
              >
                {labels.close}
              </button>
            </div>
          </div>
        </div>

        {showDeleteConfirmation && (
          <div className="px-6 pb-6">
            <div className="p-4 border border-red-200 rounded-lg bg-red-50">
              <h4 className="text-sm font-semibold text-red-700 mb-1">{labels.deleteConfirm}</h4>
              <p className="text-xs text-red-600">{labels.deleteWarning}</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                  disabled={isProcessing}
                >
                  {isProcessing ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  {isProcessing ? labels.processing : labels.confirmDelete}
                </button>
                <button
                  onClick={() => setShowDeleteConfirmation(false)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                  disabled={isProcessing}
                >
                  {labels.cancelDelete}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
