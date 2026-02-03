import React, { useEffect, useState } from 'react';
import { AppProject } from '../../../types';
import { backend } from '../../../lib/backend';
import { useBookmarks } from '../../../lib/useBookmarks';
import TimelineV2 from '../TimelineV2';
import DiscussionPanel from '../DiscussionPanel';

interface MonolithLayoutProps {
  project: AppProject;
  onClose: () => void;
  isLoggedIn: boolean;
  onAuthTrigger?: () => void;
  isOwner?: boolean;
  onManageJam?: () => void;
}

const MonolithLayout: React.FC<MonolithLayoutProps> = ({
  project,
  onClose,
  isLoggedIn,
  onAuthTrigger
}) => {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [isDiscussionOpen, setIsDiscussionOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState<number | null>(null);

  const bookmarked = isBookmarked(project.id);
  const showV2Marker = typeof import.meta !== 'undefined' && !(import.meta as any).env?.PROD;
  const timelineItems = project.milestones || [];
  const timelineCanvasHeight = Math.max(900, 300 + timelineItems.length * 220);

  // Load follow status
  useEffect(() => {
    let cancelled = false;
    const loadFollow = async () => {
      if (!project?.creator?.handle) return;
      const res = await backend.getFollowStatus({ handle: project.creator.handle });
      if (cancelled) return;
      if (res.ok) {
        setIsFollowing(!!res.isFollowing);
        if (typeof res.followersCount === 'number') setFollowersCount(res.followersCount);
      }
    };
    loadFollow();
    return () => { cancelled = true; };
  }, [project?.creator?.handle, isLoggedIn]);

  const handleFollowToggle = async () => {
    if (!isLoggedIn) {
      onAuthTrigger?.();
      return;
    }
    try {
      const res = await backend.toggleFollow({ handle: project.creator.handle });
      if (res?.ok) {
        setIsFollowing(!!res.isFollowing);
        if (typeof res.followersCount === 'number') setFollowersCount(res.followersCount);
      }
    } catch (err) {
      console.error('Follow toggle failed', err);
    }
  };

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [project.id]);

  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-blue-50 selection:text-blue-600 overflow-x-hidden relative">
      {/* Background Texture - The Monolith Texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat opacity-50" />
      </div>

      {/* Atmosphere - Deep Auras */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-100/30 rounded-full blur-[180px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-50/40 rounded-full blur-[200px]" />
      </div>

      {/* Navigation Capsule - Floating Top Center */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200]">
        <div className="flex items-center gap-1 p-1 bg-white/80 backdrop-blur-xl border border-gray-100 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.06)] group hover:scale-105 transition-transform duration-500">
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-all active:scale-90"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="w-px h-4 bg-gray-100" />
          <button
            onClick={() => setIsDiscussionOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-all active:scale-90"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
          <button
            onClick={() => toggleBookmark(project)}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90 ${bookmarked ? 'text-blue-500 bg-blue-50' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
          >
            <svg className="w-4 h-4" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>
      </div>

      {/* THE MONOLITH CANVAS */}
      <div className="relative z-10 w-full">
        <div className="relative w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 pt-24 pb-48" style={{ minHeight: timelineCanvasHeight + 640 }}>
          {/* 1. HERO ZONE: Massive Typography + Shattered Layout */}
          <div className="relative mb-32 md:mb-48">
            {/* Architectural Title */}
            <h1 className="text-[14vw] md:text-[11vw] font-black tracking-tighter leading-[0.8] text-gray-900 uppercase opacity-95 mix-blend-darken select-none pointer-events-none animate-in fade-in slide-in-from-bottom-12 duration-1000">
              {project.name}
            </h1>

            {/* The Media Window - Shattered Overlay */}
            <div className="relative mt-[-5vw] md:mt-[-8vw] ml-[10vw] md:ml-[30vw] w-[85vw] md:w-[60vw] max-w-[900px] z-10 animate-in fade-in zoom-in-95 duration-1000 delay-300">
              {/* Tagline Plaque */}
              <div className="absolute -top-12 -left-8 md:-left-24 bg-white/90 backdrop-blur-xl border border-gray-100 p-6 md:p-8 rounded-none rounded-tr-[40px] rounded-bl-[40px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] z-20 max-w-xs md:max-w-md transform -rotate-1 hover:rotate-0 transition-transform duration-500">
                <p className="text-lg md:text-xl font-bold leading-tight text-gray-800 font-mono tracking-tight">
                  {project.description}
                </p>
              </div>

              {/* Main Media */}
              <div className="relative aspect-[16/10] md:aspect-video bg-gray-100 overflow-hidden shadow-2xl rounded-[40px] md:rounded-[60px] rounded-tr-none hover:rounded-[60px] transition-all duration-1000 group">
                <img
                  src={project.screenshot}
                  alt={project.name}
                  className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100"
                />
                {/* Reflection Gradient */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50 pointer-events-none" />
              </div>

              {/* Metadata Shards - Scattered */}
              <div className="absolute -bottom-16 -right-4 md:-right-12 flex flex-col gap-4 items-end pointer-events-none">
                <div className="bg-gray-900 text-white px-6 py-3 rounded-full text-xs font-mono uppercase tracking-widest shadow-xl transform rotate-3 z-20">
                  {project.category || 'Product'}
                </div>
                {project.stats.daysLive > 0 && (
                  <div className="bg-white border border-gray-200 text-gray-500 px-5 py-2 rounded-full text-[10px] font-mono uppercase tracking-widest shadow-lg transform -rotate-2 z-10">
                    Day {project.stats.daysLive}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. THE DEBRIS FIELD: Content Scatter */}
          <div className="relative" style={{ minHeight: timelineCanvasHeight }}>
            {/* Journey Label */}
            <div className="absolute left-0 top-6 md:top-10 z-30">
              <span className="inline-block px-4 py-1.5 border border-gray-200 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white">
                The Journey
              </span>
            </div>

            {/* Timeline Artifact Layer */}
            <div className="absolute left-0 right-0 top-20 md:top-28 z-20 pointer-events-auto">
              <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
                <div className="pl-0 md:pl-12 lg:pl-24">
                  <TimelineV2
                    milestones={timelineItems}
                    onDiscussionClick={() => setIsDiscussionOpen(true)}
                  />
                </div>
              </div>
            </div>

            {/* Right Drift: The Anchor Stack */}
            <div className="relative z-30 w-full lg:max-w-[360px] lg:ml-auto mt-24 lg:mt-0">
              <div className="lg:sticky lg:top-32 space-y-12">
              {/* Identity Shard */}
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] hover:shadow-2xl transition-all duration-500 group">
                <div className="flex items-center gap-5 mb-6">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 group-hover:scale-100 transition-transform">
                    <img
                      src={project.creator.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${project.creator.handle}`}
                      className="w-full h-full object-cover"
                      alt={project.creator.name}
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{project.creator.name}</h3>
                    <p className="text-xs text-gray-400 font-mono">{project.creator.handle}</p>
                  </div>
                </div>
                <button
                  onClick={handleFollowToggle}
                  className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all
                  ${isFollowing
                      ? 'bg-gray-50 text-gray-400 border border-transparent'
                      : 'bg-black text-white shadow-lg hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98]'}`}
                >
                  {isFollowing ? 'Following' : 'Follow Builder'}
                </button>
                {followersCount !== null && (
                  <div className="mt-4 text-[9px] font-black uppercase tracking-widest text-gray-300">
                    {followersCount} Followers
                  </div>
                )}
              </div>

              {/* Proof Seal */}
              {project.proofUrl && (
                <a
                  href={project.proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block bg-[#F5F5FA] p-1 rounded-[32px] hover:bg-white border border-transparent hover:border-emerald-100 transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between p-5 border border-dashed border-gray-300 rounded-[28px] group-hover:border-emerald-200 group-hover:bg-emerald-50/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-emerald-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <span className="block text-[10px] font-black uppercase tracking-widest text-emerald-700">Source Verified</span>
                        <span className="text-[10px] font-mono text-gray-400">Git Proof Attached</span>
                      </div>
                    </div>
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-100 text-gray-300 group-hover:text-emerald-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                  </div>
                </a>
              )}

              {/* Metrics Scatter */}
              <div className="flex flex-wrap gap-3">
                <div className="bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm">
                  <span className="block text-[9px] font-black text-gray-300 uppercase">Growth</span>
                  <span className="text-sm font-bold text-blue-600 font-mono">{project.stats.growth || '0%'}</span>
                </div>
                <div className="bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm">
                  <span className="block text-[9px] font-black text-gray-300 uppercase">Revenue</span>
                  <span className="text-sm font-bold text-emerald-600 font-mono">{project.stats.revenue || '-'}</span>
                </div>
              </div>

              {/* Links Text */}
              {project.websiteUrl && (
                <div className="text-center pt-8">
                  <a href={project.websiteUrl} target="_blank" rel="noreferrer" className="text-xs font-black uppercase tracking-[0.3em] text-gray-300 hover:text-gray-900 transition-colors border-b border-gray-100 pb-1 hover:border-gray-900">
                    Visit Website ↗
                  </a>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The Control Rod - Floating Action Bar (Bottom Center) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-6 pointer-events-none">
        <div className="bg-gray-900/90 backdrop-blur-xl text-white p-2 pl-6 rounded-full shadow-2xl flex items-center justify-between pointer-events-auto hover:scale-105 transition-transform duration-300 cursor-pointer border border-white/10" onClick={() => toggleBookmark(project)}>
          <span className="text-xs font-mono font-bold tracking-widest uppercase truncate max-w-[200px]">{bookmarked ? 'Saved to collection' : 'Add to collection'}</span>
          <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center ml-4">
            <svg className="w-4 h-4" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Discussion Panel Panel */}
      <DiscussionPanel
        isOpen={isDiscussionOpen}
        onClose={() => setIsDiscussionOpen(false)}
        jamId={project.id}
        isLoggedIn={isLoggedIn}
        onAuthTrigger={onAuthTrigger}
        creatorHandle={project.creator.handle}
      />
      {showV2Marker && (
        <div className="fixed bottom-4 right-4 text-[10px] font-black uppercase tracking-widest text-gray-300 opacity-20">
          Monolith V1
        </div>
      )}
    </div>
  );
};

export default MonolithLayout;
