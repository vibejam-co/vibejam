import React, { useState, useRef, useEffect } from 'react';
import { THEME_REGISTRY, getThemeBehaviorById, getThemeDominanceById, getThemeContrastById, getThemeMaterialById } from '../../theme/ThemeRegistry';
import { LAYOUT_PRESETS, LayoutArchetype } from '../../layout/LayoutConfig';
import { THEME_EXPRESSIONS } from '../../theme/ThemeExpression';

interface ThemeControlCenterProps {
  currentThemeId: string;
  currentLayoutId: string;
  identityWeight: 'light' | 'committed' | 'locked';
  isPreviewing: boolean;
  materialLabel: string;
  credibilityLabel: string;
  followInsightLabel?: string;
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
  identityWeight,
  isPreviewing,
  materialLabel,
  credibilityLabel,
  followInsightLabel,
  onThemeChange,
  onLayoutChange,
  onReset,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'theme' | 'layout'>('theme');
  const [isChanging, setIsChanging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Performative theme switch
  const handleThemeChange = (themeId: string) => {
    setIsChanging(true);
    onThemeChange(themeId);
    setTimeout(() => setIsChanging(false), 300);
  };

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
  const material = getThemeMaterialById(currentThemeId);
  const materialMotion = (() => {
    const tension = material.interactionTension === 'soft'
      ? 'active:scale-[0.99]'
      : material.interactionTension === 'rigid'
        ? 'active:scale-[0.97]'
        : 'active:scale-[0.98]';
    const settle = material.settleBehavior === 'float'
      ? 'hover:-translate-y-0.5'
      : material.settleBehavior === 'sink'
        ? 'hover:translate-y-0.5'
        : '';
    const feedback = material.feedbackVisibility === 'assertive'
      ? 'focus-visible:ring-2 focus-visible:ring-white/30'
      : material.feedbackVisibility === 'present'
        ? 'focus-visible:ring-1 focus-visible:ring-white/20'
        : 'focus-visible:ring-1 focus-visible:ring-white/10';
    const weight = material.surfaceWeight === 'heavy'
      ? 'shadow-2xl'
      : material.surfaceWeight === 'light'
        ? 'shadow-lg'
        : 'shadow-xl';
    return `transition-[transform,box-shadow,opacity] duration-150 ease-out ${tension} ${settle} ${feedback} ${weight}`;
  })();

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
          <div className={`relative flex items-center gap-3 bg-black/90 backdrop-blur-xl text-white px-5 py-3 rounded-2xl shadow-2xl shadow-black/30 border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 ${materialMotion}`}>
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
              <div>
                <h3 className="text-sm font-semibold text-white tracking-wide">
                  Control Center
                </h3>
                <div className="text-[9px] uppercase tracking-widest text-white/40 mt-1">
                  {isPreviewing ? 'Previewing' : 'Committed'} · {identityWeight.replace('-', ' ')} · {materialLabel}
                </div>
                <div className="text-[9px] uppercase tracking-widest text-white/30 mt-1">
                  {credibilityLabel}
                </div>
                {followInsightLabel && (
                  <div className="text-[9px] uppercase tracking-widest text-white/30 mt-1">
                    {followInsightLabel}
                  </div>
                )}
              </div>
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
              
              {/* THEME SECTION — Audio Mixer Sliders */}
              {activeSection === 'theme' && (
                <div className="space-y-4">
                  {themes.map((themeId, index) => {
                    const isActive = currentThemeId === themeId;
                    const indicator = THEME_INDICATORS[themeId] || { bg: 'bg-zinc-800', accent: 'bg-zinc-400' };
                    const expression = THEME_EXPRESSIONS[themeId];
                    const behavior = getThemeBehaviorById(themeId);
                    const dominance = getThemeDominanceById(themeId);
                    const contrast = getThemeContrastById(themeId);
                    
                    return (
                      <button
                        key={themeId}
                        onClick={() => handleThemeChange(themeId)}
                        className={`w-full group relative overflow-hidden rounded-2xl transition-all duration-500 ${materialMotion} ${
                          isActive 
                            ? 'ring-[3px] ring-white/80 ring-offset-2 ring-offset-black shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)] scale-[1.02]' 
                            : 'hover:scale-[1.02] hover:shadow-lg'
                        } ${isChanging && isActive ? 'animate-pulse' : ''}`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {/* Preview background — more dramatic */}
                        <div className={`h-20 ${indicator.bg} relative`}>
                          {/* Active glow */}
                          {isActive && (
                            <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
                          )}
                        </div>
                        
                        {/* Info overlay — audio mixer style */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end p-4">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              {/* Bigger accent dot */}
                              <div className={`w-3 h-3 rounded-full ${indicator.accent} shadow-lg ${isActive ? 'animate-pulse' : ''}`} />
                              <div>
                                <span className="text-white font-bold text-sm uppercase tracking-wider">
                                  {themeId}
                                </span>
                                {expression && (
                                  <span className="block text-white/50 text-[9px] uppercase tracking-widest mt-0.5">
                                    {expression.materialMetaphor} · {expression.surfaceCharacter}
                                  </span>
                                )}
                                {behavior?.displayLabel && (
                                  <span className="block text-white/60 text-[9px] uppercase tracking-widest mt-0.5">
                                    {behavior.displayLabel}
                                  </span>
                                )}
                                {dominance?.displayLabel && (
                                  <span className="block text-white/50 text-[9px] uppercase tracking-widest mt-0.5">
                                    {dominance.displayLabel}
                                  </span>
                                )}
                                {contrast?.displayLabel && (
                                  <span className="block text-white/40 text-[9px] uppercase tracking-widest mt-0.5">
                                    Editor&apos;s POV · {contrast.displayLabel}
                                  </span>
                                )}
                              </div>
                            </div>
                            {/* Figma-style active pill */}
                            {isActive && (
                              <div className="px-2 py-1 rounded-full bg-white text-black text-[10px] font-bold uppercase tracking-wider">
                                Active
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* LAYOUT SECTION — Figma-style Grid Blocks */}
              {activeSection === 'layout' && (
                <div className="grid grid-cols-2 gap-3">
                  {layouts.map((layoutId) => {
                    const isActive = currentLayoutId === layoutId;
                    
                    return (
                      <button
                        key={layoutId}
                        onClick={() => onLayoutChange(layoutId)}
                        className={`relative group overflow-hidden rounded-2xl border transition-all duration-300 ${materialMotion} ${
                          isActive
                            ? 'bg-white text-black border-white shadow-[0_10px_40px_-10px_rgba(255,255,255,0.3)] scale-[1.02]'
                            : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:border-white/30'
                        }`}
                      >
                        {/* Preview canvas area */}
                        <div className="h-24 p-4 flex items-center justify-center bg-gradient-to-br from-white/5 to-white/0">
                          <div className={`transform transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                            {LAYOUT_ICONS[layoutId]}
                          </div>
                        </div>
                        
                        {/* Label bar */}
                        <div className={`px-3 py-2.5 flex items-center justify-between ${
                          isActive ? 'border-t border-black/10' : 'border-t border-white/10'
                        }`}>
                          <span className="text-[10px] font-bold uppercase tracking-widest">
                            {layoutId}
                          </span>
                          {isActive && (
                            <div className="w-4 h-4 rounded-full bg-black flex items-center justify-center">
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            </div>
                          )}
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
                className={`w-full py-2.5 rounded-xl text-xs font-medium text-white/30 hover:text-white/60 hover:bg-white/5 transition-all duration-300 uppercase tracking-widest ${materialMotion}`}
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
