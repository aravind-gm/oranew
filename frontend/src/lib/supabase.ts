import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Only validate if we're in browser (not during build)
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  const missing = [];
  if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  console.error('[Supabase] ❌ Missing required environment variables:', missing.join(', '));
  console.error('[Supabase] Please add these to your .env.local file');
}

// Create Supabase client with PKCE enabled and better error handling
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: false, // Disabled - prevents automatic token refresh attempts
      autoRefreshToken: false, // Disabled - app uses JWT tokens from backend, not Supabase tokens
      detectSessionInUrl: false, // Disabled - we don't use Supabase auth URLs
      flowType: 'pkce', // Explicitly enable PKCE flow for when OIDC is used
      debug: process.env.NODE_ENV === 'development',
    },
    // Add global fetch configuration for better error handling
    global: {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  }
);

// Export configuration status
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Helper to validate before use
export const validateSupabaseClient = (): boolean => {
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== 'undefined') {
      console.error('[Supabase] Client is not properly configured. Check .env.local for NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
    return false;
  }
  return true;
};

// Utility to check Supabase connection
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    if (!isSupabaseConfigured) {
      console.warn('[Supabase] Not configured');
      return false;
    }
    
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('[Supabase] Connection check failed:', error.message);
      return false;
    }
    console.log('[Supabase] Connection check passed');
    return true;
  } catch (err) {
    console.error('[Supabase] Connection check error:', err);
    return false;
  }
};
