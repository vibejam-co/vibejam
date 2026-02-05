import React, { useState, useMemo, useEffect } from 'react';
import { AppProject } from '../types';
import { backend } from '../lib/backend';
import Badge from '../components/Badge';
import { FEATURE_FLAGS } from '../constants';
import FollowSignalSurface from './follow/FollowSignalSurface';

// Semantic Icon Set (Outline 1.5px stroke)
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
  Creativity: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  ),
  Productivity: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Music: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  ),
  Lifestyle: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 0 10 10H12V2z" /><path d="M12 2a10 10 0 0 1 10 10h-10V2z" opacity="0.3" /><path d="M12 12L2.5 12" /><path d="M12 12l9.5 0" />
    </svg>
  ),
  SaaS: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" /><line x1="6" y1="6" x2="6" y2="6" /><line x1="6" y1="18" x2="6" y2="18" />
    </svg>
  ),
  DevTools: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  AI: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><circle cx="12" cy="11" r="3" />
    </svg>
  )
};

interface DiscoveryPageProps {
  onSelectApp: (app: AppProject) => void;
  onSelectCreator: (creator: AppProject['creator']) => void;
  onNavigateLeaderboard?: () => void;
  currentUserHandle?: string | null;
}

const DiscoveryPage: React.FC<DiscoveryPageProps> = ({ onSelectApp, onSelectCreator, onNavigateLeaderboard, currentUserHandle }) => {
  const [mode, setMode] = useState<'trending' | 'new' | 'revenue' | 'picks'>('trending');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const modes = [
    { id: 'trending', label: 'Trending', icon: Icons.Trending },
    { id: 'new', label: 'New', icon: Icons.New },
    { id: 'revenue', label: 'Revenue', icon: Icons.Revenue },
    { id: 'picks', label: 'Picks', icon: Icons.Picks }
  ];

  const categories = [
    { label: 'All', icon: Icons.All },
    { label: 'Creativity', icon: Icons.Creativity },
    { label: 'Productivity', icon: Icons.Productivity },
    { label: 'Music', icon: Icons.Music },
    { label: 'Lifestyle', icon: Icons.Lifestyle },
    { label: 'SaaS', icon: Icons.SaaS },
    { label: 'Dev Tools', icon: Icons.DevTools },
    { label: 'AI', icon: Icons.AI }
  ];

  const [apps, setApps] = useState<AppProject[]>([]);
  const [loading, setLoading] = useState(true);


  // Initial Fetch
  React.useEffect(() => {
    const fetchFeed = async () => {
      try {
        setLoading(true);
        const { jams } = await backend.listPublishedJams({
          sort: mode,
          category: activeCategory !== 'All' ? activeCategory : undefined,
          limit: 60,
          offset: 0
        });
        if (jams.length === 0) {
          setApps([]);
        } else {
          const mapped = jams.map(j => {
            const publishedAt = (j as any).published_at || (j as any).publishedAt || null;
            const publishedMs = publishedAt ? new Date(publishedAt).getTime() : 0;
            const daysLive = publishedMs ? Math.max(0, Math.floor((Date.now() - publishedMs) / (1000 * 60 * 60 * 24))) : 0;
            const teamType = (j as any).teamType || (j as any).team_type;
            const mrrBucket = (j as any).mrrBucket || (j as any).mrr_bucket || '$0';
            const mrrVisibility = (j as any).mrrVisibility || (j as any).mrr_visibility || 'hidden';
            const vibeTools = (j as any).vibeTools || (j as any).vibe_tools || [];
            const techStack = (j as any).techStack || (j as any).tech_stack || [];
            const proofUrl = (j as any).socials?.proof_url || (j as any).socials?.proofUrl;
            return ({
            id: j.id,
            name: j.name,
            description: j.description || j.tagline,
            category: j.category,
            proofUrl,
            icon: '✨', // placeholder
            thumbnailUrl: j.media?.heroImageUrl || '',
            screenshot: j.media?.heroImageUrl || '',
            mediaType: 'image' as const,
            creator: {
              name: j.creator?.display_name || 'Maker',
              handle: j.creator?.handle || '@maker',
              avatar: j.creator?.avatar_url || '',
              type: teamType === 'team' ? 'Team' : 'Solo Founder',
              badges: j.creator?.trust_flags ? [{ type: 'founding_creator', label: 'Founding Creator' }] : []
            },
            stats: {
              revenue: mrrBucket,
              isRevenuePublic: mrrVisibility === 'public',
              upvotes: j.stats?.upvotes || 0,
              daysLive,
              views: j.stats?.views || 0,
              growth: '+0%', rank: 0, bookmarks: j.stats?.bookmarks || 0
            },
            vibeTools,
            stack: techStack
          })});
          setApps(mapped as any);
        }
      } catch (e) {
        console.error(e);
        setApps([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, [mode, activeCategory]);



  const filteredApps = useMemo(() => {
    let result = [...apps];

    if (searchQuery) {
      result = result.filter(app =>
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result;
  }, [searchQuery, apps]);

  const revenueLeaders = useMemo(() => {
    const source = apps;
    return [...source]
      .filter(a => a.stats.isRevenuePublic && a.stats.revenue !== '$0')
      .sort((a, b) => parseFloat(b.stats.revenue.replace(/[^0-9.]/g, '')) - parseFloat(a.stats.revenue.replace(/[^0-9.]/g, '')));
  }, [apps]);

  return (
    <div className="pt-24 md:pt-32 pb-20 overflow-x-hidden selection:bg-blue-100 selection:text-blue-900">
      {/* 0. HERO AREA */}
      <header className="max-w-7xl mx-auto px-4 md:px-6 mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-xl">
          <h1 className="text-[clamp(2.5rem,8vw,4rem)] font-black text-gray-900 tracking-tighter leading-[1.1] mb-4">
            Discover what builders are <span className="whitespace-nowrap">shipping now.</span>
          </h1>
          <p className="text-base md:text-lg text-gray-500 font-medium leading-relaxed">
            Real products. Real momentum. Built in public.
          </p>
        </div>
        <div className="w-full md:w-80">
          <div className="relative group">
            <input
              type="text"
              placeholder="Search jams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-2xl bg-white border border-gray-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none text-sm font-medium shadow-sm"
            />
            <svg className="w-5 h-5 absolute left-4 top-3.5 text-gray-300 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7-0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <FollowSignalSurface
          handle={currentUserHandle || null}
          title="Still Shipping"
          subtitle="Builds you already follow."
          variant="strip"
          limit={6}
        />
      </div>

      {/* TABS & CATEGORIES */}
      <div className="sticky top-[60px] md:top-[72px] z-40 bg-white/80 backdrop-blur-xl border-y border-gray-50/50 mb-8 md:mb-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col gap-4 overflow-hidden">
          {/* Horizontal Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-gray-50/50 rounded-2xl border border-gray-100 w-full overflow-x-auto scrollbar-hide snap-x">
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id as any)}
                className={`flex items-center justify-center gap-2 min-w-[100px] flex-1 md:flex-none px-4 md:px-5 py-2 rounded-xl text-[11px] md:text-xs font-black transition-all snap-start ${mode === m.id
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-100 ring-1 ring-gray-900/5'
                  : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                <span className={mode === m.id ? 'opacity-100' : 'opacity-70'} aria-hidden="true">
                  <m.icon />
                </span>
                {m.label}
              </button>
            ))}
          </div>

          {/* Horizontal Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide snap-x -mx-4 px-4 md:mx-0 md:px-0">
            {categories.map((cat) => (
              <button
                key={cat.label}
                onClick={() => setActiveCategory(cat.label)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap border min-h-[40px] snap-start ${activeCategory === cat.label
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200 shadow-sm'
                  }`}
              >
                <span className={activeCategory === cat.label ? 'opacity-100' : 'opacity-70'} aria-hidden="true">
                  <cat.icon />
                </span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className={`grid grid-cols-1 ${FEATURE_FLAGS.VITE_LAUNCH_MODE === 'week1' ? '' : 'lg:grid-cols-[1fr_320px]'} gap-8 md:gap-12 items-start`}>

          <section className="min-w-0">
            {/* MAIN SHIPPING LINEUP */}
            <div className="bg-white rounded-[32px] md:rounded-[40px] border border-gray-100 shadow-sm overflow-hidden mb-12 md:mb-16">
              {filteredApps.length > 0 ? (
                <div className="flex flex-col">
                  {filteredApps.map((app, idx) => (
                    <div
                      key={app.id}
                      onClick={() => onSelectApp(app)}
                      className={`group flex items-center p-4 md:p-6 cursor-pointer transition-all hover:bg-gray-50/50 relative ${idx !== filteredApps.length - 1 ? 'border-b border-gray-50' : ''}`}
                    >
                      <div className="flex items-center gap-3 md:gap-8 min-w-[20px] md:min-w-[60px] shrink-0">
                        <span className="text-[10px] font-black text-gray-300 w-full text-center">{idx + 1}</span>
                      </div>
                      <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl overflow-hidden shadow-sm border border-gray-50 shrink-0 bg-gray-50 mr-4 md:mr-6">
                        <img src={app.thumbnailUrl || app.screenshot} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={app.name} />
                      </div>
                      <div className="flex-1 min-w-0 pr-2 md:pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm md:text-lg font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {app.name}
                        </h3>
                        {app.proofUrl && (
                          <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-50 via-white to-emerald-50 text-[8px] font-black text-emerald-700 border border-emerald-100 uppercase tracking-widest whitespace-nowrap inline-flex items-center gap-1 shadow-[0_4px_10px_rgba(16,185,129,0.12)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Verified Build
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-[8px] font-black text-gray-400 border border-gray-100 uppercase tracking-widest whitespace-nowrap hidden sm:inline-block">
                          {app.category}
                        </span>
                      </div>
                        <p className="text-xs md:text-sm text-gray-400 truncate mb-2 md:mb-3 font-medium leading-tight">{app.description}</p>
                        <div className="flex flex-wrap gap-2 items-center">
                          <div className="flex gap-1">
                            {app.vibeTools.slice(0, 1).map(tool => (
                              <span key={tool} className="px-2 py-0.5 md:py-1 rounded-lg bg-blue-50/30 text-[9px] font-black text-blue-500 border border-blue-100/50 uppercase tracking-wider">
                                {tool}
                              </span>
                            ))}
                          </div>
                          {app.stack.slice(0, 2).map(tool => (
                            <span key={tool} className="px-2 py-0.5 md:py-1 rounded-lg bg-gray-50 text-[9px] font-black text-gray-500 border border-gray-100 uppercase tracking-wider">
                              {tool}
                            </span>
                          ))}
                          <div
                            onClick={(e) => { e.stopPropagation(); onSelectCreator(app.creator); }}
                            className="flex items-center gap-1.5 px-2 py-0.5 md:py-1 rounded-lg hover:bg-white transition-all group/creator ml-1 min-w-0"
                          >
                            <img src={app.creator.avatar} className="w-4 h-4 md:w-5 md:h-5 rounded-full border border-white shadow-sm shrink-0" alt={app.creator.name} />
                            <span className="text-[9px] md:text-[10px] font-black text-gray-300 group-hover/creator:text-blue-500 transition-colors uppercase tracking-widest truncate max-w-[60px] md:max-w-[80px]">
                              {app.creator.name}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 md:gap-10 shrink-0">
                        <div className="flex flex-col items-end min-w-[70px] md:min-w-[100px]">
                          <span className={`text-[11px] md:text-sm font-black ${app.stats.isRevenuePublic ? 'text-green-500' : 'text-gray-200'}`}>
                            {app.stats.isRevenuePublic ? app.stats.revenue : '—'}
                          </span>
                          <span className="text-[8px] md:text-[9px] text-gray-300 uppercase tracking-widest font-black">MRR</span>
                          <div className="mt-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-300">
                            <span>{app.stats.daysLive}d</span>
                            <span className="w-1 h-1 rounded-full bg-gray-200" />
                            <span>{app.stats.views || 0} views</span>
                          </div>
                        </div>
                        <button
                          className="flex flex-col items-center justify-center w-10 h-12 md:w-14 md:h-16 rounded-xl md:rounded-2xl bg-white border border-gray-100 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50/20 active:scale-95 group/upvote"
                          onClick={(e) => { e.stopPropagation(); }}
                        >
                          <svg className="w-3 h-3 md:w-4 md:h-4 text-gray-300 group-hover/upvote:text-blue-500 transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l-8 8h16l-8-8z" /></svg>
                          <span className="text-[10px] md:text-xs font-black text-gray-600 mt-1">{app.stats.upvotes}</span>
                          <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest mt-1">Upvotes</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center bg-gray-50">
                  <p className="text-gray-400 font-bold">No jams found in this category.</p>
                  <button onClick={() => { setActiveCategory('All'); setSearchQuery(''); }} className="mt-4 text-blue-500 text-xs font-black uppercase tracking-widest">Reset Filters</button>
                </div>
              )}
            </div>

            {/* REVENUE LEADERS */}
            <div className="pt-8 border-t border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Revenue Leaders</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Top earning jams — verified revenue signals</p>
                </div>
              </div>

              <div className="flex flex-col divide-y divide-gray-50">
                {revenueLeaders.map((app, idx) => (
                  <div
                    key={app.id}
                    onClick={() => onSelectApp(app)}
                    className="group flex flex-col md:flex-row items-start md:items-center py-6 gap-4 md:gap-6 cursor-pointer transition-all hover:bg-gray-50/40 px-4 -mx-4 rounded-2xl"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0 w-full">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform border border-gray-100/50 shadow-sm">
                        {app.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="font-semibold text-gray-900 text-sm md:text-base group-hover:text-blue-600 transition-colors leading-none truncate">
                            {app.name}
                          </h4>
                        </div>
                        <p className="text-[11px] md:text-xs text-gray-400 font-medium truncate">
                          {app.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center md:items-center justify-between md:justify-start w-full md:w-auto min-w-[140px] shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                      <span className="text-sm md:text-lg font-black text-green-500 leading-none">
                        {app.stats.revenue} <span className="text-[10px] md:text-xs text-green-400/80 font-bold tracking-normal">/ mo</span>
                      </span>
                      <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-1 hidden md:block">
                        Monthly revenue
                      </span>
                      <div className="md:hidden">
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => { e.stopPropagation(); onSelectCreator(app.creator); }}
                        >
                          <img src={app.creator.avatar} className="w-5 h-5 rounded-full border border-white shadow-sm" alt={app.creator.name} />
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate max-w-[80px]">
                            {app.creator.name}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="hidden md:flex items-center gap-2.5 min-w-[130px] justify-end opacity-60 group-hover:opacity-100 transition-opacity">
                      <div className="relative">
                        <img src={app.creator.avatar} className="w-6 h-6 rounded-full border border-white shadow-sm" alt={app.creator.name} />
                        {app.creator.badges && app.creator.badges.length > 0 && (
                          <div className="absolute -top-1 -right-1 scale-[0.5] origin-top-right">
                            <Badge type={app.creator.badges[0].type} showTooltip={false} />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate max-w-[80px]">
                        {app.creator.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* RIGHT SIDE PANEL */}
          {FEATURE_FLAGS.VITE_LAUNCH_MODE !== 'week1' && (
            <aside className="w-full lg:sticky lg:top-24 space-y-8 md:space-y-10 pb-20 lg:pb-0">
              {apps.length > 3 && (
                /* Creator of the Month */
                <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-gray-100 shadow-sm overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Icons.Picks />
                  </div>
                  <h4 className="text-[9px] md:text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-6 md:mb-8">Creator of the Month</h4>
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4 md:mb-6">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-gray-50 p-1 bg-white relative z-10 overflow-hidden shadow-sm">
                        <img src={apps[0]?.creator.avatar} className="w-full h-full rounded-full object-cover" alt={apps[0]?.creator.name} />
                      </div>
                      <div className="absolute -bottom-1 -right-1 scale-75 z-20">
                        <Badge type="consistent_shipper" showTooltip={false} />
                      </div>
                    </div>
                    <h5 className="text-base md:text-lg font-bold text-gray-900 mb-1">{apps[0]?.creator.name}</h5>
                    <p className="text-[10px] md:text-xs font-bold text-gray-300 uppercase tracking-widest mb-4 md:mb-6">{apps[0]?.creator.handle}</p>
                    <p className="text-[11px] md:text-xs text-gray-400 font-medium italic mb-6 md:mb-8 leading-relaxed max-w-[200px]">"Active builder in the VibeJam community."</p>

                    <div className="grid grid-cols-2 gap-4 md:gap-6 w-full mb-8 md:mb-10 pb-8 md:pb-10 border-b border-gray-50">
                      <div className="flex flex-col">
                        <span className="text-sm md:text-base font-black text-gray-900">{apps.filter(a => a.creator.handle === apps[0]?.creator.handle).length}</span>
                        <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Jams</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm md:text-base font-black text-gray-900">{apps[0]?.stats.upvotes}</span>
                        <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Upvotes</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectCreator(apps[0]?.creator)}
                      className="w-full py-4 rounded-2xl bg-gray-900 text-white text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-gray-900/10 hover:bg-gray-800 transition-all active:scale-95">
                      View Profile
                    </button>
                  </div>
                </div>
              )}

              {/* Vibe Pulse Metrics */}
              <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-gray-100 shadow-sm">
                <h4 className="text-[9px] md:text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-6 md:mb-8">Vibe Pulse</h4>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="text-[10px] md:text-xs font-bold text-gray-500">Total Jams</span>
                    </div>
                    <span className="text-xs md:text-sm font-black text-gray-900 tracking-tight">842</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <span className="text-[10px] md:text-xs font-bold text-gray-500">Builders</span>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2">
                      <span className="text-xs md:text-sm font-black text-gray-900 tracking-tight">124</span>
                      <span className="text-[8px] md:text-[9px] font-black text-green-500">▲ 12%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      <span className="text-[10px] md:text-xs font-bold text-gray-500">Upvotes</span>
                    </div>
                    <span className="text-xs md:text-sm font-black text-gray-900 tracking-tight">14.2k</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                      <span className="text-[10px] md:text-xs font-bold text-gray-500">Tracked</span>
                    </div>
                    <span className="text-xs md:text-sm font-black text-green-600 tracking-tight">$412k</span>
                  </div>
                </div>
                <div className="mt-8 pt-8 border-t border-gray-50 flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Platform Healthy</span>
                </div>
              </div>

              {/* Top Creators This Week */}
              <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-gray-100 shadow-sm">
                <h4 className="text-[9px] md:text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-6 md:mb-8">Top Creators</h4>
                <div className="space-y-4 md:space-y-6">
                  {apps.slice(0, 5).map((app, i) => (
                    <div key={i} onClick={() => onSelectCreator(app.creator)} className="flex items-center gap-3 md:gap-4 group cursor-pointer">
                      <div className="relative shrink-0">
                        <img src={app.creator.avatar} className="w-8 h-8 md:w-10 md:h-10 rounded-xl border-2 border-white shadow-sm group-hover:scale-110 transition-transform" alt={app.creator.name} />
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-gray-900 border-2 border-white flex items-center justify-center text-[7px] font-black text-white">{i + 1}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs md:text-sm font-bold text-gray-900 truncate group-hover:text-blue-500 transition-colors">{app.creator.name}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{app.creator.handle}</p>
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                    </div>
                  ))}
                </div>
                <button
                  onClick={onNavigateLeaderboard}
                  className="w-full mt-6 md:mt-8 py-3 rounded-2xl border border-gray-100 bg-gray-50/30 text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 hover:text-gray-900 transition-all"
                >
                  View All Rankings
                </button>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscoveryPage;
