import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export function useBookmarks() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    const fetchBookmarks = async () => {
      const { data } = await supabase
        .from('bookmarks')
        .select('jam_id')
        .eq('user_id', user.id);
      
      if (data) {
        setBookmarks(new Set(data.map(b => b.jam_id)));
      }
    };
    fetchBookmarks();
  }, [user]);

  const toggleBookmark = async (jamId: string) => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase.functions.invoke('bookmark-toggle', {
        body: { jamId }
      });
      if (error) throw error;
      
      const newSet = new Set(bookmarks);
      if (data.bookmarked) {
        newSet.add(jamId);
      } else {
        newSet.delete(jamId);
      }
      setBookmarks(newSet);
      return true;
    } catch (err) {
      console.error('Error toggling bookmark:', err);
      return false;
    }
  };

  return { bookmarks, toggleBookmark };
}
