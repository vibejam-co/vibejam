import { createClient } from '@supabase/supabase-js'

// Canonical Vite access: MUST use literal import.meta.env for build-time injection
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
        flowType: 'implicit',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    },
});

// Debug Hook: Expose client for console verification (DEV only)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
    (window as any).supabase = supabase;
    console.log('[Debug] window.supabase attached');
}
