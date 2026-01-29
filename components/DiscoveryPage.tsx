import React, { useState, useMemo } from 'react';
import { AppProject } from '../types';
import { backend } from '../lib/backend';
import Badge from '../components/Badge';
import { FEATURE_FLAGS } from '../constants';

const Icons = {
  Trending: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  New: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Revenue: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20V10M18 20V4M6 20v-4" />
    </svg>
  ),
  Picks: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  All: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
};

interface DiscoveryPageProps {
  onSelectApp: (app: AppProject) => void;
  onSelectCreator: (creator: AppProject['creator']) => void;
  onNavigateLeaderboard?: () => void;
}

const DiscoveryPage: React.FC<DiscoveryPageProps> = ({ onSelectApp, onSelectCreator, onNavigateLeaderboard }) => {
  const [mode, setMode] = useState<'trending' | 'new' | 'revenue' | 'picks'>('trending');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [apps, setApps] = useState<AppProject[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchFeed = async () => {
      try {
        const jams = await backend.getDiscoveryFeed({ mode });
        const mapped = jams.map(j => ({
          id: j.id,
          name: j.name,
          description: j.tagline || j.description || '',
          category: j.category,
          thumbnailUrl: j.media?.heroImageUrl || '',
          screenshot: j.media?.heroImageUrl || '',
          mediaType: 'image' as const,
          creator: {
            name: j.creator?.display_name || 'Maker',
            handle: '@' + (j.creator?.handle || 'maker'),
            avatar: j.creator?.avatar_url || '',
            type: j.team_type === 'team' ? 'Team' : 'Solo Founder'
          },
          stats: {
            revenue: j.mrr_bucket || '$0',
            isRevenuePublic: j.mrr_visibility === 'public',
            upvotes: j.stats?.upvotes || 0,
            daysLive: 0,
            views: j.stats?.views || 0,
          },
          vibeTools: j.vibe_tools || [],
          stack: j.tech_stack || []
        }));
        setApps(mapped as any);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, [mode]);

  const filteredApps = useMemo(() => {
    let result = [...apps];
    if (activeCategory !== 'All') {
      result = result.filter(app => app.category === activeCategory);
    }
    if (searchQuery) {
      result = result.filter(app =>
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result;
  }, [activeCategory, searchQuery, apps]);

  return (
    <div className="pt-24 md:pt-32 pb-20 overflow-x-hidden selection:bg-blue-100 selection:text-blue-900">
      <header className="max-w-7xl mx-auto px-4 md:px-6 mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-xl">
          <h1 className="text-[clamp(2.5rem,8vw,4rem)] font-black text-gray-900 tracking-tighter leading-[1.1] mb-4">
            Discover what builders are <span className="whitespace-nowrap">shipping now.</span>
          </h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="bg-white rounded-[32px] md:rounded-[40px] border border-gray-100 shadow-sm overflow-hidden mb-12 md:mb-16">
          {filteredApps.map((app, idx) => (
            <div
              key={app.id}
              onClick={() => onSelectApp(app)}
              className={`group flex items-center p-4 md:p-6 cursor-pointer transition-all hover:bg-gray-50/50 relative ${idx !== filteredApps.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl overflow-hidden shadow-sm border border-gray-50 shrink-0 bg-gray-50 mr-4 md:mr-6">
                <img src={app.thumbnailUrl || app.screenshot} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={app.name} />
              </div>
              <div className="flex-1 min-w-0 pr-2 md:pr-4">
                <h3 className="text-sm md:text-lg font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {app.name}
                </h3>
                <p className="text-xs md:text-sm text-gray-400 truncate mb-2 md:mb-3 font-medium leading-tight">{app.description}</p>
              </div>
              <div className="flex items-center gap-3 md:gap-10 shrink-0">
                <button
                  className="flex flex-col items-center justify-center w-10 h-12 md:w-14 md:h-16 rounded-xl md:rounded-2xl bg-white border border-gray-100 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50/20 active:scale-95 group/upvote"
                  onClick={(e) => { e.stopPropagation(); }}
                >
                  <svg className="w-3 h-3 md:w-4 md:h-4 text-gray-300 group-hover/upvote:text-blue-500 transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l-8 8h16l-8-8z" /></svg>
                  <span className="text-10px md:text-xs font-black text-gray-600 mt-1">{app.stats.upvotes}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DiscoveryPage;
