
import React, { useState, useMemo } from 'react';
import { AppProject } from '../types';
import Badge from './Badge';

interface DiscoveryFeedProps {
  apps: AppProject[];
  onSelect: (app: AppProject) => void;
  onCreatorClick?: (creator: AppProject['creator']) => void;
  customTitle?: string;
}

const DiscoveryFeed: React.FC<DiscoveryFeedProps> = ({ apps, onSelect, onCreatorClick, customTitle }) => {
  const [filter, setFilter] = useState<'Trending' | 'Today' | 'This Week' | 'Revenue'>('Trending');

  const filteredApps = useMemo(() => {
    let result = [...apps];
    if (filter === 'Revenue') {
      result.sort((a, b) => {
        const revA = parseFloat(a.stats.revenue.replace(/[^0-9.]/g, '')) || 0;
        const revB = parseFloat(b.stats.revenue.replace(/[^0-9.]/g, '')) || 0;
        return revB - revA;
      });
    } else if (filter === 'Today') {
      result = result.filter(a => a.stats.daysLive <= 1);
    } else if (filter === 'This Week') {
      result = result.filter(a => a.stats.daysLive <= 7);
    }
    return result;
  }, [apps, filter]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{customTitle || "Discover What’s Shipping Now"}</h2>
          <p className="text-sm text-gray-400 font-medium leading-relaxed">Live launches from the VibeJam community</p>
        </div>
        <div className="flex items-center gap-2 p-1 bg-gray-100/50 rounded-xl border border-gray-100">
          {(['Trending', 'Today', 'This Week', 'Revenue'] as const).map((f) => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-400 hover:text-gray-900'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        {filteredApps.map((app, idx) => (
          <div 
            key={app.id}
            onClick={() => onSelect(app)}
            className={`group flex items-center p-4 md:p-6 cursor-pointer transition-all hover:bg-gray-50/50 relative ${idx !== filteredApps.length - 1 ? 'border-b border-gray-50' : ''}`}
          >
            {/* Left Edge Accent for Top 3 */}
            {idx < 3 && (
              <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-blue-500/20 rounded-full" />
            )}
            
            {/* 1. Left: Rank & Icon */}
            <div className="flex items-center gap-4 md:gap-8 min-w-[100px] md:min-w-[140px]">
              <span className={`text-xs font-black w-4 text-center ${idx < 3 ? 'text-blue-500' : 'text-gray-300'}`}>{idx + 1}</span>
              <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-2xl overflow-hidden shadow-sm border border-gray-50 shrink-0 bg-gray-50">
                <img src={app.thumbnailUrl || app.screenshot} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={app.name} />
                {app.mediaType === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                    <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Center: Info & Tags */}
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-base md:text-lg font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {app.name}
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-gray-50 text-[9px] font-black text-gray-400 border border-gray-100 uppercase tracking-widest">
                  {app.category}
                </span>
              </div>
              <p className="text-sm text-gray-400 truncate mb-3 font-medium leading-tight">{app.description}</p>
              
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex gap-1">
                  {app.vibeTools.slice(0, 2).map(tool => (
                    <span key={tool} className="px-2 py-1 rounded-lg bg-blue-50/30 text-[9px] font-black text-blue-500 border border-blue-100/50 uppercase tracking-wider">
                      {tool}
                    </span>
                  ))}
                </div>

                <div 
                  onClick={(e) => { e.stopPropagation(); onCreatorClick?.(app.creator); }}
                  className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white transition-all group/creator"
                >
                  <div className="relative">
                    <img src={app.creator.avatar} className="w-5 h-5 rounded-full border border-white shadow-sm" alt={app.creator.name} />
                    {app.creator.badges && app.creator.badges.length > 0 && (
                      <div className="absolute -top-1 -right-1 scale-[0.5] origin-top-right">
                        <Badge type={app.creator.badges[0].type} showTooltip={false} />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-black text-gray-300 group-hover/creator:text-blue-500 transition-colors uppercase tracking-widest">
                    {app.creator.name}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Right: Metrics */}
            <div className="flex items-center gap-6 md:gap-10">
              <div className="hidden md:flex flex-col items-end min-w-[60px]">
                <span className={`text-sm font-black ${app.stats.isRevenuePublic ? 'text-green-500' : 'text-gray-200'}`}>
                  {app.stats.isRevenuePublic ? app.stats.revenue : '—'}
                </span>
                <span className="text-[9px] text-gray-300 uppercase tracking-widest font-black">MRR</span>
              </div>
              
              <button 
                className="flex flex-col items-center justify-center w-12 h-14 md:w-14 md:h-16 rounded-2xl bg-white border border-gray-100 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50/20 active:scale-95 group/upvote"
                onClick={(e) => { e.stopPropagation(); }}
              >
                <svg className="w-4 h-4 text-gray-300 group-hover/upvote:text-blue-500 transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l-8 8h16l-8-8z"/></svg>
                <span className="text-xs font-black text-gray-600 mt-1">{app.stats.upvotes}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiscoveryFeed;
