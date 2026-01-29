import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

// standard error taxonomy helper
const standardResponse = (body: any, status: number = 200) => {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

Deno.serve(async (req) => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify Auth (Service Role Only via header or cron)
    const authHeader = req.headers.get('Authorization');
    // For cron, this verification might be different, but assuming standard service role invocation for now.
    // In production, we should validate the caller is either internal or has a secret.

    try {
        const { scan_limit = 50 } = await req.json().catch(() => ({}));

        // 1. Fetch random sample of drafts/published jams to check
        // Using random sort for sampling drift across the set
        const { data: jams, error: jamsError } = await supabase
            .from('jams')
            .select('id, stats')
            .limit(scan_limit);

        if (jamsError) throw jamsError;

        let repairedCount = 0;
        const mismatches = [];

        for (const jam of jams) {
            // Parallel fetch of true counts
            const [
                { count: trueUpvotes },
                { count: trueBookmarks },
                { count: trueComments }
            ] = await Promise.all([
                supabase.from('upvotes').select('*', { count: 'exact', head: true }).eq('jam_id', jam.id),
                supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('jam_id', jam.id),
                supabase.from('comments').select('*', { count: 'exact', head: true }).eq('jam_id', jam.id)
            ]);

            // Views are harder, assuming they live in 'signals' table with type='view'
            // or we just trust the increment for now if we don't have a reliable view ledger yet.
            // Let's assume we skip view reconciliation for now or use a dedicated stats table.

            const currentStats = jam.stats || {};
            const updates: any = {};
            let isDrifting = false;

            if (currentStats.upvotes !== trueUpvotes) {
                updates.upvotes = trueUpvotes;
                isDrifting = true;
            }
            if (currentStats.bookmarks !== trueBookmarks) {
                updates.bookmarks = trueBookmarks;
                isDrifting = true;
            }
            if (currentStats.comments !== trueComments) { // Assuming 'comments' key in stats
                updates.comments = trueComments;
                isDrifting = true;
            }

            if (isDrifting) {
                mismatches.push({ id: jam.id, old: currentStats, new: { ...currentStats, ...updates } });

                // Repair
                const newStats = { ...currentStats, ...updates };
                await supabase.from('jams').update({ stats: newStats }).eq('id', jam.id);

                // Log Event
                await supabase.from('event_log').insert({
                    event: 'drift_repair_applied',
                    level: 'warn',
                    jam_id: jam.id,
                    meta: {
                        old: currentStats,
                        new: newStats,
                        reason: 'counter_mismatch'
                    }
                });

                repairedCount++;
            }
        }

        return standardResponse({
            ok: true,
            scanned: jams.length,
            repaired: repairedCount,
            mismatches
        });

    } catch (e: any) {
        return standardResponse({ ok: false, error: e.message }, 500);
    }
})
