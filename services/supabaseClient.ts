import { createClient } from '@supabase/supabase-js';

// Helper to safely get env vars from either process.env (bundler) or window.process.env (runtime injection)
const getEnv = (key: string) => {
  // Check standard process.env
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  // Check window.process.env (often used in simple setups or legacy polyfills)
  if (typeof window !== 'undefined' && (window as any).process?.env?.[key]) {
    return (window as any).process.env[key];
  }
  return undefined;
};

const supabaseUrl = getEnv('REACT_APP_SUPABASE_URL');
const supabaseKey = getEnv('REACT_APP_SUPABASE_ANON_KEY');

// Check if configured correctly (not empty and not placeholders)
export const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseKey && 
  supabaseUrl !== 'https://your-project-id.supabase.co' && 
  !supabaseUrl.includes('placeholder') &&
  supabaseKey !== 'your_anon_key_here' &&
  supabaseKey !== 'placeholder';

// Create client with fallback values to prevent crash on init, but usage will be guarded
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseKey || 'placeholder'
);