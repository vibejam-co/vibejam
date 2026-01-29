import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { AppProject } from '../types';

interface BookmarksPanelProps {
  onJamClick: (id: string) => void;
}

const BookmarksPanel: React.FC<BookmarksPanelProps> = ({ onJamClick }) => {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchBookmarks = async () => {
      try {
        const { data, error } = await supabase
          .from('bookmarks')
          .select('*, jams(*, creator:profiles(*))')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setBookmarks(data || []);
      } catch (err) {
        console.error('Error fetching bookmarks:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookmarks();
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (bookmarks.length === 0) return (
    <div className="text-center py-20 px-8">
      <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-6 text-2xl">🔖</div>
      <h3 className="font-bold text-gray-900 mb-2">No bookmarks yet</h3>
      <p className="text-xs text-gray-400 max-w-[240px] mx-auto leading-relaxed">Stable versions of your favorite Jams will appear here for quick access.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {bookmarks.map((b) => {
        const jam = b.jams;
        if (!jam) return null;
        return (
          <div 
            key={b.id}
            onClick={() => onJamClick(jam.id)}
            className="flex items-center gap-4 p-4 rounded-3xl bg-white border border-gray-50 hover:border-blue-100 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
               {jam.media_url ? (
                 <img src={jam.media_url} className="w-full h-full object-cover" alt="" />
               ) : (
                 <span className="text-xl">🚀</span>
               )}
            </div>
            <div className="flex-1 min-w-0">
               <h4 className="font-bold text-sm text-gray-900 truncate group-hover:text-blue-500 transition-colors">{jam.name}</h4>
               <p className="text-[10px] text-gray-400 truncate font-medium">{jam.tagline || jam.description}</p>
            </div>
            <div className="text-right shrink-0">
               <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">{jam.mrr_bucket || '$0'}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BookmarksPanel;
