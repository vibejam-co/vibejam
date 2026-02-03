import React, { useState, useEffect } from 'react';
import { ThemeConfigV1 } from '../../theme/ThemeConfig';
import { THEME_REGISTRY, getThemeById } from '../../theme/ThemeRegistry';
import { ThemeClasses, resolveThemeClasses } from '../../theme/ThemeClasses';

interface ThemeControlDockProps {
    currentThemeId: string;
    activeConfig: ThemeConfigV1;
    isOwner: boolean;
    isRemixing: boolean;
    onThemeSelect: (themeId: string) => void;
    onRemix: () => void;
    onUndoRemix?: () => void;
    onKeepRemix?: () => void;
}

const ThemeControlDock: React.FC<ThemeControlDockProps> = ({
    currentThemeId,
    activeConfig,
    isOwner,
    isRemixing,
    onThemeSelect,
    onRemix,
    onUndoRemix,
    onKeepRemix
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOwner || !mounted) return null;

    const themes = Object.entries(THEME_REGISTRY).filter(([id]) => id !== 'default'); // Show presets

    // Resolve current theme classes for the orb preview
    const currentThemeClasses = resolveThemeClasses(activeConfig);

    return (
        <div
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[400] flex flex-col items-center justify-end pointer-events-none"
            style={{ perspective: '1000px' }}
        >
            {/* The Dynamic Island Dock */}
            <div
                className={`
          pointer-events-auto
          relative flex items-center gap-4
          transition-all duration-500 cubic-bezier(0.19, 1, 0.22, 1)
          ${isExpanded
                        ? 'w-auto px-4 py-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl border border-white/20 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] rounded-[32px]'
                        : 'w-16 h-16 rounded-full hover:scale-105 active:scale-95 cursor-pointer'}
        `}
                onMouseEnter={() => setIsExpanded(true)}
                onMouseLeave={() => setIsExpanded(false)}
            >
                {/* Vibe Orb (Collapsed State) */}
                {!isExpanded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`w-10 h-10 rounded-full shadow-lg animate-pulse bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 ring-2 ring-white/30`} />
                    </div>
                )}

                {/* Expanded Content */}
                {isExpanded && (
                    <>
                        {/* Theme Cards Deck */}
                        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1 px-1 max-w-[60vw]">
                            {themes.map(([id, config]) => {
                                const isActive = currentThemeId === id;
                                const previewClasses = resolveThemeClasses(config);
                                // Mini preview card
                                return (
                                    <button
                                        key={id}
                                        onClick={() => onThemeSelect(id)}
                                        className={`
                       group relative flex-shrink-0 w-16 h-24 rounded-2xl border transition-all duration-300
                       ${isActive ? 'scale-105 ring-2 ring-indigo-500 border-transparent shadow-xl z-10' : 'scale-100 border-white/20 bg-white/5 hover:scale-105 hover:bg-white/10 hover:border-white/40 opacity-80 hover:opacity-100'}
                     `}
                                    >
                                        {/* Preview Content */}
                                        <div className={`absolute inset-0 rounded-2xl overflow-hidden ${previewClasses.page} ${previewClasses.surface} pointer-events-none !min-h-0 !p-2 flex flex-col gap-1`}>
                                            <div className={`w-3/4 h-2 rounded-full ${previewClasses.accent} opacity-40`} />
                                            <div className={`w-full h-8 rounded-lg ${previewClasses.card} opacity-60`} />
                                        </div>
                                        {/* Label overlay */}
                                        <div className="absolute inset-x-0 bottom-1 text-[8px] font-bold text-center uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity text-current mix-blend-difference">
                                            {id}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="w-px h-8 bg-gray-500/20 mx-1" />

                        {/* AI Remix Spinner */}
                        {isRemixing ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={onUndoRemix}
                                    className="px-4 py-2 rounded-full text-xs font-bold border border-white/20 bg-black/5 hover:bg-black/10 transition-colors"
                                >
                                    Undo
                                </button>
                                <button
                                    onClick={onKeepRemix}
                                    className="px-4 py-2 rounded-full text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
                                >
                                    Keep It
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={onRemix}
                                title="Remix with AI"
                                className="
                  group relative w-12 h-12 flex items-center justify-center rounded-full 
                  bg-gradient-to-tr from-white/10 to-white/5 border border-white/20
                  hover:bg-white/20 hover:scale-110 active:scale-95 transition-all
                  shadow-lg
                "
                            >
                                <span className="text-xl filter drop-shadow animate-pulse group-hover:animate-none">✨</span>
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ThemeControlDock;
