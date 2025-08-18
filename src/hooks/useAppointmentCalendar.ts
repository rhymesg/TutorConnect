'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths } from 'date-fns';
import { useAppointments } from './useAppointments';
import type { 
  CalendarView, 
  CalendarEvent, 
  Appointment,
  UseAppointmentCalendarReturn,
  AppointmentFilters 
} from '../types/appointments';

interface UseAppointmentCalendarOptions {
  userId?: string;
  initialView?: CalendarView;
  initialDate?: Date;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useAppointmentCalendar(
  options: UseAppointmentCalendarOptions = {}
): UseAppointmentCalendarReturn {
  const {
    userId,
    initialView = 'week',
    initialDate = new Date(),
    autoRefresh = true,
    refreshInterval = 60000, // 1 minute
  } = options;

  const [currentDate, setCurrentDate] = useState(initialDate);
  const [currentView, setCurrentView] = useState<CalendarView>(initialView);

  // Calculate date range based on current view and date
  const dateRange = useMemo(() => {
    switch (currentView) {
      case 'day':
        return {
          start: currentDate.toISOString().split('T')[0],
          end: currentDate.toISOString().split('T')[0],
        };
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        return {
          start: weekStart.toISOString().split('T')[0],
          end: weekEnd.toISOString().split('T')[0],
        };
      case 'month':
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        // Include full weeks
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
        return {
          start: calendarStart.toISOString().split('T')[0],
          end: calendarEnd.toISOString().split('T')[0],
        };
      case 'agenda':
        const agendaStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const agendaEnd = endOfWeek(addWeeks(currentDate, 2), { weekStartsOn: 1 });
        return {
          start: agendaStart.toISOString().split('T')[0],
          end: agendaEnd.toISOString().split('T')[0],
        };
      default:
        return {
          start: currentDate.toISOString().split('T')[0],
          end: currentDate.toISOString().split('T')[0],
        };
    }
  }, [currentView, currentDate]);

  // Filters for appointments based on date range
  const filters: AppointmentFilters = useMemo(() => ({
    dateFrom: dateRange.start + 'T00:00:00.000Z',
    dateTo: dateRange.end + 'T23:59:59.999Z',
  }), [dateRange]);

  // Use appointments hook with calculated filters
  const {
    appointments,
    loading,
    error,
    refetch: refetchAppointments,
    createAppointment,
    updateAppointment,
    updateStatus,
    deleteAppointment,
  } = useAppointments({
    userId,
    initialFilters: filters,
    autoRefresh,
    refreshInterval,
  });

  // Convert appointments to calendar events
  const events = useMemo((): CalendarEvent[] => {
    return appointments.map(appointment => {
      const participant = appointment.chat?.participants?.find(p => p.user.id !== userId);
      const subject = appointment.chat?.relatedPost?.subject;
      
      let title = '';
      if (subject) {
        title += subject;
      }
      if (participant) {
        title += (title ? ' - ' : '') + participant.user.name;
      }
      if (!title) {
        title = 'Avtale';
      }

      return {
        id: appointment.id,
        title,
        start: appointment.dateTime,
        end: new Date(
          new Date(appointment.dateTime).getTime() + appointment.duration * 60000
        ).toISOString(),
        allDay: false,
        backgroundColor: getEventBackgroundColor(appointment.status),
        borderColor: getEventBorderColor(appointment.status),
        textColor: '#ffffff',
        extendedProps: {
          appointment,
          type: 'appointment' as const,
          status: appointment.status,
        },
      };
    });
  }, [appointments, userId]);

  // Navigation functions
  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const goToPrevious = useCallback(() => {
    let newDate: Date;
    
    switch (currentView) {
      case 'day':
        newDate = subDays(currentDate, 1);
        break;
      case 'week':
        newDate = subWeeks(currentDate, 1);
        break;
      case 'month':
        newDate = subMonths(currentDate, 1);
        break;
      case 'agenda':
        newDate = subWeeks(currentDate, 1);
        break;
      default:
        newDate = currentDate;
    }
    
    setCurrentDate(newDate);
  }, [currentView, currentDate]);

  const goToNext = useCallback(() => {
    let newDate: Date;
    
    switch (currentView) {
      case 'day':
        newDate = addDays(currentDate, 1);
        break;
      case 'week':
        newDate = addWeeks(currentDate, 1);
        break;
      case 'month':
        newDate = addMonths(currentDate, 1);
        break;
      case 'agenda':
        newDate = addWeeks(currentDate, 1);
        break;
      default:
        newDate = currentDate;
    }
    
    setCurrentDate(newDate);
  }, [currentView, currentDate]);

  // Refetch when date range changes
  const refetch = useCallback(async () => {
    await refetchAppointments();
  }, [refetchAppointments]);

  // Update date and refresh
  const setCurrentDateAndRefresh = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  // Update view and refresh
  const setCurrentViewAndRefresh = useCallback((view: CalendarView) => {
    setCurrentView(view);
  }, []);

  return {
    events,
    loading,
    error,
    currentDate,
    currentView,
    setCurrentDate: setCurrentDateAndRefresh,
    setCurrentView: setCurrentViewAndRefresh,
    goToToday,
    goToPrevious,
    goToNext,
    refetch,
    // Expose appointment management functions
    createAppointment,
    updateAppointment,
    updateStatus,
    deleteAppointment,
  };
}

// Helper functions for event styling
function getEventBackgroundColor(status: string): string {
  switch (status) {
    case 'CONFIRMED': return '#10b981'; // green-500
    case 'PENDING': return '#f59e0b'; // amber-500
    case 'COMPLETED': return '#6b7280'; // gray-500
    case 'CANCELLED': return '#ef4444'; // red-500
    default: return '#6b7280';
  }
}

function getEventBorderColor(status: string): string {
  switch (status) {
    case 'CONFIRMED': return '#059669'; // green-600
    case 'PENDING': return '#d97706'; // amber-600
    case 'COMPLETED': return '#4b5563'; // gray-600
    case 'CANCELLED': return '#dc2626'; // red-600
    default: return '#4b5563';
  }
}

export default useAppointmentCalendar;