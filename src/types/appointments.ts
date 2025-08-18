import { AppointmentStatus } from '@prisma/client';
import { 
  MeetingTypeValue, 
  LocationTypeValue, 
  RecurringPatternValue,
  CreateAppointmentInput,
  UpdateAppointmentInput,
  UpdateAppointmentStatusInput,
  ListAppointmentsInput,
  CheckAvailabilityInput,
  CalendarExportInput,
  AppointmentFeedbackInput
} from '../schemas/appointments';

/**
 * Appointment Management Types
 * For TutorConnect FRONT-009: Appointment Management UI
 */

// Core appointment interface extending Prisma model
export interface Appointment {
  id: string;
  chatId: string;
  dateTime: string;
  location: string;
  specificLocation?: string | null;
  duration: number;
  status: AppointmentStatus;
  teacherReady: boolean;
  studentReady: boolean;
  bothCompleted: boolean;
  reminderTime?: number | null;
  notes?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
  
  // Extended fields for UI
  locationType?: LocationTypeValue;
  meetingType?: MeetingTypeValue;
  agenda?: string;
  price?: number;
  currency?: string;
  specialRate?: boolean;
  isTrialLesson?: boolean;
  preparationMaterials?: string[];
  requiredMaterials?: string[];
  
  // Recurring fields
  isRecurring?: boolean;
  recurringPattern?: RecurringPatternValue;
  recurringEndDate?: string;
  parentAppointmentId?: string;
  
  // Relations
  chat?: {
    id: string;
    participants: Array<{
      user: {
        id: string;
        name: string;
        profileImage?: string;
      };
    }>;
    relatedPost?: {
      id: string;
      subject: string;
      type: 'TEACHER' | 'STUDENT';
    };
  };
  
  // Feedback after completion
  feedback?: AppointmentFeedback[];
}

// Appointment feedback interface
export interface AppointmentFeedback {
  id: string;
  appointmentId: string;
  userId: string;
  rating: number;
  feedback?: string;
  wouldRecommend?: boolean;
  punctuality?: number;
  preparedness?: number;
  clarity?: number;
  helpfulness?: number;
  tags?: string[];
  createdAt: string;
  
  user: {
    id: string;
    name: string;
    profileImage?: string;
  };
}

// Calendar view types
export type CalendarView = 'day' | 'week' | 'month' | 'agenda';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps: {
    appointment: Appointment;
    type: 'appointment' | 'blocked' | 'available';
    status: AppointmentStatus;
  };
}

// Availability interfaces
export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  reason?: string;
  existingAppointment?: {
    id: string;
    title: string;
    status: AppointmentStatus;
  };
}

export interface DayAvailability {
  date: string;
  isBusinessDay: boolean;
  isHoliday: boolean;
  holidayName?: string;
  timeSlots: TimeSlot[];
  totalAvailableHours: number;
}

export interface WeeklyAvailability {
  weekStart: string;
  weekEnd: string;
  days: DayAvailability[];
}

// Appointment conflict detection
export interface AppointmentConflict {
  type: 'overlap' | 'buffer_violation' | 'holiday' | 'business_hours';
  severity: 'error' | 'warning' | 'info';
  message: string;
  conflictingAppointment?: {
    id: string;
    title: string;
    dateTime: string;
    duration: number;
  };
  suggestions?: string[];
}

// Form states and UI types
export interface AppointmentFormData extends Omit<CreateAppointmentInput, 'chatId'> {
  chatId?: string;
  participantId?: string;
  participantName?: string;
  participantType?: 'TEACHER' | 'STUDENT';
  subject?: string;
  
  // UI specific fields
  date?: string; // ISO date string (YYYY-MM-DD)
  time?: string; // Time string (HH:MM)
  timeZone?: string;
}

export interface AppointmentFormErrors {
  dateTime?: string;
  duration?: string;
  location?: string;
  locationType?: string;
  meetingType?: string;
  price?: string;
  notes?: string;
  agenda?: string;
  recurringEndDate?: string;
  general?: string;
}

// Modal and dialog types
export type AppointmentModalMode = 'create' | 'edit' | 'view' | 'reschedule' | 'cancel';

export interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: AppointmentModalMode;
  appointment?: Appointment;
  chatId?: string;
  initialData?: Partial<AppointmentFormData>;
  onSuccess?: (appointment: Appointment) => void;
}

// Calendar component props
export interface AppointmentCalendarProps {
  view: CalendarView;
  appointments: Appointment[];
  onViewChange: (view: CalendarView) => void;
  onDateChange: (date: string) => void;
  onAppointmentClick: (appointment: Appointment) => void;
  onSlotClick?: (slotInfo: { start: string; end: string }) => void;
  editable?: boolean;
  loading?: boolean;
  className?: string;
}

