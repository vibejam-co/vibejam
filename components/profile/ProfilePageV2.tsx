import React, { useEffect, useState } from 'react';
import { AppProject } from '../../types';
import { backend } from '../../lib/backend';
import { supabase } from '../../lib/supabaseClient';
import AppCard from '../AppCard';

interface ProfilePageV2Props {
  handle: string;
  onClose: () => void;
  onSelectJam: (jam: AppProject) => void;
}

const ProfilePageV2: React.FC<ProfilePageV2Props> = ({ handle, onClose, onSelectJam }) => {
  const [profile, setProfile] = useState<{ name: string; handle: string; avatar?: string; bio?: string } | null>(null);
  const [jams, setJams] = useState<AppProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const cleanHandle = handle.replace('@', '');

      const { data: profileRow } = await supabase
        .from('profiles')
        .select('handle, display_name, avatar_url, bio')
        .eq('handle', cleanHandle)
        .maybeSingle();

      if (!cancelled) {
        setProfile(profileRow ? {
          name: profileRow.display_name || 'Maker',
          handle: `@${profileRow.handle}`,
          avatar: profileRow.avatar_url || undefined,
          bio: profileRow.bio || ''
        } : null);
      }

      const { data: jamsData } = await backend.fetchCreatorPublishedJamsByHandle(cleanHandle, { limit: 20 });
      if (cancelled) return;

      const mapped = jamsData.map(j => ({
        id: j.id,
        slug: j.slug,
        name: j.name,
        description: j.tagline || '',
        category: j.category || 'Product',
        proofUrl: j.socials?.proof_url || j.socials?.proofUrl,
        screenshot: j.cover_image_url || '',
        mediaType: 'image',
        thumbnailUrl: j.cover_image_url || '',
        stats: { revenue: '$0', isRevenuePublic: true, growth: '0%', rank: 0, upvotes: 0, daysLive: 0 },
        creator: {
          name: profileRow?.display_name || 'Maker',
          avatar: profileRow?.avatar_url || '',
          handle: profileRow?.handle ? `@${profileRow.handle}` : `@${cleanHandle}`,
          type: 'Solo Founder'
        },
        stack: j.tech_stack || [],
        vibeTools: j.vibe_tools || [],
        milestones: j.milestones || [],
        websiteUrl: j.website_url || ''
      } as AppProject));

      setJams(mapped);
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [handle]);

  return (
    <div className="min-h-screen bg-white text-gray-900 px-6 md:px-10 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100">
              {profile?.avatar && (
                <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
              )}
            </div>
            <div>
              <div className="text-2xl font-bold">{profile?.name || 'Creator'}</div>
              <div className="text-sm font-mono text-gray-400">{profile?.handle || `@${handle.replace('@', '')}`}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-gray-200 text-xs font-semibold text-gray-600"
          >
            Back
          </button>
        </div>

        {profile?.bio && (
          <p className="text-base text-gray-600 mb-10 max-w-2xl">
            {profile.bio}
          </p>
        )}

        <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
          Jams
        </div>

        {loading && (
          <div className="text-sm text-gray-400">Loading…</div>
        )}

        {!loading && jams.length === 0 && (
          <div className="text-sm text-gray-400">No jams published yet.</div>
        )}

        {!loading && jams.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jams.map(jam => (
              <AppCard
                key={jam.id}
                project={jam}
                onSelect={onSelectJam}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePageV2;
