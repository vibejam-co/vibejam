import React, { useState, useRef, useEffect } from 'react';
import { THEME_REGISTRY } from '../../theme/ThemeRegistry';
import { LAYOUT_PRESETS, LayoutArchetype } from '../../layout/LayoutConfig';
import { THEME_EXPRESSIONS } from '../../theme/ThemeExpression';

interface ThemeControlCenterProps {
  currentThemeId: string;
  currentLayoutId: string;
  onThemeChange: (themeId: string) => void;
  onLayoutChange: (layoutId: LayoutArchetype) => void;
  onReset: () => void;
}

// Theme color indicators for visual preview
const THEME_INDICATORS: Record<string, { bg: string; accent: string }> = {
  frosted: { bg: 'bg-gradient-to-br from-sky-100 to-white', accent: 'bg-sky-400' },
  midnight: { bg: 'bg-gradient-to-br from-zinc-900 to-black', accent: 'bg-amber-500' },
  playful: { bg: 'bg-gradient-to-br from-violet-200 to-pink-100', accent: 'bg-fuchsia-500' },
  brutalist: { bg: 'bg-white border-2 border-black', accent: 'bg-black' },
  experimental: { bg: 'bg-gradient-to-br from-violet-950 to-black', accent: 'bg-violet-400' }
};

// Layout icons using simple geometric shapes
const LAYOUT_ICONS: Record<LayoutArchetype, React.ReactNode> = {
  chronicle: (
    <div className="flex flex-col gap-0.5 w-4 h-4">
      <div className="h-1 bg-current rounded-sm" />
      <div className="h-1 bg-current rounded-sm opacity-60" />
      <div className="h-1 bg-current rounded-sm opacity-40" />
    </div>
  ),
  gallery: (
    <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
      <div className="bg-current rounded-sm" />
      <div className="bg-current rounded-sm opacity-70" />
      <div className="bg-current rounded-sm opacity-70" />
      <div className="bg-current rounded-sm opacity-40" />
    </div>
  ),
  minimal: (
    <div className="flex items-center justify-center w-4 h-4">
      <div className="w-2 h-2 bg-current rounded-full" />
    </div>
  ),
  narrative: (
    <div className="flex flex-col gap-0.5 w-4 h-4 items-center">
      <div className="w-3 h-1 bg-current rounded-sm" />
      <div className="w-4 h-0.5 bg-current rounded-sm opacity-50" />
      <div className="w-4 h-0.5 bg-current rounded-sm opacity-50" />
    </div>
  ),
  experimental: (
    <div className="w-4 h-4 relative">
      <div className="absolute inset-0 bg-current opacity-20 rotate-12 rounded-sm" />
      <div className="absolute inset-0 bg-current opacity-40 -rotate-6 rounded-sm" />
    </div>
  )
};

const ThemeControlCenter: React.FC<ThemeControlCenterProps> = ({
  currentThemeId,
  currentLayoutId,
  onThemeChange,
  onLayoutChange,
  onReset,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'theme' | 'layout'>('theme');
  const panelRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const layouts = Object.keys(LAYOUT_PRESETS) as LayoutArchetype[];
  const themes = Object.keys(THEME_REGISTRY).filter((t) => t !== 'default');

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      {/* FLOATING TRIGGER — Creative, not utility */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative overflow-hidden"
        >
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-amber-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Main button */}
          <div className="relative flex items-center gap-3 bg-black/90 backdrop-blur-xl text-white px-5 py-3 rounded-2xl shadow-2xl shadow-black/30 border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105">
            {/* Theme preview dot */}
            <div className={`w-3 h-3 rounded-full ${THEME_INDICATORS[currentThemeId]?.accent || 'bg-white'} shadow-lg`} />
            
            <span className="text-sm font-medium tracking-wide">Control</span>
            
            {/* Keyboard hint */}
            <kbd className="hidden sm:inline-flex items-center justify-center w-6 h-6 rounded-md bg-white/10 text-[10px] font-mono text-white/50">
              C
            </kbd>
          </div>
        </button>
      )}

      {/* CONTROL CENTER PANEL — Apple Control Center × Figma × Audio Mixer */}
      {isOpen && (
        <div
          ref={panelRef}
          className="relative overflow-hidden"
        >
          {/* Backdrop glow */}
          <div className="absolute -inset-4 bg-gradient-to-br from-violet-500/10 via-transparent to-fuchsia-500/10 blur-3xl" />
          
          {/* Main panel */}
          <div className="relative bg-black/95 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl shadow-black/50 w-80 overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Control Center
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Section Tabs */}
            <div className="flex p-2 gap-1">
              <button
                onClick={() => setActiveSection('theme')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-widest transition-all duration-300 ${
                  activeSection === 'theme'
                    ? 'bg-white text-black shadow-lg'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                Theme
              </button>
              <button
                onClick={() => setActiveSection('layout')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-widest transition-all duration-300 ${
                  activeSection === 'layout'
                    ? 'bg-white text-black shadow-lg'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                Layout
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              
              {/* THEME SECTION — Visual swatches, not lists */}
              {activeSection === 'theme' && (
                <div className="space-y-3">
                  {themes.map((themeId) => {
                    const isActive = currentThemeId === themeId;
                    const indicator = THEME_INDICATORS[themeId] || { bg: 'bg-zinc-800', accent: 'bg-zinc-400' };
                    const expression = THEME_EXPRESSIONS[themeId];
                    
                    return (
                      <button
                        key={themeId}
                        onClick={() => onThemeChange(themeId)}
                        className={`w-full group relative overflow-hidden rounded-2xl transition-all duration-300 ${
                          isActive ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-[1.02]' : 'hover:scale-[1.01]'
                        }`}
                      >
                        {/* Preview background */}
                        <div className={`h-16 ${indicator.bg} transition-transform duration-500 group-hover:scale-105`} />
                        
                        {/* Info overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-3">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${indicator.accent}`} />
                              <span className="text-white font-semibold text-sm capitalize">
                                {themeId}
                              </span>
                            </div>
                            {expression && (
                              <span className="text-white/40 text-[10px] uppercase tracking-wider">
                                {expression.materialMetaphor}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Active indicator */}
                        {isActive && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* LAYOUT SECTION — Visual archetypes */}
              {activeSection === 'layout' && (
                <div className="grid grid-cols-2 gap-2">
                  {layouts.map((layoutId) => {
                    const isActive = currentLayoutId === layoutId;
                    
                    return (
                      <button
                        key={layoutId}
                        onClick={() => onLayoutChange(layoutId)}
                        className={`relative p-4 rounded-2xl border transition-all duration-300 ${
                          isActive
                            ? 'bg-white text-black border-white shadow-lg'
                            : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className={isActive ? 'text-black' : 'text-white/50'}>
                            {LAYOUT_ICONS[layoutId]}
                          </div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider">
                            {layoutId}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer — Reset Action */}
            <div className="px-4 pb-4">
              <button
                onClick={onReset}
                className="w-full py-2.5 rounded-xl text-xs font-medium text-white/30 hover:text-white/60 hover:bg-white/5 transition-all duration-300 uppercase tracking-widest"
              >
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeControlCenter;
