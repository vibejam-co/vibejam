import { supabase } from './supabaseClient';
import { JamDoc, SignalType } from '../types';

/**
 * High-level backend abstraction for VibeJam.
 * Handles interactions with Supabase Edge Functions and standard DB queries.
 */

export const backend = {
  /**
   * Records a signal (view, upvote, bookmark) via edge function for rate limiting and logic.
   */
  async recordSignal(type: SignalType, jamId: string) {
    const { data, error } = await supabase.functions.invoke(`${type}-toggle`, {
      body: { jamId }
    });
    if (error) throw error;
    return data;
  },

  /**
   * Fetches the discovery feed with advanced filtering and listing logic.
   */
  async getDiscoveryFeed(options: { 
    mode?: 'trending' | 'newest' | 'revenue' | 'picks',
    category?: string,
    query?: string
  } = {}) {
    // Mode-based sorting
    let query = supabase
      .from('jams')
      .select('*, creator:profiles(*)')
      .eq('status', 'published')
      .eq('is_listed', true)
      .eq('is_private', false);

    if (options.category && options.category !== 'All') {
      query = query.eq('category', options.category);
    }

    if (options.query) {
      query = query.ilike('name', `%${options.query}%`);
    }

    switch (options.mode) {
      case 'newest':
        query = query.order('published_at', { ascending: false });
        break;
      case 'revenue':
        query = query.order('mrr_value', { ascending: false });
        break;
      default: // trending (default)
        // Note: For real trending we'd use rank.score_trending, but for now published_at
        query = query.order('published_at', { ascending: false });
    }

    const { data, error } = await query.limit(20);
    if (error) throw error;
    
    // Adapt to JamDoc type
    return (data || []).map(d => ({
      ...d,
      media: {
        heroImageUrl: d.media_url,
        imageUrls: d.media_urls || [],
      },
      stats: {
        upvotes: d.upvotes_count || 0,
        views: d.views_count || 0,
        bookmarks: d.bookmarks_count || 0,
      }
    }));
  }
};
