import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

// Client-side Supabase client for components
export const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  );
};

// Create a singleton instance for client-side use
export const supabase = createClient();

// Real-time subscription helpers
export const subscribeToChat = async (
  supabase: ReturnType<typeof createClient>,
  chatId: string,
  onMessage: (payload: any) => void,
  onMessageUpdate?: (payload: any) => void,
  onMessageDelete?: (payload: any) => void
) => {
  const channel = supabase.channel(`chat:${chatId}`, {
    config: {
      broadcast: { self: false }
    }
  });
  
  console.log('Creating channel for chat:', chatId);
  
  // Subscribe to all messages and filter on client side
  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
    },
    (payload) => {
      console.log('Received INSERT event:', payload);
      console.log('Full payload.new object:', payload.new);
      console.log('Available fields:', payload.new ? Object.keys(payload.new) : 'no payload.new');
      
      // Try different possible field names
      const messageChatId = payload.new?.chatId || payload.new?.chat_id || payload.new?.chatid;
      
      console.log('Filter check:', {
        payloadChatId: payload.new?.chatId,
        payloadChatId_snake: payload.new?.chat_id,
        payloadChatId_lower: payload.new?.chatid,
        actualChatId: messageChatId,
        expectedChatId: chatId,
        matches: messageChatId === chatId
      });
      
      // Filter on client side with flexible field name matching
      if (payload.new && messageChatId === chatId) {
        console.log('Calling onMessage with payload');
        onMessage(payload);
      } else {
        console.log('Message filtered out - different chat or no chat ID found');
      }
    }
  );

  if (onMessageUpdate) {
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
      },
      (payload) => {
        console.log('Received UPDATE event:', payload);
        // Filter on client side
        if (payload.new && payload.new.chatId === chatId) {
          onMessageUpdate(payload);
        }
      }
    );
  }

  if (onMessageDelete) {
    channel.on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'messages',
      },
      (payload) => {
        console.log('Received DELETE event:', payload);
        // Filter on client side
        if (payload.old && payload.old.chatId === chatId) {
          onMessageDelete(payload);
        }
      }
    );
  }

  const status = await channel.subscribe();
  console.log('Channel subscription status:', status);
  
  return channel;
};

export const subscribeToTyping = (
  supabase: ReturnType<typeof createClient>,
  chatId: string,
  onTypingChange: (payload: any) => void
) => {
  return supabase
    .channel(`typing:${chatId}`)
    .on('broadcast', { event: 'typing' }, onTypingChange)
    .subscribe();
};

export const broadcastTyping = (
  supabase: ReturnType<typeof createClient>,
  chatId: string,
  userId: string,
  userName: string,
  isTyping: boolean
) => {
  return supabase
    .channel(`typing:${chatId}`)
    .send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId,
        userName,
        isTyping,
        timestamp: Date.now(),
      },
    });
};

export const subscribeToPresence = (
  supabase: ReturnType<typeof createClient>,
  chatId: string,
  userId: string,
  userName: string,
  onPresenceChange: (payload: any) => void
) => {
  const channel = supabase.channel(`presence:${chatId}`);
  
  channel
    .on('presence', { event: 'sync' }, onPresenceChange)
    .on('presence', { event: 'join' }, onPresenceChange)
    .on('presence', { event: 'leave' }, onPresenceChange)
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          userId,
          userName,
          onlineAt: new Date().toISOString(),
        });
      }
    });

  return channel;
};

export const subscribeToReadReceipts = (
  supabase: ReturnType<typeof createClient>,
  chatId: string,
  onReadReceiptChange: (payload: any) => void
) => {
  return supabase
    .channel(`read-receipts:${chatId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_participants',
        filter: `chatId=eq.${chatId}`,
      },
      onReadReceiptChange
    )
    .subscribe();
};