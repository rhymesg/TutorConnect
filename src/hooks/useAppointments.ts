'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApiCall } from './useApiCall';
import type { 
  Appointment,
  UseAppointmentsReturn,
  ListAppointmentsInput,
  CreateAppointmentInput,
  UpdateAppointmentInput,
  UpdateAppointmentStatusInput,
  CheckAvailabilityInput,
  TimeSlot,
  AppointmentFilters
} from '../types/appointments';

interface UseAppointmentsOptions {
  chatId?: string;
  userId?: string;
  initialFilters?: AppointmentFilters;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useAppointments(options: UseAppointmentsOptions = {}): UseAppointmentsReturn {
  const {
    chatId,
    userId,
    initialFilters = {},
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
  } = options;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<AppointmentFilters>(initialFilters);
  const [hasMore, setHasMore] = useState(true);

  const { apiCall } = useApiCall();

  // Build query parameters
  const queryParams = useMemo(() => {
    const params: ListAppointmentsInput = {
      page: currentPage,
      limit: 20,
      ...filters,
    };

    if (chatId) {
      params.chatId = chatId;
    }

    return params;
  }, [currentPage, filters, chatId]);

  // Fetch appointments
  const fetchAppointments = useCallback(async (resetData = false) => {
    if (resetData) {
      setCurrentPage(1);
      setAppointments([]);
      setError(null);
    }

    setLoading(true);

    try {
      const response = await apiCall<{
        appointments: Appointment[];
        totalCount: number;
        hasMore: boolean;
      }>('/api/appointments', {
        method: 'GET',
        params: queryParams,
      });

      if (resetData || currentPage === 1) {
        setAppointments(response.appointments);
      } else {
        setAppointments(prev => [...prev, ...response.appointments]);
      }

      setTotalCount(response.totalCount);
      setHasMore(response.hasMore);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch appointments';
      setError(errorMessage);
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  }, [apiCall, queryParams]);

  // Refetch appointments (reset to page 1)
  const refetch = useCallback(() => {
    return fetchAppointments(true);
  }, [fetchAppointments]);

  // Load more appointments (pagination)
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    
    setCurrentPage(prev => prev + 1);
  }, [hasMore, loading]);

  // Create appointment
  const createAppointment = useCallback(async (data: CreateAppointmentInput): Promise<Appointment> => {
    setLoading(true);
    setError(null);

    try {
      const appointment = await apiCall<Appointment>('/api/appointments', {
        method: 'POST',
        body: data,
      });

      // Add to the beginning of the list
      setAppointments(prev => [appointment, ...prev]);
      setTotalCount(prev => prev + 1);

      return appointment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create appointment';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Update appointment
  const updateAppointment = useCallback(async (
    id: string, 
    data: UpdateAppointmentInput
  ): Promise<Appointment> => {
    setLoading(true);
    setError(null);

    try {
      const updatedAppointment = await apiCall<Appointment>(`/api/appointments/${id}`, {
        method: 'PATCH',
        body: data,
      });

      // Update in the list
      setAppointments(prev => 
        prev.map(apt => apt.id === id ? updatedAppointment : apt)
      );

      return updatedAppointment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update appointment';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Update appointment status
  const updateStatus = useCallback(async (
    id: string, 
    data: UpdateAppointmentStatusInput
  ): Promise<Appointment> => {
    setLoading(true);
    setError(null);

    try {
      const updatedAppointment = await apiCall<Appointment>(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        body: data,
      });

      // Update in the list
      setAppointments(prev => 
        prev.map(apt => apt.id === id ? updatedAppointment : apt)
      );

      return updatedAppointment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update appointment status';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Delete appointment
  const deleteAppointment = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await apiCall(`/api/appointments/${id}`, {
        method: 'DELETE',
      });

      // Remove from the list
      setAppointments(prev => prev.filter(apt => apt.id !== id));
      setTotalCount(prev => prev - 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete appointment';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Check availability
  const checkAvailability = useCallback(async (data: CheckAvailabilityInput): Promise<TimeSlot[]> => {
    try {
      const timeSlots = await apiCall<TimeSlot[]>('/api/appointments/availability', {
        method: 'POST',
        body: data,
      });

      return timeSlots;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check availability';
      console.error('Error checking availability:', err);
      throw new Error(errorMessage);
    }
  }, [apiCall]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<AppointmentFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  // Initial load and when dependencies change
  useEffect(() => {
    fetchAppointments(true);
  }, [fetchAppointments]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAppointments(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchAppointments]);

  // Load more when currentPage changes
  useEffect(() => {
    if (currentPage > 1) {
      fetchAppointments(false);
    }
  }, [currentPage, fetchAppointments]);

  return {
    appointments,
    loading,
    error,
    totalCount,
    hasMore,
    refetch,
    loadMore,
    createAppointment,
    updateAppointment,
    updateStatus,
    deleteAppointment,
    checkAvailability,
    // Additional utilities
    updateFilters,
    filters,
    currentPage,
  };
}

// Hook for single appointment
export function useAppointment(appointmentId: string) {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { apiCall } = useApiCall();

  const fetchAppointment = useCallback(async () => {
    if (!appointmentId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await apiCall<Appointment>(`/api/appointments/${appointmentId}`, {
        method: 'GET',
      });

      setAppointment(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch appointment';
      setError(errorMessage);
      console.error('Error fetching appointment:', err);
    } finally {
      setLoading(false);
    }
  }, [appointmentId, apiCall]);

  useEffect(() => {
    fetchAppointment();
  }, [fetchAppointment]);

  return {
    appointment,
    loading,
    error,
    refetch: fetchAppointment,
  };
}

// Hook for appointment statistics
export function useAppointmentStats(userId?: string, timeframe: '7d' | '30d' | '90d' = '30d') {
  const [stats, setStats] = useState<{
    total: number;
    completed: number;
    cancelled: number;
    pending: number;
    confirmed: number;
    upcomingThisWeek: number;
    averageDuration: number;
    completionRate: number;
    cancellationRate: number;
    totalRevenue?: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { apiCall } = useApiCall();

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiCall(`/api/appointments/stats`, {
        method: 'GET',
        params: { userId, timeframe },
      });

      setStats(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch appointment statistics';
      setError(errorMessage);
      console.error('Error fetching appointment stats:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, timeframe, apiCall]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

export default useAppointments;