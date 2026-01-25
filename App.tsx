
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Logo from './components/Logo';
import AppCard from './components/AppCard';
import AppView from './components/AppView';
import Launchpad from './components/Launchpad';
import DiscoveryPage from './components/DiscoveryPage';
import DiscoveryFeed from './components/DiscoveryFeed';
import CreatorProfile from './components/CreatorProfile';
import UserDashboard from './components/UserDashboard';
import CreatorDashboard from './components/CreatorDashboard';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import CookiePage from './pages/CookiePage';
import LeaderboardPage from './pages/LeaderboardPage';
import CreatorToolsPage from './pages/CreatorToolsPage';
import GuidelinesPage from './pages/GuidelinesPage';
import ContactPage from './pages/ContactPage';
import { MOCK_APPS } from './constants';
import { AppProject } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';

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

const RevenueCarousel: React.FC<{ onSelect: (app: AppProject) => void }> = ({ onSelect }) => {
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
    return [...MOCK_APPS]
      .filter(a => a.stats.isRevenuePublic)
      .sort((a, b) => parseFloat(b.stats.revenue.replace(/[^0-9.]/g, '')) - parseFloat(a.stats.revenue.replace(/[^0-9.]/g, '')))
      .slice(0, 10);
  }, []);

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
            <li><button onClick={() => onNavigate?.('leaderboard')} className="text-sm text-gray-400 hover:text-gray-900 transition-colors font-bold">Leaderboard</button></li>
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

