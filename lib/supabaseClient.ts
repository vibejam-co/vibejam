import { createClient } from '@supabase/supabase-js'

// Canonical Vite access: MUST use literal import.meta.env for build-time injection
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const SUPABASE_URL = supabaseUrl || '';
export const SUPABASE_ANON_KEY = supabaseAnonKey || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

console.log('%c[Supabase] Initializing in REAL mode.', 'color: #3ecf8e; font-weight: bold;');

if (!isSupabaseConfigured) {
    console.error('[Supabase] CRITICAL: Environment variables missing. Production will fail.');
}

// Singleton client instance
// Using implicit flow for client-side SPA - tokens come directly in URL fragment
// PKCE flow requires code_verifier persistence which can fail in some browser/redirect scenarios
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
    auth: {
        // Use PKCE for more reliable session refresh and modern auth flows
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    },
});

// Debug Hook: Expose client for console verification (DEV or ?debug=1)
if (typeof window !== 'undefined') {
    const search = window.location?.search || '';
    const debugEnabled = import.meta.env.DEV || search.includes('debug=1');
    if (debugEnabled) {
        (window as any).supabase = supabase;
        console.log('[Debug] window.supabase attached');
    }
}
