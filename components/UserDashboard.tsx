
import React, { useState } from 'react';
import Badge, { BadgeRow } from './Badge';
import AppCard from './AppCard';
import { AppProject } from '../types';
import BookmarksPanel from './BookmarksPanel';

interface UserDashboardProps {
  onBack: () => void;
  onSelectApp: (app: AppProject) => void;
  onSelectCreator: (creator: AppProject['creator']) => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ onBack, onSelectApp, onSelectCreator }) => {
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'history' | 'activity'>('bookmarks');
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);

  // Mock User Data
  const user = {
    name: 'Curator X',
    handle: '@curatorx',
    avatar: 'https://picsum.photos/seed/user-curator/100',
    auraColor: '#C7D6EA',
    bio: 'Independent architect shaping lifestyle experiences. Building in the open.',
    joinedDate: 'Jan 2024',
    stats: {
      reach: '2.4k',
      signals: '128',
      jams: '12'
    },
    badges: ['early_access', 'top_curator'] as any[]
  };

  return (
    <div className=\"min-h-screen bg-white pt-32 pb-20\">
      <div className=\"max-w-7xl mx-auto px-6\">
        <div className=\"flex flex-col lg:flex-row gap-16\">
          {/* Profile Sidebar */}
          <div className=\"lg:w-80 shrink-0\">
            <div className=\"sticky top-32\">
              <div className=\"relative w-32 h-32 md:w-40 md:h-40 mb-10 aura-clip mx-auto lg:mx-0\">
                <img src={user.avatar} className=\"w-full h-full rounded-full object-cover relative z-10 border-4 border-white shadow-xl\" alt=\"\" />
                <div className=\"aura-halo\" style={{ background: user.auraColor, opacity: 0.2, inset: '-8px' }} />
              </div>

              <div className=\"text-center lg:text-left mb-10\">
                <div className=\"flex items-center justify-center lg:justify-start gap-3 mb-2\">
                  <h1 className=\"text-3xl font-black text-gray-900 tracking-tight\">{user.name}</h1>
                  <BadgeRow badges={user.badges} size=\"sm\" />
                </div>
                <p className=\"text-lg font-medium text-gray-400\">{user.handle}</p>
                <p className=\"mt-6 text-sm text-gray-500 leading-relaxed font-medium capitalize\">{user.bio}</p>
                <div className=\"mt-8 flex items-center justify-center lg:justify-start gap-2\">
                  <span className=\"text-[10px] font-black text-gray-300 uppercase tracking-widest\">Joined {user.joinedDate}</span>
                </div>
              </div>

              <div className=\"grid grid-cols-3 gap-4 mb-10\">
                {[
                  { label: 'Reach', value: user.stats.reach },
                  { label: 'Signals', value: user.stats.signals },
                  { label: 'Jams', value: user.stats.jams }
                ].map(stat => (
                  <div key={stat.label} className=\"text-center lg:text-left\">
                    <span className=\"block text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1\">{stat.label}</span>
                    <span className=\"text-lg font-black text-gray-900\">{stat.value}</span>
                  </div>
                ))}
              </div>

              <button className=\"w-full py-4 rounded-2xl bg-gray-900 text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-gray-900/10 active:scale-95 transition-all\">Edit Profile</button>
            </div>
          </div>

          {/* Main Content */}
          <div className=\"flex-1\">
            <div className=\"flex items-center gap-12 border-b border-gray-50 mb-12\">
              {[
                { id: 'bookmarks', label: 'Bookmarks' },
                { id: 'history', label: 'History' },
                { id: 'activity', label: 'Activity' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-6 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === tab.id ? 'text-gray-900' : 'text-gray-300'}`}
                >
                  {tab.label}
                  <div className={`absolute bottom-0 left-0 h-0.5 bg-gray-900 transition-all duration-500 ${activeTab === tab.id ? 'w-full' : 'w-0'}`} />
                </button>
              ))}
            </div>

            {activeTab === 'bookmarks' && (
              <div className=\"grid grid-cols-1 md:grid-cols-2 gap-8\">
                {/* Empty State or Items would go here */}
                <div className=\"col-span-full py-32 text-center rounded-[40px] border border-dashed border-gray-100\">
                  <p className=\"text-gray-400 font-medium mb-6\">No bookmarked jams yet.</p>
                  <button onClick={onBack} className=\"text-[10px] font-black text-blue-500 uppercase tracking-widest\">Browse Discover Feed →</button>
                </div>
              </div>
            )}
            
            {activeTab === 'activity' && (
              <div className=\"space-y-6\">
                 {[1,2,3].map(i => (
                   <div key={i} className=\"p-6 rounded-3xl border border-gray-50 flex items-center justify-between group\">
                      <div className=\"flex items-center gap-4\">
                         <div className=\"w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500\">
                            <svg className=\"w-5 h-5\" fill=\"currentColor\" viewBox=\"0 0 24 24\"><path d=\"M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z\" /></svg>
                         </div>
                         <div>
                            <p className=\"text-sm font-bold text-gray-900\">Upvoted <span className=\"text-blue-500\">Chord Studio</span></p>
                            <span className=\"text-[10px] font-bold text-gray-300 uppercase tracking-widest\">2 hours ago</span>
                         </div>
                      </div>
                      <button className=\"text-gray-400 opacity-0 group-hover:opacity-100 transition-all\">
                         <svg className=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth=\"2\" d=\"M9 5l7 7-7 7\"/></svg>
                      </button>
                   </div>
                 ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isBookmarksOpen && (
        <BookmarksPanel 
          onClose={() => setIsBookmarksOpen(false)} 
          onSelectJam={(id) => { setIsBookmarksOpen(false); }}
          onDiscover={onBack}
        />
      )}
    </div>
  );
};

export default UserDashboard;
