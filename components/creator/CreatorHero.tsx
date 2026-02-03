import React from 'react';

interface CreatorHeroProps {
    name: string;
    tagline: string;
    isVerified?: boolean;
    lastUpdated?: string;
    onFollowClick?: () => void;
    onOpenLinksClick?: () => void;
}

const CreatorHero: React.FC<CreatorHeroProps> = ({
    name,
    tagline,
    isVerified,
    lastUpdated,
    onFollowClick,
    onOpenLinksClick
}) => {
    return (
        <div className="pt-12 pb-16 text-left max-w-2xl">
            {/* Status indicators */}
            <div className="flex items-center gap-3 mb-10">
                {isVerified && (
                    <div className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100/50 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[9px] font-black text-emerald-700 uppercase tracking-[0.2em]">Verified Build</span>
                    </div>
                )}
                {lastUpdated && (
                    <div className="px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100/50 flex items-center gap-1.5">
                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em]">{lastUpdated}</span>
                    </div>
                )}
            </div>

            <h1 className="text-7xl md:text-8xl font-black text-gray-900 tracking-tighter leading-[0.85] mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                {name}
            </h1>
            <p className="text-xl md:text-3xl text-gray-400 font-medium leading-tight mb-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
                {tagline}
            </p>

            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                <button
                    onClick={onFollowClick}
                    className="px-8 h-14 bg-gray-900 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-gray-900/20 hover:scale-105 active:scale-95 transition-all"
                >
                    Follow this build
                </button>
                <button
                    onClick={onOpenLinksClick}
                    className="px-8 h-14 bg-white border border-gray-100 text-gray-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:text-gray-900 hover:border-gray-200 transition-all"
                >
                    Open Links
                </button>
            </div>
        </div>
    );
};

export default CreatorHero;
