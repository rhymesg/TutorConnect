# Real-time Messaging Implementation

This document describes the comprehensive real-time messaging system implemented for TutorConnect, featuring WebSocket connections, optimistic UI updates, offline support, and Norwegian localization.

## Architecture Overview

The real-time messaging system consists of several interconnected components:

### Core Hooks

1. **useRealtimeConnection** - Connection management and recovery
2. **useRealtimeMessages** - Message handling with optimistic updates
3. **useRealtimeChat** - Chat room subscriptions and management
4. **useTypingIndicator** - Debounced typing status
5. **useUserPresence** - Online/offline status tracking

### Supporting Components

- **MessageQueue** - Offline message queue with retry logic
- **MessageBubble** - Enhanced message component with status indicators
- **ConversationView** - Updated chat interface

## Features

### 1. Connection Management (useRealtimeConnection)

- **Automatic retry with exponential backoff**
- **Network status detection** (online/offline/slow)
- **Connection health monitoring** with heartbeat
- **Performance metrics** and analytics
- **Norwegian timezone support**

```typescript
const {
  connectionState,
  isConnected,
  connect,
  disconnect,
  reconnect,
  getChannel,
  formatNorwegianTime
} = useRealtimeConnection({
  enableRetry: true,
  maxRetries: 5,
  enableNetworkDetection: true,
  heartbeatInterval: 30000
});
```

### 2. Message Queue (MessageQueue)

- **Optimistic UI updates** for instant feedback
- **Offline message storage** with local persistence
- **Automatic retry** with exponential backoff
- **Batch processing** for efficiency
- **Event-driven architecture**

```typescript
const queue = new MessageQueue({
  maxRetries: 3,
  persistToStorage: true,
  batchSize: 5
});

// Add message for optimistic update
const tempId = queue.addMessage(messageData);
```

### 3. Real-time Messages (useRealtimeMessages)

- **Optimistic message sending** with rollback on failure
- **Message pagination** with virtual scrolling support
- **Read receipts** and delivery status
- **Message search** and filtering
- **Analytics tracking**

```typescript
const {
  messages,
  loading,
  sendMessage,
  editMessage,
  deleteMessage,
  retryMessage,
  loadMore,
  analytics
} = useRealtimeMessages({
  chatId,
  enableOptimisticUpdates: true,
  enableAnalytics: true
});
```

### 4. Chat Management (useRealtimeChat)

- **Real-time participant management**
- **Typing indicators** with debouncing
- **Presence tracking** (online/away/busy/offline)
- **Appointment integration**
- **Chat statistics**
- **Event system** for custom handling

```typescript
const {
  chat,
  participants,
  messages,
  sendMessage,
  startTyping,
  stopTyping,
  typingUsers,
  onlineUsers,
  statistics,
  addEventListener
} = useRealtimeChat({
  chatId,
  enablePresence: true,
  enableTyping: true,
  enableAppointments: true
});
```

### 5. Typing Indicators (useTypingIndicator)

- **Debounced typing detection** (configurable delay)
- **Automatic timeout** to prevent stuck indicators
- **Performance throttling** to reduce network calls
- **Norwegian message formatting**

```typescript
const {
  isTyping,
  typingUsers,
  startTyping,
  stopTyping,
  handleTyping,
  getTypingText
} = useTypingIndicator({
  chatId,
  debounceMs: 1000,
  autoStopMs: 5000
});
```

### 6. User Presence (useUserPresence)

- **Multi-status presence** (online/away/busy/offline)
- **Idle detection** with configurable timeouts
- **Location tracking** (current chat/page)
- **Device detection** (desktop/mobile/tablet)
- **Global vs chat-specific presence**

```typescript
const {
  currentStatus,
  isOnline,
  users,
  onlineUsers,
  setStatus,
  goOnline,
  goAway,
  goBusy,
  goOffline,
  getUserPresence,
  formatLastSeen
} = useUserPresence({
  globalPresence: true,
  idleTimeoutMs: 300000,
  enableLocationTracking: true
});
```

## Error Handling & Recovery

### Connection Recovery

- **Exponential backoff** with jitter for retry delays
- **Maximum retry limits** to prevent infinite loops
- **Network status monitoring** for intelligent reconnection
- **Graceful degradation** when WebSocket fails

### Message Recovery

- **Optimistic UI rollback** on send failure
- **Manual retry buttons** for failed messages
- **Queue persistence** across browser sessions
- **Background sync** when connection restored

### User Feedback

- **Visual status indicators** for connection state
- **Message status icons** (sending/sent/delivered/read/failed)
- **Error messages** with retry options
- **Loading states** and progress indicators

## Performance Optimizations

### Network Efficiency

- **Message batching** to reduce API calls
- **Debounced typing indicators** (max 1 per 3 seconds)
- **Heartbeat optimization** (configurable intervals)
- **Connection pooling** for multiple chats

### UI Performance

- **Virtual scrolling** for large message lists
- **React.memo** for component optimization
- **Efficient re-renders** with proper dependency arrays
- **Message caching** with size limits

### Storage Management

- **Local storage persistence** for offline messages
- **Automatic cleanup** of old cached data
- **Compression support** for large message queues
- **Memory leak prevention**

## Norwegian Localization

### Timezone Support

