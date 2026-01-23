import { AppProject, JamStatus } from '../types';

export interface JamPublished extends AppProject {
  slug: string;
  publishedAt: number;
  status: 'published';
}

const PUBLISHED_KEY = 'vj_startjam_published_v2';

export const jamLocalStore = {
  savePublished: (jam: JamPublished): void => {
    try {
      const existing = jamLocalStore.listLocalOnly();
      existing.unshift(jam);
      localStorage.setItem(PUBLISHED_KEY, JSON.stringify(existing));
    } catch (e) {
      console.error("Failed to save jam locally", e);
    }
  },

  listLocalOnly: (): JamPublished[] => {
    try {
      const data = localStorage.getItem(PUBLISHED_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  get: (id: string): any | null => {
    try {
      // 1. Check Published
      const published = jamLocalStore.listLocalOnly();
      const found = published.find((j: any) => j.id === id);
      if (found) return found;

      // 2. Check Draft
      const draftRaw = localStorage.getItem('vj_draft_jam');
      if (draftRaw) {
        const draft = JSON.parse(draftRaw);
        if (draft.id === id) return draft;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Unified hybrid fetcher for v1
   * Returns only localStorage jams (Supabase is now the source of truth via backend.ts)
   */
  listAll: async (limit = 20): Promise<JamPublished[]> => {
    // Return local jams only - Supabase data fetching is handled by backend.ts
    const localJams = jamLocalStore.listLocalOnly();
    return localJams.slice(0, limit);
  }
};

export const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};
