import React, { useState } from 'react';

interface ControlCenterProps {
    isOwner: boolean;
    activeLayout: string;
    onRemix: () => void;
    onGenerate: () => void;
    onMoodChange: (mood: string) => void;
    onDensityChange: (density: 'airy' | 'balanced' | 'dense') => void;
}

const ControlCenter: React.FC<ControlCenterProps> = ({
    isOwner,
    onRemix,
    onGenerate,
    onMoodChange,
    onDensityChange
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeMood, setActiveMood] = useState('cinematic');
    const [activeDensity, setActiveDensity] = useState<'airy' | 'balanced' | 'dense'>('balanced');

    if (!isOwner) return null;

    const moods = [
        { id: 'cinematic', icon: '🎬', label: 'Cinematic' },
        { id: 'electric', icon: '⚡️', label: 'Electric' },
        { id: 'playful', icon: '🎨', label: 'Playful' },
        { id: 'minimal', icon: '⚪️', label: 'Minimal' }
    ];

    const densities = [
        { id: 'airy', label: 'Airy', icon: '◌' },
        { id: 'balanced', label: 'Balanced', icon: '≡' },
        { id: 'dense', label: 'Dense', icon: '▩' }
    ];

    return (
        <div
            className="fixed right-6 top-1/2 -translate-y-1/2 z-[300] flex items-center"
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
        >
            {/* The Invisible Sliver Trigger */}
            <div className={`w-1.5 h-32 rounded-full cursor-pointer transition-all duration-500 bg-gray-900/10 hover:bg-gray-900/20 ${isExpanded ? 'opacity-0 scale-y-0' : 'opacity-100 scale-y-100'}`} />

            {/* The Actual Control Prism */}
            <div className={`
                flex flex-col gap-4 p-2 bg-white/60 backdrop-blur-3xl border border-white/40 rounded-[32px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1)
                ${isExpanded ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0 pointer-events-none'}
            `}>
                {/* 1. The Pulse (Generative Remix) */}
                <button
                    onClick={onRemix}
                    title="Remix Atmosphere"
                    className="w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-gray-900/20 group relative"
                >
                    <span className="text-xl animate-pulse group-hover:animate-none">✨</span>
                    <div className="absolute left-full ml-4 px-3 py-1 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Remix Vibe
                    </div>
                </button>

                <div className="w-8 h-px bg-gray-900/5 mx-auto" />

                {/* 2. Layout Switcher / Generator */}
                <button
                    onClick={onGenerate}
                    title="New Archetype"
                    className="w-12 h-12 rounded-full bg-white text-gray-400 hover:text-gray-900 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group relative"
                >
                    <span className="text-xl">🎲</span>
                    <div className="absolute left-full ml-4 px-3 py-1 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        New Layout
                    </div>
                </button>

                <div className="w-8 h-px bg-gray-900/5 mx-auto" />

                {/* 3. Mood Selector */}
                <div className="flex flex-col gap-2">
                    {moods.map(mood => (
                        <button
                            key={mood.id}
                            onClick={() => {
                                setActiveMood(mood.id);
                                onMoodChange(mood.id);
                            }}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 group relative
                                ${activeMood === mood.id ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-900'}
                            `}
                        >
                            <span className="text-lg">{mood.icon}</span>
                            <div className="absolute left-full ml-4 px-3 py-1 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                {mood.label} Mood
                            </div>
                        </button>
                    ))}
                </div>

                <div className="w-8 h-px bg-gray-900/5 mx-auto" />

                {/* 4. Density Selector */}
                <div className="flex flex-col gap-1 p-1 bg-gray-50 rounded-[24px]">
                    {densities.map(density => (
                        <button
                            key={density.id}
                            onClick={() => {
                                setActiveDensity(density.id as any);
                                onDensityChange(density.id as any);
                            }}
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm transition-all group relative
                                ${activeDensity === density.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-300 hover:text-gray-600'}
                            `}
                        >
                            <span className="font-bold">{density.icon}</span>
                            <div className="absolute left-full ml-4 px-3 py-1 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                {density.label} Space
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ControlCenter;
