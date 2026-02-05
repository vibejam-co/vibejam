import React, { useEffect, useState } from 'react';
import { FollowSignalItem, FollowSignalSummary, formatSince, loadFollowSignalSurface } from '../../lib/FollowSignalSurface';

type Variant = 'strip' | 'list' | 'profile';

interface FollowSignalSurfaceProps {
  handle?: string | null;
  title: string;
  subtitle?: string;
  variant: Variant;
  limit?: number;
  onOpenJam?: (slug: string) => void;
}

const directionGlyph: Record<FollowSignalItem['direction'], string> = {
  up: '↑',
  flat: '→',
  down: '↓'
};

const FollowSignalSurface: React.FC<FollowSignalSurfaceProps> = ({ handle, title, subtitle, variant, limit = 6, onOpenJam }) => {
  const [summary, setSummary] = useState<FollowSignalSummary>({ items: [], activeCount: 0, totalCount: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!handle) return;
      setLoading(true);
      const data = await loadFollowSignalSurface(handle, limit);
      if (!cancelled) setSummary(data);
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [handle, limit]);

  if (!handle) return null;

  const containerClass = variant === 'strip'
    ? 'mt-10'
    : variant === 'profile'
      ? 'mt-8'
      : 'mt-6';

  const listClass = variant === 'strip'
    ? 'flex gap-4 overflow-x-auto no-scrollbar pb-2'
    : 'space-y-3';

  return (
    <section className={containerClass}>
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">{title}</h3>
          {subtitle && (
            <p className="text-[10px] font-medium text-gray-400">{subtitle}</p>
          )}
        </div>
        {!loading && summary.totalCount > 0 && (
          <span className="text-[9px] uppercase tracking-widest text-gray-300">
            {summary.activeCount} active this week
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-xs text-gray-400">Loading…</div>
      ) : summary.items.length === 0 ? (
        <div className="text-xs text-gray-400">No recent activity from followed builds.</div>
      ) : (
        <div className={listClass}>
          {summary.items.map((item) => {
            const tone = item.direction === 'up'
              ? 'text-gray-900'
              : item.direction === 'flat'
                ? 'text-gray-600'
                : 'text-gray-400';
            const rowClass = variant === 'strip'
              ? 'min-w-[220px] rounded-xl border border-gray-100 px-4 py-3'
              : 'rounded-lg border border-gray-100 px-4 py-3';

            return (
              <button
                key={item.jamId}
                type="button"
                onClick={() => {
                  if (onOpenJam) {
                    onOpenJam(item.slug);
                    return;
                  }
                  if (typeof window !== 'undefined') {
                    window.location.href = `/jam/${item.slug}`;
                  }
                }}
                className={`${rowClass} text-left bg-white/60 hover:bg-white transition-colors ${tone}`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold truncate">{item.name}</div>
                  <div className="text-[10px] font-bold">{directionGlyph[item.direction]}</div>
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-widest text-gray-400 truncate">
                  {item.creatorName}
                </div>
                <div className="mt-2 text-[10px] text-gray-400">{formatSince(item.daysSince)}</div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default FollowSignalSurface;
