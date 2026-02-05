import React, { useEffect, useMemo, useState } from 'react';
import { AppProject } from '../../types';
import { backend } from '../../lib/backend';
import { mapJamToAppProject } from '../../lib/jamMapping';
import LayoutRenderer from '../../layout/renderer/LayoutRenderer';
import { createTruthModel } from '../../layout/truth';
import { DEFAULT_LAYOUT_CONFIG, LAYOUT_PRESETS, LayoutArchetype, LayoutConfigV1, validateLayoutConfig } from '../../layout/LayoutConfig';
import { resolveTheme, ResolvedTheme } from '../../theme/ThemeResolver';
import { resolveThemeClasses } from '../../theme/ThemeClasses';
import ThemeControlDock from '../creator/ThemeControlDock';
import { THEME_REGISTRY, getThemeById, getThemeBehaviorById, getThemeDominanceById, getThemeContrastById, getThemeMaterialById } from '../../theme/ThemeRegistry';
import { ThemeBehaviorProfile } from '../../theme/ThemeBehavior';
import ThemeRemixDrawer from '../creator/ThemeRemixDrawer';
import { ThemeRemixResult, validateRemix } from '../../theme/ThemeRemix';
import { ThemeConfigV1 } from '../../theme/ThemeConfig';
import { ThemeIdentityV1 } from '../../theme/ThemeIdentity';
import { ThemeClasses } from '../../theme/ThemeClasses';
import ThemeControlCenter from '../control-center/ThemeControlCenter';
import { CredibilityState, deriveCredibilityState } from '../../theme/CredibilityState';
import { loadFollowSignalSurface } from '../../lib/FollowSignalSurface';

interface JamPageV2Props {
  project?: AppProject | null;
  jamSlug?: string | null;
  layoutConfig?: LayoutConfigV1;
  onClose: () => void;
  isLoggedIn: boolean;
  currentUserHandle?: string;
  onAuthTrigger?: () => void;
  onManageJam?: () => void;
  onCreatorClick?: (creator: AppProject['creator'], project: AppProject) => void;
  isOwner?: boolean;
  userThemeId?: string | null;
  userThemeConfig?: ThemeConfigV1 | null;
  showChrome?: boolean;
}

