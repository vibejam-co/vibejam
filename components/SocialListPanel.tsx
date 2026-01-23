
import React, { useState, useRef } from 'react';
import Badge from './Badge';
import HoverProfileCard from './HoverProfileCard';

interface SocialUser {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  auraColor?: string;
  badge?: any;
  isFollowing?: boolean;
  bio?: string;
  stats?: { products: number; reach: string; signals: string; };
}

interface SocialListPanelProps {
  title: 'Followers' | 'Following';
  count: string;
  users: SocialUser[];
  onClose: () => void;
  onSelectUser: (user: any) => void;
}

const SocialListPanel: React.FC<SocialListPanelProps> = ({ title, count, users, onClose, onSelectUser }) => {
  const [hoveredUser, setHoveredUser] = useState<SocialUser | null>(null);
  const [cardPos, setCardPos] = useState({ top: 0, left: 0 });
  const hoverTimeout = useRef<number | null>(null);

  const handleMouseEnter = (e: React.MouseEvent, user: SocialUser) => {
    if (window.innerWidth < 1024) return; // Only hover on desktop
    if (hoverTimeout.current) window.clearTimeout(hoverTimeout.current);
    
    const rect = e.currentTarget.getBoundingClientRect();
    // Position 12px to the right of the row
    setCardPos({ top: rect.top, left: rect.right + 12 });
    setHoveredUser(user);
  };

  const handleMouseLeave = () => {
    hoverTimeout.current = window.setTimeout(() => setHoveredUser(null), 100);
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-end md:items-center justify-center animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/5 backdrop-blur-[2px]" onClick={onClose} />
      
      <div 
        className="relative w-full max-w-[560px] bg-white rounded-t-[32px] md:rounded-[32px] shadow-[0_-24px_80px_rgba(0,0,0,0.12),0_12px_48px_rgba(0,0,0,0.08)] flex flex-col max-h-[75vh] animate-in slide-in-from-bottom-full md:slide-in-from-bottom-8 duration-500 ease-out"
        role="dialog"
        aria-modal="true"
      >
        <header className="flex items-center justify-between px-8 h-20 border-b border-gray-50 shrink-0">
          <div className="flex items-center gap-6">
            <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors hover:bg-gray-50">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h2>
          </div>
          <span className="text-sm font-black text-gray-300 uppercase tracking-widest">{count}</span>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 scrollbar-hide" data-vj-hover-root>
          {users.length > 0 ? (
            users.map((user) => (
              <div 
                key={user.id} 
                data-vj-hover-anchor
                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50/80 transition-all group w-full"
                onMouseEnter={(e) => handleMouseEnter(e, user)}
                onMouseLeave={handleMouseLeave}
              >
                <div className="relative shrink-0 aura-clip cursor-pointer" onClick={() => onSelectUser(user)}>
                  <div className="w-10 h-10 rounded-full border border-gray-100 overflow-hidden relative z-10 bg-white">
                    <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
                  </div>
                  {user.auraColor && (
                    <div className="aura-halo" style={{ background: user.auraColor, opacity: 0.15, inset: '-2px', filter: 'blur(4px)' }} />
                  )}
                  {user.badge && (
                    <div className="absolute -bottom-1 -right-1 scale-[0.4] origin-bottom-right z-20">
                      <Badge type={user.badge} showTooltip={false} />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelectUser(user)}>
                  <p className="text-sm font-bold text-gray-900 leading-tight group-hover:text-blue-500 transition-colors truncate">{user.name}</p>
                  <p className="text-xs font-medium text-gray-400 leading-tight truncate">{user.handle}</p>
                </div>

                <button className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${user.isFollowing ? 'border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50/30' : 'bg-gray-900 text-white shadow-sm hover:scale-105 active:scale-95'}`}>
                  {user.isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm font-bold text-gray-900 mb-1">{title === 'Followers' ? 'No followers yet' : 'Not following anyone yet'}</p>
              <p className="text-xs font-medium text-gray-400 max-w-[200px] leading-relaxed">{title === 'Followers' ? 'People who follow this profile will appear here.' : 'Start exploring Jams to find people to follow.'}</p>
            </div>
          )}
        </div>
      </div>

      <HoverProfileCard 
        user={{
          name: hoveredUser?.name || '',
          handle: hoveredUser?.handle || '',
          avatar: hoveredUser?.avatar || '',
          auraColor: hoveredUser?.auraColor,
          badge: hoveredUser?.badge,
          bio: hoveredUser?.bio,
          stats: hoveredUser?.stats,
          isFollowing: hoveredUser?.isFollowing
        }} 
        position={cardPos} 
        visible={!!hoveredUser} 
      />
    </div>
  );
};

export default SocialListPanel;
