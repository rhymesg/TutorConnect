import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

// Client-side Supabase client for components
export const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

// Create a singleton instance for client-side use
export const supabase = createClient();