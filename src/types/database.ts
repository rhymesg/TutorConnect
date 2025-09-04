// Database types generated from Prisma schema
import type { 
  User, 
  Post, 
  Chat, 
  ChatParticipant, 
  Message, 
  Appointment, 
  Document, 
  InfoRequest,
  Gender,
  PrivacySetting,
  PostType,
  PostStatus,
  Subject,
  AgeGroup,
  AppointmentStatus,
  DocumentType,
  VerificationStatus,
  MessageType,
  NorwegianRegion
} from '@prisma/client';

// Re-export Prisma types
export type {
  User,
  Post,
  Chat,
  ChatParticipant,
  Message,
  Appointment,
  Document,
  InfoRequest,
  Gender,
  PrivacySetting,
  PostType,
  PostStatus,
  Subject,
  AgeGroup,
  AppointmentStatus,
  DocumentType,
  VerificationStatus,
  MessageType,
  NorwegianRegion,
};

// Extended types with relations
export interface UserWithProfile extends User {
  posts: Post[];
  documents: Document[];
  _count?: {
    posts: number;
    sentMessages: number;
    documents: number;
  };
}

export interface PostWithUser extends Post {
  user: User;
  chats: Chat[];
  _count?: {
    chats: number;
  };
}

export interface PostWithDetails extends Post {
  user: {
    id: string;
    name: string;
    profileImage: string | null;
    isActive: boolean;
    region: NorwegianRegion;
    teacherSessions?: number;
    teacherStudents?: number;
    studentSessions?: number;
    studentTeachers?: number;
  };
  _count?: {
    chats?: number;
    messages?: number;
  };
  viewCount?: number;
  price?: number; // Computed field for display
}

export interface ChatWithParticipants extends Chat {
  participants: (ChatParticipant & {
    user: User;
  })[];
  messages: Message[];
  relatedPost?: Post | null;
  _count?: {
    messages: number;
  };
}

export interface MessageWithSender extends Message {
  sender: {
    id: string;
    name: string;
    profileImage: string | null;
  };
  appointment?: Appointment | null;
}

export interface AppointmentWithChat extends Appointment {
  chat: {
    id: string;
    participants: (ChatParticipant & {
      user: {
        id: string;
        name: string;
        profileImage: string | null;
      };
    })[];
  };
}

export interface DocumentWithUser extends Document {
  user: {
    id: string;
    name: string;
  };
}

// Search and filter types
export interface PostFilters {
  type?: PostType;
  subject?: Subject;
  ageGroups?: AgeGroup[];
  location?: NorwegianRegion;
  minRate?: number;
  maxRate?: number;
  search?: string;
  sortBy?: 'createdAt' | 'hourlyRate' | 'rating';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  includePaused?: boolean;
}

export interface UserFilters {
  region?: NorwegianRegion;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

// Statistics types
export interface UserStats {
  totalPosts: number;
  activePosts: number;
  totalChats: number;
  totalAppointments: number;
  completedAppointments: number;
  rating?: number;
  responseTime?: number; // in minutes
}

export interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  activePosts: number;
  totalChats: number;
  totalAppointments: number;
  usersByRegion: Record<NorwegianRegion, number>;
  postsBySubject: Record<Subject, number>;
}

// Creation and update types
export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  region: NorwegianRegion;
  postalCode?: string;
  gender?: Gender;
  birthYear?: number;
  school?: string;
  degree?: string;
  certifications?: string;
  bio?: string;
}

export interface UpdateUserData {
  name?: string;
  region?: NorwegianRegion;
  postalCode?: string;
  gender?: Gender;
  birthYear?: number;
  school?: string;
  degree?: string;
  certifications?: string;
  bio?: string;
  privacyGender?: PrivacySetting;
  privacyAge?: PrivacySetting;
  privacyDocuments?: PrivacySetting;
  privacyContact?: PrivacySetting;
}

export interface CreatePostData {
  type: PostType;
  subject: Subject;
  ageGroups: AgeGroup[];
  title: string;
  description: string;
  availableDays: string[];
  availableTimes: string[];
  preferredSchedule?: string;
  location: NorwegianRegion;
  specificLocation?: string;
  hourlyRate?: number;
  hourlyRateMin?: number;
  hourlyRateMax?: number;
}

export interface CreateChatData {
  relatedPostId?: string;
  participantIds: string[];
  initialMessage?: string;
}

export interface CreateMessageData {
  content: string;
  type?: MessageType;
  chatId: string;
  appointmentId?: string;
}

export interface CreateAppointmentData {
  chatId: string;
  dateTime: Date;
  location: string;
  specificLocation?: string;
  duration?: number;
  notes?: string;
  reminderTime?: number;
}

// Utility types for form handling
export type PostFormData = Omit<CreatePostData, 'userId'>;
export type UserFormData = Omit<CreateUserData, 'password'>;
export type MessageFormData = Omit<CreateMessageData, 'chatId'>;

// Pagination types
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export type PaginatedPosts = PaginatedResult<PostWithDetails>;
export type PaginatedUsers = PaginatedResult<UserWithProfile>;
export type PaginatedMessages = PaginatedResult<MessageWithSender>;