
import React, { useState, useEffect } from 'react';
import { AppProject } from '../types';
import Badge from './Badge';
import { supabase } from '../lib/supabaseClient';
import { backend } from '../lib/backend';
import { useAuth } from '../contexts/AuthContext';

interface CreatorDashboardProps {
  user: {
    name: string;
    handle: string;
    avatar: string;
    auraColor: string;
    creatorSince: string;
  };
  onBack: () => void;
  onStartJam: () => void;
  onEditJam: (jam: any) => void;
  refreshTrigger?: number;
}

const CreatorDashboard: React.FC<CreatorDashboardProps> = ({ user, onBack, onStartJam, onEditJam, refreshTrigger = 0 }) => {
  const { user: authUser } = useAuth();
  const [ownedJams, setOwnedJams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionJamId, setActionJamId] = useState<string | null>(null);

  useEffect(() => {
    if (!authUser) return;

    const fetchMyJams = async () => {
      try {
        // Query real jams table for this user
        const { data, error } = await supabase
          .from('jams')
          .select('*')
          .eq('creator_id', authUser.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setOwnedJams(data);
      } catch (e) {
        console.error("[Creator] Error fetching jams:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchMyJams();
  }, [authUser, refreshTrigger]);

  const refresh = async () => {
    if (!authUser) return;
    try {
      const { data, error } = await supabase
        .from('jams')
        .select('*')
        .eq('creator_id', authUser.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setOwnedJams(data);
    } catch (e) {
      console.error("[Creator] Error refreshing jams:", e);
    }
  };

  const handleUnpublish = async (jamId: string, hide: boolean) => {
    try {
      setActionJamId(jamId);
      const res = await backend.unpublishJam({ jamId, hide });
      if (!res.ok) throw new Error(res.error || 'UNPUBLISH_FAILED');
      await refresh();
    } catch (e) {
      console.error('[Creator] Unpublish failed', e);
    } finally {
      setActionJamId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white pt-32 pb-40 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto px-6">

        {/* Navigation Back */}
        <button onClick={onBack} className="mb-12 flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-all group">
          <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Studio</span>
        </button>

        {/* Creator Identity Header */}
        <header className="flex items-center justify-between mb-20">
          <div className="flex items-center gap-6">
            <div className="relative aura-clip">
              <div className="w-20 h-20 rounded-full border-[3px] border-white p-1 bg-white relative z-10 shadow-sm overflow-hidden flex items-center justify-center">
                {user.avatar ? (
                  <img src={user.avatar} className="w-full h-full rounded-full object-cover" alt={user.name} />
                ) : (
                  <span className="text-xl font-black text-gray-200">{user.name[0]?.toUpperCase()}</span>
                )}
              </div>
              <div className="aura-halo" style={{ background: user.auraColor, opacity: 0.2, inset: '-6px' }} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-black text-gray-900 tracking-tighter leading-none">{user.name}</h1>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-[8px] font-black text-blue-500 uppercase tracking-widest border border-blue-100/50">Creator</span>
              </div>
              <p className="text-xs font-bold text-gray-300 uppercase tracking-[0.3em] mb-1">{user.handle}</p>
              <p className="text-[10px] font-medium text-gray-400">Creator since {user.creatorSince}</p>
            </div>
          </div>
        </header>

        {/* Jam Overview Section */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">My Jams</h3>
            <button
              onClick={onStartJam}
              className="text-[10px] font-black text-blue-500 hover:text-blue-600 uppercase tracking-widest transition-colors"
            >
              + New Jam
            </button>
          </div>

          <div className="space-y-6">
            {ownedJams.length > 0 ? (
              ownedJams.map(jam => (
                <div key={jam.id} className="premium-card rounded-[40px] p-10 border border-gray-50 bg-[#F9F9FB]/30">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4 mb-3">
                        <h4 className="text-2xl font-black text-gray-900 tracking-tight leading-none">{jam.name}</h4>
                        {jam.is_hidden ? (
                          <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-[9px] font-black uppercase tracking-widest border border-gray-200">Hidden</span>
                        ) : jam.status === 'published' ? (
                          <span className="px-2.5 py-1 rounded-full bg-green-50 text-green-600 text-[9px] font-black uppercase tracking-widest border border-green-100/50">Live</span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 text-[9px] font-black uppercase tracking-widest border border-yellow-100/50">Draft</span>
                        )}
                      </div>
                      <p className="text-gray-500 font-medium mb-6">{jam.tagline || 'No tagline set.'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onEditJam(jam)}
                        className="px-4 py-2 rounded-xl bg-white border border-gray-100 text-[9px] font-black uppercase tracking-widest text-gray-700 hover:text-gray-900 hover:border-gray-200 transition-all"
                      >
                        Edit
                      </button>
                      {jam.status === 'published' && (
                        <button
                          onClick={() => handleUnpublish(jam.id, false)}
                          disabled={actionJamId === jam.id}
                          className="px-4 py-2 rounded-xl bg-white border border-gray-100 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-700 hover:border-gray-200 transition-all disabled:opacity-40"
                        >
                          Unpublish
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const ok = confirm('This will hide the Jam from discovery and your public profile. Continue?');
                          if (ok) handleUnpublish(jam.id, true);
                        }}
                        disabled={actionJamId === jam.id}
                        className="px-4 py-2 rounded-xl bg-red-50 border border-red-100 text-[9px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 hover:border-red-200 transition-all disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-20 rounded-[40px] border-2 border-dashed border-gray-100 text-center flex flex-col items-center">
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4">No Jams Launched</span>
                <button
                  onClick={onStartJam}
                  className="px-8 py-3 rounded-2xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                >
                  Launch Your First Jam
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Audience Pulse - Zero State */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-20">
          <section className="bg-white p-10 rounded-[40px] border border-gray-50 shadow-sm">
            <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mb-8">Audience Pulse</h3>
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded-full border border-gray-100 text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <div>
                <p className="text-xl font-black text-gray-900 leading-none">0</p>
                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Growth will show here</p>
              </div>
            </div>
          </section>

          <section className="bg-white p-10 rounded-[40px] border border-gray-50 shadow-sm">
            <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mb-8">Recent Signals</h3>
            <div className="py-8 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-100">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No signals yet</p>
            </div>
          </section>
        </div>

        {/* Badges & Prestige */}
        <section className="flex flex-col items-center pt-10 border-t border-gray-50">
          <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mb-8">Launch Prestige</h3>
          <div className="flex gap-6 p-4 px-10 bg-white border border-gray-100 rounded-full shadow-sm mb-6 opacity-30 cursor-not-allowed">
            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Pending Achievement</span>
          </div>
        </section>

      </div>
    </div>
  );
};

export default CreatorDashboard;
