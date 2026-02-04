import React, { useState, useRef, useEffect } from 'react';
import { THEME_REGISTRY } from '../../theme/ThemeRegistry';
import { LAYOUT_PRESETS, LayoutArchetype } from '../../layout/LayoutConfig';

interface ThemeControlCenterProps {
  currentThemeId: string;
  currentLayoutId: string;
  onThemeChange: (themeId: string) => void;
  onLayoutChange: (layoutId: LayoutArchetype) => void;
  onReset: () => void;
}

const ThemeControlCenter: React.FC<ThemeControlCenterProps> = ({
  currentThemeId,
  currentLayoutId,
  onThemeChange,
  onLayoutChange,
  onReset,
}) => {
  const [isOpen, setIsOpen] = useState(false);
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
    <div className="fixed bottom-4 right-4 z-[9999] font-sans">
      {/* 1. Entry Point (Floating Control Pill) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-white/90 backdrop-blur-md border border-gray-200 shadow-sm hover:shadow-md text-gray-800 text-xs font-medium px-4 py-2 rounded-full transition-all duration-200 ease-in-out transform hover:scale-105"
        >
          Label: Control
        </button>
      )}

      {/* 2. Control Center Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-4 w-64 animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200/50">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Control Center
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* 3. Sections */}
            
            {/* 🎨 Theme Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                🎨 Theme
              </label>
              <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                {themes.map((themeId) => (
                  <button
                    key={themeId}
                    onClick={() => onThemeChange(themeId)}
                    className={`text-left text-xs px-2 py-1.5 rounded-md transition-colors ${
                      currentThemeId === themeId
                        ? 'bg-blue-500 text-white font-medium shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100/50'
                    }`}
                  >
                    {themeId.charAt(0).toUpperCase() + themeId.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* 🧩 Layout Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                🧩 Layout
              </label>
              <div className="grid grid-cols-1 gap-1">
                {layouts.map((layoutId) => (
                  <button
                    key={layoutId}
                    onClick={() => onLayoutChange(layoutId)}
                    className={`text-left text-xs px-2 py-1.5 rounded-md transition-colors ${
                      currentLayoutId === layoutId
                        ? 'bg-indigo-500 text-white font-medium shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100/50'
                    }`}
                  >
                    {layoutId.charAt(0).toUpperCase() + layoutId.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* 🔁 Actions */}
            <div className="pt-2 border-t border-gray-200/50">
              <button
                onClick={onReset}
                className="w-full text-center text-xs text-red-500 hover:text-red-600 font-medium py-1.5 hover:bg-red-50 rounded-md transition-colors"
              >
                Reset Defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeControlCenter;
