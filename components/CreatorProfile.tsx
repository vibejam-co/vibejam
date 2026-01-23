
import React, { useState, useEffect, useMemo } from 'react';
import AppCard from './AppCard';
import { AppProject } from '../types';
import { MOCK_APPS } from '../constants';
import Badge, { SEAL_METADATA, BadgeRow } from './Badge';
import SocialListPanel from './SocialListPanel';
import BookmarksPanel from './BookmarksPanel';
import { useBookmarks } from '../lib/useBookmarks';

interface CreatorProfileProps {
  creator: AppProject['creator'];
  onClose: () => void;
  onSelectApp: (app: AppProject) => void;
  isFirstTimeEarn?: boolean;
}

const MOCK_TEAM_MEMBERS = [
  { id: 'tm1', name: 'Sarah Chen', handle: '@sarah', role: 'Founder & Engineer', avatar: 'https://picsum.photos/seed/sarah/100', auraColor: '#A9D6C2', badge: 'revenue_leader' as const, isFollowing: true },
  { id: 'tm2', name: 'Marcus Bell', handle: '@marcus', role: 'Product Design', avatar: 'https://picsum.photos/seed/marcus/100', auraColor: '#EAEAEA', badge: 'founding_member' as const, isFollowing: false },
  { id: 'tm3', name: 'Elena Voss', handle: '@elena', role: 'Growth Strategy', avatar: 'https://picsum.photos/seed/elena/100', auraColor: '#C8C2D8', badge: 'consistent_shipper' as const, isFollowing: true },
  { id: 'tm4', name: 'Jordan T.', handle: '@jt', role: 'AI Research', avatar: 'https://picsum.photos/seed/jordan/100', auraColor: '#C7D6EA', badge: 'top_curator' as const, isFollowing: false },
  { id: 'tm5', name: 'Maya R.', handle: '@maya', role: 'Community', avatar: 'https://picsum.photos/seed/maya/100', auraColor: '#EAEAEA', badge: 'community_builder' as const, isFollowing: false },
];

