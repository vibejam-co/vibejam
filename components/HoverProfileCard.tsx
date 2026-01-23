
import React from 'react';
import Badge from './Badge';

interface HoverProfileCardProps {
  user: {
    name: string;
    handle: string;
    avatar: string;
    auraColor?: string;
    bio?: string;
    badge?: any;
    stats?: { products: number; reach: string; signals: string; };
    isFollowing?: boolean;
    badges?: any[];
  };
  position: { top: number; left: number };
  visible: boolean;
}

const HoverProfileCard: React.FC<HoverProfileCardProps> = ({ user, position, visible }) => {
  if (!user) return null;
  return (
    <div className={`fixed z-[9999] w-[280px] bg-white border border-gray-100 rounded-2xl shadow-xl transition-all duration-200 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`} style={{ top: position.top, left: position.left }}>
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-full border border-gray-100 overflow-hidden bg-white"><img src={user.avatar} alt={user.name} /></div>
          <div>
            <div className="flex items-center gap-2"><span className="font-bold text-gray-900">{user.name}</span>{user.badge && <Badge type={user.badge} showTooltip={false} size="sm" />}</div>
            <span className="text-[11px] font-bold text-gray-300 uppercase tracking-widest">{user.handle}</span>
          </div>
        </div>
        <div className="text-xs text-gray-500 font-medium leading-relaxed mb-4">{user.bio || "Independent architect shaping lifestyle experiences."}</div>
        <div className="flex items-center gap-2 text-[9px] font-black text-gray-300 uppercase tracking-widest mb-4"><span>{user.stats?.products || 1} Product</span><span>•</span><span>{user.stats?.reach || '2.4k'} Reach</span></div>
        <div className="flex items-center gap-3"><button className="flex-1 py-2 rounded-lg bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest">{user.isFollowing ? 'Following' : 'Follow'}</button></div>
      </div>
    </div>
  );
};

export default HoverProfileCard;
