
import React, { useState, useMemo } from 'react';
import { MOCK_APPS } from '../constants';
import { AppProject } from '../types';
import { backend } from '../lib/backend';
import Badge from './Badge';

const Icons = {
  Trending: () => ( <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg> ),
  New: () => ( <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg> ),
  Revenue: () => ( <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10M18 20V4M6 20v-4" /></svg> ),
  Picks: () => ( <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg> ),
  All: () => ( <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg> ),
  Creativity: () => ( <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></svg> ),
  Productivity: () => ( <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg> ),
  Music: () => ( <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg> ),
  Lifestyle: () => ( <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z" /><path d="M12 2a10 10 0 0 1 10 10h-10V2z" opacity="0.3" /><path d="M12 12L2.5 12" /><path d="M12 12l9.5 0" /></svg> ),
  SaaS: () => ( <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" /><line x1="6" y1="6" x2="6" y2="6" /><line x1="6" y1="18" x2="6" y2="18" /></svg> ),
  DevTools: () => ( <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg> ),
  AI: () => ( <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><circle cx="12" cy="11" r="3" /></svg> )
};

interface DiscoveryPageProps { onSelectApp: (app: AppProject) => void; onSelectCreator: (creator: AppProject['creator']) => void; onNavigateLeaderboard?: () => void; }

const DiscoveryPage: React.FC<DiscoveryPageProps> = ({ onSelectApp, onSelectCreator, onNavigateLeaderboard }) => {
  const [mode, setMode] = useState<'trending' | 'new' | 'revenue' | 'picks'>('trending');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [apps, setApps] = useState<AppProject[]>([]);

  React.useEffect(() => {
    const fetchFeed = async () => {
      try {
        const { jams } = await backend.listPublishedJams({ sort: 'trending' });
        if (jams.length === 0) { setApps(MOCK_APPS); } 
        else {
          const mapped = jams.map(j => ({ id: j.id, name: j.name, description: j.description || j.tagline, category: j.category, icon: '✨', thumbnailUrl: j.media?.heroImageUrl || '', screenshot: j.media?.heroImageUrl || '', mediaType: 'image' as const, creator: { name: 'Maker', handle: '@maker', avatar: '', type: j.teamType === 'team' ? 'Team' : 'Solo Founder' }, stats: { revenue: j.mrrBucket || '$0', isRevenuePublic: j.mrrVisibility === 'public', upvotes: j.stats?.upvotes || 0, daysLive: 0, views: j.stats?.views || 0, growth: '+0%', rank: 0, bookmarks: 0 }, vibeTools: j.vibeTools || [], stack: j.techStack || [] }));
          setApps(mapped as any);
        }
      } catch (e) { console.error(e); setApps(MOCK_APPS); }
    };
    fetchFeed();
  }, []);

  const filteredApps = useMemo(() => {
    let result = apps.length > 0 ? [...apps] : [...MOCK_APPS];
    if (activeCategory !== 'All') result = result.filter(app => app.category === activeCategory);
    if (searchQuery) result = result.filter(app => app.name.toLowerCase().includes(searchQuery.toLowerCase()) || app.description.toLowerCase().includes(searchQuery.toLowerCase()));
    if (mode === 'revenue') result.sort((a, b) => parseFloat(b.stats.revenue.replace(/[^0-9.]/g, '')) - parseFloat(a.stats.revenue.replace(/[^0-9.]/g, '')));
    else if (mode === 'new') result.sort((a, b) => a.stats.daysLive - b.stats.daysLive);
    else result.sort((a, b) => b.stats.upvotes - a.stats.upvotes);
    return result;
  }, [activeCategory, mode, searchQuery, apps]);

  return (
    <div className="pt-24 md:pt-32 pb-20 overflow-x-hidden selection:bg-blue-100 selection:text-blue-900">
      <header className="max-w-7xl mx-auto px-4 md:px-6 mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-xl"><h1 className="text-[clamp(2.5rem,8vw,4rem)] font-black text-gray-900 tracking-tighter leading-[1.1] mb-4">Discover what builders are <span className="whitespace-nowrap">shipping now.</span></h1><p className="text-base md:text-lg text-gray-500 font-medium leading-relaxed">Real products. Real momentum. Built in public.</p></div>
        <div className="w-full md:w-80"><div className="relative group"><input type="text" placeholder="Search jams..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-12 pl-12 pr-4 rounded-2xl bg-white border border-gray-100 focus:border-blue-500 transition-all outline-none text-sm font-medium shadow-sm" /><svg className="w-5 h-5 absolute left-4 top-3.5 text-gray-300 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7-0 11-14 0 7 7 0 0114 0z" /></svg></div></div>
      </header>
      <div className="sticky top-[60px] md:top-[72px] z-40 bg-white/80 backdrop-blur-xl border-y border-gray-50/50 mb-8 md:mb-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center gap-1 p-1 bg-gray-50/50 rounded-2xl border border-gray-100 w-full overflow-x-auto scrollbar-hide snap-x">
            {[ { id: 'trending', label: 'Trending', icon: Icons.Trending }, { id: 'new', label: 'New', icon: Icons.New }, { id: 'revenue', label: 'Revenue', icon: Icons.Revenue }, { id: 'picks', label: 'Picks', icon: Icons.Picks } ].map((m) => (
              <button key={m.id} onClick={() => setMode(m.id as any)} className={`flex items-center justify-center gap-2 min-w-[100px] flex-1 md:flex-none px-4 md:px-5 py-2 rounded-xl text-[11px] md:text-xs font-black transition-all snap-start ${mode === m.id ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}><span className={mode === m.id ? 'opacity-100' : 'opacity-70'}><m.icon /></span>{m.label}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide snap-x -mx-4 px-4 md:mx-0 md:px-0">
            {[ { label: 'All', icon: Icons.All }, { label: 'Creativity', icon: Icons.Creativity }, { label: 'Productivity', icon: Icons.Productivity }, { label: 'Music', icon: Icons.Music }, { label: 'Lifestyle', icon: Icons.Lifestyle }, { label: 'SaaS', icon: Icons.SaaS }, { label: 'Dev Tools', icon: Icons.DevTools }, { label: 'AI', icon: Icons.AI } ].map((cat) => (
              <button key={cat.label} onClick={() => setActiveCategory(cat.label)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap border min-h-[40px] snap-start ${activeCategory === cat.label ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'}`}><span className={activeCategory === cat.label ? 'opacity-100' : 'opacity-70'}><cat.icon /></span>{cat.label}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-6"><div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 md:gap-12 items-start"><section className="min-w-0"><div className="bg-white rounded-[32px] md:rounded-[40px] border border-gray-100 shadow-sm overflow-hidden mb-12 md:mb-16">{filteredApps.map((app, idx) => (
        <div key={app.id} onClick={() => onSelectApp(app)} className={`group flex items-center p-4 md:p-6 cursor-pointer transition-all hover:bg-gray-50/50 relative ${idx !== filteredApps.length - 1 ? 'border-b border-gray-50' : ''}`}><div className="flex items-center gap-3 md:gap-8 min-w-[20px] md:min-w-[60px] shrink-0"><span className="text-[10px] font-black text-gray-300 w-full text-center">{idx + 1}</span></div><div className="relative w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl overflow-hidden shadow-sm border border-gray-50 shrink-0 bg-gray-50 mr-4 md:mr-6"><img src={app.thumbnailUrl || app.screenshot} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={app.name} /></div><div className="flex-1 min-w-0 pr-2 md:pr-4"><div className="flex items-center gap-2 mb-1"><h3 className="text-sm md:text-lg font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{app.name}</h3><span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-[8px] font-black text-gray-400 border border-gray-100 uppercase tracking-widest hidden sm:inline-block">{app.category}</span></div><p className="text-xs md:text-sm text-gray-400 truncate mb-2 md:mb-3 font-medium leading-tight">{app.description}</p><div className="flex flex-wrap gap-2 items-center"><div className="flex gap-1">{app.vibeTools.slice(0, 1).map(tool => (<span key={tool} className="px-2 py-0.5 md:py-1 rounded-lg bg-blue-50/30 text-[9px] font-black text-blue-500 border border-blue-100/50 uppercase tracking-wider">{tool}</span>))}</div><div onClick={(e) => { e.stopPropagation(); onSelectCreator(app.creator); }} className="flex items-center gap-1.5 px-2 py-0.5 md:py-1 rounded-lg hover:bg-white transition-all group/creator ml-1 min-w-0"><img src={app.creator.avatar} className="w-4 h-4 md:w-5 md:h-5 rounded-full border border-white shadow-sm shrink-0" alt={app.creator.name} /><span className="text-[9px] md:text-[10px] font-black text-gray-300 group-hover/creator:text-blue-500 transition-colors uppercase tracking-widest truncate max-w-[60px] md:max-w-[80px]">{app.creator.name}</span></div></div></div><div className="flex items-center gap-3 md:gap-10 shrink-0"><div className="flex flex-col items-end min-w-[50px] md:min-w-[80px]"><span className={`text-[11px] md:text-sm font-black ${app.stats.isRevenuePublic ? 'text-green-500' : 'text-gray-200'}`}>{app.stats.isRevenuePublic ? app.stats.revenue : '—'}</span><span className="text-[8px] md:text-[9px] text-gray-300 uppercase tracking-widest font-black">MRR</span></div><button className="flex flex-col items-center justify-center w-10 h-12 md:w-14 md:h-16 rounded-xl md:rounded-2xl bg-white border border-gray-100 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50/20 active:scale-95 group/upvote" onClick={(e) => { e.stopPropagation(); }}><svg className="w-3 h-3 md:w-4 md:h-4 text-gray-300 group-hover/upvote:text-blue-500 transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l-8 8h16l-8-8z" /></svg><span className="text-[10px] md:text-xs font-black text-gray-600 mt-1">{app.stats.upvotes}</span></button></div></div>
      ))}</div></section></div></div>
    </div>
  );
};
export default DiscoveryPage;
