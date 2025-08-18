// Real-time messaging hooks
export { useRealtimeConnection } from './useRealtimeConnection';
export { useRealtimeMessages } from './useRealtimeMessages';
export { useRealtimeChat } from './useRealtimeChat';
export { useTypingIndicator } from './useTypingIndicator';
export { useUserPresence } from './useUserPresence';

// Existing hooks
export { useAuth } from './useAuth';
export { useApiCall } from './useApiCall';
export { useMessages } from './useMessages';

// Export types
export type { ConnectionStatus, NetworkStatus, ConnectionOptions, ConnectionState } from './useRealtimeConnection';
export type { TypingUser, TypingState, UseTypingIndicatorOptions } from './useTypingIndicator';
export type { PresenceStatus, PresenceUser, PresenceState, UseUserPresenceOptions } from './useUserPresence';
export type { UIMessage, UseRealtimeMessagesOptions, MessageState as RealtimeMessageState } from './useRealtimeMessages';
export type { RealtimeParticipant, ChatState, ChatEvent, UseRealtimeChatOptions } from './useRealtimeChat';