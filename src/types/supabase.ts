// Supabase-specific types for TutorConnect
import type { Database } from './database-generated';

// Re-export database types
export type { Database };

// Supabase Auth types
export interface SupabaseAuthUser {
  id: string;
  aud: string;
  role?: string;
  email?: string;
  email_confirmed_at?: string;
  phone?: string;
  confirmation_sent_at?: string;
  confirmed_at?: string;
  last_sign_in_at?: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
  identities?: Array<{
    id: string;
    user_id: string;
    identity_data: Record<string, unknown>;
    provider: string;
    last_sign_in_at: string;
    created_at: string;
    updated_at: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: SupabaseAuthUser;
}

// Storage types
export interface StorageFile {
  name: string;
  id?: string;
  updated_at?: string;
  created_at?: string;
  last_accessed_at?: string;
  metadata?: Record<string, unknown>;
}

export interface StorageFileUpload {
  file: File;
  path: string;
  options?: {
    cacheControl?: string;
    contentType?: string;
    upsert?: boolean;
    duplex?: 'half' | 'full';
  };
}

export interface StorageFileDownload {
  path: string;
  transform?: {
    width?: number;
    height?: number;
    resize?: 'cover' | 'contain' | 'fill';
    format?: 'avif' | 'webp' | 'jpeg' | 'png';
    quality?: number;
  };
}

// Real-time types
export interface RealtimeChannel {
  channel: string;
  config: {
    broadcast?: {
      self?: boolean;
      ack?: boolean;
    };
    presence?: {
      key?: string;
    };
  };
}

export interface RealtimePresence {
  [key: string]: {
    presence_ref: string;
    user_id: string;
    online_at: string;
    [key: string]: unknown;
  }[];
}

export interface RealtimeBroadcast<T = unknown> {
  type: string;
  event: string;
  payload: T;
}

export interface RealtimePostgresChanges<T = Record<string, unknown>> {
  commit_timestamp: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T | null;
  old: T | null;
  schema: string;
  table: string;
}

// RLS (Row Level Security) types
export interface RLSContext {
  user_id?: string;
  user_role?: string;
  user_email?: string;
  [key: string]: unknown;
}

// Error types
export interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

export interface SupabaseApiError extends SupabaseError {
  status?: number;
  statusText?: string;
}

export interface SupabaseAuthError extends SupabaseError {
  status?: number;
}

// Function invocation types
export interface FunctionInvokeOptions {
  headers?: Record<string, string>;
  body?: unknown;
}

export interface FunctionResponse<T = unknown> {
  data: T | null;
  error: SupabaseError | null;
}

// Database function types (for stored procedures)
export interface DatabaseFunction<TArgs = unknown[], TReturn = unknown> {
  name: string;
  args?: TArgs;
  returns: TReturn;
}

// Migration types
export interface Migration {
  version: string;
  name: string;
  statements: string[];
  applied_at?: string;
}

// Bucket types for storage
export interface StorageBucket {
  id: string;
  name: string;
  owner: string;
  public: boolean;
  avif_autodetection: boolean;
  file_size_limit?: number;
  allowed_mime_types?: string[];
  created_at: string;
  updated_at: string;
}

// Webhook types
export interface WebhookPayload<T = unknown> {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: T;
  old_record?: T;
}

// Edge Function types
export interface EdgeFunctionContext {
  req: Request;
  supabaseClient: any; // Supabase client instance
  env: Record<string, string>;
}

export interface EdgeFunctionResponse {
  status?: number;
  headers?: Record<string, string>;
  body?: unknown;
}

// Custom types for TutorConnect-specific Supabase operations

// Profile operations
export interface SupabaseUserProfile {
  id: string;
  email: string;
  name: string;
  region: string;
  profile_image_url?: string;
  created_at: string;
  updated_at: string;
}

// File upload operations
export interface ProfileImageUpload extends StorageFileUpload {
  userId: string;
  bucket: 'profile-images';
}

export interface DocumentUpload extends StorageFileUpload {
  userId: string;
  documentType: string;
  bucket: 'documents';
}

// Real-time subscriptions
export interface ChatSubscription {
  channel: string;
  chatId: string;
  userId: string;
  onMessage: (payload: RealtimePostgresChanges) => void;
  onPresence: (payload: RealtimePresence) => void;
}

export interface UserStatusSubscription {
  channel: string;
  userId: string;
  onStatusChange: (payload: RealtimePostgresChanges) => void;
}

// Analytics events
export interface SupabaseAnalyticsEvent {
  event_name: string;
  user_id?: string;
  properties?: Record<string, unknown>;
  timestamp?: string;
}

// Custom RPC function types
export interface GetNearbyPostsParams {
  user_region: string;
  subject_filter?: string;
  post_type?: 'TEACHER' | 'STUDENT';
  radius_km?: number;
  limit_count?: number;
}

export interface GetUserStatsParams {
  user_id: string;
}

export interface GetChatParticipantsParams {
  chat_id: string;
}

// Stored procedure return types
export interface NearbyPostsResult {
  id: string;
  title: string;
  description: string;
  user_name: string;
  distance_km: number;
  hourly_rate: number;
  created_at: string;
}

export interface UserStatsResult {
  total_posts: number;
  active_posts: number;
  total_chats: number;
  completed_appointments: number;
  average_rating: number;
}

// Policy types for RLS
export interface RLSPolicy {
  name: string;
  table: string;
  command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  expression: string;
  check?: string;
}

// Configuration types
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
  options?: {
    auth?: {
      detectSessionInUrl?: boolean;
      persistSession?: boolean;
      autoRefreshToken?: boolean;
    };
    realtime?: {
      params?: Record<string, string>;
      headers?: Record<string, string>;
    };
    global?: {
      headers?: Record<string, string>;
    };
  };
}