import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2'

export async function checkRateLimit(
  supabase: SupabaseClient,
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  // 1. Get current count
  // Using a simple row per key strategy. 
  // Key should be composed of "action:ip_or_user:window_bucket"

  // Calculate window bucket (e.g. current minute)
  const now = new Date();
  const windowStart = new Date(now.getTime() - (now.getTime() % (windowSeconds * 1000)));

  const fullKey = `${key}:${windowStart.toISOString()}`;

  // Read current
  const { data: row } = await supabase
    .from('rate_limits')
    .select('count')
    .eq('key', fullKey)
    .maybeSingle();

  const current = row?.count || 0;

  if (current >= limit) {
    return { allowed: false, remaining: 0 };
  }

  // Increment (Upsert)
  // This isn't perfectly atomic without a stored procedure, but good enough for soft limits.
  const { error } = await supabase
    .from('rate_limits')
    .upsert(
      { key: fullKey, count: current + 1, window_start: windowStart.toISOString() },
      { onConflict: 'key' }
    );

  // Clean up old windows occasionally (optional / cron job typically)

  return { allowed: true, remaining: limit - (current + 1) };
}
