
import React, { useState, useRef, useEffect } from 'react';
import { BadgeType } from '../types';

interface BadgeProps {
  type: BadgeType;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isNewEarn?: boolean;
  onAnimationComplete?: () => void;
}

/**
 * VibeJam v12.2 Badge Prominence Invariants
 * Seal = Solid Object (No blur, crisp glyph)
 * Aura = Pure Light (Behind, clipped, capped)
 * Shine = Micro-sweep for Tier ≥ 9 (Session-Guarded)
 * Settle = Tighten -> Release for Tier 10 (Synced with Shine)
 */

export const SEAL_METADATA: Record<BadgeType, {
  label: string,
  description: string,
  earned: string,
  status: string,
  scope: string,
  howToEarn?: string,
  icon: React.ReactNode,
  tier: number,
  color: string,
  accentClass: string,
  auraColor: string,
  motionType: 'static' | 'breathing' | 'refractive' | 'shimmer' | 'none'
}> = {
  founding_creator: {
    label: 'FOUNDER',
    description: 'Founding Creator',
    earned: 'JAN 2024',
    status: 'ACTIVE',
    scope: 'GLOBAL',
    tier: 10,
    color: 'text-[#E6C89A]',
    auraColor: '#E6C89A',
    motionType: 'static',
    accentClass: 'border-t-2 border-[#E6C89A]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    )
  },
  founding_member: {
    label: 'MEMBER',
    description: 'Founding Member',
    earned: 'JAN 2024',
    status: 'ACTIVE',
    scope: 'COMMUNITY',
    tier: 2,
    color: 'text-[#EAEAEA]',
    auraColor: '#EAEAEA',
    motionType: 'none',
    accentClass: 'border-t-2 border-[#EAEAEA]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <circle cx="12" cy="12" r="8" />
      </svg>
    )
  },
  early_access: {
    label: 'ADOPTER',
    description: 'Early Adopter',
    earned: 'FEB 2024',
    status: 'LEGACY',
    scope: 'BETA',
    tier: 1,
    color: 'text-[#EAEAEA]',
    auraColor: '#EAEAEA',
    motionType: 'none',
    accentClass: 'border-t-2 border-[#EAEAEA]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    )
  },
  breakout_creator: {
    label: 'PIONEER',
    description: 'Breakout Creator',
    earned: 'MAR 2024',
    status: 'ACTIVE',
    scope: 'TRENDING',
    tier: 6,
    color: 'text-[#C7D6EA]',
    auraColor: '#C7D6EA',
    motionType: 'breathing',
    accentClass: 'border-t-2 border-[#C7D6EA]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    )
  },
  consistent_shipper: {
    label: 'ICON',
    description: 'Consistent Shipper',
    earned: '2024',
    status: 'ACTIVE',
    scope: 'GLOBAL',
    tier: 7,
    color: 'text-[#C8C2D8]',
    auraColor: '#C8C2D8',
    motionType: 'shimmer',
    accentClass: 'border-t-2 border-[#C8C2D8]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <path d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    )
  },
  revenue_leader: {
    label: 'LEGEND',
    description: 'Revenue Leader',
    earned: '2024',
    status: 'VERIFIED',
    scope: 'FINANCIAL',
    tier: 9,
    color: 'text-[#A9D6C2]',
    auraColor: '#A9D6C2',
    motionType: 'refractive',
    accentClass: 'border-t-2 border-[#A9D6C2]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15" />
      </svg>
    ),
    howToEarn: 'Revenue data verified via Stripe or manual audit.'
  },
  cult_favorite: {
    label: 'FAVORITE',
    description: 'Cult Favorite',
    earned: '2024',
    status: 'ACTIVE',
    scope: 'CULTURAL',
    tier: 5,
    color: 'text-[#C7D6EA]',
    auraColor: '#C7D6EA',
    motionType: 'breathing',
    accentClass: '',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    )
  },
  top_curator: {
    label: 'CURATOR',
    description: 'Top Curator',
    earned: '2024',
    status: 'ACTIVE',
    scope: 'FEED',
    tier: 4,
    color: 'text-[#C7D6EA]',
    auraColor: '#C7D6EA',
    motionType: 'breathing',
    accentClass: '',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  },
  community_builder: {
    label: 'BUILDER',
    description: 'Community Builder',
    earned: '2024',
    status: 'ACTIVE',
    scope: 'ECOSYSTEM',
    tier: 3,
    color: 'text-[#EAEAEA]',
    auraColor: '#EAEAEA',
    motionType: 'none',
    accentClass: '',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
      </svg>
    )
  },
  insider: {
    label: 'INSIDER',
    description: 'Insider',
    earned: '2024',
    status: 'STEWARD',
    scope: 'CORE',
    tier: 8,
    color: 'text-[#C8C2D8]',
    auraColor: '#C8C2D8',
    motionType: 'shimmer',
    accentClass: 'border-t-2 border-[#C8C2D8]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    howToEarn: 'Identity and creator history verified by VibeJam.'
  }
};