// List component props
export interface AppointmentListProps {
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
  onStatusChange?: (appointmentId: string, status: AppointmentStatus) => void;
  groupBy?: 'date' | 'status' | 'participant' | 'none';
  sortBy?: 'dateTime' | 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
  showActions?: boolean;
  loading?: boolean;
  className?: string;
}

// Quick actions for appointments
export type AppointmentAction = 
  | 'view'
  | 'edit'
  | 'reschedule'
  | 'cancel'
  | 'confirm'
  | 'complete'
  | 'mark_ready'
  | 'add_notes'
  | 'contact_participant'
  | 'export_calendar'
  | 'share_meeting_link';

export interface AppointmentActionConfig {
  action: AppointmentAction;
  label: string;
  icon: string;
  enabled: (appointment: Appointment) => boolean;
  visible: (appointment: Appointment) => boolean;
  handler: (appointment: Appointment) => void;
}

// Statistics and analytics
export interface AppointmentStats {
  total: number;
  completed: number;
  cancelled: number;
  pending: number;
  confirmed: number;
  upcomingThisWeek: number;
  upcomingNextWeek: number;
  averageDuration: number;
  mostCommonMeetingType: MeetingTypeValue;
  mostCommonLocation: LocationTypeValue;
  completionRate: number;
  cancellationRate: number;
  averageRating?: number;
  totalHours: number;
  totalRevenue?: number;
}

// Filter and search types
export interface AppointmentFilters {
  status?: AppointmentStatus[];
  dateFrom?: string;
  dateTo?: string;
  locationType?: LocationTypeValue[];
  meetingType?: MeetingTypeValue[];
  participantId?: string;
  isRecurring?: boolean;
  hasNotes?: boolean;
  minDuration?: number;
  maxDuration?: number;
  priceRange?: {
    min: number;
    max: number;
  };
}

export interface AppointmentSearchParams extends AppointmentFilters {
  query?: string;
  page?: number;
  limit?: number;
  sortBy?: 'dateTime' | 'createdAt' | 'updatedAt' | 'duration' | 'price';
  sortOrder?: 'asc' | 'desc';
}

// Notification and reminder types
export interface AppointmentReminder {
  id: string;
  appointmentId: string;
  type: 'sms' | 'email' | 'push' | 'in_app';
  scheduledFor: string;
  status: 'scheduled' | 'sent' | 'failed' | 'cancelled';
  message: string;
  createdAt: string;
  sentAt?: string;
}

export interface AppointmentNotification {
  type: 'reminder' | 'confirmation' | 'cancellation' | 'reschedule' | 'completion_request';
  appointment: Appointment;
  message: string;
  actions?: Array<{
    label: string;
    action: AppointmentAction;
    style?: 'primary' | 'secondary' | 'danger';
  }>;
}

// Meeting link and online session types
export interface MeetingLink {
  id: string;
  appointmentId: string;
  platform: 'zoom' | 'teams' | 'meet' | 'custom';
  url: string;
  meetingId?: string;
  passcode?: string;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface OnlineSessionInfo {
  meetingLink: MeetingLink;
  requiresDownload: boolean;
  browserSupported: boolean;
  testConnectionUrl?: string;
  troubleshootingUrl?: string;
  supportContact?: string;
}

// Export types from schemas
export type {
  CreateAppointmentInput,
  UpdateAppointmentInput,
  UpdateAppointmentStatusInput,
  ListAppointmentsInput,
  CheckAvailabilityInput,
  CalendarExportInput,
  AppointmentFeedbackInput,
  MeetingTypeValue,
  LocationTypeValue,
  RecurringPatternValue,
};

// Utility type for Norwegian business context
export interface NorwegianBusinessConstraints {
  allowWeekends: boolean;
  allowHolidays: boolean;
  minAdvanceHours: number;
  maxAdvanceDays: number;
  businessHours: {
    weekdays: { start: string; end: string };
    saturday: { start: string; end: string };
    sunday: { start: string; end: string };
  };
  bufferBetweenAppointments: number; // minutes
  maxDailyAppointments: number;
  maxWeeklyHours: number;
}

// Hook return types
export interface UseAppointmentsReturn {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  hasMore: boolean;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  createAppointment: (data: CreateAppointmentInput) => Promise<Appointment>;
  updateAppointment: (id: string, data: UpdateAppointmentInput) => Promise<Appointment>;
  updateStatus: (id: string, data: UpdateAppointmentStatusInput) => Promise<Appointment>;
  deleteAppointment: (id: string) => Promise<void>;
  checkAvailability: (data: CheckAvailabilityInput) => Promise<TimeSlot[]>;
}

export interface UseAppointmentCalendarReturn {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  currentDate: Date;
  currentView: CalendarView;
  setCurrentDate: (date: Date) => void;
  setCurrentView: (view: CalendarView) => void;
  goToToday: () => void;
  goToPrevious: () => void;
  goToNext: () => void;
  refetch: () => Promise<void>;
}