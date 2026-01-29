
import React, { useState, useEffect } from 'react';
import Badge from '../components/Badge';
import { AppProject } from '../types';

interface LeaderboardPageProps {
  onBack: () => void;
  onSelectCreator: (creator: AppProject['creator']) => void;
}

const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ onBack, onSelectCreator }) => {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('week');

  const leaders = [
    {
      rank: 1,
      name: 'Maya R.',
      handle: '@maya',
      avatar: 'https://picsum.photos/seed/maya/100',
      signals: 1420,
      auraColor: '#C8C2D8',
      growth: '+12.4%',
      badges: ['revenue_leader', 'founding_creator']
    },
    {
      rank: 2,
      name: 'Jordan T.',
      handle: '@jt',
      avatar: 'https://picsum.photos/seed/jordan/100',
      signals: 1205,
      auraColor: '#C7D6EA',
      growth: '+8.1%',
      badges: ['top_curator', 'early_access']
    },
    {
      rank: 3,
      name: 'Sam K.',
      handle: '@samk',
      avatar: 'https://picsum.photos/seed/sam/100',
      signals: 980,
      auraColor: '#A9D6C2',
      growth: '+4.5%',
      badges: ['breakout_creator']
    }
  ];

  return (
    <div className=\"min-h-screen bg-white pt-48 pb-20 px-6\">
      <div className=\"max-w-5xl mx-auto\">
        <header className=\"mb-20\">
          <div className=\"flex flex-col md:flex-row md:items-end justify-between gap-8\">
            <div>
              <button onClick={onBack} className=\"mb-8 text-gray-400 hover:text-gray-900 transition-colors flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest\">
                <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth=\"2.5\" d=\"M15 19l-7-7 7-7\" /></svg>
                Back to Home
              </button>
              <h1 className=\"text-5xl font-black text-gray-900 tracking-tighter\">Leaderboards.</h1>
              <p className=\"text-lg text-gray-400 font-medium mt-4\">Rewarding taste, curation, and builder velocity.</p>
            </div>
            
            <div className=\"flex bg-gray-50 p-1.5 rounded-2xl\">
              {[
                { id: 'week', label: 'WEEK' },
                { id: 'month', label: 'MONTH' },
                { id: 'all', label: 'ALL TIME' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTimeframe(t.id as any)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeframe === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className=\"space-y-4\">
          {leaders.map((user) => (
            <div 
              key={user.handle}
              onClick={() => onSelectCreator({ name: user.name, handle: user.handle, avatar: user.avatar, color: user.auraColor, type: 'Solo Founder' } as any)}
              className=\"group p-6 md:p-8 rounded-[32px] border border-gray-50 hover:bg-gray-50/50 hover:border-blue-100 transition-all cursor-pointer flex items-center gap-6 md:gap-10\"
            >
              <span className=\"text-2xl font-black text-gray-200 group-hover:text-blue-500/20 tabular-nums w-8\">{user.rank}</span>
              
              <div className=\"relative aura-clip shrink-0\">
                <img src={user.avatar} className=\"w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-white shadow-md relative z-10\" alt=\"\" />
                <div className=\"aura-halo\" style={{ background: user.auraColor, opacity: 0.15, inset: '-4px' }} />
              </div>

              <div className=\"flex-1 min-w-0\">
                 <div className=\"flex items-center gap-3 mb-1\">
                    <h3 className=\"text-lg font-bold text-gray-900 truncate\">{user.name}</h3>
                    <div className=\"flex gap-1.5\">
                       {user.badges.map(b => <Badge key={b} type={b as any} size=\"sm\" showTooltip={false} />)}
                    </div>
                 </div>
                 <span className=\"text-xs font-medium text-gray-400\">{user.handle}</span>
              </div>

              <div className=\"hidden md:flex flex-col items-end\">
                 <span className=\"text-lg font-black text-gray-900\">{user.signals.toLocaleString()} <span className=\"text-[10px] text-gray-400 uppercase tracking-widest ml-1\">Signals</span></span>
                 <span className=\"text-[11px] font-black text-green-500 uppercase tracking-widest\">{user.growth}</span>
              </div>
              
              <div className=\"md:hidden flex flex-col items-end\">
                 <span className=\"text-sm font-black text-gray-900\">{user.signals}</span>
                 <span className=\"text-[9px] font-black text-green-500 uppercase tracking-widest\">{user.growth}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
