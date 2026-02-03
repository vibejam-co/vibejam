import React, { useState } from 'react';

interface ControlDockProps {
    isOwner: boolean;
    onStudioClick: () => void;
    onAppearanceClick?: () => void;
    onRemixClick?: () => void;
    onGenerateClick?: () => void;
}

const ControlDock: React.FC<ControlDockProps> = ({
    isOwner,
    onStudioClick,
    onAppearanceClick,
    onRemixClick,
    onGenerateClick
}) => {
    const [isRevealed, setIsRevealed] = useState(false);

    return (
        <>
            {/* Invisible Edge Trigger Area */}
            <div
                className="fixed bottom-0 right-0 w-32 h-32 z-[299]"
                onMouseEnter={() => setIsRevealed(true)}
                onMouseLeave={() => setIsRevealed(false)}
            />

            <div
                onMouseEnter={() => setIsRevealed(true)}
                onMouseLeave={() => setIsRevealed(false)}
                className={`
          fixed bottom-12 right-12 z-[300] transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1)
          ${isRevealed || isOwner ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0 pointer-events-none'}
        `}
            >
                <div className="flex flex-col gap-3 p-2 bg-white/40 backdrop-blur-2xl border border-white/40 rounded-[28px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] group">
                    <button
                        onClick={onStudioClick}
                        data-tooltip="Creator Studio"
                        className="w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-gray-900/20"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                        </svg>
                    </button>

                    <div className="w-8 h-[1px] bg-gray-900/10 mx-auto" />

                    <button
                        onClick={onAppearanceClick}
                        data-tooltip="Appearance"
                        className="w-12 h-12 rounded-full bg-white/80 text-gray-400 hover:text-gray-900 flex items-center justify-center hover:bg-white hover:scale-110 active:scale-95 transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-3" />
                        </svg>
                    </button>

                    <button
                        onClick={onRemixClick}
                        data-tooltip="Remix Layout"
                        className="w-12 h-12 rounded-full bg-white/80 text-gray-400 hover:text-gray-900 flex items-center justify-center hover:bg-white hover:scale-110 active:scale-95 transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>

                    <button
                        onClick={onGenerateClick}
                        data-tooltip="Regenerate Bio"
                        className="w-12 h-12 rounded-full bg-white/80 text-gray-400 hover:text-gray-900 flex items-center justify-center hover:bg-white hover:scale-110 active:scale-95 transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a2 2 0 00-1.96 1.414l-.477 2.387a2 2 0 00.547 1.022l1.428 1.428a2 2 0 002.828 0l1.428-1.428a2 2 0 00.547-1.022l.477-2.387a2 2 0 00-1.414-1.96l-2.387-.477a2 2 0 00-1.022.547l-1.428 1.428a2 2 0 000 2.828l1.428 1.428z" />
                        </svg>
                    </button>
                </div>
            </div>
        </>
    );
};

export default ControlDock;
