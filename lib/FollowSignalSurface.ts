import { backend } from './backend';

export type CredibilityDirection = 'up' | 'flat' | 'down';

export interface FollowSignalItem {
  jamId: string;
  slug: string;
  name: string;
  creatorName: string;
  creatorHandle: string;
  updatedAt: string | null;
  daysSince: number | null;
  direction: CredibilityDirection;
}

export interface FollowSignalSummary {
  items: FollowSignalItem[];
  activeCount: number;
  totalCount: number;
}

const extractHandle = (item: any): string | null =>
  item?.handle || item?.profile?.handle || item?.following?.handle || item?.user?.handle || null;

const extractName = (item: any): string =>
  item?.name || item?.display_name || item?.profile?.display_name || item?.following?.display_name || item?.user?.display_name || 'Builder';

const daysSince = (date?: string | null): number | null => {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  const diff = Math.floor((Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
};

export const deriveDirection = (days: number | null): CredibilityDirection => {
  if (days === null) return 'down';
  if (days <= 7) return 'up';
  if (days <= 30) return 'flat';
  return 'down';
};

export const formatSince = (days: number | null): string => {
  if (days === null) return 'No recent update';
  if (days === 0) return 'Updated today';
  if (days === 1) return 'Updated 1d ago';
  return `Updated ${days}d ago`;
};

export const loadFollowSignalSurface = async (handle: string, limit: number = 6): Promise<FollowSignalSummary> => {
  if (!handle) return { items: [], activeCount: 0, totalCount: 0 };

  const res = await backend.listFollows({ handle, kind: 'following', limit });
  const follows = res.items || [];

  const creators = follows
    .map((item) => ({
      handle: extractHandle(item),
      name: extractName(item)
    }))
    .filter((creator) => !!creator.handle)
    .slice(0, limit);

  const jams = await Promise.all(
    creators.map(async (creator) => {
      const { data } = await backend.fetchCreatorPublishedJamsByHandle(creator.handle as string, { limit: 1 });
      const jam = data?.[0];
      if (!jam) return null;
      const updatedAt = jam.published_at || jam.publishedAt || null;
      const days = daysSince(updatedAt);
      return {
        jamId: jam.id,
        slug: jam.slug || jam.id,
        name: jam.name,
        creatorName: creator.name,
        creatorHandle: creator.handle as string,
        updatedAt,
        daysSince: days,
        direction: deriveDirection(days)
      } as FollowSignalItem;
    })
  );

  const items = jams.filter((j): j is FollowSignalItem => !!j);
  const activeCount = items.filter((item) => item.daysSince !== null && item.daysSince <= 7).length;

  return {
    items,
    activeCount,
    totalCount: items.length
  };
};
