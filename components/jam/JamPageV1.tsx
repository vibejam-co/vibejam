import React, { useEffect, useState } from 'react';
import { AppProject } from '../../types';
import { useBookmarks } from '../../lib/useBookmarks';
import { backend } from '../../lib/backend';
import SignalsThread from '../signals/SignalsThread';

interface JamPageV1Props {
  project: AppProject;
  onBack: () => void;
  onCreatorClick?: (creator: AppProject['creator']) => void;
  isLoggedIn?: boolean;
  onAuthTrigger?: () => void;
  onManageJam?: () => void;
  isOwner?: boolean;
}

const JamPageV1: React.FC<JamPageV1Props> = ({
  project,
  onBack,
  onCreatorClick,
  isLoggedIn = false,
  onAuthTrigger,
  onManageJam,
  isOwner = false
}) => {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState<number | null>(null);

  const bookmarked = isBookmarked(project.id);

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

  const handleFollowToggle = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
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

  return (
    <div className="min-h-screen bg-white text-gray-900 pt-10 md:pt-20 pb-20 px-4 md:px-0">
      <div className="relative w-full max-w-5xl mx-auto bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden">
        <div className="sticky top-0 z-30 flex items-center justify-between px-8 h-20 bg-white/90 backdrop-blur-md border-b border-gray-50/50">
          <button onClick={onBack} className="group flex items-center gap-2 text-gray-400 hover:text-gray-900">
            <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Back</span>
          </button>

          <div className="flex items-center gap-3">
            {isOwner && (
              <button
                onClick={onManageJam}
                className="px-5 py-2 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest mr-4"
              >
                Manage Jam
              </button>
            )}
            <button
              onClick={() => toggleBookmark(project)}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${bookmarked ? 'bg-blue-50 border-blue-200 text-blue-500' : 'bg-white border-gray-100 text-gray-400 hover:text-gray-900'}`}
            >
              <svg className="w-5 h-5" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-8 md:p-12 lg:p-16 border-r border-gray-50">
            <header className="mb-12">
              <div className="flex items-center gap-4 mb-4">
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-500 text-[10px] font-black uppercase tracking-widest">{project.category}</span>
                {project.proofUrl && (
                  <span className="px-3 py-1 rounded-full bg-gradient-to-r from-emerald-50 via-white to-emerald-50 text-[8px] font-black text-emerald-700 uppercase tracking-widest border border-emerald-100 inline-flex items-center gap-1 shadow-[0_6px_16px_rgba(16,185,129,0.15)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Verified Build
                  </span>
                )}
                {isOwner && <span className="px-2 py-0.5 rounded bg-gray-100 text-[8px] font-black text-gray-400 uppercase tracking-widest">Owner</span>}
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter leading-none mb-6">{project.name}</h1>
              <p className="text-xl md:text-2xl text-gray-400 font-medium leading-relaxed max-w-2xl">{project.description}</p>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
              {[
                { label: 'MRR', value: project.stats.revenue, accent: 'text-green-600' },
                { label: 'Upvotes', value: project.stats.upvotes, accent: 'text-blue-500' },
                { label: 'Growth', value: project.stats.growth, accent: 'text-purple-600' },
                { label: 'Days Live', value: project.stats.daysLive, accent: 'text-gray-900' }
              ].map((stat) => (
                <div key={stat.label} className="p-6 rounded-[32px] border border-gray-50 bg-[#F9F9FB]/50">
                  <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{stat.label}</span>
                  <span className={`text-2xl font-black ${stat.accent}`}>{stat.value}</span>
                </div>
              ))}
            </div>

            {project.screenshot && (
              <div className="relative aspect-[16/10] rounded-[40px] overflow-hidden bg-gray-100 mb-16">
                <img src={project.screenshot} alt="Product Insight" className="w-full h-full object-cover" />
              </div>
            )}

            {project.milestones && project.milestones.length > 0 && (
              <section className="mb-20">
                <h2 className="text-[11px] font-black text-gray-300 uppercase tracking-[0.3em] mb-12">Journey</h2>
                <div className="space-y-0 border-l-[1.5px] border-dashed border-gray-100 ml-4">
                  {project.milestones?.map((m, i) => (
                    <div key={i} className="relative pl-12 pb-12 last:pb-0">
                      <div className="absolute left-[-6px] top-1 w-3 h-3 rounded-full bg-white border-2 border-blue-500" />
                      <span className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">{m.date}</span>
                      <h4 className="text-xl font-bold text-gray-900">{m.label}</h4>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="pt-16 border-t border-gray-50">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-10">Signals</h3>
              <SignalsThread
                jamId={project.id}
                isLoggedIn={isLoggedIn}
                onAuthTrigger={onAuthTrigger}
                creatorHandle={project.creator.handle}
              />
            </section>
          </div>

          <div className="w-full md:w-[320px] lg:w-[380px] p-8 lg:p-12 shrink-0 bg-[#F9F9FB]/30">
            <div className="sticky top-28">
              <div
                onClick={() => onCreatorClick?.(project.creator)}
                className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:border-blue-100 transition-all cursor-pointer text-center"
              >
                <div className="mb-6 relative mx-auto w-24 h-24 aura-clip">
                  <img src={project.creator.avatar} className="w-full h-full rounded-full object-cover relative z-10" alt={project.creator.name} />
                  <div className="aura-halo" style={{ background: project.creator.color, opacity: 0.2, inset: '-6px' }} />
                </div>
                <h3 className="font-bold text-gray-900 text-xl leading-none mb-1">{project.creator.name}</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">{project.creator.handle}</p>
                <button
                  onClick={handleFollowToggle}
                  className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all ${isFollowing ? 'bg-white text-gray-400 border border-gray-100 shadow-sm' : 'bg-gray-900 text-white shadow-gray-900/10'}`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                {followersCount !== null && (
                  <div className="mt-4 text-[9px] font-black uppercase tracking-widest text-gray-300">
                    {followersCount} Followers
                  </div>
                )}
              </div>

              {project.proofUrl && (
                <div className="mt-6 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm overflow-hidden relative">
                  <div className="absolute -top-10 -right-16 w-40 h-40 rounded-full bg-emerald-100/40 blur-2xl" />
                  <div className="absolute -bottom-12 -left-10 w-32 h-32 rounded-full bg-blue-100/50 blur-2xl" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Verification</span>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-[9px] font-black text-emerald-700 border border-emerald-100 uppercase tracking-widest inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Verified
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-500 p-[2px] shadow-lg shadow-emerald-500/20">
                        <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center">
                          <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3l7 4v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">Verified Build</p>
                        <p className="text-[11px] text-gray-400 font-medium">Git proof attached</p>
                      </div>
                    </div>
                    <a
                      href={project.proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-gray-900/10 hover:shadow-gray-900/20 transition-all"
                    >
                      Git
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 3h7v7M10 14L21 3M21 14v7h-7" />
                      </svg>
                    </a>
                  </div>
                </div>
              )}

              {(project.vibeTools?.length > 0) && (
                <div className="mt-6 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Vibe Tools</span>
                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{project.vibeTools.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.vibeTools.slice(0, 8).map((t) => (
                      <span key={t} className="px-3 py-1 rounded-xl bg-blue-50/60 text-[9px] font-black text-blue-600 border border-blue-100 uppercase tracking-widest">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(project.stack?.length > 0) && (
                <div className="mt-6 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Tech Stack</span>
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{project.stack.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.stack.slice(0, 8).map((t) => (
                      <span key={t} className="px-3 py-1 rounded-xl bg-gray-50 text-[9px] font-black text-gray-600 border border-gray-100 uppercase tracking-widest">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JamPageV1;
