import React from 'react';

/**
 * Metadata for all available badges in the system.
 */
export const SEAL_METADATA: Record<string, { label: string; icon: string; auraColor: string; description: string }> = {
  founding_creator: {
    label: 'Founding Creator',
    icon: '💎',
    auraColor: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', // Gold aura
    description: 'Among the first to build and ship on VibeJam.'
  },
  founding_member: {
    label: 'Founding Member',
    icon: '⚡',
    auraColor: 'linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)', // Electric blue/purple
    description: 'A pioneer in the VibeJam community.'
  },
  early_access: {
    label: 'Early Access',
    icon: '🛡️',
    auraColor: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
    description: 'Joined during the private beta.'
  },
  breakout_creator: {
    label: 'Breakout Creator',
    icon: '🚀',
    auraColor: 'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)',
    description: 'Recognized for explosive growth and engagement.'
  },
  consistent_shipper: {
    label: 'Consistent Shipper',
    icon: '📦',
    auraColor: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    description: 'Maintains a high cadence of quality updates.'
  },
  revenue_verified: {
    label: 'Revenue Verified',
    icon: '💰',
    auraColor: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
    description: 'Proof of real, sustainable growth.'
  }
};

interface BadgeProps {
  type: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const Badge: React.FC<BadgeProps> = ({ type, size = 'md', showTooltip = false }) => {
  const metadata = SEAL_METADATA[type];
  if (!metadata) return null;

  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-xl'
  };

  return (
    <div className="relative group/badge inline-block">
      <div 
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center bg-white border border-gray-100 shadow-sm relative z-10`}
        title={!showTooltip ? metadata.description : undefined}
      >
        <span>{metadata.icon}</span>
      </div>
      
      {/* Aura Effect */}
      <div 
        className="absolute inset-[-4px] rounded-full opacity-20 blur-sm group-hover/badge:opacity-40 transition-opacity duration-700"
        style={{ background: metadata.auraColor }}
      />

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-4 bg-gray-900 rounded-2xl opacity-0 group-hover/badge:opacity-100 transition-all pointer-events-none z-[200]">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs">{metadata.icon}</span>
            <span className="text-[10px] font-black text-white uppercase tracking-widest">{metadata.label}</span>
          </div>
          <p className="text-[10px] text-gray-400 leading-relaxed font-medium">{metadata.description}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 -translate-y-1" />
        </div>
      )}
    </div>
  );
};

export default Badge;