const AppContent: React.FC = () => {
  const { user: authUser, profile, loading: authLoading } = useAuth();
  const [selectedApp, setSelectedApp] = useState<AppProject | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<AppProject['creator'] | null>(null);
  const [isLaunchpadOpen, setIsLaunchpadOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'discover' | 'learn' | 'me' | 'creator-studio' | 'privacy' | 'terms' | 'cookie' | 'leaderboard' | 'creator-tools' | 'guidelines' | 'contact'>('home');
  const [isFirstTimeEarnDemo, setIsFirstTimeEarnDemo] = useState(false);
  const [returnToJam, setReturnToJam] = useState<AppProject | null>(null);

  // Use the validated unified session user/profile
  const currentUser = useMemo(() => {
    if (authUser) {
      const userObj = {
        name: profile?.display_name || authUser.name,
        avatar: profile?.avatar_url || authUser.avatar,
        handle: authUser.handle,
        auraColor: '#C7D6EA'
      };
      return userObj;
    }
    return null;
  }, [authUser, profile]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  useEffect(() => {
    if (selectedApp || isLaunchpadOpen || selectedCreator || isAuthOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [selectedApp, isLaunchpadOpen, selectedCreator, isAuthOpen]);

  const handleOpenCreator = (creator: AppProject['creator'], fromJam?: AppProject, demoEarn: boolean = false) => {
    if (fromJam) {
      setReturnToJam(fromJam);
      setSelectedApp(null);
    } else {
      setReturnToJam(null);
    }
    setSelectedCreator(creator);
    setIsFirstTimeEarnDemo(demoEarn);
  };

  const handleCloseCreator = () => {
    setSelectedCreator(null);
    setIsFirstTimeEarnDemo(false);
    if (returnToJam) {
      setSelectedApp(returnToJam);
      setReturnToJam(null);
    }
  };

  const handleOpenLaunchpad = useCallback(() => {
    if (currentUser) {
      setIsLaunchpadOpen(true);
    } else {
      setIsAuthOpen(true);
    }
  }, [currentUser]);

  const renderHeader = () => (
    <nav className={`fixed top-0 border-transparent left-0 right-0 z-50 transition-all duration-500 ${isScrolled || (currentPage !== 'home' && currentPage !== 'me' && currentPage !== 'creator-studio' && currentPage !== 'privacy' && currentPage !== 'terms' && currentPage !== 'cookie' && currentPage !== 'leaderboard' && currentPage !== 'creator-tools' && currentPage !== 'guidelines' && currentPage !== 'contact') ? 'glass-header py-3 md:py-4' : 'py-5 md:py-8'}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
        <div onClick={() => { setCurrentPage('home'); setSelectedCreator(null); setSelectedApp(null); window.scrollTo(0, 0); }} className="cursor-pointer">
          <Logo />
        </div>

        <div className="hidden md:flex items-center gap-12">
          <button
            onClick={() => { setCurrentPage('discover'); setSelectedCreator(null); setSelectedApp(null); }}
            className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all relative group ${currentPage === 'discover' && !selectedCreator ? 'text-gray-900' : 'text-gray-400 hover:text-gray-900'}`}
          >
            Discover
            <span className={`absolute -bottom-2 left-0 h-0.5 bg-blue-500 transition-all duration-500 ${currentPage === 'discover' && !selectedCreator ? 'w-full' : 'w-0 group-hover:w-full'}`} />
          </button>
          <button
            onClick={() => { setCurrentPage('learn'); setSelectedCreator(null); setSelectedApp(null); }}
            className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all relative group ${currentPage === 'learn' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-900'}`}
          >
            Learn
            <span className={`absolute -bottom-2 left-0 h-0.5 bg-blue-500 transition-all duration-500 ${currentPage === 'learn' ? 'w-full' : 'w-0 group-hover:w-full'}`} />
          </button>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          {currentUser ? (
            <div className="flex items-center gap-3 md:gap-4">
              <button
                onClick={() => { setCurrentPage('creator-studio'); setSelectedCreator(null); setSelectedApp(null); }}
                className={`text-[10px] font-black uppercase tracking-widest px-3 md:px-4 py-1.5 md:py-2 rounded-xl border transition-all ${currentPage === 'creator-studio' ? 'bg-gray-900 text-white border-gray-900' : 'text-gray-400 border-gray-100 hover:text-gray-900'} hidden sm:block`}
              >
                Studio
              </button>
              <button
                onClick={() => { setCurrentPage('me'); setSelectedCreator(null); setSelectedApp(null); }}
                className="relative aura-clip group"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-gray-100 p-0.5 bg-white relative z-10">
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full rounded-full object-cover" />
                </div>
                <div className="aura-halo" style={{ background: currentUser.auraColor, opacity: 0.2, inset: '-4px' }} />
              </button>
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
            apps={MOCK_APPS}
            onSelect={setSelectedApp}
            onCreatorClick={(creator) => handleOpenCreator(creator)}
            customTitle="Top Jams Shipping Today"
          />
        </div>
      </section>

      <RevenueCarousel onSelect={setSelectedApp} />

      <section className="homepage-v4-segment bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="premium-card rounded-[32px] md:rounded-[50px] p-8 md:p-24 overflow-hidden border-gray-100 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.03)]">
            <div className="flex flex-col lg:flex-row items-center gap-12 md:gap-20 relative z-10">
              <div className="flex-1 space-y-6 md:space-y-10 text-center lg:text-left">
                <span className="inline-block px-4 md:px-5 py-2 rounded-full bg-blue-50/50 text-blue-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] border border-blue-100/20">
                  Founding Creator Spotlight
                </span>
                <h2 className="text-4xl md:text-7xl font-black text-gray-900 leading-[1.1] tracking-tighter">
                  Crafting <span className="text-blue-500/80">Digital Poetry</span> with Elena Voss.
                </h2>
                <p className="text-gray-400 text-base md:text-xl leading-relaxed font-medium">
                  Elena is the founder of Opal, a productivity tool that focuses on the soul of the work rather than just the checkboxes. Her philosophy on "Premium Restraint" has influenced an entire generation of indie makers.
                </p>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 md:gap-8 pt-4">
                  <button className="vibe-pill text-white text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] py-4 md:py-5 px-8 md:px-10 rounded-full shadow-2xl shadow-blue-500/10 active:scale-95 transition-all bg-gray-900">Read Interview</button>
                  <button
                    onClick={() => {
                      const elenaApp = MOCK_APPS.find(a => a.creator.name === 'Elena Voss');
                      if (elenaApp) handleOpenCreator(elenaApp.creator, undefined, true);
                    }}
                    className="text-gray-400 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] hover:text-gray-900 transition-colors font-bold">View Profile →</button>
                </div>
              </div>
              <div className="flex-1 w-full relative group">
                <div className="relative aspect-[4/5] md:aspect-[4/5] rounded-[24px] md:rounded-[40px] overflow-hidden border-[1px] border-black/5 shadow-2xl">
                  <img src="https://picsum.photos/seed/elena-spotlight/800/1000" className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700" alt="Elena Spotlight" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <VibeCheckV4 />
      <FooterV4 onNavigate={(page) => { setCurrentPage(page); window.scrollTo(0, 0); }} onNavigateSubmitApp={handleOpenLaunchpad} />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      {renderHeader()}

      <div className="flex-1 relative">
        {currentPage === 'home' && !selectedCreator && renderHomePageV4()}
        {currentPage === 'privacy' && !selectedCreator && (
          <PrivacyPage onBack={() => { setCurrentPage('home'); window.scrollTo(0, 0); }} />
        )}
        {currentPage === 'terms' && !selectedCreator && (
          <TermsPage onBack={() => { setCurrentPage('home'); window.scrollTo(0, 0); }} />
        )}
        {currentPage === 'cookie' && !selectedCreator && (
          <CookiePage onBack={() => { setCurrentPage('home'); window.scrollTo(0, 0); }} />
        )}
        {currentPage === 'leaderboard' && !selectedCreator && (
          <LeaderboardPage
            onBack={() => { setCurrentPage('home'); window.scrollTo(0, 0); }}
            onSelectCreator={(creator) => handleOpenCreator(creator)}
          />
        )}
        {currentPage === 'creator-tools' && !selectedCreator && (
          <CreatorToolsPage
            onStartJam={handleOpenLaunchpad}
            onBrowseJams={() => { setCurrentPage('discover'); window.scrollTo(0, 0); }}
          />
        )}
        {currentPage === 'guidelines' && !selectedCreator && (
          <GuidelinesPage
            onStartJam={handleOpenLaunchpad}
            onBrowseJams={() => { setCurrentPage('discover'); window.scrollTo(0, 0); }}
          />
        )}
        {currentPage === 'contact' && !selectedCreator && (
          <ContactPage
            onBack={() => { setCurrentPage('home'); window.scrollTo(0, 0); }}
          />
        )}
        {currentPage === 'discover' && !selectedCreator && (
          <DiscoveryPage
            onSelectApp={setSelectedApp}
            onSelectCreator={(creator) => handleOpenCreator(creator)}
            onNavigateLeaderboard={() => setCurrentPage('leaderboard')}
          />
        )}
        {currentPage === 'learn' && !selectedCreator && (
          <div className="pt-48 text-center text-gray-400 h-[70vh] flex flex-col items-center justify-center px-6">
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em] mb-6">COMING SOON</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter">Learn is being drafted.</h2>
            <p className="mt-4 text-base md:text-xl font-medium text-gray-400 max-w-md">Founders, builders, and growth hackers — your editorial hub is coming.</p>
          </div>
        )}
        {currentPage === 'me' && currentUser && !selectedCreator && (
          <UserDashboard
            onBack={() => setCurrentPage('home')}
            onSelectApp={setSelectedApp}
            onSelectCreator={(creator) => handleOpenCreator(creator)}
          />
        )}
        {currentPage === 'creator-studio' && currentUser && !selectedCreator && (
          <CreatorDashboard
            user={{
              name: currentUser.name,
              handle: currentUser.handle,
              avatar: currentUser.avatar,
              auraColor: currentUser.auraColor,
              creatorSince: 'Jan 2026'
            }}
            onBack={() => setCurrentPage('home')}
            onStartJam={() => setIsLaunchpadOpen(true)}
          />
        )}

        {/* Mount Indicator */}
        <div className="fixed bottom-2 right-2 text-[8px] font-black uppercase text-gray-200 pointer-events-none select-none z-[9999]">VJ: OK</div>
      </div>

      {selectedCreator && (
        <CreatorProfile
          creator={selectedCreator}
          onClose={handleCloseCreator}
          onSelectApp={setSelectedApp}
          isFirstTimeEarn={isFirstTimeEarnDemo}
        />
      )}

      {selectedApp && (
        <AppView
          project={selectedApp}
          onClose={() => setSelectedApp(null)}
          onCreatorClick={(creator) => handleOpenCreator(creator, selectedApp)}
          isLoggedIn={!!currentUser}
          onAuthTrigger={() => setIsAuthOpen(true)}
          onManageJam={() => { setSelectedApp(null); setCurrentPage('creator-studio'); }}
          isOwner={currentUser?.handle === selectedApp.creator.handle}
        />
      )}

      {isLaunchpadOpen && (
        <Launchpad
          onClose={() => setIsLaunchpadOpen(false)}
        />
      )}

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {(currentPage !== 'home' || selectedCreator) && <div className="mt-auto"><FooterV4 onNavigate={(page) => { setCurrentPage(page); window.scrollTo(0, 0); }} onNavigateSubmitApp={handleOpenLaunchpad} /></div>}
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