All timestamps are formatted using Norwegian timezone (Europe/Oslo):

```typescript
const formatNorwegianTime = (date: Date) => {
  return new Intl.DateTimeFormat('nb-NO', {
    timeZone: 'Europe/Oslo',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};
```

### Message Formatting

- **Typing indicators**: "skriver..." / "2 skriver..."
- **Status messages**: "Tilgjengelig" / "Borte" / "Opptatt"
- **Time formatting**: "5 min siden" / "2 timer siden"
- **Error messages**: "Kunne ikke sende" / "Prøv igjen"

## Security Considerations

### Authentication

- **JWT token validation** for all real-time connections
- **User access verification** for chat participation
- **Channel isolation** by chat ID

### Data Protection

- **Message encryption** (integration with SEC-002)
- **Privacy settings** respected in presence
- **GDPR compliance** for data storage
- **Rate limiting** for abuse prevention

## Usage Examples

### Basic Chat Implementation

```typescript
import { useRealtimeChat } from '@/hooks';

function ChatPage({ chatId }: { chatId: string }) {
  const {
    chat,
    messages,
    loading,
    sendMessage,
    typingUsers,
    isConnected
  } = useRealtimeChat({
    chatId,
    enablePresence: true,
    enableTyping: true
  });

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage(content);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="messages">
        {messages.map(message => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.senderId === user.id}
          />
        ))}
      </div>
      
      {typingUsers.length > 0 && (
        <div>{typingUsers.map(u => u.name).join(', ')} skriver...</div>
      )}
      
      {!isConnected && (
        <div className="error">Frakoblet - prøver å koble til...</div>
      )}
      
      <MessageComposer onSendMessage={handleSendMessage} />
    </div>
  );
}
```

### Global Presence Tracking

```typescript
import { useUserPresence } from '@/hooks';

function PresenceIndicator({ userId }: { userId: string }) {
  const { getUserPresence, formatLastSeen } = useUserPresence({
    globalPresence: true
  });

  const presence = getUserPresence(userId);
  
  if (!presence) return null;

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${getStatusColor(presence.status)}`} />
      <span className="text-sm">
        {presence.status === 'online' 
          ? 'Tilgjengelig' 
          : formatLastSeen(presence.lastSeen)
        }
      </span>
    </div>
  );
}
```

## Testing

### Unit Tests

- **Hook behavior** with mock WebSocket connections
- **Message queue operations** with various scenarios
- **Error handling** and recovery mechanisms
- **Norwegian formatting** functions

### Integration Tests

- **End-to-end message flow** from send to receive
- **Connection failure** and recovery scenarios
- **Multi-user chat** interactions
- **Offline/online transitions**

### Performance Tests

- **Connection latency** measurements
- **Message throughput** under load
- **Memory usage** with large message lists
- **Battery impact** on mobile devices

## Monitoring & Analytics

### Connection Metrics

- **Connection success rate**
- **Average latency** and response times
- **Reconnection frequency**
- **Network status distribution**

### Message Metrics

- **Send success rate**
- **Delivery confirmation rate**
- **Retry attempts** and failure causes
- **Queue processing efficiency**

### User Behavior

- **Typing patterns** and frequency
- **Presence status changes**
- **Chat engagement** metrics
- **Feature usage** statistics

## Troubleshooting

### Common Issues

1. **Connection failures**
   - Check network connectivity
   - Verify authentication tokens
   - Review server logs for errors

2. **Message delivery issues**
   - Check message queue status
   - Verify chat permissions
   - Review retry attempts

3. **Performance problems**
   - Monitor memory usage
   - Check message cache size
   - Review component re-render frequency

### Debug Tools

- **Connection state inspector** in browser dev tools
- **Message queue viewer** for pending messages
- **Real-time event logs** for troubleshooting
- **Performance metrics** dashboard

## Future Enhancements

### Planned Features

- **Voice message support** with audio indicators
- **File sharing** with drag-and-drop
- **Message reactions** with emoji picker
- **Message threading** for organized discussions
- **Push notifications** for background alerts

### Technical Improvements

- **WebRTC integration** for voice/video calls
- **Message compression** for bandwidth optimization
- **Advanced caching** strategies
- **Improved analytics** and monitoring
- **Better error recovery** mechanisms

## API Integration

The real-time system integrates with the following API endpoints:

- **POST /api/chat/realtime** - Connection management
- **PUT /api/chat/realtime** - Typing indicators
- **GET /api/chat/realtime** - Chat status
- **POST /api/messages** - Send messages
- **PUT /api/messages/[id]** - Edit messages
- **DELETE /api/messages/[id]** - Delete messages
- **POST /api/messages/typing** - Typing status
- **POST /api/messages/read-receipts** - Read receipts

## Deployment Notes

### Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Setup

Ensure the following tables exist:
- `chats` - Chat room information
- `chat_participants` - Chat membership
- `messages` - Message content and metadata
- `users` - User profiles and presence

### Real-time Policies

Configure Supabase RLS policies for:
- Chat message access by participants
- Typing indicator broadcasting
- Presence updates
- Read receipt tracking

This comprehensive real-time messaging system provides a robust, scalable, and user-friendly chat experience optimized for the Norwegian market and TutorConnect's specific needs.