const CreatorProfile: React.FC<CreatorProfileProps> = ({ creator, onClose, onSelectApp, isFirstTimeEarn = false }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [viewingList, setViewingList] = useState<'followers' | 'following' | null>(null);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const { count: bookmarkCount } = useBookmarks();

  const creatorProducts = MOCK_APPS.filter(app => app.creator.handle === creator.handle);
  const isTeam = creator.type === 'Team';

  const badgeTypes = useMemo(() => {
    return (creator.badges || [])
      .sort((a, b) => (SEAL_METADATA[b.type]?.tier || 0) - (SEAL_METADATA[a.type]?.tier || 0))
      .map(b => b.type);
  }, [creator.badges]);

  const primaryBadge = badgeTypes[0] ? SEAL_METADATA[badgeTypes[0]] : null;

  useEffect(() => {
    if (isFirstTimeEarn && !acknowledged) {
      const rippleTimer = window.setTimeout(() => setShowRipple(true), 900);
      const cleanupTimer = window.setTimeout(() => {
        setShowRipple(false);
        setAcknowledged(true);
      }, 3000);
      return () => { clearTimeout(rippleTimer); clearTimeout(cleanupTimer); };
    }
  }, [isFirstTimeEarn, acknowledged]);

  const MetricItem = ({ label, value, onClick }: { label: string, value: string, onClick: () => void }) => (
    <button onClick={onClick} className="flex flex-col items-center group/metric transition-transform active:scale-95">
      <span className="text-xl font-bold text-gray-900 leading-none group-hover:text-blue-500 transition-colors">{value}</span>
      <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-1.5">{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[150] bg-white overflow-y-auto scroll-smooth animate-in fade-in duration-500">
      <div className="relative pt-24 pb-20 px-6 border-b border-gray-50 bg-gradient-to-b from-[#fafafa] to-white">
        <button onClick={onClose} className="absolute top-8 left-6 md:left-12 flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-all group">
          <div className="w-9 h-9 rounded-full bg-white border border-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.2em] hidden sm:inline">Back</span>
        </button>

        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          <div className="mb-12 relative">
             <div className={`avatar-shell w-28 h-28 md:w-36 md:h-36 border-[3.5px] p-1.5 transition-all duration-700 bg-white ${isTeam ? 'border-dashed' : 'border-solid'}`} style={{ borderColor: primaryBadge?.auraColor || '#f3f4f6' }}>
               <div className="vj-aura" style={{ background: primaryBadge?.auraColor || '#EAEAEA', opacity: 0.35 }} />
               <img src={creator.avatar} className="w-full h-full rounded-full object-cover relative z-10" alt={creator.name} />
               {showRipple && (
                <div className="absolute inset-[-6px] rounded-full border-[2px] opacity-0" style={{ borderColor: primaryBadge?.auraColor || '#E2E8F0', animation: 'aura-ripple 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards' }} />
              )}
             </div>
          </div>
          
          <div className="mb-8">
            <div className="flex items-baseline justify-center gap-3 mb-2">
              <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter leading-none">
                {creator.name}
              </h1>
              <BadgeRow badges={badgeTypes} limit={3} size="md" />
            </div>
            <p className="text-sm font-bold text-gray-300 uppercase tracking-[0.4em] mb-6">{creator.handle}</p>
          </div>
          
          <div className="flex flex-col items-center gap-10">
            <button onClick={() => setIsFollowing(!isFollowing)} className={`min-w-[180px] py-4 px-12 rounded-[24px] font-black text-[12px] uppercase tracking-[0.2em] transition-all ${isFollowing ? 'bg-white text-gray-400 border border-gray-100 shadow-sm' : 'bg-gray-900 text-white shadow-2xl shadow-gray-900/10 active:scale-95'}`}>
              {isFollowing ? 'Following' : 'Follow'}
            </button>

            <div className="flex items-center gap-12">
              <MetricItem label="Followers" value="2.4k" onClick={() => setViewingList('followers')} />
              <div className="w-px h-6 bg-gray-100" />
              <MetricItem label="Following" value="118" onClick={() => setViewingList('following')} />
              <div className="w-px h-6 bg-gray-100" />
              <MetricItem label="Bookmarks" value={bookmarkCount.toString()} onClick={() => setShowBookmarks(true)} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6">
        <div className="flex flex-col py-20 border-b border-gray-50">
          <div className="flex items-center justify-center gap-16 md:gap-24">
            {[{ label: 'Products', value: creatorProducts.length }, { label: 'Reach', value: '14.2k' }, { label: 'Signals', value: creatorProducts[0]?.stats.revenue || '$0' }].map((stat) => (
              <div key={stat.label} className="text-center group/stat">
                <span className="block text-3xl font-black text-gray-900 tracking-tighter group-hover/stat:text-blue-500 transition-colors">{stat.value}</span>
                <span className="block text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mt-2 leading-none">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-20 pb-40">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {creatorProducts.map(app => (
            <AppCard key={app.id} project={app} onClick={() => onSelectApp(app)} />
          ))}
        </div>
      </div>

      {viewingList && (
        <SocialListPanel 
          title={viewingList === 'followers' ? 'Followers' : 'Following'}
          count={viewingList === 'followers' ? '2.4k' : '118'}
          users={MOCK_TEAM_MEMBERS}
          onClose={() => setViewingList(null)}
          onSelectUser={() => setViewingList(null)}
        />
      )}

      {showBookmarks && (
        <BookmarksPanel 
          onClose={() => setShowBookmarks(false)}
          onSelectJam={(id) => {
            const jam = MOCK_APPS.find(a => a.id === id);
            if (jam) {
              onSelectApp(jam);
              setShowBookmarks(false);
            }
          }}
          onDiscover={() => {
            setShowBookmarks(false);
            onClose();
          }}
        />
      )}

      <style>{`
        @keyframes aura-ripple { 0% { transform: scale(1); opacity: 0.2; } 100% { transform: scale(1.15); opacity: 0; } }
      `}</style>
    </div>
  );
};

export default CreatorProfile;
