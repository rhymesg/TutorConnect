// API response and request types for TutorConnect

// Base API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
  statusCode: number;
  meta?: {
    timestamp: string;
    requestId: string;
    path: string;
  };
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Search and filter types
export interface SearchParams {
  q?: string;
  query?: string;
  search?: string;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  orderBy?: string;
  order?: 'asc' | 'desc';
}

// HTTP method types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// API endpoint types
export interface ApiEndpoint {
  method: HttpMethod;
  path: string;
  auth?: boolean;
  permissions?: string[];
  rateLimit?: {
    max: number;
    window: number; // in seconds
  };
}

// Request types for different endpoints

// User API types
export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  region: string;
  postalCode?: string;
  gender?: string;
  birthYear?: number;
}

export interface UpdateUserRequest {
  name?: string;
  region?: string;
  postalCode?: string;
  gender?: string;
  birthYear?: number;
  school?: string;
  degree?: string;
  certifications?: string;
  bio?: string;
  privacyGender?: string;
  privacyAge?: string;
  privacyDocuments?: string;
  privacyContact?: string;
}

export interface GetUsersRequest extends PaginationParams, SearchParams, SortParams {
  region?: string;
  isActive?: boolean;
}

// Post API types
export interface CreatePostRequest {
  type: 'TEACHER' | 'STUDENT';
  subject: string;
  ageGroups: string[];
  title: string;
  description: string;
  availableDays: string[];
  availableTimes: string[];
  preferredSchedule?: string;
  location: string;
  specificLocation?: string;
  hourlyRate?: number;
  hourlyRateMin?: number;
  hourlyRateMax?: number;
}

export interface UpdatePostRequest extends Partial<CreatePostRequest> {
  isActive?: boolean;
}

export interface GetPostsRequest extends PaginationParams, SearchParams, SortParams {
  type?: 'TEACHER' | 'STUDENT';
  subject?: string;
  ageGroups?: string[];
  location?: string;
  minRate?: number;
  maxRate?: number;
  userId?: string;
  isActive?: boolean;
}

// Chat API types
export interface CreateChatRequest {
  relatedPostId?: string;
  participantIds: string[];
  initialMessage?: string;
}

export interface GetChatsRequest extends PaginationParams, SortParams {
  userId?: string;
  isActive?: boolean;
  hasUnread?: boolean;
}

export interface GetChatMessagesRequest extends PaginationParams {
  chatId: string;
  before?: string; // message ID
  after?: string; // message ID
}

// Message API types
export interface CreateMessageRequest {
  content: string;
  type?: 'TEXT' | 'APPOINTMENT_REQUEST' | 'APPOINTMENT_RESPONSE' | 'SYSTEM_MESSAGE';
  appointmentId?: string;
}

export interface UpdateMessageRequest {
  content: string;
}

// Appointment API types
export interface CreateAppointmentRequest {
  chatId: string;
  dateTime: string; // ISO string
  location: string;
  specificLocation?: string;
  duration?: number;
  notes?: string;
  reminderTime?: number;
}

export interface UpdateAppointmentRequest {
  dateTime?: string;
  location?: string;
  specificLocation?: string;
  duration?: number;
  status?: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  reminderTime?: number;
  cancellationReason?: string;
}

export interface GetAppointmentsRequest extends PaginationParams, SortParams {
  userId?: string;
  chatId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}

// Document API types
export interface UploadDocumentRequest {
  documentType: 'PROFILE_IMAGE' | 'EDUCATION_CERTIFICATE' | 'ID_VERIFICATION' | 'TEACHING_CERTIFICATE' | 'OTHER_DOCUMENT';
  file: File;
  description?: string;
}

export interface GetDocumentsRequest extends PaginationParams {
  userId?: string;
  documentType?: string;
  verificationStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

// Info Request API types
export interface CreateInfoRequestRequest {
  receiverId: string;
  requestType: 'contact' | 'documents' | 'detailed_profile';
  message?: string;
}

export interface UpdateInfoRequestRequest {
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  responseMessage?: string;
}

// File upload types
export interface FileUploadResponse {
  fileId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export interface FileUploadRequest {
  file: File;
  folder?: string;
  maxSize?: number;
  allowedTypes?: string[];
}

// Real-time event types
export interface RealtimeEvent<T = unknown> {
  type: string;
  event: string;
  payload: T;
  timestamp: string;
  userId?: string;
  chatId?: string;
}

export interface ChatMessageEvent extends RealtimeEvent {
  type: 'chat_message';
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: {
    id: string;
    content: string;
    senderId: string;
    chatId: string;
    sentAt: string;
    type: string;
  };
}

export interface AppointmentEvent extends RealtimeEvent {
  type: 'appointment';
  event: 'INSERT' | 'UPDATE';
  payload: {
    id: string;
    chatId: string;
    dateTime: string;
    status: string;
    createdAt: string;
  };
}

export interface UserStatusEvent extends RealtimeEvent {
  type: 'user_status';
  event: 'UPDATE';
  payload: {
    userId: string;
    isActive: boolean;
    lastActive: string;
  };
}

// WebSocket types
export interface WebSocketMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp: string;
  id?: string;
}

export interface WebSocketResponse<T = unknown> {
  type: string;
  success: boolean;
  data?: T;
  error?: string;
  requestId?: string;
}

// Analytics types
export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  timestamp: string;
}

export interface ApiMetrics {
  endpoint: string;
  method: HttpMethod;
  statusCode: number;
  responseTime: number;
  timestamp: string;
  userId?: string;
  userAgent?: string;
  ip?: string;
}

// Health check types
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    database: 'healthy' | 'unhealthy';
    supabase: 'healthy' | 'unhealthy';
    storage: 'healthy' | 'unhealthy';
  };
  uptime: number;
}

// Rate limiting types
export interface RateLimitHeaders {
  'X-RateLimit-Limit': string;
  'X-RateLimit-Remaining': string;
  'X-RateLimit-Reset': string;
  'Retry-After'?: string;
}

export interface RateLimitExceededResponse extends ApiError {
  code: 'RATE_LIMIT_EXCEEDED';
  retryAfter: number;
}