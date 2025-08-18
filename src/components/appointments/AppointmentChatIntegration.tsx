'use client';

import { useState } from 'react';
import { CalendarIcon, ClockIcon, PlusIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

import AppointmentCreateModal from './AppointmentCreateModal';
import { formatNorwegianDateTime } from '../../schemas/appointments';
import type { Appointment } from '../../types/appointments';

interface AppointmentChatIntegrationProps {
  chatId: string;
  participantName?: string;
  participantType?: 'TEACHER' | 'STUDENT';
  subject?: string;
  recentAppointments?: Appointment[];
  onAppointmentCreated?: (appointment: Appointment) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
  className?: string;
}

export function AppointmentChatIntegration({
  chatId,
  participantName,
  participantType,
  subject,
  recentAppointments = [],
  onAppointmentCreated,
  onAppointmentClick,
  className = '',
}: AppointmentChatIntegrationProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const upcomingAppointments = recentAppointments
    .filter(apt => new Date(apt.dateTime) > new Date() && apt.status !== 'CANCELLED')
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
    .slice(0, 3);

  const pastAppointments = recentAppointments
    .filter(apt => new Date(apt.dateTime) <= new Date() || apt.status === 'COMPLETED')
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
    .slice(0, 2);

  const handleAppointmentSuccess = (appointment: Appointment) => {
    setShowCreateModal(false);
    onAppointmentCreated?.(appointment);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'text-green-600 bg-green-50 border-green-200';
      case 'PENDING': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'COMPLETED': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'CANCELLED': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'Bekreftet';
      case 'PENDING': return 'Venter';
      case 'COMPLETED': return 'Fullført';
      case 'CANCELLED': return 'Kansellert';
      default: return status;
    }
  };

  return (
    <div className={`bg-white border border-neutral-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CalendarIcon className="h-5 w-5 text-brand-600 mr-2" />
            <h3 className="font-medium text-neutral-900">Avtaler</h3>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-3 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Ny avtale
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Upcoming appointments */}
        {upcomingAppointments.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-neutral-700 mb-3">Kommende avtaler</h4>
            <div className="space-y-2">
              {upcomingAppointments.map(appointment => {
                const dateTime = formatNorwegianDateTime(appointment.dateTime);
                
                return (
                  <div
                    key={appointment.id}
                    onClick={() => onAppointmentClick?.(appointment)}
                    className="p-3 bg-neutral-50 rounded-lg cursor-pointer hover:bg-neutral-100 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-sm font-medium text-neutral-900">
                        {subject || 'Avtale'}
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(appointment.status)}`}>
                        {getStatusLabel(appointment.status)}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm text-neutral-600 mb-1">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {dateTime.weekday} {dateTime.date} kl. {dateTime.time}
                    </div>
                    
                    <div className="text-xs text-neutral-500">
                      {appointment.duration} min • {appointment.location}
                    </div>
                    
                    {appointment.notes && (
                      <div className="mt-2 text-xs text-neutral-600 line-clamp-2">
                        {appointment.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Past appointments */}
        {pastAppointments.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-neutral-700 mb-3">Tidligere avtaler</h4>
            <div className="space-y-2">
              {pastAppointments.map(appointment => {
                const dateTime = formatNorwegianDateTime(appointment.dateTime);
                
                return (
                  <div
                    key={appointment.id}
                    onClick={() => onAppointmentClick?.(appointment)}
                    className="p-3 bg-neutral-50 rounded-lg cursor-pointer hover:bg-neutral-100 transition-colors opacity-75"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-sm font-medium text-neutral-700">
                        {subject || 'Avtale'}
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(appointment.status)}`}>
                        {getStatusLabel(appointment.status)}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm text-neutral-500 mb-1">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {dateTime.weekday} {dateTime.date} kl. {dateTime.time}
                    </div>
                    
                    <div className="text-xs text-neutral-400">
                      {appointment.duration} min • {appointment.location}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {upcomingAppointments.length === 0 && pastAppointments.length === 0 && (
          <div className="text-center py-6">
            <CalendarIcon className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm text-neutral-500 mb-3">
              Ingen avtaler ennå
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              Opprett første avtale
            </button>
          </div>
        )}

        {/* Quick scheduling suggestions */}
        {upcomingAppointments.length === 0 && pastAppointments.length > 0 && (
          <div className="border-t border-neutral-100 pt-4">
            <div className="text-center">
              <p className="text-sm text-neutral-600 mb-2">
                Ønsker du å avtale ny time?
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                Planlegg ny avtale
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create appointment modal */}
      <AppointmentCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        mode="create"
        chatId={chatId}
        participantName={participantName}
        participantType={participantType}
        subject={subject}
        onSuccess={handleAppointmentSuccess}
      />
    </div>
  );
}

export default AppointmentChatIntegration;