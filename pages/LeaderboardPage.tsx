
import React, { useState, useMemo } from 'react';
import { MOCK_APPS } from '../constants';
import { AppProject } from '../types';
import Badge from '../components/Badge';

interface LeaderboardPageProps {
  onBack: () => void;
  onSelectCreator: (creator: AppProject['creator']) => void;
}

const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ onBack, onSelectCreator }) => {
  const [timeframe, setTimeframe] = useState<'weekly' | 'alltime'>('weekly');

  const rankedCreators = useMemo(() => {
    const creatorsMap = new Map<string, any>();
    MOCK_APPS.forEach(app => {
      const handle = app.creator.handle;
      if (!creatorsMap.has(handle)) {
        creatorsMap.set(handle, {
          ...app.creator,
          totalUpvotes: 0,
          jamsLaunched: 0,
          followers: 1200 + Math.floor(Math.random() * 800),
          daysActive: app.stats.daysLive + 10
        });
      }
      const data = creatorsMap.get(handle);
      data.totalUpvotes += app.stats.upvotes;
      data.jamsLaunched += 1;
    });
    const list = Array.from(creatorsMap.values());
    return list.sort((a, b) => timeframe === 'weekly' ? b.totalUpvotes - a.totalUpvotes : b.followers - a.followers);
  }, [timeframe]);

  return (
    <div className="min-h-screen bg-white pt-32 pb-40 animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto px-6">
        <button onClick={onBack} className="mb-12 flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-all group">
          <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return Home</span>
        </button>

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tighter leading-none mb-6">Leaderboard</h1>
            <p className="text-xl text-gray-400 font-medium">The builders leading the culture this week.</p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-2xl border border-gray-100">
            <button onClick={() => setTimeframe('weekly')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeframe === 'weekly' ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}>This Week</button>
            <button onClick={() => setTimeframe('alltime')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeframe === 'alltime' ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}>All Time</button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-12 md:gap-20 items-start">
          <main className="min-w-0">
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
              <div className="hidden md:flex items-center px-8 h-16 bg-gray-50/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <div className="w-12 text-center pr-4">#</div>
                <div className="flex-1">Creator</div>
                <div className="w-24 text-center">Upvotes</div>
                <div className="w-24 text-center">Followers</div>
                <div className="w-32"></div>
              </div>
              <div className="flex flex-col">
                {rankedCreators.map((creator, idx) => (
                  <div key={creator.handle} onClick={() => onSelectCreator(creator)} className="group flex flex-col md:flex-row md:items-center px-6 py-8 md:px-8 transition-all hover:bg-gray-50/40 cursor-pointer border-b border-gray-100 last:border-0">
                    <div className="flex items-center flex-1 gap-6 mb-4 md:mb-0">
                      <div className="w-8 text-center shrink-0">
                        <span className={`text-lg font-black ${idx < 3 ? 'text-blue-500' : 'text-gray-200'}`}>{idx + 1}</span>
                      </div>
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-14 h-14 rounded-full border-2 border-white shadow-sm overflow-hidden bg-white">
                          <img src={creator.avatar} className="w-full h-full object-cover" alt={creator.name} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-gray-900 truncate text-lg group-hover:text-blue-500 transition-colors">{creator.name}</h4>
                          <p className="text-[11px] font-bold text-gray-300 uppercase tracking-widest truncate">{creator.handle}</p>
                        </div>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center shrink-0">
                       <div className="w-24 text-center"><span className="text-sm font-black text-blue-500">{creator.totalUpvotes}</span></div>
                       <div className="w-24 text-center"><span className="text-sm font-black text-gray-900">{creator.followers}</span></div>
                    </div>
                    <div className="w-full md:w-32 flex justify-end">
                      <button className="px-6 py-3 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all">Follow</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
          <aside className="premium-card rounded-[40px] p-10 bg-[#F9F9FB]/50 border border-gray-100 shadow-sm">
            <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.3em] mb-8">Rankings Guide</h3>
            <p className="text-sm text-gray-500 leading-relaxed font-medium">Rankings are updated daily based on high-signal community engagement.</p>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
