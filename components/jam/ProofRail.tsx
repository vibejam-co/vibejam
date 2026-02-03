import React from 'react';
import { AppProject } from '../../types';

interface ProofRailProps {
    project: AppProject;
    isFollowing: boolean;
    followersCount: number | null;
    onFollowToggle: () => void;
    isLoggedIn: boolean;
}

const ProofRail: React.FC<ProofRailProps> = ({
    project,
    isFollowing,
    onFollowToggle,
    followersCount
}) => {
    return (
        <div className="sticky top-28 space-y-6">
            {/* Creator Card */}
            <div className="p-8 rounded-[40px] bg-white border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full overflow-hidden border border-gray-50 mb-6 relative group">
                    <img
                        src={project.creator.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${project.creator.handle}`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        alt={project.creator.name}
                    />
                    <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1">{project.creator.name}</h2>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-6">{project.creator.handle}</p>
                <button
                    onClick={onFollowToggle}
                    className={`
                        w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95
                        ${isFollowing
                            ? 'bg-white text-gray-400 border border-gray-100'
                            : 'bg-gray-900 text-white shadow-xl shadow-gray-900/10 hover:shadow-gray-900/20'
                        }
                    `}
                >
                    {isFollowing ? 'Following' : 'Follow'}
                </button>
                {followersCount !== null && (
                    <div className="mt-4 text-[9px] font-black uppercase tracking-widest text-gray-300">
                        {followersCount.toLocaleString()} Builders following
                    </div>
                )}
            </div>

            {/* Proof Card */}
            {project.proofUrl && (
                <div className="p-8 rounded-[40px] bg-white border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">Proof</span>
                        <div className="px-2 py-1 rounded-full bg-emerald-50 border border-emerald-100/50 flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-emerald-500" />
                            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-wider">Verified</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-gray-900">Source Verified</h4>
                            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Git Proof Attached</p>
                        </div>
                    </div>
                    <a
                        href={project.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3.5 rounded-2xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-gray-800 transition-all"
                    >
                        <span>Open Repo</span>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
                {[
                    { label: 'Backers', value: project.stats.upvotes || 0, color: 'text-blue-500' },
                    { label: 'Revenue', value: project.stats.revenue || 'Prefer not to say', color: 'text-emerald-500' },
                    { label: 'Growth', value: project.stats.growth || '+0%', color: 'text-blue-500' },
                    { label: 'Active', value: `${project.stats.daysLive || 0}d`, color: 'text-gray-900' }
                ].map(stat => (
                    <div key={stat.label} className="p-6 rounded-[32px] bg-white border border-gray-100 shadow-[0_15px_35px_rgba(0,0,0,0.02)] flex flex-col items-center text-center">
                        <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-1.5">{stat.label}</span>
                        <span className={`text-sm md:text-base font-black tracking-tight ${stat.color}`}>{stat.value}</span>
                    </div>
                ))}
            </div>

            {/* Official Links */}
            <div className="p-6 rounded-[32px] bg-white border border-gray-100 shadow-[0_15px_35px_rgba(0,0,0,0.02)]">
                <span className="block text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4 text-center">Official Links</span>
                <div className="flex flex-wrap justify-center gap-2">
                    {project.websiteUrl && (
                        <a
                            href={project.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 rounded-full border border-gray-50 text-[9px] font-black text-gray-400 uppercase tracking-widest hover:border-gray-900 hover:text-gray-900 transition-all"
                        >
                            Website
                        </a>
                    )}
                    {project.creator.handle && (
                        <a
                            href={`https://x.com/${project.creator.handle.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 rounded-full border border-gray-50 text-[9px] font-black text-gray-400 uppercase tracking-widest hover:border-gray-900 hover:text-gray-900 transition-all"
                        >
                            X/Twitter
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProofRail;
