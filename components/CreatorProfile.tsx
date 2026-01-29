import React, { useState, useEffect, useMemo, useRef } from 'react';
import AppCard from './AppCard';
import { AppProject, BadgeType } from '../types';
import Badge, { SEAL_METADATA, BadgeRow } from './Badge';
import SocialListPanel from './SocialListPanel';
import BookmarksPanel from './BookmarksPanel';
import { useBookmarks } from '../lib/useBookmarks';
import { useAuth } from '../contexts/AuthContext'; // [NEW]
import { supabase } from '../lib/supabaseClient'; // [NEW]
import { backend } from '../lib/backend'; // [NEW]

interface CreatorProfileProps {
  creator: {
    handle: string;
    name: string;
    avatar: string;
    badges?: any[];
    type?: string;
  };
  onClose: () => void;
  onSelectApp: (app: AppProject) => void;
  isFirstTimeEarn?: boolean;
}

const CreatorProfile: React.FC<CreatorProfileProps> = ({ creator: initialCreator, onClose, onSelectApp, isFirstTimeEarn = false }) => {
  const { user, profile: myProfile, refreshProfile, signOut } = useAuth();

  // Real State
  const [profileData, setProfileData] = useState(initialCreator);
  const [products, setProducts] = useState<AppProject[]>([]);
  const [stats, setStats] = useState({ followers: 0, following: 0, bookmarks: 0, reach: 0, signals: 0 });

  // UI State
  const [isMe, setIsMe] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ display_name: '', username: '', bio: '', avatar_url: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Social & Interactivity
  const [isFollowing, setIsFollowing] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [viewingList, setViewingList] = useState<'followers' | 'following' | null>(null);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const { count: bookmarkCount } = useBookmarks();

  // Determine if viewing own profile
  useEffect(() => {
    if (user && myProfile) {
      const cleanHandle = (h: string) => h.replace('@', '').toLowerCase();
      if (cleanHandle(myProfile.handle || '') === cleanHandle(initialCreator.handle)) {
        setIsMe(true);
        // If it's me, use my fresh profile data from context as source of truth
        setProfileData({
          handle: '@' + (myProfile.handle || ''),
          name: myProfile.display_name || '',
          avatar: myProfile.avatar_url || '',
          badges: myProfile.badges || [],
          type: 'Solo Founder' // Default
        });
        setEditForm({
          display_name: myProfile.display_name || '',
          username: myProfile.handle || '',
          bio: myProfile.bio || '',
          avatar_url: myProfile.avatar_url || ''
        });
      }
    }
  }, [user, myProfile, initialCreator]);

  // Fetch Real Data (Products & Stats)
  useEffect(() => {
    const loadRealData = async () => {
      const handle = profileData.handle.replace('@', '');

      // 1. Fetch Products
      const { data: jams } = await backend.fetchCreatorPublishedJamsByHandle(handle, { limit: 10 });
      // Map JamDoc to AppProject legacy shape for card
      const mappedJams: AppProject[] = jams.map(j => ({
        id: j.id,
        name: j.name,
        description: j.tagline,
        category: j.category,
        screenshot: j.cover_image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop',
        mediaType: 'image',
        thumbnailUrl: j.cover_image_url,
        stats: { revenue: '$0', isRevenuePublic: true, growth: '0%', rank: 0, upvotes: 0, daysLive: 0 },
        creator: profileData,
        stack: [],
        vibeTools: []
      }));
      setProducts(mappedJams);

      // 2. Fetch Stats
      // We need the profile ID first to query related tables
      const { data: dbProfile } = await supabase.from('profiles').select('id').eq('handle', handle).maybeSingle();
      if (dbProfile) {
        const [{ count: followers }, { count: following }, { count: bookmarks }, { count: upvotes }] = await Promise.all([
          supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', dbProfile.id),
          supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', dbProfile.id),
          supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('user_id', dbProfile.id),
          supabase.from('jam_upvotes').select('*', { count: 'exact', head: true }).eq('user_id', dbProfile.id),
        ]);
        setStats({
          followers: followers || 0,
          following: following || 0,
          bookmarks: bookmarks || 0,
          reach: 0, // Placeholder
          signals: upvotes || 0
        });

        // Check if I am following this user
        if (user && !isMe) {
          const { count } = await supabase.from('follows').select('*', { count: 'exact', head: true })
            .eq('follower_id', user.id).eq('following_id', dbProfile.id);
          setIsFollowing(!!count);
        }
      }
    };
    loadRealData();
  }, [profileData.handle, user, isMe]);

  const handleEditSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setErrorMsg(null);

    // Validate
    const cleanHandle = editForm.username.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanHandle) {
      setErrorMsg("Handle cannot be empty");
      setIsSaving(false);
      return;
    }

    try {
      // Check uniqueness if changed
      if (cleanHandle !== myProfile?.handle) {
        const { data } = await supabase.from('profiles').select('id').eq('handle', cleanHandle).maybeSingle();
        if (data) throw new Error("Handle taken");
      }

      const updates = {
        display_name: editForm.display_name,
        handle: cleanHandle,
        bio: editForm.bio,
        avatar_url: editForm.avatar_url
      };

      const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
      if (error) throw error;

      await refreshProfile(); // Update context
      setIsEditing(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsSaving(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;

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

  const handleLogout = async () => {
    await signOut();
    onClose();
    // Force refresh or redirect might be needed by parent, but Context handles state nulling
    window.location.reload(); // Hard reset to ensure clean state
  };

  const badgeTypes = useMemo(() => {
    return (profileData.badges || [])
      .sort((a, b) => (SEAL_METADATA[b.type as BadgeType]?.tier || 0) - (SEAL_METADATA[a.type as BadgeType]?.tier || 0))
      .map(b => b.type as BadgeType);
  }, [profileData.badges]);

  const primaryBadge = badgeTypes[0] ? SEAL_METADATA[badgeTypes[0]] : null;

  // Effects for Aura
  useEffect(() => {
    if (isFirstTimeEarn && !acknowledged) {
      const rippleTimer = window.setTimeout(() => setShowRipple(true), 900);
      const cleanupTimer = window.setTimeout(() => {
        setShowRipple(false);
        setAcknowledged(true);
      }, 3000);
      return () => { clearTimeout(rippleTimer); clearTimeout(cleanupTimer); };
    }
  }, [isFirstTimeEarn, acknowledged]);

  const MetricItem = ({ label, value, onClick }: { label: string, value: string, onClick?: () => void }) => (
    <button onClick={onClick} className="flex flex-col items-center group/metric transition-transform active:scale-95 disabled:pointer-events-none" disabled={!onClick}>
      <span className="text-xl font-bold text-gray-900 leading-none group-hover:text-blue-500 transition-colors">{value}</span>
      <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-1.5">{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[150] bg-white overflow-y-auto scroll-smooth animate-in fade-in duration-500">
      <div className="relative pt-24 pb-20 px-6 border-b border-gray-50 bg-gradient-to-b from-[#fafafa] to-white">
        <button onClick={onClose} className="absolute top-8 left-6 md:left-12 flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-all group">
          <div className="w-9 h-9 rounded-full bg-white border border-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.2em] hidden sm:inline">Back</span>
        </button>

        {isMe && (
          <div className="absolute top-8 right-6 md:right-12 flex gap-3">
            <button onClick={handleLogout} className="px-4 py-2 rounded-full border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors">
              Logout
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-4 py-2 rounded-full border text-xs font-bold transition-colors ${isEditing ? 'bg-black text-white border-black' : 'bg-white border-gray-200 text-gray-900 hover:border-gray-900'}`}
            >
              {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </button>
          </div>
        )}

        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          <div className="mb-12 relative">
            <div className={`avatar-shell w-28 h-28 md:w-36 md:h-36 border-[3.5px] p-1.5 transition-all duration-700 bg-white border-solid`} style={{ borderColor: primaryBadge?.auraColor || '#f3f4f6' }}>
              <div className="vj-aura" style={{ background: primaryBadge?.auraColor || '#EAEAEA', opacity: 0.35 }} />
              <img src={profileData.avatar || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png'} className="w-full h-full rounded-full object-cover relative z-10" alt={profileData.name} />
              {showRipple && (
                <div className="absolute inset-[-6px] rounded-full border-[2px] opacity-0" style={{ borderColor: primaryBadge?.auraColor || '#E2E8F0', animation: 'aura-ripple 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards' }} />
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

          <div className="mb-8 w-full max-w-md">
            {isEditing ? (
              <div className="flex flex-col gap-3 animate-in fade-in">
                <input
                  className="text-center text-2xl font-black text-gray-900 border-b-2 border-gray-100 focus:border-black outline-none pb-2"
                  value={editForm.display_name}
                  onChange={e => setEditForm(s => ({ ...s, display_name: e.target.value }))}
                  placeholder="Display Name"
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
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center gap-3 mb-2">
                  <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter leading-none">
                    {profileData.name}
                  </h1>
                  <BadgeRow badges={badgeTypes} limit={3} size="md" />
                </div>
                <p className="text-sm font-bold text-gray-300 uppercase tracking-[0.4em] mb-4">{profileData.handle}</p>
                {myProfile?.bio && <p className="text-sm text-gray-500 max-w-lg mx-auto leading-relaxed">{myProfile.bio}</p>}
              </>
            )}
          </div>

          {!isEditing && (
            <div className="flex flex-col items-center gap-10">
              {!isMe && (
                <button
                  onClick={async () => {
                    // Toggle follow logic (optimistic)
                    setIsFollowing(!isFollowing);
                    // Call backend...
                    if (!user) return;
                    try {
                      const targetId = (await supabase.from('profiles').select('id').eq('handle', profileData.handle.replace('@', '')).single()).data?.id;
                      if (!targetId) return;
                      if (!isFollowing) {
                        await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId });
                        setStats(s => ({ ...s, followers: s.followers + 1 }));
                      } else {
                        await supabase.from('follows').delete().match({ follower_id: user.id, following_id: targetId });
                        setStats(s => ({ ...s, followers: s.followers - 1 }));
                      }
                    } catch (e) { console.error(e); }
                  }}
                  className={`min-w-[180px] py-4 px-12 rounded-[24px] font-black text-[12px] uppercase tracking-[0.2em] transition-all ${isFollowing ? 'bg-white text-gray-400 border border-gray-100 shadow-sm' : 'bg-gray-900 text-white shadow-2xl shadow-gray-900/10 active:scale-95'}`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}

              <div className="flex items-center gap-12">
                <MetricItem label="Followers" value={stats.followers.toString()} />
                <div className="w-px h-6 bg-gray-100" />
                <MetricItem label="Following" value={stats.following.toString()} />
                <div className="w-px h-6 bg-gray-100" />
                <MetricItem label="Bookmarks" value={stats.bookmarks.toString()} onClick={() => setShowBookmarks(true)} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6">
        <div className="flex flex-col py-20 border-b border-gray-50">
          <div className="flex items-center justify-center gap-16 md:gap-24">
            {[{ label: 'Products', value: products.length }, { label: 'Reach', value: stats.reach }, { label: 'Signals', value: stats.signals }].map((stat) => (
              <div key={stat.label} className="text-center group/stat">
                <span className="block text-3xl font-black text-gray-900 tracking-tighter group-hover/stat:text-blue-500 transition-colors">{stat.value}</span>
                <span className="block text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mt-2 leading-none">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-20 pb-40">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {products.length === 0 ? (
            <div className="col-span-full py-12 text-center">
              <p className="text-sm font-bold text-gray-300 uppercase tracking-widest">No jams published yet.</p>
            </div>
          ) : (
            products.map(app => (
              <AppCard key={app.id} project={app} onClick={() => onSelectApp(app)} />
            ))
          )}
        </div>
      </div>

      {showBookmarks && (
        <BookmarksPanel
          onClose={() => setShowBookmarks(false)}
          onSelectJam={(id) => {
            // ...
            // Need to fetch full jam or rely on what BookmarksPanel gives (it gives ID usually)
            // For now we just close
            setShowBookmarks(false);
          }}
          onDiscover={() => {
            setShowBookmarks(false);
            onClose();
          }}
        />
      )}

      <style>{`
        @keyframes aura-ripple { 0% { transform: scale(1); opacity: 0.2; } 100% { transform: scale(1.15); opacity: 0; } }
      `}</style>
    </div>
  );
};

export default CreatorProfile;
