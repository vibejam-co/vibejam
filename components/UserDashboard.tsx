import React, { useState, useEffect, useMemo } from 'react';
import { AppProject, BadgeType } from '../types';
import { BadgeRow, SEAL_METADATA } from './Badge';
import SocialListPanel from './SocialListPanel';
import BookmarksPanel from './BookmarksPanel';
import AppCard from './AppCard';
import FollowSignalSurface from './follow/FollowSignalSurface';
import { useAuth } from '../contexts/AuthContext';
import { useBookmarks } from '../lib/useBookmarks';
import { supabase } from '../lib/supabaseClient';
import { backend } from '../lib/backend';

interface UserDashboardProps {
  onBack: () => void;
  onSelectApp: (app: AppProject) => void;
  onSelectCreator: (creator: AppProject['creator']) => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ onBack, onSelectApp, onSelectCreator }) => {
  const { user: authUser, profile, loading: authLoading, signOut, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'bookmarks'>('overview');
  const [viewingList, setViewingList] = useState<'followers' | 'following' | null>(null);
  const [listUsers, setListUsers] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const { bookmarks, count: bookmarkCount } = useBookmarks() as any;

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ display_name: '', username: '', bio: '', avatar_url: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    bookmarks: 0,
    upvotes: 0,
    comments: 0
  });
  const [notifSettings, setNotifSettings] = useState<{ notify_follow: boolean; notify_comment: boolean; notify_reply: boolean } | null>(null);
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setEditForm({
        display_name: profile.display_name || '',
        username: profile.handle || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile]);

  useEffect(() => {
    if (!authUser) return;

    const fetchStats = async () => {
      try {
        const [
          { count: followersCount },
          { count: followingCount },
          { count: upvotesCount }
        ] = await Promise.all([
          supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', authUser.id),
          supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', authUser.id),
          supabase.from('jam_upvotes').select('*', { count: 'exact', head: true }).eq('user_id', authUser.id),
        ]);

        setStats({
          followers: followersCount || 0,
          following: followingCount || 0,
          bookmarks: bookmarkCount || 0,
          upvotes: upvotesCount || 0,
          comments: 0 // Placeholder
        });
      } catch (error) {
        console.error("[Stats] Error fetching user stats:", error);
      }
    };

    fetchStats();
  }, [authUser, bookmarkCount]);

  useEffect(() => {
    let cancelled = false;
    const loadSettings = async () => {
      if (!authUser) return;
      setNotifLoading(true);
      const res = await backend.getNotificationSettings();
      if (!cancelled) {
        setNotifSettings(res.settings || { notify_follow: true, notify_comment: true, notify_reply: true });
        setNotifLoading(false);
      }
    };
    loadSettings();
    return () => { cancelled = true; };
  }, [authUser]);

  useEffect(() => {
    let cancelled = false;
    const loadList = async () => {
      if (!authUser || !viewingList) return;
      setListLoading(true);
      const res = await backend.listFollows({ targetId: authUser.id, kind: viewingList });
      if (cancelled) return;
      setListUsers(res.items || []);
      setListLoading(false);
    };
    loadList();
    return () => { cancelled = true; };
  }, [authUser, viewingList]);

  const handleEditSave = async () => {
    if (!authUser) return;
    setIsSaving(true);
    setErrorMsg(null);

    const cleanHandle = editForm.username.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanHandle) {
      setErrorMsg("Handle cannot be empty");
      setIsSaving(false);
      return;
    }

    try {
      if (cleanHandle !== profile?.handle) {
        const { data } = await supabase.from('profiles').select('id').eq('handle', cleanHandle).maybeSingle();
        if (data) throw new Error("Handle taken");
      }

      const updates = {
        display_name: editForm.display_name,
        handle: cleanHandle,
        bio: editForm.bio,
        avatar_url: editForm.avatar_url
      };

      const { error } = await supabase.from('profiles').update(updates).eq('id', authUser.id);
      if (error) throw error;

      await refreshProfile();
      setIsEditing(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authUser) return;

    setIsSaving(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${authUser.id}/${Math.random()}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setEditForm(prev => ({ ...prev, avatar_url: publicUrl }));
    } catch (error: any) {
      setErrorMsg("Upload failed: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const badgeTypes = useMemo(() => {
    return (profile?.badges || [])
      .sort((a, b) => (SEAL_METADATA[b.type as BadgeType]?.tier || 0) - (SEAL_METADATA[a.type as BadgeType]?.tier || 0))
      .map(b => b.type as BadgeType);
  }, [profile?.badges]);

  const primaryBadge = badgeTypes[0] ? SEAL_METADATA[badgeTypes[0]] : null;

  if (authLoading || !authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const avatarUrl = profile?.avatar_url || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture;
  const displayName = profile?.display_name || authUser.user_metadata?.full_name || authUser.email || 'Maker';
  const handle = profile?.handle ? `@${profile.handle}` : (authUser.email ? `@${authUser.email.split('@')[0]}` : '@user');
  const joinedDate = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Jan 2026';

  const MetricItem = ({ label, value, active, onClick }: { label: string, value: string, active?: boolean, onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`flex flex-col items-center px-6 py-2 rounded-2xl transition-all active:scale-95 ${active ? 'bg-gray-50' : 'hover:bg-gray-50/50'}`}
    >
      <span className={`text-xl font-bold transition-colors ${active ? 'text-blue-500' : 'text-gray-900'}`}>{value}</span>
      <span className={`text-[10px] font-black uppercase tracking-widest mt-1.5 ${active ? 'text-blue-400' : 'text-gray-300'}`}>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-white pt-32 pb-40 animate-in fade-in duration-500">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex justify-between items-center mb-12">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-all group">
            <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Back to Feed</span>
          </button>
          <button onClick={() => signOut()} className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors">Logout</button>
        </div>

        <header className="flex flex-col items-center text-center mb-16">
          <div className="relative mb-8">
            <div className="vj-aura" style={{ background: primaryBadge?.auraColor || '#EAEAEA', opacity: 0.25, transform: 'scale(1.5)', filter: 'blur(20px)' }} />
            <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full border-4 p-1 shadow-sm bg-white relative z-10 overflow-hidden flex items-center justify-center`} style={{ borderColor: primaryBadge?.auraColor || '#f3f4f6' }}>
              {avatarUrl ? (
                <img src={avatarUrl} className="w-full h-full rounded-full object-cover" alt={displayName} />
              ) : (
                <span className="text-2xl font-black text-gray-200">{displayName[0]?.toUpperCase()}</span>
              )}
            </div>
            {isEditing && (
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex flex-col gap-2 w-48 z-20">
                <label className="cursor-pointer bg-black/80 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full hover:bg-black transition-all text-center">
                  Upload Photo
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                <input
                  className="w-full text-[9px] text-center bg-white/90 backdrop-blur-md border border-gray-200 rounded-full px-2 py-1 outline-none focus:ring-2 ring-blue-500/20"
                  placeholder="Or enter image URL..."
                  value={editForm.avatar_url}
                  onChange={e => setEditForm(s => ({ ...s, avatar_url: e.target.value }))}
                />
              </div>
            )}
          </div>

          <div className="w-full max-w-md">
            {isEditing ? (
              <div className="flex flex-col gap-3 animate-in fade-in">
                <input
                  className="text-center text-2xl md:text-3xl font-black text-gray-900 border-b-2 border-gray-100 focus:border-blue-500 outline-none pb-2 bg-transparent placeholder:text-gray-200"
                  value={editForm.display_name || ''}
                  onChange={e => setEditForm(s => ({ ...s, display_name: e.target.value }))}
                  placeholder="Your Full Name"
                />
                <div className="flex items-center justify-center gap-1 group/handle">
                  <span className="text-gray-400 font-bold">@</span>
                  <input
                    className="text-center text-sm font-bold text-gray-500 uppercase tracking-widest border-b border-transparent focus:border-gray-300 outline-none bg-transparent"
                    value={editForm.username}
                    onChange={e => setEditForm(s => ({ ...s, username: e.target.value }))}
                    placeholder="username"
                  />
                </div>
                <textarea
                  className="text-center text-sm text-gray-600 bg-gray-50 rounded-lg p-3 min-h-[80px] w-full resize-none focus:bg-white focus:ring-1 ring-black/5"
                  value={editForm.bio || ''}
                  onChange={e => setEditForm(s => ({ ...s, bio: e.target.value.slice(0, 250) }))}
                  placeholder="Your bio..."
                  maxLength={250}
                />
                <div className="text-[10px] text-gray-300 font-bold uppercase tracking-widest text-right">
                  {(editForm.bio || '').length}/250
                </div>
                {errorMsg && <p className="text-red-500 text-xs font-bold">{errorMsg}</p>}
                <button
                  onClick={handleEditSave}
                  disabled={isSaving}
                  className="mt-2 bg-blue-600 text-white font-bold py-2 rounded-full hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={() => setIsEditing(false)} className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Cancel</button>
              </div>
            ) : (
              <>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter leading-none mb-2">{displayName}</h1>
                <p className="text-sm font-bold text-gray-300 uppercase tracking-[0.4em] mb-6">{handle}</p>
                <p className="text-gray-500 font-medium text-lg max-w-md mx-auto leading-relaxed mb-10">{profile?.bio || 'No bio yet.'}</p>
              </>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 mb-10 bg-white border border-gray-50 p-2 rounded-[32px] shadow-sm">
            <MetricItem label="Followers" value={stats.followers.toString()} onClick={() => setViewingList('followers')} />
            <div className="w-px h-6 bg-gray-100" />
            <MetricItem label="Following" value={stats.following.toString()} onClick={() => setViewingList('following')} />
            <div className="w-px h-6 bg-gray-100" />
            <MetricItem
              label="Bookmarks"
              value={bookmarkCount.toString()}
              active={activeTab === 'bookmarks'}
              onClick={() => setActiveTab(activeTab === 'bookmarks' ? 'overview' : 'bookmarks')}
            />
          </div>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-8 py-3 rounded-2xl border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 hover:border-gray-900 transition-all"
            >
              Edit Profile
            </button>
          )}
        </header>

        {activeTab === 'overview' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
              {[
                { label: 'Joined', value: joinedDate },
                { label: 'Upvotes', value: stats.upvotes },
                { label: 'Comments', value: stats.comments },
                { label: 'Followed', value: stats.following }
              ].map(stat => (
                <div key={stat.label} className="text-center p-6 bg-gray-50/50 rounded-[32px] border border-gray-50/30">
                  <span className="block text-2xl font-black text-gray-900 tracking-tighter mb-1">{stat.value}</span>
                  <span className="block text-[9px] font-black text-gray-300 uppercase tracking-widest">{stat.label}</span>
                </div>
              ))}
            </div>

            <div className="mb-20">
              <FollowSignalSurface
                handle={profile?.handle || null}
                title="Builds You Follow"
                subtitle="Quiet updates from your graph."
                variant="list"
                limit={8}
              />
            </div>

            <section className="mb-20 flex flex-col items-center">
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mb-8">Prestige & Badges</span>
              <div className={`p-3 px-8 bg-white border border-gray-100 rounded-full shadow-sm`}>
                {badgeTypes.length > 0 ? (
                  <BadgeRow badges={badgeTypes} limit={5} size="md" />
                ) : (
                  <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-4">No badges yet</span>
                )}
              </div>
            </section>

            <section className="mb-20">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black text-gray-900 tracking-tight">Notifications</h3>
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-1">Control what pings you</p>
                </div>
                {notifLoading && <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Loading…</span>}
              </div>
              {notifSettings && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { key: 'notify_follow', label: 'Follows' },
                    { key: 'notify_comment', label: 'Comments' },
                    { key: 'notify_reply', label: 'Replies' }
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={async () => {
                        if (!notifSettings) return;
                        const next = { ...notifSettings, [item.key]: !notifSettings[item.key as keyof typeof notifSettings] } as any;
                        setNotifSettings(next);
                        await backend.updateNotificationSettings(next);
                      }}
                      className={`flex items-center justify-between px-4 py-3 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all ${notifSettings[item.key as keyof typeof notifSettings] ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                    >
                      {item.label}
                      <span className={`w-10 h-5 rounded-full p-0.5 flex items-center ${notifSettings[item.key as keyof typeof notifSettings] ? 'bg-blue-500 justify-end' : 'bg-gray-200 justify-start'}`}>
                        <span className="w-4 h-4 rounded-full bg-white shadow" />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-10 border-b border-gray-50 pb-6">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Saved Jams</h2>
              <button
                onClick={() => setActiveTab('overview')}
                className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900"
              >
                Close Bookmarks
              </button>
            </div>

            {bookmarks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {bookmarks.map((bookmark: any) => {
                  const fullProject = {
                    id: bookmark.id,
                    name: bookmark.name,
                    description: bookmark.description || 'Saved.',
                    category: bookmark.category,
                    icon: bookmark.icon || '✨',
                    screenshot: bookmark.screenshot,
                    mediaType: 'image',
                    thumbnailUrl: bookmark.screenshot,
                    stats: {
                      revenue: bookmark.mrr || '$0',
                      isRevenuePublic: true,
                      growth: '0%',
                      rank: 0,
                      upvotes: 0,
                      daysLive: 0
                    },
                    creator: {
                      ...bookmark.creator,
                      color: '#3b82f6',
                      type: 'Solo Founder',
                      handle: bookmark.creator?.handle || '@maker'
                    },
                    stack: [],
                    vibeTools: [],
                    milestones: []
                  } as AppProject;

                  return (
                    <AppCard
                      key={bookmark.id}
                      project={fullProject}
                      onClick={() => onSelectApp(fullProject)}
                      onCreatorClick={(creator) => onSelectCreator(creator)}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 text-center bg-gray-50/50 rounded-[40px] border border-dashed border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 mb-2">No bookmarks yet.</h3>
                <button onClick={onBack} className="px-8 py-3 rounded-2xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Discover Jams</button>
              </div>
            )}
          </div>
        )}

        {viewingList && (
          <SocialListPanel
            title={viewingList === 'followers' ? 'Followers' : 'Following'}
            count={viewingList === 'followers' ? stats.followers.toString() : stats.following.toString()}
            users={listUsers}
            onClose={() => setViewingList(null)}
            onSelectUser={() => setViewingList(null)}
            loading={listLoading}
            isLoggedIn={!!authUser}
            onToggleFollow={async (user) => {
              if (!authUser) return;
              const res = await backend.toggleFollow({ handle: user.handle });
              if (res?.ok) {
                setListUsers(prev => prev.map(u => u.id === user.id ? { ...u, isFollowing: res.isFollowing } : u));
                if (viewingList === 'following') {
                  if (!res.isFollowing) {
                    setListUsers(prev => prev.filter(u => u.id !== user.id));
                    setStats(s => ({ ...s, following: Math.max(0, s.following - 1) }));
                  }
                }
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
