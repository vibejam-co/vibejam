import React, { useState, useEffect } from 'react';
import { AppProject } from '../../types';
import { backend } from '../../lib/backend';
import { supabase } from '../../lib/supabaseClient';
import CreatorHero from './CreatorHero';
import CreatorIdentityColumn from './CreatorIdentityColumn';
import TimelineV2 from '../jam/TimelineV2';
import ControlDock from './ControlDock';

interface CreatorPageV2Props {
    creator: {
        handle: string;
        name: string;
        avatar: string;
        bio?: string;
    };
    isLoggedIn: boolean;
    isMe: boolean;
    onClose: () => void;
    onSelectApp: (app: AppProject) => void;
    onStudioClick: () => void;
}

const CreatorPageV2: React.FC<CreatorPageV2Props> = ({
    creator: initialCreator,
    isLoggedIn,
    isMe,
    onClose,
    onSelectApp,
    onStudioClick
}) => {
    const [products, setProducts] = useState<AppProject[]>([]);
    const [stats, setStats] = useState({ followers: 0, following: 0, signals: 0 });
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [initialCreator.handle]);

    // Load Data
    useEffect(() => {
        let cancelled = false;
        const loadData = async () => {
            setLoading(true);
            const handle = initialCreator.handle.replace('@', '');

            // 1. Fetch Products
            const { data: jams } = await backend.fetchCreatorPublishedJamsByHandle(handle, { limit: 10 });
            if (cancelled) return;

            const mappedJams: AppProject[] = jams.map(j => ({
                id: j.id,
                name: j.name,
                description: j.tagline,
                category: j.category,
                proofUrl: j.socials?.proof_url || j.socials?.proofUrl,
                screenshot: j.cover_image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop',
                mediaType: 'image',
                thumbnailUrl: j.cover_image_url,
                stats: { revenue: '$0', isRevenuePublic: true, growth: '0%', rank: 0, upvotes: 0, daysLive: 0 },
                creator: initialCreator,
                stack: j.tech_stack || [],
                vibeTools: j.vibe_tools || [],
                milestones: j.milestones || []
            }));
            setProducts(mappedJams);

            // 2. Fetch Stats & Profile
            const { data: dbProfile } = await supabase.from('profiles').select('id').eq('handle', handle).maybeSingle();
            if (dbProfile && !cancelled) {
                const [{ count: followers }, { count: following }, { count: upvotes }] = await Promise.all([
                    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', dbProfile.id),
                    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', dbProfile.id),
                    supabase.from('jam_upvotes').select('*', { count: 'exact', head: true }).eq('user_id', dbProfile.id),
                ]);
                setStats({
                    followers: followers || 0,
                    following: following || 0,
                    signals: upvotes || 0
                });

                if (isLoggedIn && !isMe) {
                    const res = await backend.getFollowStatus({ targetId: dbProfile.id });
                    setIsFollowing(!!res?.isFollowing);
                }
            }
            setLoading(false);
        };

        loadData();
        return () => { cancelled = true; };
    }, [initialCreator.handle, isLoggedIn, isMe]);

    const handleFollowToggle = async () => {
        if (!isLoggedIn) return;
        try {
            const res = await backend.toggleFollow({ handle: initialCreator.handle });
            if (res?.ok) {
                setIsFollowing(!!res.isFollowing);
                if (typeof res.followersCount === 'number') {
                    setStats(s => ({ ...s, followers: res.followersCount || 0 }));
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    const primaryJam = products[0];

    return (
        <div className="min-h-screen bg-white text-gray-900 selection:bg-blue-50 selection:text-blue-600">
            {/* Background Aesthetic */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-50/10 rounded-full blur-[120px]" />
            </div>

            {/* Navigation Capsule */}
            <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200]">
                <div className="flex items-center gap-1 p-1 bg-white/80 backdrop-blur-xl border border-gray-100 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="w-px h-4 bg-gray-100" />
                    <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </button>
                    <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="relative z-10 pt-20">
                <div className="max-w-[1240px] mx-auto px-6">
                    <div className="grid grid-cols-12 gap-12 lg:gap-24">
                        {/* Main Content (Left Track - 8 columns) */}
                        <div className="col-span-12 lg:col-span-8">
                            {primaryJam ? (
                                <CreatorHero
                                    name={primaryJam.name}
                                    tagline={primaryJam.description}
                                    isVerified={!!primaryJam.proofUrl}
                                    lastUpdated="Updated Today"
                                    onFollowClick={handleFollowToggle}
                                />
                            ) : (
                                <div className="py-24 animate-pulse">
                                    <div className="w-64 h-16 bg-gray-50 rounded-2xl mb-6" />
                                    <div className="w-96 h-8 bg-gray-50 rounded-xl" />
                                </div>
                            )}

                            {/* Section Header: THE STORY */}
                            <div className="mt-12 mb-10">
                                <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">The Story</h3>
                            </div>

                            {/* Hero Image */}
                            {primaryJam?.screenshot && (
                                <div className="aspect-[16/10] rounded-[48px] overflow-hidden bg-[#F9F9FB] border border-gray-100 shadow-2xl mb-16 group">
                                    <img
                                        src={primaryJam.screenshot}
                                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                        alt={primaryJam.name}
                                    />
                                </div>
                            )}

                            {/* Timeline */}
                            <div className="pb-32">
                                {primaryJam?.milestones && primaryJam.milestones.length > 0 ? (
                                    <TimelineV2 milestones={primaryJam.milestones} />
                                ) : (
                                    <div className="py-24 rounded-[48px] border-2 border-dashed border-gray-50 flex flex-col items-center justify-center text-center">
                                        <p className="text-gray-300 font-medium text-lg">The journey is just beginning. No milestones yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar (Right Track - 4 columns) */}
                        <div className="col-span-12 lg:col-span-4 pt-12">
                            <CreatorIdentityColumn
                                name={initialCreator.name}
                                handle={initialCreator.handle}
                                avatar={initialCreator.avatar}
                                bio={initialCreator.bio}
                                isFollowing={isFollowing}
                                followersCount={stats.followers}
                                onFollowToggle={handleFollowToggle}
                                stats={{
                                    backers: stats.followers,
                                    revenue: 'Prefer not to say',
                                    growth: '+0%',
                                    activeDays: 0
                                }}
                                proofUrl={primaryJam?.proofUrl}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Control Dock */}
            <ControlDock
                isOwner={isMe}
                onStudioClick={onStudioClick}
                onAppearanceClick={() => console.log('Appearance')}
                onRemixClick={() => console.log('Remix')}
                onGenerateClick={() => console.log('Generate')}
            />
        </div>
    );
};

export default CreatorPageV2;
