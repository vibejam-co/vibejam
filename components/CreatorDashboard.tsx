
import React from 'react';
import Badge from './Badge';

interface CreatorDashboardProps {
  user: {
    name: string;
    handle: string;
    avatar: string;
    auraColor: string;
    creatorSince: string;
  };
  onBack: () => void;
  onStartJam: () => void;
}

const CreatorDashboard: React.FC<CreatorDashboardProps> = ({ user, onBack, onStartJam }) => {
  const ownedJams = [
    {
      id: 'o1',
      name: 'VibeStudio',
      tagline: 'The creative operating system for modern builders.',
      status: 'Live',
      launchDate: 'Feb 12, 2026',
      stats: {
        upvotes: 412,
        comments: 24,
        followers: 128,
        mrr: '$1,240'
      }
    }
  ];

  const recentComments = [
    { id: 'c1', user: '@jt', text: 'This is the cleanest UI I’ve used in months.', time: '2h ago' },
    { id: 'c2', user: '@maya', text: 'How are you handling the real-time sync?', time: '5h ago' }
  ];

  return (
    <div className="min-h-screen bg-white pt-32 pb-40 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto px-6">
        <button onClick={onBack} className="mb-12 flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-all group">
          <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Studio</span>
        </button>

        <header className="flex items-center justify-between mb-20">
          <div className="flex items-center gap-6">
            <div className="relative aura-clip">
              <div className="w-20 h-20 rounded-full border-[3px] border-white p-1 bg-white relative z-10 shadow-sm">
                <img src={user.avatar} className="w-full h-full rounded-full object-cover" alt={user.name} />
              </div>
              <div className="aura-halo" style={{ background: user.auraColor, opacity: 0.2, inset: '-6px' }} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-black text-gray-900 tracking-tighter leading-none">{user.name}</h1>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-[8px] font-black text-blue-500 uppercase tracking-widest border border-blue-100/50">Creator</span>
              </div>
              <p className="text-xs font-bold text-gray-300 uppercase tracking-[0.3em] mb-1">{user.handle}</p>
              <p className="text-[10px] font-medium text-gray-400">Creator since {user.creatorSince}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-5 py-2.5 rounded-xl border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-all">View Profile</button>
          </div>
        </header>

        <section className="mb-20">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">My Jams</h3>
            <button 
                onClick={onStartJam}
                className="text-[10px] font-black text-blue-500 hover:text-blue-600 uppercase tracking-widest transition-colors"
            >
                + New Jam
            </button>
          </div>

          <div className="space-y-6">
            {ownedJams.map(jam => (
              <div key={jam.id} className="premium-card rounded-[40px] p-10 border border-gray-50 bg-[#F9F9FB]/30">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-3">
                      <h4 className="text-2xl font-black text-gray-900 tracking-tight leading-none">{jam.name}</h4>
                      <span className="px-2.5 py-1 rounded-full bg-green-50 text-green-600 text-[9px] font-black uppercase tracking-widest border border-green-100/50">{jam.status}</span>
                    </div>
                    <p className="text-gray-500 font-medium mb-6">{jam.tagline}</p>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                      <span>Launched {jam.launchDate}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button className="px-8 py-4 rounded-2xl bg-gray-900 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-gray-900/10">View Jam</button>
                    <button className="w-14 h-14 rounded-2xl border border-gray-100 bg-white flex items-center justify-center text-gray-300 hover:text-gray-900 transition-all cursor-help" title="Editing coming soon">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-10 border-t border-gray-100/50">
                    {[
                        { label: 'Upvotes', value: jam.stats.upvotes.toString() },
                        { label: 'Comments', value: jam.stats.comments.toString() },
                        { label: 'Followers', value: jam.stats.followers.toString() },
                        { label: 'MRR', value: jam.stats.mrr }
                    ].map(stat => (
                        <div key={stat.label}>
                            <span className="block text-2xl font-black text-gray-900 tracking-tighter leading-none mb-1">{stat.value}</span>
                            <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</span>
                        </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col items-center pt-10 border-t border-gray-50">
            <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mb-8">Launch Prestige</h3>
            <div className="flex gap-6 p-4 px-10 bg-white border border-gray-100 rounded-full shadow-sm mb-6">
                <Badge type="founding_creator" />
                <Badge type="consistent_shipper" />
            </div>
        </section>
      </div>
    </div>
  );
};

export default CreatorDashboard;
