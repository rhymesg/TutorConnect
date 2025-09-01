import { createBrowserClient, createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

import type { Database } from '@/types/supabase';

// Client-side Supabase client for components
export const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

// Server-side Supabase client for server components
export const createServerClient = () => {
  const cookieStore = cookies();
  
  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
};

// Middleware Supabase client for route handlers and middleware
export const createMiddlewareClient = (request: any, response: any) => {
  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );
};

// Admin Supabase client with service role key (server-only)
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Storage bucket names
export const STORAGE_BUCKETS = {
  PROFILE_IMAGES: 'profile-images',
  DOCUMENTS: 'documents',
  CHAT_FILES: 'chat-files',
} as const;

// Helper functions for file uploads
export const uploadProfileImage = async (
  supabase: ReturnType<typeof createClient>,
  userId: string,
  file: File
) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.PROFILE_IMAGES)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload profile image: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKETS.PROFILE_IMAGES)
    .getPublicUrl(filePath);

  return {
    path: data.path,
    publicUrl,
    fileName,
  };
};

export const uploadDocument = async (
  supabase: ReturnType<typeof createClient>,
  userId: string,
  file: File,
  documentType: string
) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${documentType}-${userId}-${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${documentType}/${fileName}`;

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.DOCUMENTS)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload document: ${error.message}`);
  }

  // Get public URL (documents bucket should have RLS policies)
  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKETS.DOCUMENTS)
    .getPublicUrl(filePath);

  return {
    path: data.path,
    publicUrl,
    fileName,
    fileSize: file.size,
    mimeType: file.type,
  };
};

// Helper function to get user profile with error handling
export const getUserProfile = async (
  supabase: ReturnType<typeof createClient>,
  userId: string
) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to get user profile: ${error.message}`);
  }

  return data;
};


// Database helper functions with error handling
export const createPost = async (
  supabase: ReturnType<typeof createClient>,
  postData: any
) => {
  const { data, error } = await supabase
    .from('posts')
    .insert([postData])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create post: ${error.message}`);
  }

  return data;
};

export const updatePost = async (
  supabase: ReturnType<typeof createClient>,
  postId: string,
  updates: any
) => {
  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', postId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update post: ${error.message}`);
  }

  return data;
};

export const createChat = async (
  supabase: ReturnType<typeof createClient>,
  chatData: any
) => {
  const { data, error } = await supabase
    .from('chats')
    .insert([chatData])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create chat: ${error.message}`);
  }

  return data;
};

export const sendMessage = async (
  supabase: ReturnType<typeof createClient>,
  messageData: any
) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([messageData])
    .select(`
      *,
      sender:users(id, name, profileImage),
      appointment:appointments(id, dateTime, location, status)
    `)
    .single();

  if (error) {
    throw new Error(`Failed to send message: ${error.message}`);
  }

  return data;
};

// Enhanced message sending (simplified - no real-time notifications)
export const sendMessageWithNotifications = async (
  supabase: ReturnType<typeof createClient>,
  messageData: any,
  notifyParticipants: boolean = true
) => {
  const message = await sendMessage(supabase, messageData);
  return message;
};

export const createAppointment = async (
  supabase: ReturnType<typeof createClient>,
  appointmentData: any
) => {
  const { data, error } = await supabase
    .from('appointments')
    .insert([appointmentData])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create appointment: ${error.message}`);
  }

  return data;
};

// Error handling helper
export const handleSupabaseError = (error: any): string => {
  if (error?.message?.includes('duplicate key')) {
    return 'This item already exists.';
  }
  
  if (error?.message?.includes('foreign key')) {
    return 'Referenced item not found.';
  }
  
  if (error?.message?.includes('not found')) {
    return 'Item not found.';
  }
  
  if (error?.code === 'PGRST116') {
    return 'No data found.';
  }
  
  return error?.message || 'An unexpected error occurred.';
};

// Type-safe query builder helpers
export const buildPostQuery = (supabase: ReturnType<typeof createClient>) => {
  return supabase
    .from('posts')
    .select(`
      *,
      user:users(id, name, profile_image, region),
      _count:chats(count)
    `);
};

export const buildChatQuery = (supabase: ReturnType<typeof createClient>) => {
  return supabase
    .from('chats')
    .select(`
      *,
      participants:chat_participants(
        *,
        user:users(id, name, profile_image)
      ),
      recent_message:messages(
        content,
        sent_at,
        type,
        sender:users(name)
      )
    `);
};

export const buildUserQuery = (supabase: ReturnType<typeof createClient>) => {
  return supabase
    .from('users')
    .select(`
      *,
      _count:posts(count)
    `);
};