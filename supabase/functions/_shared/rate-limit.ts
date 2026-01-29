import { createClient } from 'jsr:@supabase/supabase-js@2'

export async function checkRateLimit(
  sb: any,
  key: string,
  limit: number,
  windowSeconds: number
) {
  const { data, error } = await sb.rpc('check_rate_limit', {
    p_key: key,
    p_limit: limit,
    p_window: `${windowSeconds} seconds`
  });

  if (error) {
    console.error('Rate limit error:', error);
    return { allowed: true }; // Fail open
  }

  return { allowed: data };
}