const JamPageV2: React.FC<JamPageV2Props> = ({
  project,
  jamSlug,
  layoutConfig,
  onClose,
  isLoggedIn,
  currentUserHandle,
  onAuthTrigger,
  onManageJam,
  onCreatorClick,
  isOwner,
  userThemeId,
  userThemeConfig,
  showChrome = false
}) => {
  const [loadedProject, setLoadedProject] = useState<AppProject | null>(project ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Dopamine flash state for theme transition
  const [dopamineFlash, setDopamineFlash] = useState<'none' | 'light' | 'dark'>('none');
  
  // AI Remix State
  const [isRemixDrawerOpen, setIsRemixDrawerOpen] = useState(false);
  const [isRemixing, setIsRemixing] = useState(false);
  const [ephemeralRemix, setEphemeralRemix] = useState<ThemeRemixResult | null>(null);
  const [previousThemeState, setPreviousThemeState] = useState<{ themeId: string | null; remix: ThemeRemixResult | null; source: 'url' | 'control' | 'remix' | 'saved' | 'default' } | null>(null);
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const routeSlug = useMemo(() => {
    if (jamSlug) return jamSlug;
    if (typeof window === 'undefined') return null;
    const path = window.location.pathname;
    if (!path.startsWith('/jam/')) return null;
    return path.split('/jam/')[1] || null;
  }, [jamSlug]);

  useEffect(() => {
    setLoadedProject(project ?? null);
  }, [project]);

  useEffect(() => {
    if (project || !routeSlug) return;
    let cancelled = false;
    const loadJam = async () => {
      setIsLoading(true);
      try {
        const bySlug = await backend.getJamBySlug(routeSlug);
        let jam = bySlug.ok ? bySlug.jam : null;
        if (!jam) {
          const fallback = await backend.getJam(routeSlug);
          if (fallback.ok) jam = fallback.jam;
        }
        if (cancelled) return;
        if (jam) {
          setLoadedProject(mapJamToAppProject(jam));
        } else {
          setLoadError('Jam not found.');
        }
      } catch (e) {
        setLoadError('Failed to load jam.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    loadJam();
    return () => { cancelled = true; };
  }, [project, routeSlug]);

  const resolvedIsOwner = useMemo(() => {
    if (typeof isOwner === 'boolean') return isOwner;
    if (!currentUserHandle || !loadedProject?.creator?.handle) return false;
    return currentUserHandle.replace('@', '') === loadedProject.creator.handle.replace('@', '');
  }, [currentUserHandle, isOwner, loadedProject]);

  if (isLoading || (!loadedProject && routeSlug)) return null;
  if (!loadedProject || loadError) return null;

  const truth = createTruthModel(loadedProject);

  const searchLayout = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('layout')
    : null;
  const isValidArchetype = (value: string | null): value is LayoutArchetype => {
    return value === 'chronicle' || value === 'gallery' || value === 'minimal' || value === 'narrative' || value === 'experimental';
  };

  const initialConfig = isValidArchetype(searchLayout)
    ? validateLayoutConfig(LAYOUT_PRESETS[searchLayout])
    : validateLayoutConfig(layoutConfig);

  const [activeConfig, setActiveConfig] = useState<LayoutConfigV1>(initialConfig);

  const searchTheme = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('theme')
    : null;

  const jamThemeId = (loadedProject as any)?.theme_id || loadedProject?.themeId || null;
  const jamThemeConfig = (loadedProject as any)?.theme_config || loadedProject?.themeConfig || null;
  const [activeThemeId, setActiveThemeId] = useState<string | null>(searchTheme);
  const [themeSource, setThemeSource] = useState<'url' | 'control' | 'remix' | 'saved' | 'default'>(searchTheme ? 'url' : 'default');
  const [committedTheme, setCommittedTheme] = useState<{ type: 'theme'; id: string } | { type: 'remix'; remix: ThemeRemixResult } | null>(null);
  const [commitCount, setCommitCount] = useState<number>(0);
  const lastIdentityAction = React.useRef<'explicit' | 'system'>('system');
  const previousIdentityWeight = React.useRef<ThemeIdentityV1['identityWeight'] | null>(null);

  const themeCommitKey = loadedProject?.id ? `vibejam.theme.commit.${loadedProject.id}` : null;
  const themeCommitCountKey = loadedProject?.id ? `vibejam.theme.commitCount.${loadedProject.id}` : null;

  useEffect(() => {
    if (!themeCommitKey || typeof window === 'undefined') return;

    try {
      const stored = window.localStorage.getItem(themeCommitKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.type === 'theme' && parsed?.id) {
          setCommittedTheme({ type: 'theme', id: parsed.id });
          if (!searchTheme) {
            setActiveThemeId(parsed.id);
            setThemeSource('control');
          }
        }
        if (parsed?.type === 'remix' && parsed?.remix) {
          const validated = validateRemix(parsed.remix);
          setCommittedTheme({ type: 'remix', remix: validated });
          if (!searchTheme) {
            setEphemeralRemix(validated);
            setThemeSource('remix');
          }
        }
      }

      if (themeCommitCountKey) {
        const count = Number(window.localStorage.getItem(themeCommitCountKey) || '0');
        setCommitCount(Number.isFinite(count) ? count : 0);
      }
    } catch (error) {
      console.warn('[ThemeIdentity] Failed to hydrate committed theme from localStorage.', error);
    }
  }, [themeCommitKey, themeCommitCountKey, searchTheme]);

  const persistCommittedTheme = (record: { type: 'theme'; id: string } | { type: 'remix'; remix: ThemeRemixResult }) => {
    if (!themeCommitKey || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(themeCommitKey, JSON.stringify(record));
      setCommittedTheme(record);
    } catch (error) {
      console.warn('[ThemeIdentity] Failed to persist committed theme.', error);
    }
  };

  const incrementCommitCount = () => {
    if (!themeCommitCountKey || typeof window === 'undefined') return;
    const next = commitCount + 1;
    setCommitCount(next);
    try {
      window.localStorage.setItem(themeCommitCountKey, String(next));
    } catch (error) {
      console.warn('[ThemeIdentity] Failed to persist commit count.', error);
    }
  };

  useEffect(() => {
    if (activeThemeId || ephemeralRemix) return;
    if (jamThemeId || jamThemeConfig) {
      setThemeSource('saved');
      return;
    }
    if (userThemeId || userThemeConfig) {
      setThemeSource('saved');
      return;
    }
    setThemeSource('default');
  }, [activeThemeId, ephemeralRemix, jamThemeId, jamThemeConfig, userThemeId, userThemeConfig]);

  useEffect(() => {
    const showDevWarning = typeof import.meta !== 'undefined' && !(import.meta as any).env?.PROD;
    if (!showDevWarning || showChrome) return;
    if (!truth.Hero.props.title || !truth.Identity.props.name) {
      console.warn('[PublicJam] Jam content is too sparse for a standalone public page. Add a title and builder identity.');
    }
  }, [truth, showChrome]);

  const resolvedThemeData: ResolvedTheme = useMemo(() => {
    if (ephemeralRemix) {
      return {
        config: ephemeralRemix.config,
        behavior: getThemeBehaviorById('experimental'),
        dominance: getThemeDominanceById('experimental'),
        contrast: getThemeContrastById('experimental'),
        material: getThemeMaterialById('experimental'),
        source: 'remix'
      };
    }
    return resolveTheme({
      urlTheme: activeThemeId,
      jamTheme: jamThemeId,
      jamThemeConfig,
      userTheme: userThemeId,
      userThemeConfig: userThemeConfig || null
    });
  }, [ephemeralRemix, activeThemeId, jamThemeId, jamThemeConfig, userThemeId, userThemeConfig]);

  const resolvedTheme: ThemeConfigV1 = resolvedThemeData.config;
  const resolvedBehavior = resolvedThemeData.behavior;
  const resolvedDominance = resolvedThemeData.dominance;
  const resolvedContrast = resolvedThemeData.contrast;
  const resolvedMaterial = resolvedThemeData.material;
  const [followInsightLabel, setFollowInsightLabel] = useState<string | null>(null);

  const credibility: CredibilityState = useMemo(() => {
    const raw = loadedProject as any;
    return deriveCredibilityState({
      milestones: truth.Timeline.props.milestones,
      proofUrl: truth.Proof.props.proofUrl,
      updatedAt: raw?.updatedAt || raw?.updated_at || null,
      publishedAt: raw?.publishedAt || raw?.published_at || null,
      createdAt: raw?.createdAt || raw?.created_at || null,
      proofFirst: resolvedContrast?.emphasizes === 'proof',
      heroFirst: resolvedContrast?.emphasizes === 'hero'
    });
  }, [loadedProject, truth, resolvedContrast]);

  const isPreviewing = themeSource === 'url' || (themeSource === 'remix' && committedTheme?.type !== 'remix');
  const identityWeight: ThemeIdentityV1['identityWeight'] = isPreviewing
    ? 'light'
    : commitCount >= 2
      ? 'locked'
      : (themeSource === 'control' || themeSource === 'saved' || themeSource === 'remix') ? 'committed' : 'light';
  const authoredBy: ThemeIdentityV1['authoredBy'] =
    themeSource === 'remix' ? 'remix' :
      (themeSource === 'control' || themeSource === 'saved') ? 'creator' : 'system';
  const stability: ThemeIdentityV1['stability'] =
    identityWeight === 'locked' ? 'stable' :
      identityWeight === 'committed' ? 'semi-stable' : 'fluid';
  const narrativeLock = identityWeight === 'locked';

  const themeIdentity: ThemeIdentityV1 = {
    version: 1,
    identityWeight,
    authoredBy,
    stability,
    narrativeLock
  };

  const canShowChrome = showChrome;
  const canShowRemixControls = canShowChrome && isOwner && themeIdentity.identityWeight === 'light';

  const lockedContrast = useMemo(() => {
    if (!narrativeLock || !isPreviewing) return resolvedContrast;
    if (committedTheme?.type === 'theme') return getThemeContrastById(committedTheme.id);
    return resolvedContrast;
  }, [narrativeLock, isPreviewing, resolvedContrast, committedTheme]);

  const credibilityLabel = credibility.silencePenalty
    ? `Credibility: Silent (${credibility.silenceDays} days)`
    : `Credibility: ${credibility.momentumLevel === 'compounding' ? 'Compounding' : credibility.momentumLevel === 'active' ? 'Active' : 'Dormant'}`;

  useEffect(() => {
    let cancelled = false;
    const loadInsight = async () => {
      if (!currentUserHandle) return;
      const summary = await loadFollowSignalSurface(currentUserHandle, 12);
      if (cancelled) return;
      if (summary.totalCount === 0) {
        setFollowInsightLabel(null);
        return;
      }
      setFollowInsightLabel(`You follow ${summary.totalCount} builds · ${summary.activeCount} active this week`);
    };
    loadInsight();
    return () => { cancelled = true; };
  }, [currentUserHandle]);

  useEffect(() => {
    if (!loadedProject) return;
    if (typeof document === 'undefined') return;

    const proofState = truth.Proof.props.proofUrl ? 'Proof verified' : 'Proof unverified';
    const narrative = resolvedBehavior?.narrativeFlow || 'linear';
    const title = `${truth.Hero.props.title} — ${truth.Identity.props.name}`;
    const description = `${truth.Hero.props.description || 'Build in public.'} ${proofState}. Narrative: ${narrative}. Theme: ${resolvedThemeName}.`;
    const image = truth.Hero.props.imageUrl || loadedProject.screenshot || '';

    const setMeta = (selector: string, attr: 'content' | 'href', value: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | null;
      if (!el) {
        const [tag, key, keyValue] = selector.startsWith('meta') ? ['meta', 'name', selector.match(/\"(.*?)\"/)?.[1]] : ['link', 'rel', selector.match(/\"(.*?)\"/)?.[1]];
        if (!keyValue) return;
        el = document.createElement(tag) as any;
        el.setAttribute(key, keyValue);
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    document.title = title;
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    if (image) setMeta('meta[property="og:image"]', 'content', image);
    setMeta('meta[property="og:type"]', 'content', 'website');
    setMeta('meta[name="twitter:card"]', 'content', image ? 'summary_large_image' : 'summary');
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', description);
    if (image) setMeta('meta[name="twitter:image"]', 'content', image);
    const canonicalSlug = routeSlug || (loadedProject as any)?.slug || loadedProject?.id || '';
    if (canonicalSlug) {
      setMeta('link[rel="canonical"]', 'href', `${window.location.origin}/jam/${canonicalSlug}`);
    }
  }, [loadedProject, truth, resolvedThemeName, resolvedBehavior, routeSlug]);

  useEffect(() => {
    const showDevWarning = typeof import.meta !== 'undefined' && !(import.meta as any).env?.PROD;
    if (!showDevWarning) return;

    if (themeIdentity.identityWeight === 'locked' && themeSource === 'remix') {
      console.warn('[ThemeIdentity] Locked identity is being modified by a remix.');
    }

    if (themeIdentity.narrativeLock && isPreviewing) {
      console.warn('[ThemeIdentity] Narrative lock active — contrast overrides are blocked for previews.');
    }
  }, [themeIdentity, themeSource, isPreviewing]);

  useEffect(() => {
    const showDevWarning = typeof import.meta !== 'undefined' && !(import.meta as any).env?.PROD;
    if (!showDevWarning) return;

    if (previousIdentityWeight.current && previousIdentityWeight.current !== themeIdentity.identityWeight) {
      const weightOrder = { light: 0, committed: 1, locked: 2 };
      const escalated = weightOrder[themeIdentity.identityWeight] > weightOrder[previousIdentityWeight.current];
      if (escalated && lastIdentityAction.current !== 'explicit') {
        console.warn('[ThemeIdentity] Identity weight escalated without explicit user action.');
      }
    }
    previousIdentityWeight.current = themeIdentity.identityWeight;
    lastIdentityAction.current = 'system';
  }, [themeIdentity.identityWeight]);

  const resolvedThemeName = (() => {
    if (ephemeralRemix) return 'ai-remix';
    if (activeThemeId && THEME_REGISTRY[activeThemeId]) return activeThemeId;
    if (jamThemeId && THEME_REGISTRY[jamThemeId]) return jamThemeId;
    if (jamThemeConfig) return 'custom';
    if (userThemeId && THEME_REGISTRY[userThemeId]) return userThemeId;
    if (userThemeConfig) return 'custom';
    return 'default';
  })();

  const themeClasses: ThemeClasses = useMemo(() => {
    if (ephemeralRemix) return ephemeralRemix.classes;
    return resolveThemeClasses(resolvedTheme);
  }, [ephemeralRemix, resolvedTheme]);

  const handleRemix = async (prompt: string) => {
    if (!loadedProject?.id) return null;
    setIsRemixing(true);
    try {
      const result = await backend.remixTheme({
        jamId: loadedProject.id,
        prompt,
        baseTheme: resolvedTheme
      });

      if (result) {
        const validated = validateRemix(result);
        setPreviousThemeState({ themeId: activeThemeId, remix: ephemeralRemix, source: themeSource });
        setEphemeralRemix(validated);
        setThemeSource('remix');
        return validated;
      }
    } catch (e) {
      console.error('Remix failed:', e);
    } finally {
      setIsRemixing(false);
    }
    return null;
  };

  const handleRejectRemix = () => {
    setEphemeralRemix(null);
  };

  const handleAcceptRemix = () => {
    console.log('Accepted remix:', ephemeralRemix);
    if (ephemeralRemix) {
      lastIdentityAction.current = 'explicit';
      persistCommittedTheme({ type: 'remix', remix: ephemeralRemix });
      incrementCommitCount();
      setThemeSource('remix');
    }
  };

  const handleArchetypeChange = (archetype: LayoutArchetype) => {
    setActiveConfig(validateLayoutConfig(LAYOUT_PRESETS[archetype] || DEFAULT_LAYOUT_CONFIG));
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('layout', archetype);
      const query = params.toString();
      const url = `${window.location.pathname}${query ? `?${query}` : ''}`;
      window.history.replaceState(window.history.state, '', url);
    }
  };

  const handleThemeChange = (themeName: string) => {
    setPreviousThemeState({ themeId: activeThemeId, remix: ephemeralRemix, source: themeSource });
    
    // DOPAMINE FLASH — instant perceptual change
    const newTheme = getThemeById(themeName);
    const isNewThemeDark = newTheme?.palette === 'dark';
    setDopamineFlash(isNewThemeDark ? 'dark' : 'light');
    setTimeout(() => setDopamineFlash('none'), 150);
    
    setActiveThemeId(themeName);
    setEphemeralRemix(null);
    setThemeSource('control');
    lastIdentityAction.current = 'explicit';
    persistCommittedTheme({ type: 'theme', id: themeName });
    incrementCommitCount();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('theme', themeName);
      const query = params.toString();
      const url = `${window.location.pathname}${query ? `?${query}` : ''}`;
      window.history.replaceState(window.history.state, '', url);
    }
  };

  const handleReset = () => {
    setActiveThemeId(null);
    setEphemeralRemix(null);
    setThemeSource('default');
    setActiveConfig(validateLayoutConfig(layoutConfig));
    
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.delete('theme');
      params.delete('layout');
      const query = params.toString();
      const url = `${window.location.pathname}${query ? `?${query}` : ''}`;
      window.history.replaceState(window.history.state, '', url);
    }
  };

  const showDevLabel = typeof import.meta !== 'undefined' && !(import.meta as any).env?.PROD;

  return (
    <div className={`relative ${themeClasses.page}`}>
      {/* DOPAMINE FLASH — CSS-only transition feedback */}
      {dopamineFlash !== 'none' && (
        <div 
          className={`fixed inset-0 z-[9998] pointer-events-none transition-opacity duration-150 ease-out ${
            dopamineFlash === 'light' ? 'bg-white' : 'bg-black'
          }`}
          style={{ animation: 'dopamineFlash 150ms ease-out forwards' }}
        />
      )}
      
      <style>{`
        @keyframes dopamineFlash {
          0% { opacity: 0.8; }
          100% { opacity: 0; }
        }
      `}</style>

      {canShowChrome && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Back to Discover"
          title="Back to Discover"
          className={`fixed top-4 left-4 z-[150] inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${themeClasses.surface} ${themeClasses.body}`}
        >
          <span aria-hidden="true">←</span>
          Back to Discover
        </button>
      )}

      <LayoutRenderer
        config={activeConfig}
        truth={truth}
        theme={themeClasses}
        behavior={resolvedBehavior}
        dominance={resolvedDominance}
        contrast={lockedContrast}
        identity={themeIdentity}
        material={resolvedMaterial}
        credibility={credibility}
      />

      {canShowChrome && (
        <ThemeControlCenter
          currentThemeId={resolvedThemeName}
          currentLayoutId={activeConfig.archetype}
          identityWeight={themeIdentity.identityWeight}
          isPreviewing={themeIdentity.identityWeight === 'light' && isPreviewing}
          materialLabel={resolvedMaterial.displayLabel}
          credibilityLabel={credibilityLabel}
          followInsightLabel={followInsightLabel || undefined}
          onThemeChange={handleThemeChange}
          onLayoutChange={handleArchetypeChange}
          onReset={handleReset}
        />
      )}

      {canShowRemixControls && (
        <ThemeControlDock
          currentThemeId={resolvedThemeName}
          activeConfig={activeConfig}
          isOwner={isOwner}
          isRemixing={!!ephemeralRemix}
          onThemeSelect={(themeId) => {
            handleThemeChange(themeId);
            if (ephemeralRemix) setEphemeralRemix(null);
          }}
          onRemix={() => setIsRemixDrawerOpen(true)}
          onUndoRemix={handleRejectRemix}
          onKeepRemix={handleAcceptRemix}
        />
      )}

      {canShowRemixControls && (
        <ThemeRemixDrawer
          isOpen={isRemixDrawerOpen}
          onClose={() => setIsRemixDrawerOpen(false)}
          isProcessing={isRemixing}
          onRemix={handleRemix}
          lastRemix={ephemeralRemix || undefined}
        />
      )}

      {showDevLabel && (
        <>
          <div className="fixed bottom-4 right-4 text-[10px] font-semibold uppercase tracking-widest text-gray-300">
            Layout: {activeConfig.archetype} · v{activeConfig.version}
          </div>
          <div className="fixed bottom-7 right-4 text-[10px] font-semibold uppercase tracking-widest text-gray-300">
            Theme: {resolvedThemeName} · v{resolvedTheme.version}
          </div>
        </>
      )}
    </div>
  );
};

export default JamPageV2;
