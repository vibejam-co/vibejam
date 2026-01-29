import React, { useState, useEffect, useMemo, useRef } from 'react';
import AppCard from './AppCard';
import { AppProject, BadgeType } from '../types';
import Badge, { SEAL_METADATA } from './Badge';
import BookmarksPanel from './BookmarksPanel';
import { useBookmarks } from '../lib/useBookmarks';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { backend } from '../lib/backend';

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

const BadgeRow = ({ badges, limit, size }: { badges: string[], limit: number, size: 'sm' | 'md' | 'lg' }) => {
  return (
    <div className="flex gap-2">
      {badges.slice(0, limit).map((b, i) => (
        <Badge key={i} type={b} size={size} showTooltip />
      ))}
    </div>
  );
};

const CreatorProfile: React.FC<CreatorProfileProps> = ({ creator: initialCreator, onClose, onSelectApp, isFirstTimeEarn = false }) => {
  const { user, signOut } = useAuth();
  const [profileData, setProfileData] = useState(initialCreator);
  const [products, setProducts] = useState<AppProject[]>([]);
  const [stats, setStats] = useState({ followers: 0, following: 0, bookmarks: 0, reach: 0, signals: 0 });
  const [isMe, setIsMe] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ display_name: '', username: '', bio: '', avatar_url: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);

  useEffect(() => {
    const handle = profileData.handle.replace('@', '');
    const loadRealData = async () => {
      const { data: jams } = await backend.getDiscoveryFeed({ mode: 'newest' });
      const creatorJams = jams.filter(j => j.creator?.handle === handle);
      
      const mappedJams: AppProject[] = creatorJams.map(j => ({
        id: j.id,
        name: j.name,
        description: j.tagline || j.description || '',
        category: j.category,
        screenshot: j.media?.heroImageUrl || '',
        mediaType: 'image',
        thumbnailUrl: j.media?.heroImageUrl || '',
        stats: {
          revenue: j.mrr_bucket || '$0',
          isRevenuePublic: j.mrr_visibility === 'public',
          growth: '+0%',
          rank: j.rank?.score_trending || 0,
          upvotes: j.stats?.upvotes || 0,
          daysLive: 0,
        },
        creator: profileData,
        stack: j.tech_stack || [],
        vibeTools: j.vibe_tools || []
      }));
      setProducts(mappedJams);

      const { data: dbProfile } = await supabase.from('profiles').select('id, display_name, handle, avatar_url, bio, badges').eq('handle', handle).maybeSingle();
      
      if (dbProfile) {
        if (user && dbProfile.id === user.id) {
          setIsMe(true);
        }
        
        setProfileData({
          handle: '@' + dbProfile.handle,
          name: dbProfile.display_name || '',
          avatar: dbProfile.avatar_url || '',
          badges: dbProfile.badges || [],
          type: 'Solo Founder'
        });

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
          reach: 0,
          signals: upvotes || 0
        });

        if (user && dbProfile.id !== user.id) {
          const { count } = await supabase.from('follows').select('*', { count: 'exact', head: true })
            .eq('follower_id', user.id).eq('following_id', dbProfile.id);
          setIsFollowing(!!count);
        }
      }
    };
    loadRealData();
  }, [profileData.handle, user]);

  const handleEditSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setErrorMsg(null);
    try {
      const updates = {
        display_name: editForm.display_name,
        handle: editForm.username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
        bio: editForm.bio,
        avatar_url: editForm.avatar_url
      };
      const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
      if (error) throw error;
      setIsEditing(false);
      window.location.reload();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    onClose();
    window.location.reload();
  };

  const badgeTypes = useMemo(() => {
    return (profileData.badges || [])
      .map(b => b.type);
  }, [profileData.badges]);

  const primaryBadge = badgeTypes[0] ? SEAL_METADATA[badgeTypes[0]] : null;

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
            </div>
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
                </div>
                <p className="text-sm font-bold text-gray-300 uppercase tracking-[0.4em] mb-4">{profileData.handle}</p>
              </>
            )}
          </div>

          {!isEditing && (
            <div className="flex flex-col items-center gap-10">
              <div className="flex items-center gap-12">
                <MetricItem label="Followers" value={stats.followers.toString()} />
                <div className="w-px h-6 bg-gray-100" />
                <MetricItem label="Following" value={stats.following.toString()} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-20 pb-40">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {products.map(app => (
            <AppCard key={app.id} project={app} onClick={() => onSelectApp(app)} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreatorProfile;
