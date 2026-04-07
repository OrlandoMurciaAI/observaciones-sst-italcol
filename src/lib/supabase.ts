import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found in environment variables');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

/**
 * Creates a Supabase client with an optional access token.
 * Use this in API routes to perform operations as the authenticated user.
 */
export function getSupabase(accessToken?: string) {
    if (!accessToken) return supabase;
    
    return createClient(
        supabaseUrl || '',
        supabaseAnonKey || '',
        {
            global: {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        }
    );
}

/**
 * Helper to handle Supabase errors in a consistent way
 */
export async function handleSupabaseError(promise: Promise<any>) {
  try {
    const { data, error } = await promise;
    if (error) throw error;
    return data;
  } catch (e: any) {
    console.error('Supabase Error:', e.message || e);
    throw e;
  }
}
