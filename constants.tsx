
import { AppProject } from './types';

export const MOCK_APPS: AppProject[] = [
  {
    id: '1',
    name: 'Lumify',
    description: 'Ambient focus environments for creators and writers.',
    category: 'Creativity',
    icon: '✨',
    screenshot: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1200',
    mediaType: 'image',
    thumbnailUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=400',
    stats: { revenue: '$4.2k', isRevenuePublic: true, growth: '+12%', rank: 1, upvotes: 412, daysLive: 45 },
    creator: { 
      name: 'Alex Rivera', 
      avatar: 'https://picsum.photos/seed/alex/100', 
      color: '#3b82f6', 
      type: 'Solo Founder', 
      handle: '@arivera',
      badges: [
        { type: 'founding_creator', label: 'Founding Creator', description: 'One of the first creators to ship on VibeJam.' },
        { type: 'consistent_shipper', label: 'Consistent Shipper', description: 'Crafted. Earned. Built.' },
        { type: 'insider', label: 'Insider', description: 'Key contributor.' }
      ]
    },
    stack: ['Next.js', 'Postgres'],
    vibeTools: ['Claude', 'Cursor'],
    milestones: [
      { date: 'Jan 12', label: 'Initial Launch' },
      { date: 'Feb 02', label: 'Hit $1k MRR' },
      { date: 'Feb 15', label: 'VibeJam Featured' }
    ]
  },
  {
    id: '2',
    name: 'Chord',
    description: 'Social networking for independent music labels.',
    category: 'Music',
    icon: '🎵',
    screenshot: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=1200',
    mediaType: 'image',
    thumbnailUrl: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=400',
    stats: { revenue: '$12.8k', isRevenuePublic: true, growth: '+24%', rank: 2, upvotes: 890, daysLive: 120 },
    creator: { 
      name: 'Sarah Chen', 
      avatar: 'https://picsum.photos/seed/sarah/100', 
      color: '#f43f5e', 
      type: 'Team', 
      handle: '@schen',
      badges: [
        { type: 'breakout_creator', label: 'Breakout Creator', description: 'This product broke through on VibeJam.' },
        { type: 'revenue_leader', label: 'Revenue Leader', description: 'Exceptional financial performance.' },
        { type: 'top_curator', label: 'Top Curator', description: 'Refined taste.' }
      ]
    },
    stack: ['React', 'Supabase', 'Web Audio API'],
    vibeTools: ['Gemini', 'Linear'],
    milestones: [
      { date: 'Nov 2023', label: 'Beta Release' },
      { date: 'Jan 2024', label: 'Series Vibe Seed' }
    ]
  },
  {
    id: '3',
    name: 'Drift',
    description: 'AI-assisted travel planning for digital nomads.',
    category: 'Lifestyle',
    icon: '☁️',
    screenshot: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1200',
    mediaType: 'image',
    thumbnailUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=400',
    stats: { revenue: '$2.1k', isRevenuePublic: true, growth: '+8%', rank: 5, upvotes: 245, daysLive: 30 },
    creator: { 
      name: 'Marcus Bell', 
      avatar: 'https://picsum.photos/seed/marcus/100', 
      color: '#22c55e', 
      type: 'Solo Founder', 
      handle: '@mbell',
      badges: [
        { type: 'founding_member', label: 'Founding Member', description: 'A pioneer member.' },
        { type: 'early_access', label: 'Early Access', description: 'First wave explorer.' },
        { type: 'community_builder', label: 'Community Builder', description: 'Fostering growth.' }
      ]
    },
    stack: ['Python', 'FastAPI', 'React'],
    vibeTools: ['Claude'],
    milestones: [
      { date: 'Feb 2024', label: 'First 100 Users' }
    ]
  },
  {
    id: '4',
    name: 'Opal',
    description: 'A minimal task manager that rewards deep work.',
    category: 'Productivity',
    icon: '💎',
    screenshot: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&q=80&w=1200',
    mediaType: 'image',
    thumbnailUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&q=80&w=400',
    stats: { revenue: '$950', isRevenuePublic: false, growth: '+45%', rank: 12, upvotes: 1102, daysLive: 12 },
    creator: { 
      name: 'Elena Voss', 
      avatar: 'https://picsum.photos/seed/elena/100', 
      color: '#a855f7', 
      type: 'Solo Founder', 
      handle: '@evoss',
      badges: [
        { type: 'consistent_shipper', label: 'Consistent Shipper', description: 'Crafted. Earned. Built.' },
        { type: 'cult_favorite', label: 'Cult Favorite', description: 'Deeply resonated.' }
      ]
    },
    stack: ['SwiftUI', 'Node.js'],
    vibeTools: ['Claude', 'Cursor'],
    milestones: [
      { date: 'Mar 01', label: 'Pre-launch signups open' },
      { date: 'Mar 10', label: 'Official Release' }
    ]
  }
];
