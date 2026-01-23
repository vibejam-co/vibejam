
import React, { useState } from 'react';
import { AppProject } from '../types';
import { MOCK_APPS } from '../constants';
import Badge from './Badge';
import SocialListPanel from './SocialListPanel';
import BookmarksPanel from './BookmarksPanel';
import AppCard from './AppCard';
import { useBookmarks } from '../lib/useBookmarks';

interface UserDashboardProps {
  onBack: () => void;
  onSelectApp: (app: AppProject) => void;
  onSelectCreator: (creator: AppProject['creator']) => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ onBack, onSelectApp, onSelectCreator }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'bookmarks'>('overview');
  const [viewingList, setViewingList] = useState<'followers' | 'following' | null>(null);
  const { bookmarks, count: bookmarkCount } = useBookmarks();

  const user = {
    name: 'Curator X',
    handle: '@curatorx',
    avatar: 'https://picsum.photos/seed/user-curator/100',
    auraColor: '#C7D6EA',
    joined: 'Jan 2026',
    bio: 'Curating the future of creative tools. Builder at heart.',
    stats: {
      upvotes: 12,
      comments: 3,
      followed: 8,
      followers: 142,
      following: 89
    },
    badges: [
      { type: 'top_curator' as const },
      { type: 'founding_member' as const }
    ]
  };

  const MetricItem = ({ label, value, active, onClick }: { label: string, value: string, active?: boolean, onClick: () => void }) => (
    <button 
      onClick={onClick} 
      className={`flex flex-col items-center px-6 py-2 rounded-2xl transition-all active:scale-95 ${active ? 'bg-gray-50' : 'hover:bg-gray-50/50'}`}
    >
      <span className={`text-xl font-bold transition-colors ${active ? 'text-blue-500' : 'text-gray-900'}`}>{value}</span>
      <span className={`text-[10px] font-black uppercase tracking-widest mt-1.5 ${active ? 'text-blue-400' : 'text-gray-300'}`}>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-white pt-32 pb-40 animate-in fade-in duration-500">
      <div className="max-w-5xl mx-auto px-6">
        <button onClick={onBack} className="mb-12 flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-all group">
          <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Back to Feed</span>
        </button>

        <header className="flex flex-col items-center text-center mb-16">
          <div className="relative aura-clip mb-8">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white p-1 shadow-sm bg-white relative z-10 overflow-hidden">
              <img src={user.avatar} className="w-full h-full rounded-full object-cover" alt={user.name} />
            </div>
            <div className="aura-halo" style={{ background: user.auraColor, opacity: 0.2, inset: '-8px' }} />
          </div>
          
          <div className="space-y-2 mb-6">
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter leading-none">{user.name}</h1>
            <p className="text-sm font-bold text-gray-300 uppercase tracking-[0.4em]">{user.handle}</p>
          </div>

          <p className="text-gray-500 font-medium text-lg max-w-md mx-auto leading-relaxed mb-10">{user.bio}</p>

          <div className="flex items-center justify-center gap-2 mb-10 bg-white border border-gray-50 p-2 rounded-[32px] shadow-sm">
            <MetricItem label="Followers" value={user.stats.followers.toString()} onClick={() => setViewingList('followers')} />
            <div className="w-px h-6 bg-gray-100" />
            <MetricItem label="Following" value={user.stats.following.toString()} onClick={() => setViewingList('following')} />
            <div className="w-px h-6 bg-gray-100" />
            <MetricItem 
              label="Bookmarks" 
              value={bookmarkCount.toString()} 
              active={activeTab === 'bookmarks'}
              onClick={() => setActiveTab(activeTab === 'bookmarks' ? 'overview' : 'bookmarks')} 
            />
          </div>

          <button className="px-8 py-3 rounded-2xl border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-all">Edit Profile</button>
        </header>

        {activeTab === 'overview' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
              {[
                { label: 'Joined', value: user.joined },
                { label: 'Upvotes', value: user.stats.upvotes },
                { label: 'Comments', value: user.stats.comments },
                { label: 'Followed', value: user.stats.followed }
              ].map(stat => (
                <div key={stat.label} className="text-center p-6 bg-gray-50/50 rounded-[32px] border border-gray-50/30">
                  <span className="block text-2xl font-black text-gray-900 tracking-tighter mb-1">{stat.value}</span>
                  <span className="block text-[9px] font-black text-gray-300 uppercase tracking-widest">{stat.label}</span>
                </div>
              ))}
            </div>

            <section className="mb-20 flex flex-col items-center">
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mb-8">Ecosystem Status</span>
              <div className="flex gap-6 p-3 px-8 bg-white border border-gray-100 rounded-full shadow-sm">
                {user.badges.map((b, i) => (
                  <Badge key={i} type={b.type} />
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-10 border-b border-gray-50 pb-6">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Saved Jams</h2>
              <button 
                onClick={() => setActiveTab('overview')}
                className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900"
              >
                Close Bookmarks
              </button>
            </div>

            {bookmarks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {bookmarks.map((bookmark) => {
                  const fullProject = MOCK_APPS.find(a => a.id === bookmark.id) || {
                    id: bookmark.id,
                    name: bookmark.name,
                    description: 'Saved from your bookmarks.',
                    category: bookmark.category,
                    icon: '✨',
                    screenshot: bookmark.screenshot,
                    mediaType: 'image',
                    thumbnailUrl: bookmark.screenshot,
                    stats: { revenue: bookmark.mrr, isRevenuePublic: true, growth: '0%', rank: 0, upvotes: 0, daysLive: 0 },
                    creator: { ...bookmark.creator, color: '#3b82f6', type: 'Solo Founder' },
                    stack: [],
                    vibeTools: [],
                    milestones: []
                  } as AppProject;

                  return (
                    <AppCard 
                      key={bookmark.id} 
                      project={fullProject} 
                      onClick={() => onSelectApp(fullProject)}
                      onCreatorClick={(creator) => onSelectCreator(creator)}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 text-center bg-gray-50/50 rounded-[40px] border border-dashed border-gray-200">
                <div className="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center text-gray-300 mb-6 border border-gray-100">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">No bookmarks yet.</h3>
                <p className="text-xs font-medium text-gray-400 max-w-[200px] leading-relaxed mb-8">Save a Jam to find it here later.</p>
                <button 
                  onClick={onBack}
                  className="px-8 py-3 rounded-2xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                >
                  Discover Jams
                </button>
              </div>
            )}
          </div>
        )}

        {viewingList && (
          <SocialListPanel 
            title={viewingList === 'followers' ? 'Followers' : 'Following'}
            count={viewingList === 'followers' ? user.stats.followers.toString() : user.stats.following.toString()}
            users={[]}
            onClose={() => setViewingList(null)}
            onSelectUser={() => setViewingList(null)}
          />
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
