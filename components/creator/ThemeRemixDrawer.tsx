import React, { useState } from 'react';
import { ThemeRemixResult } from '../../theme/ThemeRemix';

interface ThemeRemixDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onRemix: (prompt: string) => Promise<ThemeRemixResult | null>;
    isProcessing: boolean;
    lastRemix?: ThemeRemixResult;
}

const ThemeRemixDrawer: React.FC<ThemeRemixDrawerProps> = ({
    isOpen,
    onClose,
    onRemix,
    isProcessing,
    lastRemix
}) => {
    const [prompt, setPrompt] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || isProcessing) return;
        await onRemix(prompt);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[400] flex items-end justify-center pointer-events-none">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-700 pointer-events-auto ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={`
          relative w-full max-w-xl bg-white/80 backdrop-blur-3xl border border-white/40 rounded-t-[40px] shadow-[0_-32px_128px_-32px_rgba(0,0,0,0.2)] p-8 pointer-events-auto
          transition-transform duration-700 cubic-bezier(0.16, 1, 0.3, 1)
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
            >
                {/* Handle */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-900/10 rounded-full" />

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase mb-2">Remix Vibe</h2>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Type your mood, AI does the rest.</p>
                </div>

                <form onSubmit={handleSubmit} className="relative">
                    <input
                        autoFocus
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        disabled={isProcessing}
                        placeholder="e.g. 1970s jazz poster, underwater sanctuary, vaporwave..."
                        className={`
              w-full h-16 px-6 bg-gray-50/50 border border-gray-100 rounded-2xl text-lg font-medium text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/5 transition-all
              ${isProcessing ? 'opacity-50' : 'opacity-100'}
            `}
                    />

                    <button
                        type="submit"
                        disabled={!prompt.trim() || isProcessing}
                        className={`
              absolute right-2 top-2 h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all
              ${isProcessing ? 'bg-gray-100 text-gray-400' : 'bg-gray-900 text-white hover:scale-105 active:scale-95 shadow-lg shadow-gray-900/20'}
              disabled:opacity-50 disabled:scale-100
            `}
                    >
                        {isProcessing ? (
                            <span className="flex items-center gap-2">
                                <div className="w-3 h-3 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
                                Brewing...
                            </span>
                        ) : 'Mutate'}
                    </button>
                </form>

                {lastRemix?.explanation && (
                    <div className="mt-6 flex items-start gap-3 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs shadow-sm">✨</div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">AI Art Director</div>
                            <p className="text-sm font-medium text-gray-600 leading-relaxed italic">{lastRemix.explanation}</p>
                        </div>
                    </div>
                )}

                <div className="mt-8 flex justify-between items-center px-2">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                        Remix Cost: 1 Vibe Credit
                    </div>
                    <button onClick={onClose} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">
                        Close Panel
                    </button>
                </div>
            </div>

            {/* Shimmer Effect while processing */}
            {isProcessing && (
                <div className="fixed inset-0 pointer-events-none z-[500] animate-pulse">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-purple-500/5 to-pink-500/5 backdrop-blur-[2px]" />
                </div>
            )}
        </div>
    );
};

export default ThemeRemixDrawer;