export const BadgeRow: React.FC<{ badges?: BadgeType[], limit?: number, size?: 'sm' | 'md' }> = ({ badges, limit = 3, size = 'sm' }) => {
  if (!badges || badges.length === 0) return null;
  const displayBadges = badges.slice(0, limit);
  const overflow = badges.length - limit;

  return (
    <div className="flex items-center gap-1.5 h-6">
      {displayBadges.map((b, i) => (
        <Badge key={i} type={b} showTooltip size={size} />
      ))}
      {overflow > 0 && (
        <span className="px-1.5 h-4 flex items-center bg-white/80 backdrop-blur-md border border-black/5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] rounded-full text-[8px] font-black text-gray-400 uppercase tracking-widest tabular-nums">
          +{overflow}
        </span>
      )}
    </div>
  );
};

const Badge: React.FC<BadgeProps> = ({ type, showTooltip = true, size = 'sm', isNewEarn = false, onAnimationComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(isNewEarn);
  const [shine, setShine] = useState(false);
  const [settle, setSettle] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const meta = SEAL_METADATA[type];

  if (!meta) return null;

  const shouldShine = meta.tier >= 9;
  const SHINE_KEY = `vj_shine_v4_${type}`;

  useEffect(() => {
    if (isNewEarn) {
      const revealTimer = window.setTimeout(() => setIsOpen(true), 1400);
      const dismissTimer = window.setTimeout(() => {
        setIsOpen(false);
        setIsAnimating(false);
        onAnimationComplete?.();
      }, 3900);
      return () => { clearTimeout(revealTimer); clearTimeout(dismissTimer); };
    }
  }, [isNewEarn, onAnimationComplete]);

  useEffect(() => {
    if (!shouldShine) return;

    // One-time per session per badge type to prevent spamming
    if (typeof window !== 'undefined' && sessionStorage.getItem(SHINE_KEY) === '1') return;

    if (typeof window !== 'undefined') sessionStorage.setItem(SHINE_KEY, '1');

    const shineTimer = window.setTimeout(() => setShine(true), 250);

    // Tier 10: trigger settle near shine midpoint
    let tMid: number | undefined;
    if (meta.tier === 10) {
      tMid = window.setTimeout(() => {
        setSettle(true);
        window.setTimeout(() => setSettle(false), 280);
      }, 260); // midpoint-ish of sweep
    }

    const duration = meta.tier === 10 ? 650 : 620;
    const cleanupTimer = window.setTimeout(() => setShine(false), duration + 300);

    return () => {
      clearTimeout(shineTimer);
      clearTimeout(cleanupTimer);
      if (tMid) clearTimeout(tMid);
    };
  }, [shouldShine, type, meta.tier]);

  const handleEnter = () => {
    if (!showTooltip || isAnimating) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setIsOpen(true), 120);
  };

  const handleLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setIsOpen(false), 150);
  };

  const sizePx = size === 'sm' ? 'w-5 h-5' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8';

  return (
    <div
      className="relative inline-flex items-center group/badge"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {/* 1) Shell & Aura Layer */}
      <div className={`avatar-shell ${sizePx} flex items-center justify-center cursor-help`}>
        <div
          className="vj-aura"
          style={{ background: meta.auraColor, opacity: 0.25 }}
        />

        {/* 2) Solid Seal Body */}
        <div
          className={`vj-seal-body relative z-10 w-full h-full rounded-full bg-white/95 border border-black/5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex items-center justify-center transition-all duration-300 before:content-[""] before:absolute before:inset-[1px] before:rounded-full before:bg-gradient-to-b before:from-white/70 before:to-transparent ${isOpen ? '-translate-y-0.5 shadow-md' : ''}`}
          data-settle={settle ? "on" : "off"}
        >
          {/* Tier-Differentiated Micro-shine sweep (tier ≥ 9 only) */}
          {shouldShine && (
            <span
              className="vj-seal-shine"
              data-shine={shine ? 'on' : 'off'}
              data-tier={String(meta.tier)}
              aria-hidden="true"
            />
          )}

          <div className={`relative z-10 w-[55%] h-[55%] ${meta.color} transition-transform duration-300 ${isOpen ? 'scale-110' : ''}`}>
            {meta.icon}
          </div>
        </div>
      </div>

      {showTooltip && isOpen && (
        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-[240px] z-[400] bg-white border border-[#F2F2F7] rounded-[16px] shadow-[0_12px_32px_-4px_rgba(0,0,0,0.08)] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 ease-out ${meta.accentClass}`}>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-9 h-9 rounded-full bg-white border border-[#F2F2F7] flex items-center justify-center ${meta.color} shrink-0 shadow-sm`}>
                <div className="w-[55%] h-[55%]">{meta.icon}</div>
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-[#1C1C1E] leading-tight truncate uppercase tracking-tight">{meta.label}</p>
                <p className="text-[11px] text-[#8E8E93] leading-tight truncate">{meta.description}</p>
              </div>
            </div>
            <div className="h-[0.5px] bg-[#F2F2F7] -mx-4 mb-4" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[8px] font-black text-[#C6C6C8] uppercase tracking-wider mb-0.5">Earned</p>
                <p className="text-[10px] font-bold text-[#1C1C1E]">{meta.earned}</p>
              </div>
              <div>
                <p className="text-[8px] font-black text-[#C6C6C8] uppercase tracking-wider mb-0.5">Status</p>
                <p className="text-[10px] font-bold text-[#1C1C1E]">{meta.status}</p>
              </div>
            </div>
            {meta.howToEarn && (
              <div className="mt-3 pt-3 border-t border-[#F2F2F7]">
                <p className="text-[9px] font-medium text-[#8E8E93] leading-relaxed italic">
                  {meta.howToEarn}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Badge;
