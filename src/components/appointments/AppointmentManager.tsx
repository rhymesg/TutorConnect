'use client';

import { useState, useCallback, useMemo } from 'react';
import { PlusIcon, FunnelIcon, CalendarIcon, ListBulletIcon } from '@heroicons/react/24/outline';

import AppointmentCalendar from './AppointmentCalendar';
import AppointmentList from './AppointmentList';
import AppointmentCreateModal from './AppointmentCreateModal';
import AppointmentDetailsModal from './AppointmentDetailsModal';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useAppointmentCalendar } from '../../hooks/useAppointmentCalendar';
import { useAppointments } from '../../hooks/useAppointments';
import type { 
  CalendarView, 
  Appointment, 
  AppointmentFilters,
  AppointmentAction 
} from '../../types/appointments';

interface AppointmentManagerProps {
  userId?: string;
  initialView?: CalendarView;
  showCreateButton?: boolean;
  showFilters?: boolean;
  allowViewSwitch?: boolean;
  className?: string;
}

type ViewMode = 'calendar' | 'list';

export function AppointmentManager({
  userId,
  initialView = 'week',
  showCreateButton = true,
  showFilters = true,
  allowViewSwitch = true,
  className = '',
}: AppointmentManagerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilters, setShowFiltersPanel] = useState(false);
  const [filters, setFilters] = useState<AppointmentFilters>({});

  // Use calendar hook for calendar view
  const {
    events,
    loading: calendarLoading,
    error: calendarError,
    currentDate,
    currentView,
    setCurrentDate,
    setCurrentView,
    goToToday,
    goToPrevious,
    goToNext,
    refetch: refetchCalendar,
    createAppointment: createCalendarAppointment,
    updateAppointment: updateCalendarAppointment,
    updateStatus: updateCalendarStatus,
    deleteAppointment: deleteCalendarAppointment,
  } = useAppointmentCalendar({
    userId,
    initialView,
    autoRefresh: true,
  });

  // Use appointments hook for list view
  const {
    appointments,
    loading: listLoading,
    error: listError,
    refetch: refetchList,
    createAppointment: createListAppointment,
    updateAppointment: updateListAppointment,
    updateStatus: updateListStatus,
    deleteAppointment: deleteListAppointment,
  } = useAppointments({
    userId,
    initialFilters: filters,
    autoRefresh: false,
  });

  // Current data based on view mode
  const currentAppointments = useMemo(() => {
    if (viewMode === 'calendar') {
      return events.map(event => event.extendedProps.appointment);
    }
    return appointments;
  }, [viewMode, events, appointments]);

  const isLoading = viewMode === 'calendar' ? calendarLoading : listLoading;
  const error = viewMode === 'calendar' ? calendarError : listError;

  // Appointment management functions
  const handleCreateAppointment = async (data: any) => {
    if (viewMode === 'calendar') {
      return await createCalendarAppointment(data);
    }
    return await createListAppointment(data);
  };

  const handleUpdateAppointment = async (id: string, data: any) => {
    if (viewMode === 'calendar') {
      return await updateCalendarAppointment(id, data);
    }
    return await updateListAppointment(id, data);
  };

  const handleUpdateStatus = async (id: string, data: any) => {
    if (viewMode === 'calendar') {
      return await updateCalendarStatus(id, data);
    }
    return await updateListStatus(id, data);
  };

  const handleDeleteAppointment = async (id: string) => {
    if (viewMode === 'calendar') {
      await deleteCalendarAppointment(id);
    } else {
      await deleteListAppointment(id);
    }
  };

  const handleRefetch = useCallback(() => {
    if (viewMode === 'calendar') {
      refetchCalendar();
    } else {
      refetchList();
    }
  }, [viewMode, refetchCalendar, refetchList]);

  // Event handlers
  const handleAppointmentClick = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  }, []);

  const handleSlotClick = useCallback((slotInfo: { start: string; end: string }) => {
    const initialData = {
      date: slotInfo.start.split('T')[0],
      time: slotInfo.start.split('T')[1]?.slice(0, 5) || '09:00',
    };
    setShowCreateModal(true);
  }, []);

  const handleAppointmentSuccess = useCallback((appointment: Appointment) => {
    setShowCreateModal(false);
    handleRefetch();
  }, [handleRefetch]);

  const handleDetailsAction = useCallback(async (action: AppointmentAction, appointment: Appointment) => {
    switch (action) {
      case 'edit':
        setShowDetailsModal(false);
        setSelectedAppointment(appointment);
        setShowCreateModal(true);
        break;
      case 'confirm':
        await handleUpdateStatus(appointment.id, { status: 'CONFIRMED' });
        break;
      case 'cancel':
        await handleUpdateStatus(appointment.id, { 
          status: 'CANCELLED',
          cancellationReason: appointment.cancellationReason 
        });
        break;
      case 'complete':
        await handleUpdateStatus(appointment.id, { status: 'COMPLETED' });
        break;
      case 'mark_ready':
        const updateData = userId === appointment.chat?.participants?.find(p => p.user.id === userId)?.user.id
          ? { teacherReady: !appointment.teacherReady }
          : { studentReady: !appointment.studentReady };
        await handleUpdateAppointment(appointment.id, updateData);
        break;
      default:
        console.log(`Action ${action} not implemented`);
    }
    
    handleRefetch();
  }, [handleUpdateStatus, handleUpdateAppointment, handleRefetch, userId]);

  const handleStatusChange = useCallback(async (appointmentId: string, status: string) => {
    await handleUpdateStatus(appointmentId, { status });
    handleRefetch();
  }, [handleUpdateStatus, handleRefetch]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Avtaler</h1>
          <p className="text-neutral-600">
            Administrer dine avtalte timer og møter
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* View mode toggle */}
          {allowViewSwitch && (
            <div className="flex bg-neutral-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-2 text-sm font-medium rounded transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <CalendarIcon className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Kalender</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm font-medium rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <ListBulletIcon className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Liste</span>
              </button>
            </div>
          )}

          {/* Filters */}
          {showFilters && (
            <button
              onClick={() => setShowFiltersPanel(!showFilters)}
              className="flex items-center px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50"
            >
              <FunnelIcon className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Filter</span>
            </button>
          )}

          {/* Create appointment */}
          {showCreateButton && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
            >
              <PlusIcon className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Ny avtale</span>
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">
            <strong>Feil:</strong> {error}
          </div>
          <button
            onClick={handleRefetch}
            className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Prøv igjen
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && (
        <>
          {viewMode === 'calendar' ? (
            <AppointmentCalendar
              view={currentView}
              appointments={currentAppointments}
              onViewChange={setCurrentView}
              onDateChange={(date) => setCurrentDate(new Date(date))}
              onAppointmentClick={handleAppointmentClick}
              onSlotClick={handleSlotClick}
              editable={true}
              loading={calendarLoading}
            />
          ) : (
            <AppointmentList
              appointments={currentAppointments}
              onAppointmentClick={handleAppointmentClick}
              onStatusChange={handleStatusChange}
              groupBy="date"
              sortBy="dateTime"
              sortOrder="asc"
              showActions={true}
              loading={listLoading}
            />
          )}
        </>
      )}

      {/* Modals */}
      <AppointmentCreateModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedAppointment(null);
        }}
        mode={selectedAppointment ? 'edit' : 'create'}
        appointment={selectedAppointment || undefined}
        onSuccess={handleAppointmentSuccess}
      />

      <AppointmentDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedAppointment(null);
        }}
        mode="view"
        appointment={selectedAppointment || undefined}
        currentUserId={userId}
        onEdit={(appointment) => handleDetailsAction('edit', appointment)}
        onConfirm={(appointment) => handleDetailsAction('confirm', appointment)}
        onCancel={(appointment) => handleDetailsAction('cancel', appointment)}
        onComplete={(appointment) => handleDetailsAction('complete', appointment)}
        onMarkReady={(appointment, ready) => handleDetailsAction('mark_ready', appointment)}
      />
    </div>
  );
}

export default AppointmentManager;