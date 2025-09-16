// Enhanced Supabase client with proper configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

// Enhanced client configuration for better performance and reliability
const supabaseConfig = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' as const,
  },
  global: {
    headers: {
      'X-Client-Info': 'smart-shift-tracker@1.0.0',
    },
  },
  db: {
    schema: 'public' as const,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
};

// Main client for frontend operations (uses anon key)
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, supabaseConfig);

// Admin client for server-side operations (uses service role key)
export const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY 
  ? createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      ...supabaseConfig,
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// Helper functions for enhanced data operations
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (attempt === maxRetries - 1) break;
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
    }
  }
  
  throw lastError!;
};

// Enhanced query with automatic retry and error handling
/* eslint-disable @typescript-eslint/no-explicit-any */
export const enhancedQuery = {
  async select<T>(
    table: string,
    select: string = '*',
    filters?: Record<string, unknown>
  ) {
    return withRetry(async () => {
  let query: any = (supabase as any).from(table).select(select);
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as T[];
    });
  },

  async insert<T>(table: string, data: Partial<T> | Partial<T>[]): Promise<unknown[]> {
    return withRetry(async () => {
      const { data: result, error } = await (supabase as any)
        .from(table)
        .insert(data)
        .select();
      
      if (error) throw error;
      return (result ?? []) as unknown[];
    });
  },

  async update<T>(table: string, data: Partial<T>, id: string) {
    return withRetry(async () => {
      const { data: result, error } = await (supabase as any)
        .from(table)
        .update(data)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return result;
    });
  },

  async delete(table: string, id: string) {
    return withRetry(async () => {
      const { error } = await (supabase as any)
        .from(table)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    });
  }
};
/* eslint-enable @typescript-eslint/no-explicit-any */

// Real-time subscription helpers
export const createRealtimeSubscription = (
  table: string,
  callback: (payload: unknown) => void,
  filters?: string
) => {
  let channel = supabase.channel(`realtime:${table}`);
  
  if (filters) {
    channel = channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table,
      filter: filters
    }, callback);
  } else {
    channel = channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table
    }, callback);
  }
  
  return channel.subscribe();
};