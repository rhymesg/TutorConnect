export interface ChatParticipant {
  id: string;
  chatId: string;
  userId: string;
  joinedAt: Date;
  leftAt?: Date;
  isActive: boolean;
  unreadCount: number;
  lastReadAt?: Date;
  user: {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
    isActive: boolean;
    lastActive?: Date;
    teacherSessions?: number;
    teacherStudents?: number;
    studentSessions?: number;
    studentTeachers?: number;
  };
}

export interface Message {
  id: string;
  content: string;
  type: 'TEXT' | 'APPOINTMENT_REQUEST' | 'APPOINTMENT_RESPONSE' | 'SYSTEM_MESSAGE';
  chatId: string;
  senderId: string;
  isEdited: boolean;
  editedAt?: Date;
  sentAt: Date;
  appointmentId?: string;
  sender: {
    id: string;
    name: string;
    profileImage?: string;
  };
  appointment?: {
    id: string;
    dateTime: Date;
    location: string;
    status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
    hourlyRate?: number;
    duration?: number; // in minutes
    subject?: string;
  };
}

export interface Chat {
  id: string;
  relatedPostId?: string;
  isActive: boolean;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  participants: ChatParticipant[];
  messages?: Message[];
  relatedPost?: {
    id: string;
    title: string;
    type: 'TEACHER' | 'STUDENT';
    subject: string;
    hourlyRate?: number;
    user: {
      id: string;
      name: string;
      profileImage?: string;
      teacherSessions?: number;
      teacherStudents?: number;
      studentSessions?: number;
      studentTeachers?: number;
    };
  };
  lastMessage?: Message;
  unreadCount: number;
}

export interface TypingIndicator {
  chatId: string;
  userId: string;
  userName: string;
  timestamp: Date;
}

export interface MessageStatus {
  messageId: string;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: Date;
}

export interface ChatFilter {
  type: 'all' | 'unread' | 'archived';
  search?: string;
}

export interface MessageAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  type: 'image' | 'document' | 'audio' | 'video';
}

export interface ChatListItem extends Chat {
  otherParticipant: ChatParticipant;
  displayName: string;
  displayImage?: string;
  isOnline: boolean;
  lastSeenText: string;
}

// Hook return types
export interface UseChatReturn {
  chats: ChatListItem[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  markAsRead: (chatId: string) => Promise<void>;
  searchChats: (query: string) => void;
  filterChats: (filter: ChatFilter) => void;
}

export interface UseMessagesReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  sendMessage: (content: string, type?: Message['type']) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  loadMore: () => void;
  markAsRead: () => void;
}

export interface UseTypingReturn {
  typingUsers: TypingIndicator[];
  startTyping: () => void;
  stopTyping: () => void;
  isTyping: boolean;
}

export interface ChatState {
  activeChatId: string | null;
  sidebarOpen: boolean;
  searchQuery: string;
  filter: ChatFilter;
  isConnected: boolean;
}