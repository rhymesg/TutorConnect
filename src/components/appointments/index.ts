// Appointment Management Components
export { default as AppointmentManager } from './AppointmentManager';
export { default as AppointmentCalendar } from './AppointmentCalendar';
export { default as AppointmentList } from './AppointmentList';
export { default as AppointmentCard } from './AppointmentCard';
export { default as AppointmentBooking } from './AppointmentBooking';
export { default as AppointmentStatus, StatusIndicator } from './AppointmentStatus';
export { default as AppointmentCreateModal } from './AppointmentCreateModal';
export { default as AppointmentDetailsModal } from './AppointmentDetailsModal';
export { default as AppointmentChatIntegration } from './AppointmentChatIntegration';

// Re-export types for convenience
export type {
  Appointment,
  AppointmentFeedback,
  CalendarView,
  CalendarEvent,
  TimeSlot,
  DayAvailability,
  WeeklyAvailability,
  AppointmentConflict,
  AppointmentFormData,
  AppointmentFormErrors,
  AppointmentModalProps,
  AppointmentCalendarProps,
  AppointmentListProps,
  AppointmentAction,
  AppointmentActionConfig,
  AppointmentStats,
  AppointmentFilters,
  AppointmentSearchParams,
  AppointmentReminder,
  AppointmentNotification,
  MeetingLink,
  OnlineSessionInfo,
  NorwegianBusinessConstraints,
  UseAppointmentsReturn,
  UseAppointmentCalendarReturn,
} from '../../types/appointments';

// Re-export schemas and utilities
export {
  createAppointmentSchema,
  updateAppointmentSchema,
  updateAppointmentStatusSchema,
  listAppointmentsSchema,
  checkAvailabilitySchema,
  calendarExportSchema,
  appointmentFeedbackSchema,
  MeetingType,
  LocationType,
  RecurringPattern,
  DurationOptions,
  ReminderOptions,
  NorwegianHolidays,
  BusinessHours,
  validateNorwegianBusinessHours,
  validateAdvanceNotice,
  validateRecurringPattern,
  formatNorwegianCurrency,
  formatNorwegianDateTime,
  generateAppointmentTitle,
  AppointmentConstants,
} from '../../schemas/appointments';

// Re-export hooks
export { default as useAppointments, useAppointment, useAppointmentStats } from '../../hooks/useAppointments';
export { default as useAppointmentCalendar } from '../../hooks/useAppointmentCalendar';