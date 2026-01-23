import { useState, useEffect, useCallback } from 'react';
import { AppProject } from '../types';
import { backend } from './backend';

const BOOKMARKS_KEY = 'vj_bookmarks_v1';
export const VJ_BOOKMARKS_UPDATED_EVENT = 'vj:bookmarks-updated';

export interface BookmarkItem {
  id: string;
  name: string;
  screenshot: string;
  category: string;
  creator: {
    name: string;
    handle: string;
    avatar: string;
  };
  mrr: string;
  createdAt: number;
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  const hydrate = useCallback(async () => {
    try {
      if (typeof window === 'undefined') return;

      // 1. Load from Backend (Fail-open)
      const { jams, error } = await backend.listMyBookmarks();

      if (!error && jams.length > 0) {
        // Map JamDoc to BookmarkItem
        const mapped: BookmarkItem[] = jams.map(j => ({
          id: j.id,
          name: j.name,
          screenshot: j.media?.heroImageUrl || '',
          category: j.category,
          creator: {
            name: 'Maker',
            handle: '@maker',
            avatar: ''
          },
          mrr: j.mrrBucket || '',
          createdAt: Date.now()
        }));
        setBookmarks(mapped);
        localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(mapped)); // Sync local
        return;
      }

      // 2. Fallback to LocalStorage if backend empty/fails
      const raw = localStorage.getItem(BOOKMARKS_KEY);
      if (raw) {
        setBookmarks(JSON.parse(raw));
      } else {
        setBookmarks([]);
      }
    } catch (e) {
      console.error("VJ: Bookmark hydration failed", e);
      // Final fallback
      const raw = localStorage.getItem(BOOKMARKS_KEY);
      if (raw) setBookmarks(JSON.parse(raw));
    }
  }, []);

  const notify = () => {
    window.dispatchEvent(new CustomEvent(VJ_BOOKMARKS_UPDATED_EVENT));
  };

  useEffect(() => {
    hydrate();

    const handleSync = () => hydrate();
    const handleStorage = (e: StorageEvent) => {
      if (e.key === BOOKMARKS_KEY) hydrate();
    };

    window.addEventListener(VJ_BOOKMARKS_UPDATED_EVENT, handleSync);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(VJ_BOOKMARKS_UPDATED_EVENT, handleSync);
      window.removeEventListener('storage', handleStorage);
    };
  }, [hydrate]);

  const isBookmarked = (id: string) => bookmarks.some(b => b.id === id);

  const toggleBookmark = (jam: AppProject) => {
    const existing = isBookmarked(jam.id);
    let next: BookmarkItem[];

    // BACKEND SYNC (Fire/Forget or Optimistic with rollback could go here)
    // We do optimistic here.
    backend.toggleBookmark(jam.id).catch(err => {
      console.warn('Backend bookmark toggle failed', err);
      // Ideally rollback here if strict
    });

    if (existing) {
      next = bookmarks.filter(b => b.id !== jam.id);
    } else {
      const newItem: BookmarkItem = {
        id: jam.id,
        name: jam.name,
        screenshot: jam.screenshot,
        category: jam.category,
        creator: {
          name: jam.creator.name,
          handle: jam.creator.handle,
          avatar: jam.creator.avatar,
        },
        mrr: jam.stats.revenue,
        createdAt: Date.now(),
      };
      next = [newItem, ...bookmarks];
    }

    setBookmarks(next);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
    notify();
  };

  const removeBookmark = (id: string) => {
    const next = bookmarks.filter(b => b.id !== id);
    setBookmarks(next);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
    notify();
  };

  return {
    bookmarks,
    count: bookmarks.length,
    isBookmarked,
    toggleBookmark,
    removeBookmark,
    refresh: hydrate
  };
}
