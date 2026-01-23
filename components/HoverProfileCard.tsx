
import React from 'react';
import Badge, { BadgeRow } from './Badge';

interface HoverProfileCardProps {
  user: {
    name: string;
    handle: string;
    avatar: string;
    auraColor?: string;
    bio?: string;
    badge?: any;
    stats?: {
      products: number;
      reach: string;
      signals: string;
    };
    isFollowing?: boolean;
    badges?: any[];
  };
  position: { top: number; left: number };
  visible: boolean;
}

const HoverProfileCard: React.FC<HoverProfileCardProps> = ({ user, position, visible }) => {
  return (
    <div 
      data-vj-hover-card
      data-state={visible ? "open" : "closed"}
      data-side="right"
      style={{ 
        top: position.top, 
        left: position.left
      }}
    >
      <div className="vj-hover-inner">
        <div className="vj-hover-id">
          <div className="vj-hover-avatar avatar-shell">
            <div className="vj-aura" style={{ background: user.auraColor }} />
            <img src={user.avatar} alt={user.name} className="relative z-10" />
          </div>
          <div className="vj-hover-name">
            <div className="flex items-center gap-2">
              <span className="name">{user.name}</span>
              {user.badge && <Badge type={user.badge} showTooltip={false} size="sm" />}
            </div>
            <span className="handle">{user.handle}</span>
          </div>
        </div>

        <div className="vj-hover-bio">
          {user.bio || "Independent architect shaping lifestyle experiences."}
        </div>

        <div className="vj-hover-signals">
          <span>{user.stats?.products || 1} Product</span>
          <span className="dot">•</span>
          <span>{user.stats?.reach || '2.4k'} Reach</span>
          <span className="dot">•</span>
          <span>{user.stats?.signals || '$2.1k'} Signals</span>
        </div>

        <div className="vj-hover-actions">
          <button className="btn-follow">
            {user.isFollowing ? 'Following' : 'Follow'}
          </button>
          <a href="#" className="link-profile" onClick={(e) => e.preventDefault()}>
            View Profile →
          </a>
        </div>
      </div>
      <div className="vj-hover-arrow" />
    </div>
  );
};

export default HoverProfileCard;
