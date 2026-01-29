import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabaseClient';
import DiscoveryPage from './components/DiscoveryPage';
import LeaderboardPage from './pages/LeaderboardPage';
import CreatorDashboard from './components/CreatorDashboard';
import UserDashboard from './components/UserDashboard';
import Launchpad from './components/Launchpad';
import AppView from './components/AppView';
import CreatorProfile from './components/CreatorProfile';
import { AppProject } from './types';

// Wrapper to handle deep navigation for Jam details
const JamDetailWrapper = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [jam, setJam] = useState<AppProject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJam = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from('jams')
          .select('*, creator:profiles(*)')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (data) {
          // Adapt DB record to AppProject type
          const adapted: AppProject = {
            id: data.id,
            name: data.name,
            description: data.tagline || data.description || '',
            category: data.category,
            screenshot: data.media?.heroImageUrl || '',
            mediaType: 'image',
            thumbnailUrl: data.media?.heroImageUrl || '',
            stats: {
              revenue: data.mrr_bucket || '$0',
              isRevenuePublic: data.mrr_visibility === 'public',
              growth: '+0%',
              rank: data.rank?.score_trending || 0,
              upvotes: data.stats?.upvotes || 0,
              daysLive: data.published_at ? Math.floor((Date.now() - new Date(data.published_at).getTime()) / (1000 * 60 * 60 * 24)) : 0,
            },
            creator: {
              name: data.creator?.display_name || 'Anonymous',
              avatar: data.creator?.avatar_url || '',
              handle: data.creator?.handle || 'anon',
              type: data.team_type === 'team' ? 'Team' : 'Solo Founder',
              badges: data.creator?.badges || [],
            },
            stack: data.tech_stack || [],
            vibeTools: data.vibe_tools || [],
            status: data.status
          };
          setJam(adapted);
        }
      } catch (err) {
        console.error('Error fetching jam for detail view:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJam();
  }, [id]);

  if (loading) return null;
  if (!jam) return <div>Jam not found</div>;

  return <AppView app={jam} onClose={() => navigate(-1)} />;
};

function AppContent() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#3b82f6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#3b82f6]/30">
      <Suspense fallback={null}>
        <Routes location={location}>
          <Route path="/" element={<DiscoveryPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/studio" element={<CreatorDashboard />} />
          <Route path="/me" element={<UserDashboard />} />
          <Route path="/launch" element={<Launchpad />} />
          <Route path="/jam/:id" element={<JamDetailWrapper />} />
          <Route path="/c/:handle" element={<CreatorProfile />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
