
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Logo from './components/Logo';
import AppCard from './components/AppCard';
import Launchpad from './components/Launchpad';
import DiscoveryPage from './components/DiscoveryPage';
import DiscoveryFeed from './components/DiscoveryFeed';
import UserDashboard from './components/UserDashboard';
import CreatorDashboard from './components/CreatorDashboard';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import CookiePage from './pages/CookiePage';
import LeaderboardPage from './pages/LeaderboardPage';
import CreatorToolsPage from './pages/CreatorToolsPage';
import GuidelinesPage from './pages/GuidelinesPage';
import ContactPage from './pages/ContactPage';
import { backend } from './lib/backend';
import { getJamSlug, mapJamToAppProject } from './lib/jamMapping';
import { FEATURE_FLAGS } from './constants';
import { AppProject } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabaseClient';
import JamPageV2 from './components/jam/JamPageV2';
import ProfilePageV2 from './components/profile/ProfilePageV2';
import EmbedPage from './components/embed/EmbedPage';
import { warnIfObserveOnlyWindow, warnIfRankingOrHype } from './lib/ChangeTypes';

const AuthModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { signInWithGoogle } = useAuth();
  const oauthEnabled = true;

  if (!isOpen) return null;

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    if (provider === 'github') {
      alert("GitHub login coming soon. Please use Google.");
      return;
    }

    try {
      await signInWithGoogle();
      onClose();
    } catch (error: any) {
      console.error("OAuth init failed", error);
      alert(error.message || "Failed to start sign-in flow.");
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/5 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[420px] bg-white rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col p-8 md:p-12 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-300 hover:text-gray-900 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="mb-10 opacity-80 scale-90">
            <Logo />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Sign in to VibeJam</h2>
          <p className="text-sm text-gray-400 font-medium mb-10">Join, comment, and launch your Jam.</p>

          <div className="w-full space-y-3">
            {[
              { id: 'google', name: 'Google', icon: 'https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png' },
              { id: 'github', name: 'GitHub', icon: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png' }
            ].map(platform => (
              <button
                key={platform.name}
                onClick={() => handleOAuthLogin(platform.id as any)}
                className={`w-full h-14 rounded-full flex items-center px-6 group transition-all ${oauthEnabled ? 'bg-gray-50 hover:bg-gray-100' : 'bg-gray-50/50 cursor-not-allowed grayscale'
                  }`}
              >
                <img src={platform.icon} alt="" className="w-5 h-5 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                <span className="flex-1 text-sm font-bold text-gray-700">
                  Continue with {platform.name}
                </span>
              </button>
            ))}
          </div>

          <p className="mt-10 text-[10px] text-gray-300 font-medium leading-relaxed">
            By continuing, you agree to VibeJam’s <br />
            <span className="underline cursor-pointer">Terms</span> and <span className="underline cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
};

const RevenueCarousel: React.FC<{ apps: AppProject[], onSelect: (app: AppProject) => void }> = ({ apps, onSelect }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: false,
    skipSnaps: false,
    loop: false
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onSelectIdx = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelectIdx();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelectIdx);
    emblaApi.on('reInit', onSelectIdx);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        emblaApi.scrollNext();
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        emblaApi.scrollPrev();
      }
    };

    const root = emblaApi.rootNode();
    root.addEventListener('keydown', handleKeyDown);
    return () => root.removeEventListener('keydown', handleKeyDown);
  }, [emblaApi, onSelectIdx]);

  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  const leaders = useMemo(() => {
    return apps
      .filter(a => a.stats.isRevenuePublic)
      .sort((a, b) => parseFloat(`${b.stats.revenue}`.replace(/[^0-9.]/g, '')) - parseFloat(`${a.stats.revenue}`.replace(/[^0-9.]/g, '')))
      .slice(0, 10);
  }, [apps]);

  return (
    <section className="earnings homepage-v4-segment bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="earnings-header mb-10 text-center lg:text-left">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Highest Earning VibeJams</h2>
          <p className="text-gray-400 font-medium text-lg mt-2">Example of revenue transparency supported by VibeJam.</p>
        </div>

        <div className="embla" ref={emblaRef} tabIndex={0} style={{ outline: 'none' }}>
          <div className="embla__container">
            {leaders.map((app, idx) => (
              <div
                key={app.id}
                className={`embla__slide snap-center ${idx === 0 ? 'embla__slide--featured' : ''}`}
              >
                <div
                  onClick={() => onSelect(app)}
                  className={`earnings-card group ${selectedIndex === idx ? 'is-snapped' : ''}`}
                >
                  <div className="earnings-media" style={{ backgroundImage: `url(${app.screenshot})` }} />
                  <div className="earnings-vignette" />

                  <div
                    className="aura-layer opacity-0 group-hover:opacity-30"
                    style={{ boxShadow: `inset 0 0 80px ${app.creator.color}` }}
                  />

                  <div className="earnings-content">
                    <div className="earnings-meta">
                      <div className="earnings-app flex items-center justify-between gap-4">
                        <h3 className="earnings-appname text-2xl font-bold text-white truncate">{app.name}</h3>
                        <span className="earnings-chip text-[9px] font-black text-white/70 uppercase tracking-widest border border-white/20 px-3 py-1 rounded-full backdrop-blur-md shrink-0">
                          {app.category}
                        </span>
                      </div>

                      <div className="earnings-creator flex items-center gap-3 mt-4">
                        <div className="creator-avatar w-8 h-8 rounded-full border border-white/30 overflow-hidden shrink-0 relative">
                          <img src={app.creator.avatar} className="w-full h-full object-cover" alt={app.creator.name} />
                          <div className="aura-halo" style={{ inset: '-4px', background: app.creator.color, opacity: 0.2, filter: 'blur(8px)', zIndex: -1 }} />
                        </div>
                        <div className="creator-meta">
                          <span className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em]">{app.creator.name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="earnings-revenue flex items-end justify-between mt-auto">
                      <div className="rev">
                        <div className="rev-label text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-1">Monthly Revenue</div>
                        <div className="rev-value text-4xl font-black text-white tracking-tighter leading-none">{app.stats.revenue}</div>
                      </div>
                      <button className="earnings-action w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white transition-all group-hover:bg-white group-hover:text-gray-900" aria-label="View Jam">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="earnings-indicators mt-8 flex justify-center items-center gap-3" aria-hidden="false">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`dot w-1.5 h-1.5 rounded-full transition-all duration-300 ${index === selectedIndex ? 'bg-gray-900 scale-125 opacity-100' : 'bg-gray-200 opacity-40 scale-100'}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
      <style>{`
        :root {
          --embla-height: 420px;
        }
        @media (max-width: 1023px) { --embla-height: 360px; }
        @media (max-width: 640px) { --embla-height: 320px; }

        .earnings-card {
          position: relative;
          height: var(--embla-height);
          border-radius: 40px;
          background: #fdfdfd;
          border: var(--border-soft);
          cursor: pointer;
          overflow: hidden;
          isolation: isolate;
        }
        .earnings-media {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          transition: transform 1.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .earnings-card:hover .earnings-media { transform: scale(1.04); }
        .earnings-vignette {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.85) 100%);
          pointer-events: none;
        }
        .earnings-content {
          position: relative;
          z-index: 10;
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 32px;
        }
        .is-snapped .earnings-card { transform: translateY(-2px); box-shadow: var(--shadow-soft); }
        
        .embla__slide { flex: 0 0 85%; min-width: 0; padding-left: 1rem; }
        @media (min-width: 768px) { .embla__slide { flex: 0 0 71.4%; } } 
        @media (min-width: 1024px) { 
          .embla__slide { flex: 0 0 42%; } 
          .embla__slide--featured { flex: 0 0 54%; }
        }
      `}</style>
    </section>
  );
};

const VibeCheckV4: React.FC = () => {
  const testimonials = [
    {
      name: "Jordan T.",
      role: "Top Curator",
      emoji: "🔥",
      quote: "The attention to detail on Lumify is insane. v12.2 really nailed the color logic.",
      avatar: "https://picsum.photos/seed/jordan/100",
      auraColor: "#C7D6EA"
    },
    {
      name: "Maya R.",
      role: "Top Curator",
      emoji: "✨",
      quote: "Finally a place that values taste over raw metrics. VibeJam is my daily morning visit.",
      avatar: "https://picsum.photos/seed/maya/100",
      auraColor: "#C8C2D8"
    },
    {
      name: "Sam K.",
      role: "Top Curator",
      emoji: "💎",
      quote: "Discovering Chord here changed our startup trajectory. The community is elite.",
      avatar: "https://picsum.photos/seed/sam/100",
      auraColor: "#A9D6C2"
    }
  ];

  return (
    <section className="homepage-v4-segment bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-10 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Vibe Check</h2>
          <p className="text-gray-400 font-medium text-base md:text-lg mt-2">Design preview — real curator feedback coming from founding launches.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="premium-card rounded-[32px] md:rounded-[40px] p-8 md:p-10 group">
              <div className="absolute top-8 right-8 text-xl opacity-10 group-hover:opacity-100 transition-opacity">{t.emoji}</div>

              <div className="flex items-center gap-4 mb-6 md:mb-8">
                <div className="relative aura-clip">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-gray-100 relative z-10 overflow-hidden">
                    <img src={t.avatar} alt={t.name} className="w-full h-full rounded-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                  </div>
                  <div className="aura-halo" style={{ inset: '-2px', background: t.auraColor, opacity: 0.1, z_index: 0 }} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm leading-none mb-1">{t.name}</h4>
                  <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{t.role}</p>
                </div>
              </div>

              <p className="text-gray-500 text-sm md:text-base leading-relaxed font-medium">
                "{t.quote}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FooterV4: React.FC<{ onNavigate?: (page: any) => void; onNavigateSubmitApp?: () => void }> = ({ onNavigate, onNavigateSubmitApp }) => (
  <footer className="bg-white border-t border-gray-50 pt-16 md:pt-20 pb-12 md:pb-16">
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12 md:gap-16 mb-16 md:mb-20">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <Logo />
          <p className="text-sm md:text-base text-gray-400 max-w-[300px] leading-relaxed font-medium">
            Curating the next generation of creative platforms. Built for the culture, by the culture.
          </p>
        </div>

        <div>
          <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em] mb-6 md:mb-8">Platform</h4>
          <ul className="space-y-3 md:space-y-4">
            <li><button onClick={() => onNavigate?.('discover')} className="text-sm text-gray-400 hover:text-gray-900 transition-colors font-bold">Browse Jams</button></li>
            {FEATURE_FLAGS.VITE_FEATURE_LEADERBOARD && (
              <li><button onClick={() => onNavigate?.('leaderboard')} className="text-sm text-gray-400 hover:text-gray-900 transition-colors font-bold">Leaderboard</button></li>
            )}
            <li><button onClick={() => onNavigate?.('discover')} className="text-sm text-gray-400 hover:text-gray-900 transition-colors font-bold">Featured</button></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em] mb-6 md:mb-8">Makers</h4>
          <ul className="space-y-3 md:space-y-4">
            <li><button onClick={onNavigateSubmitApp} className="text-sm text-gray-400 hover:text-gray-900 transition-colors font-bold">Submit App</button></li>
            <li><button onClick={() => onNavigate?.('creator-tools')} className="text-sm text-gray-400 hover:text-gray-900 transition-colors font-bold">Creator Tools</button></li>
            <li><button onClick={() => onNavigate?.('guidelines')} className="text-sm text-gray-400 hover:text-gray-900 transition-colors font-bold">Guidelines</button></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em] mb-6 md:mb-8">Connect</h4>
          <ul className="space-y-3 md:space-y-4">
            <li>
              <a
                href="https://x.com/vibejam_co"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-gray-900 transition-colors font-bold block"
              >
                Twitter
              </a>
            </li>
            <li className="relative group/discord">
              <button
                title="Launching soon"
                className="text-sm text-gray-400 cursor-default transition-colors font-bold flex items-center gap-2"
              >
                Discord
                <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest sm:hidden">(Soon)</span>
              </button>
              <div className="absolute bottom-full left-0 mb-2 px-3 py-1 bg-gray-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 invisible group-hover/discord:opacity-100 group-hover/discord:visible transition-all hidden md:block">
                Launching soon
              </div>
            </li>
            <li>
              <button
                onClick={() => onNavigate?.('contact')}
                className="text-sm text-gray-400 hover:text-gray-900 transition-colors font-bold"
              >
                Contact
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="pt-10 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
        <span className="text-[9px] md:text-[10px] font-black text-gray-300 uppercase tracking-widest text-center md:text-left">
          © 2024 VibeJam Inc. An early, curated platform for builders shipping in public.
        </span>
        <div className="flex flex-wrap justify-center gap-6 md:gap-8">
          <button onClick={() => onNavigate?.('privacy')} className="text-[9px] md:text-[10px] font-black text-gray-300 hover:text-gray-600 uppercase tracking-widest">PRIVACY</button>
          <button onClick={() => onNavigate?.('terms')} className="text-[9px] md:text-[10px] font-black text-gray-300 hover:text-gray-600 uppercase tracking-widest">TERMS</button>
          <button onClick={() => onNavigate?.('cookie')} className="text-[9px] md:text-[10px] font-black text-gray-300 hover:text-gray-600 uppercase tracking-widest">COOKIES</button>
        </div>
      </div>
    </div>
  </footer>
);

const resolveJamPageVersion = (search: string): 'v1' | 'v2' => {
  const params = new URLSearchParams(search);
  const v = params.get('v');
  if (v === '1') return 'v1' as const;
  return 'v2';
};

const buildSearchWithVersion = (search: string, version: 'v1' | 'v2') => {
  const params = new URLSearchParams(search);
  if (version === 'v2') {
    params.set('v', '2');
  } else {
    params.delete('v');
  }
  const query = params.toString();
  return query ? `?${query}` : '';
};

const buildSearchWithoutVersion = (search: string) => {
  const params = new URLSearchParams(search);
  params.delete('v');
  const query = params.toString();
  return query ? `?${query}` : '';
};

const AppContent: React.FC = () => {
  const { user: authUser, profile, loading: authLoading, signOut } = useAuth();
  const debugEnabled = typeof window !== 'undefined' && window.location.search.includes('debug=1');
  const [debugAuth, setDebugAuth] = useState<any | null>(null);
  const [selectedApp, setSelectedApp] = useState<AppProject | null>(null);
  const [profileHandle, setProfileHandle] = useState<string | null>(null);
  const [isLaunchpadOpen, setIsLaunchpadOpen] = useState(false);
  const [editingJam, setEditingJam] = useState<any | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [jamRouteSlug, setJamRouteSlug] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<'home' | 'discover' | 'learn' | 'me' | 'creator-studio' | 'privacy' | 'terms' | 'cookie' | 'leaderboard' | 'creator-tools' | 'guidelines' | 'contact' | 'jam' | 'profile' | 'embed'>('home');
  const [embedSlug, setEmbedSlug] = useState<string | null>(null);
  const [dashboardRefreshTrigger, setDashboardRefreshTrigger] = useState(0);
  const [discoveryApps, setDiscoveryApps] = useState<AppProject[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);
  const initialPageRef = useRef(currentPage);

  useEffect(() => {
    if (!debugEnabled || !supabase) return;
    let mounted = true;

    const loadAuthDebug = async () => {
      try {
        const sessionRes = await supabase.auth.getSession();
        const userRes = await supabase.auth.getUser();
        if (!mounted) return;
        const session = sessionRes?.data?.session;
        setDebugAuth({
          sessionPresent: Boolean(session),
          accessTokenPresent: Boolean(session?.access_token),
          refreshTokenPresent: Boolean(session?.refresh_token),
          expiresAt: session?.expires_at || null,
          userId: session?.user?.id || null,
          getSessionError: sessionRes?.error?.message || null,
          getUserError: userRes?.error?.message || null
        });
      } catch (e: any) {
        if (!mounted) return;
        setDebugAuth({ error: e?.message || 'UNKNOWN_ERROR' });
      }
    };

    loadAuthDebug();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => loadAuthDebug());
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [debugEnabled]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.location.search.includes('governance=1')) return;
    warnIfObserveOnlyWindow();
    warnIfRankingOrHype({ leaderboard: FEATURE_FLAGS.VITE_FEATURE_LEADERBOARD });
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (currentPage === 'jam') return;
    document.title = 'VibeJam';
  }, [currentPage]);

  const updateHistoryForPage = useCallback((page: typeof currentPage, mode: 'push' | 'replace' = 'replace') => {
    if (typeof window === 'undefined') return;
    const search = buildSearchWithoutVersion(window.location.search);
    const url = `/${search}`;
    const state = { page };
    if (mode === 'push') {
      window.history.pushState(state, '', url);
    } else {
      window.history.replaceState(state, '', url);
    }
  }, []);

  const applyJamState = useCallback((project: AppProject | null, version: 'v1' | 'v2', replaceHistory: boolean, slugOverride?: string | null) => {
    setProfileHandle(null);
    setSelectedApp(project);
    setCurrentPage('jam');
    const slug = slugOverride ?? (project ? getJamSlug(project) : null);
    setJamRouteSlug(slug);

    if (typeof window !== 'undefined') {
      if (slug) {
        const search = buildSearchWithVersion(window.location.search, version);
        const url = `/jam/${slug}${search}`;
        const state = { page: 'jam', jamId: project?.id, slug, version };
        if (replaceHistory) {
          window.history.replaceState(state, '', url);
        } else {
          window.history.pushState(state, '', url);
        }
      }
    }
  }, []);

  const openJam = useCallback((project: AppProject, options?: { replaceHistory?: boolean; versionOverride?: 'v1' | 'v2' }) => {
    const version = options?.versionOverride ?? resolveJamPageVersion(window.location.search);
    if (currentPage !== 'jam') {
      updateHistoryForPage(currentPage, 'replace');
    }
    applyJamState(project, version, options?.replaceHistory ?? false);
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, [applyJamState, currentPage, updateHistoryForPage]);

  const closeJam = useCallback(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/jam/')) {
      if (window.history.length > 1) {
        window.history.back();
        return;
      }
      const search = buildSearchWithoutVersion(window.location.search);
      window.history.replaceState({ page: 'home' }, '', `/${search}`);
    }
    setSelectedApp(null);
    setCurrentPage('home');
    setJamRouteSlug(null);
    setProfileHandle(null);
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, []);

  const goToCreatorStudio = useCallback(() => {
    setSelectedApp(null);
    setJamRouteSlug(null);
    setProfileHandle(null);
    setCurrentPage('creator-studio');
    updateHistoryForPage('creator-studio', 'replace');
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, [updateHistoryForPage]);

  // Deep Link Handling
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname;
    if (path.startsWith('/jam/')) {
      const slug = path.split('/jam/')[1];
      if (slug) {
        const version = resolveJamPageVersion(window.location.search);
        applyJamState(null, version, true, slug);
        return;
      }
    }
    if (path.startsWith('/embed/')) {
      const slug = path.split('/embed/')[1];
      if (slug) {
        setEmbedSlug(slug);
        setSelectedApp(null);
        setJamRouteSlug(null);
        setProfileHandle(null);
        setCurrentPage('embed');
        return;
      }
    }
    if (path.startsWith('/@')) {
      const handle = path.slice(2);
      if (handle) {
        setProfileHandle(handle);
        setSelectedApp(null);
        setJamRouteSlug(null);
        setCurrentPage('profile');
        return;
      }
    }
    updateHistoryForPage(initialPageRef.current, 'replace');
  }, [applyJamState, updateHistoryForPage]);

  useEffect(() => {
    if (currentPage === 'jam' || currentPage === 'profile') return;
    updateHistoryForPage(currentPage, 'replace');
  }, [currentPage, updateHistoryForPage]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/jam/')) {
        const slug = path.split('/jam/')[1];
        if (slug) {
          const version = resolveJamPageVersion(window.location.search);
          applyJamState(null, version, true, slug);
        }
        return;
      }
      if (path.startsWith('/embed/')) {
        const slug = path.split('/embed/')[1];
        if (slug) {
          setEmbedSlug(slug);
          setSelectedApp(null);
          setJamRouteSlug(null);
          setProfileHandle(null);
          setCurrentPage('embed');
        }
        return;
      }
      if (path.startsWith('/@')) {
        const handle = path.slice(2);
        if (handle) {
          setProfileHandle(handle);
          setSelectedApp(null);
          setJamRouteSlug(null);
          setCurrentPage('profile');
        }
        return;
      }
      setSelectedApp(null);
      setJamRouteSlug(null);
      setEmbedSlug(null);
      setProfileHandle(null);
      const fallback = (window.history.state?.page as typeof currentPage) || 'home';
      setCurrentPage(fallback);
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [applyJamState]);

  // Poll real discovery feed
  useEffect(() => {
    const loadFeed = async () => {
      try {
        const res = await backend.fetchDiscoverNewJams({ limit: 20 });
        if (!res.error && res.data) {
          const mapped = res.data.map(item => ({
            id: item.id,
            slug: item.slug || item.id,
            name: item.name,
            description: item.tagline || '',
            category: item.category,
            proofUrl: item.socials?.proof_url || item.socials?.proofUrl,
            icon: '✨',
            screenshot: item.cover_image_url || '',
            thumbnailUrl: item.cover_image_url || '',
            mediaType: 'image',
            stats: {
              revenue: 'Prefer not to say',
              isRevenuePublic: false,
              growth: '+0%',
              rank: 99,
              upvotes: 0,
              daysLive: 0,
              views: 0,
              bookmarks: 0
            },
            creator: {
              name: item.display_name || 'Maker',
              avatar: item.avatar_url || '',
              handle: item.handle || '',
              type: 'Solo Founder',
              color: '#3b82f6'
            },
            stack: item.tech_stack || item.techStack || [],
            vibeTools: item.vibe_tools || item.vibeTools || [],
            websiteUrl: '',
            status: 'published'
          } as AppProject));

          setDiscoveryApps(mapped);
        }
      } catch (e) {
        console.warn("Feed fetch error", e);
      }
    };
    loadFeed();
  }, [dashboardRefreshTrigger]);

  // Use the validated unified session user/profile
  const currentUser = useMemo(() => {
    if (authUser) {
      const userObj = {
        name: profile?.display_name || authUser.user_metadata?.full_name || authUser.email || 'Maker',
        avatar: profile?.avatar_url || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
        handle: profile?.handle ? `@${profile.handle}` : (authUser.email ? `@${authUser.email.split('@')[0]}` : '@user'),
        auraColor: '#C7D6EA',
        joinedDate: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Jan 2026'
      };
      return userObj;
    }
    return null;
  }, [authUser, profile]);

  useEffect(() => {
    let cancelled = false;
    const loadUnread = async () => {
      if (!authUser) {
        setUnreadCount(0);
        return;
      }
      const res = await backend.getUnreadNotificationCount();
      if (!cancelled && res.ok) setUnreadCount(res.count);
    };
    loadUnread();
    return () => { cancelled = true; };
  }, [authUser]);

  const openNotification = async (item: any) => {
    try {
      if (item?.jam_id) {
        const { jam, ok } = await backend.getJam(item.jam_id);
        if (ok && jam) {
          const project = mapJamToAppProject(jam);
          if ((jam as any).creator) {
            const c = (jam as any).creator;
            project.creator = {
              name: c.display_name || 'Maker',
              avatar: c.avatar_url || '',
              handle: c.handle || '',
              type: project.creator.type,
              color: '#3b82f6'
            };
          }
          openJam(project);
          return;
        }
      }
      if (item?.actor?.handle) {
        openProfile(`@${item.actor.handle}`, { replaceHistory: true });
      }
    } catch (e) {
      console.warn('Open notification failed', e);
    }
  };

  const pushToast = (message: string) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    if (!authUser || !supabase) return;
    const channel = supabase.channel(`vj-notifications-${authUser.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${authUser.id}`
      }, (payload: any) => {
        const n = payload.new;
        setUnreadCount(prev => prev + 1);
        if (notificationsOpen) {
          backend.listNotifications(50).then(res => {
            if (res.ok) setNotifications(res.items || []);
          });
        }
        const actor = (n as any)?.data?.actor_name;
        const message = n.type === 'follow'
          ? 'New follower'
          : n.type === 'reply'
            ? 'New reply'
            : 'New comment';
        pushToast(actor ? `${actor} · ${message}` : message);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [authUser, notificationsOpen]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll Lock Management
  useEffect(() => {
    const isModalActive = isLaunchpadOpen || isAuthOpen;
    document.body.style.overflow = isModalActive ? 'hidden' : 'auto';
  }, [isLaunchpadOpen, isAuthOpen]);

  const openProfile = useCallback((handle: string, options?: { replaceHistory?: boolean }) => {
    const cleanHandle = handle.replace('@', '');
    setProfileHandle(cleanHandle);
    setSelectedApp(null);
    setJamRouteSlug(null);
    setCurrentPage('profile');
    if (typeof window !== 'undefined') {
      const search = buildSearchWithoutVersion(window.location.search);
      const url = `/@${cleanHandle}${search}`;
      const state = { page: 'profile', handle: cleanHandle };
      if (options?.replaceHistory) {
        window.history.replaceState(state, '', url);
      } else {
        window.history.pushState(state, '', url);
      }
      window.scrollTo(0, 0);
    }
  }, []);

  const closeProfile = useCallback(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/@')) {
      if (window.history.length > 1) {
        window.history.back();
        return;
      }
      const search = buildSearchWithoutVersion(window.location.search);
      window.history.replaceState({ page: 'home' }, '', `/${search}`);
    }
    setProfileHandle(null);
    setCurrentPage('home');
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, []);

  const handleOpenLaunchpad = useCallback(() => {
    if (currentUser) {
      setIsLaunchpadOpen(true);
    } else {
      setIsAuthOpen(true);
    }
  }, [currentUser]);

  const handleEditJam = (jam: any) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    setEditingJam(jam);
    setIsLaunchpadOpen(true);
  };

  const renderHeader = () => {
    const avatarUrl = profile?.avatar_url || authUser?.user_metadata?.avatar_url || authUser?.user_metadata?.picture;
    const displayName = profile?.display_name || authUser?.user_metadata?.full_name || authUser?.email || 'Maker';
    const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    return (
      <nav className={`fixed top-0 border-transparent left-0 right-0 z-50 transition-all duration-500 ${isScrolled || (currentPage !== 'home' && currentPage !== 'me' && currentPage !== 'creator-studio' && currentPage !== 'privacy' && currentPage !== 'terms' && currentPage !== 'cookie' && currentPage !== 'leaderboard' && currentPage !== 'creator-tools' && currentPage !== 'guidelines' && currentPage !== 'contact') ? 'glass-header py-3 md:py-4' : 'py-5 md:py-8'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
          <div onClick={() => { setCurrentPage('home'); setSelectedApp(null); window.scrollTo(0, 0); }} className="cursor-pointer">
            <Logo />
          </div>

          <div className="hidden md:flex items-center gap-12">
            <button
              onClick={() => { setCurrentPage('discover'); setSelectedApp(null); }}
              className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all relative group ${currentPage === 'discover' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-900'}`}
            >
              Discover
              <span className={`absolute -bottom-2 left-0 h-0.5 bg-blue-500 transition-all duration-500 ${currentPage === 'discover' ? 'w-full' : 'w-0 group-hover:w-full'}`} />
            </button>
            <button
              onClick={() => { setCurrentPage('learn'); setSelectedApp(null); }}
              className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all relative group ${currentPage === 'learn' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-900'}`}
            >
              Learn
              <span className={`absolute -bottom-2 left-0 h-0.5 bg-blue-500 transition-all duration-500 ${currentPage === 'learn' ? 'w-full' : 'w-0 group-hover:w-full'}`} />
            </button>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            {authUser ? (
              <div className="flex items-center gap-3 md:gap-4">
                <button
                  onClick={() => { setCurrentPage('creator-studio'); setSelectedApp(null); }}
                  className={`text-[10px] font-black uppercase tracking-widest px-3 md:px-4 py-1.5 md:py-2 rounded-xl border transition-all ${currentPage === 'creator-studio' ? 'bg-gray-900 text-white border-gray-900' : 'text-gray-400 border-gray-100 hover:text-gray-900'} hidden sm:block`}
                >
                  Studio
                </button>
                <div className="relative">
                  <button
                    onClick={async () => {
                      if (!authUser) return;
                      const next = !notificationsOpen;
                      setNotificationsOpen(next);
                      if (next) {
                        setNotificationsLoading(true);
                        const res = await backend.listNotifications(50);
                        setNotifications(res.items || []);
                        setNotificationsLoading(false);
                        await backend.markNotificationsRead();
                        const refreshed = await backend.getUnreadNotificationCount();
                        if (refreshed.ok) setUnreadCount(refreshed.count);
                      }
                    }}
                    className="relative w-9 h-9 md:w-10 md:h-10 rounded-full border border-gray-100 bg-white flex items-center justify-center hover:border-gray-200 transition-all"
                    aria-label="Notifications"
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-black flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className="absolute top-full right-0 mt-3 w-[320px] bg-white rounded-2xl shadow-xl border border-gray-50 overflow-hidden z-50">
                      <div className="flex items-center justify-between px-4 h-12 border-b border-gray-50">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Notifications</span>
                        <button
                          onClick={() => setNotificationsOpen(false)}
                          className="text-[10px] font-black text-gray-300 uppercase tracking-widest hover:text-gray-900"
                        >
                          Close
                        </button>
                      </div>
                      <div className="max-h-[360px] overflow-y-auto">
                        {notificationsLoading ? (
                          <div className="p-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Loading…</div>
                        ) : notifications.length > 0 ? (
                          notifications.map((n: any) => (
                            <button
                              key={n.id}
                              onClick={() => { setNotificationsOpen(false); openNotification(n); }}
                              className="w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50/60 transition-all"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full border border-gray-100 overflow-hidden bg-white shrink-0">
                                  {n.actor?.avatar_url ? (
                                    <img src={n.actor.avatar_url} alt={n.actor.display_name || 'User'} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-gray-400">VJ</div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[11px] font-bold text-gray-900 truncate">
                                    {n.actor?.display_name || 'Someone'}{' '}
                                    <span className="text-gray-400 font-medium">
                                      {n.type === 'follow' ? 'followed you' : n.type === 'reply' ? 'replied to your signal' : 'commented on your jam'}
                                    </span>
                                  </p>
                                  <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest mt-1">
                                    {new Date(n.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                {!n.read_at && (
                                  <span className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                                )}
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-6 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">No notifications yet</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative group/user">
                  <button
                    onClick={() => { setCurrentPage('me'); setSelectedApp(null); }}
                    className="relative aura-clip group"
                  >
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-gray-100 p-0.5 bg-white relative z-10 overflow-hidden flex items-center justify-center">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={displayName} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-xs font-black text-gray-400">{initials}</span>
                      )}
                    </div>
                    <div className="aura-halo" style={{ background: '#C7D6EA', opacity: 0.2, inset: '-4px' }} />
                  </button>

                  {/* Simple Dropdown for Logout */}
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-50 py-2 opacity-0 invisible group-hover/user:opacity-100 group-hover/user:visible transition-all">
                    <button
                      onClick={() => { setCurrentPage('me'); setSelectedApp(null); }}
                      className="w-full px-5 py-2.5 text-left text-[11px] font-bold text-gray-700 hover:bg-gray-50"
                    >
                      View Profile
                    </button>
                    <div className="h-px bg-gray-50 mx-2 my-1" />
                    <button
                      onClick={async () => {
                        await signOut();
                        setCurrentPage('home');
                      }}
                      className="w-full px-5 py-2.5 text-left text-[11px] font-bold text-red-500 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="hidden sm:block text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 font-bold"
              >
                Sign In
              </button>
            )}
            <button
              onClick={handleOpenLaunchpad}
              className="vibe-pill text-white text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] py-2 md:py-3 px-6 md:px-8 rounded-full shadow-2xl shadow-blue-500/20 active:scale-95 transition-all bg-blue-500"
            >
              <span className="md:inline hidden">Start Your Jam</span>
              <span className="md:hidden">Launch</span>
            </button>
          </div>
        </div>
      </nav>
    );
  };

  // Homepage is intentionally theme-agnostic and not affected by Jam theming.
  const renderHomePageV4 = () => (
    <div className="homepage-v4 overflow-x-hidden">
      <section className="relative pt-32 md:pt-48 pb-16 md:pb-20 overflow-hidden hero-spotlight">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center relative z-10">
          <span className="block text-[10px] font-black text-blue-500 uppercase tracking-[.3em] mb-4 md:mb-6 animate-in fade-in slide-in-from-bottom-2 duration-1000">Founding Era — Curated Preview</span>
          <h1 className="text-[clamp(2.5rem,10vw,5.5rem)] font-black text-gray-900 tracking-tighter leading-[1] mb-8 md:mb-10 max-w-5xl mx-auto">
            Discover <span className="text-blue-500 whitespace-nowrap">vibe–coded</span> apps built in public.
          </h1>
          <p className="text-lg md:text-2xl text-gray-400 max-w-2xl mx-auto mb-12 md:mb-16 leading-relaxed font-medium">
            VibeJam is the home for creative engineering, cult-favorite products, and the makers behind them. Premium curation with human warmth.
          </p>
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="flex -space-x-3 md:-space-x-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="w-10 h-10 md:w-12 md:h-12 rounded-full border-[2px] md:border-[3px] border-white overflow-hidden bg-gray-100 shadow-sm relative group/av">
                  <img src={`https://picsum.photos/seed/curator${i}/100`} alt="curator" />
                </div>
              ))}
            </div>
            <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest px-4">Join <span className="text-gray-900">12,400+</span> curators making vibes happen</p>
          </div>
        </div>
      </section>

      <section className="homepage-v4-segment bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <DiscoveryFeed
            apps={discoveryApps}
            onSelect={openJam}
            onCreatorClick={(creator) => openProfile(creator.handle)}
            customTitle="Top Jams Shipping This Week"
          />
        </div>
      </section>

      <RevenueCarousel apps={discoveryApps} onSelect={setSelectedApp} />

      {discoveryApps.length > 5 && (
        <section className="homepage-v4-segment bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="premium-card rounded-[32px] md:rounded-[50px] p-8 md:p-24 overflow-hidden border-gray-100 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.03)]">
              {(() => {
                const featured = discoveryApps[0];
                if (!featured) return null;
                const featuredHandle = featured.creator?.handle;
                return (
              <div className="flex flex-col lg:flex-row items-center gap-12 md:gap-20 relative z-10">
                <div className="flex-1 space-y-6 md:space-y-10 text-center lg:text-left">
                  <span className="inline-block px-4 md:px-5 py-2 rounded-full bg-blue-50/50 text-blue-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] border border-blue-100/20">
                    Featured Jam
                  </span>
                  <h2 className="text-4xl md:text-7xl font-black text-gray-900 leading-[1.1] tracking-tighter">
                    {featured.name} <span className="text-blue-500/80">is Live.</span>
                  </h2>
                  <p className="text-gray-400 text-base md:text-xl leading-relaxed font-medium">
                    {featured.description}
                  </p>
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 md:gap-8 pt-4">
                    <button
                      onClick={() => openJam(featured)}
                      className="vibe-pill text-white text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] py-4 md:py-5 px-8 md:px-10 rounded-full shadow-2xl shadow-blue-500/10 active:scale-95 transition-all bg-gray-900"
                    >
                      View Jam
                    </button>
                    <button
                      onClick={() => {
                        if (featuredHandle) openProfile(featuredHandle);
                      }}
                      className="text-gray-400 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] hover:text-gray-900 transition-colors font-bold"
                    >
                      View Maker Profile →
                    </button>
                  </div>
                </div>
                <div className="flex-1 w-full relative group">
                  <div className="relative aspect-[4/5] md:aspect-[4/5] rounded-[24px] md:rounded-[40px] overflow-hidden border-[1px] border-black/5 shadow-2xl">
                    <img src={featured.screenshot} className="w-full h-full object-cover transition-all duration-700" alt="Spotlight" />
                  </div>
                </div>
              </div>
                );
              })()}
            </div>
          </div>
        </section>
      )}

      {FEATURE_FLAGS.VITE_LAUNCH_MODE !== 'week1' && <VibeCheckV4 />}
      <FooterV4 onNavigate={(page) => { setCurrentPage(page); window.scrollTo(0, 0); }} onNavigateSubmitApp={handleOpenLaunchpad} />
    </div>
  );

  const isV2PageActive = currentPage === 'jam' || currentPage === 'profile' || currentPage === 'embed';
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      {!isV2PageActive && renderHeader()}

      <div className="flex-1 relative">
        {!isV2PageActive && (
          <>
            {currentPage === 'home' && renderHomePageV4()}
            {currentPage === 'privacy' && (
              <PrivacyPage onBack={() => { setCurrentPage('home'); window.scrollTo(0, 0); }} />
            )}
            {currentPage === 'terms' && (
              <TermsPage onBack={() => { setCurrentPage('home'); window.scrollTo(0, 0); }} />
            )}
            {currentPage === 'cookie' && (
              <CookiePage onBack={() => { setCurrentPage('home'); window.scrollTo(0, 0); }} />
            )}
            {currentPage === 'leaderboard' && (
              FEATURE_FLAGS.VITE_FEATURE_LEADERBOARD ? (
                <LeaderboardPage
                  onBack={() => { setCurrentPage('home'); window.scrollTo(0, 0); }}
                  onSelectCreator={(creator) => openProfile(creator.handle)}
                />
              ) : null
            )}
            {currentPage === 'creator-tools' && (
              <CreatorToolsPage
                onStartJam={handleOpenLaunchpad}
                onBrowseJams={() => { setCurrentPage('discover'); window.scrollTo(0, 0); }}
              />
            )}
            {currentPage === 'guidelines' && (
              <GuidelinesPage
                onStartJam={handleOpenLaunchpad}
                onBrowseJams={() => { setCurrentPage('discover'); window.scrollTo(0, 0); }}
              />
            )}
            {currentPage === 'contact' && (
              <ContactPage
                onBack={() => { setCurrentPage('home'); window.scrollTo(0, 0); }}
              />
            )}
            {currentPage === 'discover' && (
              <DiscoveryPage
                onSelectApp={openJam}
                onSelectCreator={(creator) => openProfile(creator.handle)}
                onNavigateLeaderboard={() => setCurrentPage('leaderboard')}
                currentUserHandle={currentUser?.handle || null}
              />
            )}
            {currentPage === 'learn' && (
              <div className="pt-48 text-center text-gray-400 h-[70vh] flex flex-col items-center justify-center px-6">
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em] mb-6">COMING SOON</span>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter">Learn is being drafted.</h2>
                <p className="mt-4 text-base md:text-xl font-medium text-gray-400 max-w-md">Founders, builders, and growth hackers — your editorial hub is coming.</p>
              </div>
            )}
            {currentPage === 'me' && currentUser && (
              <UserDashboard
                onBack={() => setCurrentPage('home')}
                onSelectApp={openJam}
                onSelectCreator={(creator) => openProfile(creator.handle)}
              />
            )}
            {currentPage === 'creator-studio' && currentUser && (
              <CreatorDashboard
                user={{
                  name: currentUser.name,
                  handle: currentUser.handle,
                  avatar: currentUser.avatar,
                  auraColor: currentUser.auraColor,
                  creatorSince: currentUser.joinedDate
                }}
                onBack={() => setCurrentPage('home')}
                onStartJam={() => setIsLaunchpadOpen(true)}
                onEditJam={handleEditJam}
                refreshTrigger={dashboardRefreshTrigger}
              />
            )}
          </>
        )}
      </div>

      {currentPage === 'profile' && profileHandle && (
        <ProfilePageV2
          handle={profileHandle}
          onClose={closeProfile}
          onSelectJam={openJam}
        />
      )}

      {currentPage === 'embed' && embedSlug && (
        <EmbedPage slug={embedSlug} />
      )}

      {currentPage === 'jam' && (
        <JamPageV2
          project={selectedApp}
          jamSlug={jamRouteSlug}
          onClose={closeJam}
          isLoggedIn={!!currentUser}
          currentUserHandle={currentUser?.handle}
          onAuthTrigger={() => setIsAuthOpen(true)}
          onManageJam={goToCreatorStudio}
          onCreatorClick={(creator) => openProfile(creator.handle)}
          isOwner={selectedApp ? currentUser?.handle === selectedApp.creator.handle : undefined}
          userThemeId={(profile as any)?.theme_id || (profile as any)?.themeId || null}
          userThemeConfig={(profile as any)?.theme_config || (profile as any)?.themeConfig || null}
          showChrome={true}
        />
      )}

      {isLaunchpadOpen && (
        <Launchpad
          onClose={() => { setIsLaunchpadOpen(false); setEditingJam(null); }}
          onOpenJam={(jam) => {
            // Convert JamPublished (Launchpad type) to AppProject (App type)
            // JamPublished is very similar to AppProject, but we should safely cast or map
            // Actually Launchpad.tsx constructs previewJam as JamPublished which matches usage
            openJam(jam as any);
          }}
          onPublishSuccess={() => setDashboardRefreshTrigger(p => p + 1)}
          initialJam={editingJam}
        />
      )}

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
          {toasts.map(t => (
            <div key={t.id} className="px-4 py-3 rounded-2xl bg-gray-900 text-white text-[11px] font-black uppercase tracking-widest shadow-xl">
              {t.message}
            </div>
          ))}
        </div>
      )}

      {debugEnabled && (
        <div className="fixed bottom-6 left-6 z-[9999] max-w-[320px] rounded-2xl border border-gray-200 bg-white/90 backdrop-blur p-4 shadow-xl text-[10px] font-mono text-gray-700">
          <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Auth Debug</div>
          <pre className="whitespace-pre-wrap break-words">{JSON.stringify(debugAuth, null, 2)}</pre>
        </div>
      )}

      {!isV2PageActive && currentPage !== 'home' && (
        <div className="mt-auto">
          <FooterV4 onNavigate={(page) => { setCurrentPage(page); window.scrollTo(0, 0); }} onNavigateSubmitApp={handleOpenLaunchpad} />
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
