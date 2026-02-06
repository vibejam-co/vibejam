import React, { useEffect, useMemo, useState } from 'react';
import { AppProject } from '../../types';
import { mapJamToAppProject } from '../../lib/jamMapping';
import CanvasRenderer from '../../layout/canvas/CanvasRenderer';
import { createTruthModel } from '../../layout/truth';
import { DEFAULT_LAYOUT_CONFIG, LAYOUT_PRESETS, LayoutArchetype, LayoutConfigV1, validateLayoutConfig } from '../../layout/LayoutConfig';
import { resolveTheme, ResolvedTheme } from '../../theme/ThemeResolver';
import { resolveThemeClasses } from '../../theme/ThemeClasses';
import ThemeControlDock from '../creator/ThemeControlDock';
import ThemeControlCenter from '../control-center/ThemeControlCenter';
import { getThemeRegistry, getThemeById, getThemeBehaviorById, getThemeDominanceById, getThemeContrastById, getThemeMaterialById, runThemeRegistryDevChecks } from '../../theme/ThemeRegistry';
import { ThemeBehaviorProfile } from '../../theme/ThemeBehavior';
import ThemeRemixDrawer from '../creator/ThemeRemixDrawer';
import { ThemeRemixResult, validateRemix } from '../../theme/ThemeRemix';
import { ThemeConfigV1 } from '../../theme/ThemeConfig';
import { ThemeIdentityV1 } from '../../theme/ThemeIdentity';
import { ThemeClasses } from '../../theme/ThemeClasses';
import { CredibilityState, deriveCredibilityState } from '../../theme/CredibilityState';
import { loadFollowSignalSurface } from '../../lib/FollowSignalSurface';
import { TrustSignalsV1, deriveTrustSignals } from '../../theme/TrustSignals';
import { emitEventSignal, normalizeEventContext } from '../../lib/EventSignals';
import { FEATURE_FLAGS } from '../../constants';
import { getBackend } from '../../lib/backendRuntime';
import { markJamRuntimeActive } from '../../lib/jamRuntime';
import { JamNarrativeMode } from '../../jam/narrative/JamNarrative';
import { deriveJamNarrativeMode, deriveJamNarrativeReason } from '../../jam/narrative/deriveJamNarrativeMode';
import { deriveProofLevel } from '../../jam/proof/deriveProofLevel';
import { PROOF_EMPHASIS_MAP } from '../../jam/proof/ProofEmphasis';
import { deriveSilenceState } from '../../jam/silence/deriveSilenceState';
import { SILENCE_FRAMING_MAP } from '../../jam/silence/SilenceFraming';
import { ACTIVITY_DENSITY_MAP } from '../../jam/density/ActivityDensity';
import { deriveDensityProfile } from '../../jam/density/deriveDensityProfile';
import { CreativeSurfaceConfig } from '../../jam/creative/CreativeSurfaceConfig';
import { resolveCreativeSurface } from '../../jam/creative/resolveCreativeSurface';
import { resolveCreativeGrid } from '../../jam/creative/CreativeGrid';
import { enforceCreativeSafety } from '../../jam/creative/CreativeSafety';
import { resolvePremiumTemplate } from '../../jam/templates/resolvePremiumTemplate';
import { PREMIUM_JAM_TEMPLATES, PremiumJamTemplateId } from '../../jam/templates/PremiumJamTemplates';
import { EDITORIAL_CANVAS, POSTER_CANVAS } from '../../jam/canvas/JamCanvasPresets';
import {
  CommitmentMomentsV1,
  CommitmentMomentKey,
  DEFAULT_COMMITMENT_MOMENTS,
  hasAnyCommitmentMoment,
  markCommitmentMoment,
  readCommitmentMoments,
  serializeCommitmentMoments
} from '../../theme/CommitmentMoments';

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
  coldStartPreview?: boolean;
  showControlCenter?: boolean;
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
  showChrome = false,
  coldStartPreview = false,
  showControlCenter
}) => {
  markJamRuntimeActive('JamPageV2');

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

  const [coldStartActive, setColdStartActive] = useState(!!coldStartPreview);

  useEffect(() => {
    setLoadedProject(project ?? null);
  }, [project]);

  useEffect(() => {
    if (project || !routeSlug) return;
    let cancelled = false;
    const loadJam = async () => {
      setIsLoading(true);
      try {
        const backend = await getBackend();
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

  useEffect(() => {
    setColdStartActive(!!coldStartPreview);
  }, [coldStartPreview]);

  const resolvedIsOwner = useMemo(() => {
    if (typeof isOwner === 'boolean') return isOwner;
    if (!currentUserHandle || !loadedProject?.creator?.handle) return false;
    return currentUserHandle.replace('@', '') === loadedProject.creator.handle.replace('@', '');
  }, [currentUserHandle, isOwner, loadedProject]);

  if (isLoading || (!loadedProject && routeSlug)) return null;
  if (!loadedProject || loadError) return null;
  if (!FEATURE_FLAGS.VITE_FEATURE_PUBLIC_BIO && !showChrome) return null;

  const truth = createTruthModel(loadedProject);
  const previewTruth = useMemo(() => {
    if (!coldStartActive) return truth;
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().slice(0, 10);
    const milestones = truth.Timeline.props.milestones?.length
      ? truth.Timeline.props.milestones
      : [
        { date: formatDate(today), label: 'Shipped the current build' },
        { date: formatDate(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)), label: 'Proof of progress posted' },
        { date: formatDate(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)), label: 'First milestone published' }
      ];
    const proofUrl = truth.Proof.props.proofUrl || truth.Links.props.websiteUrl || '';
    return {
      ...truth,
      Proof: { ...truth.Proof, props: { ...truth.Proof.props, proofUrl } },
      Timeline: { ...truth.Timeline, props: { ...truth.Timeline.props, milestones } }
    };
  }, [coldStartActive, truth]);

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
  const [commitmentMoments, setCommitmentMoments] = useState<CommitmentMomentsV1>(DEFAULT_COMMITMENT_MOMENTS);
  const [followersCount, setFollowersCount] = useState<number | null>(null);
  const pageViewLogged = React.useRef(false);
  const previewThemeLogged = React.useRef(false);
  const lastIdentityAction = React.useRef<'explicit' | 'system'>('system');
  const previousIdentityWeight = React.useRef<ThemeIdentityV1['identityWeight'] | null>(null);

  const themeCommitKey = loadedProject?.id ? `vibejam.theme.commit.${loadedProject.id}` : null;
  const themeCommitCountKey = loadedProject?.id ? `vibejam.theme.commitCount.${loadedProject.id}` : null;
  const commitmentMomentsKey = loadedProject?.id ? `vibejam.commitment.moments.${loadedProject.id}` : null;

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

      if (commitmentMomentsKey) {
        const stored = window.localStorage.getItem(commitmentMomentsKey);
        setCommitmentMoments(readCommitmentMoments(stored));
      }
    } catch (error) {
      console.warn('[ThemeIdentity] Failed to hydrate committed theme from localStorage.', error);
    }
  }, [themeCommitKey, themeCommitCountKey, commitmentMomentsKey, searchTheme]);

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
    if (next === 1) {
      registerCommitmentMoment('firstThemeCommit');
    }
  };

  const registerCommitmentMoment = (moment: CommitmentMomentKey) => {
    if (!commitmentMomentsKey || typeof window === 'undefined') return;
    setCommitmentMoments((prev) => {
      const next = markCommitmentMoment(prev, moment);
      if (next !== prev) {
        try {
          window.localStorage.setItem(commitmentMomentsKey, serializeCommitmentMoments(next));
        } catch (error) {
          console.warn('[CommitmentMoments] Failed to persist commitment moments.', error);
        }
        const context = normalizeEventContext({
          jamId: loadedProject?.id,
          theme: resolvedThemeName,
          narrative: resolvedBehavior?.narrativeFlow,
          credibility: effectiveCredibility.momentumLevel,
          surface: showChrome ? 'in-app' : 'public'
        });
        if (moment === 'firstPublicShare') {
          emitEventSignal('first_share', context);
        }
        if (moment === 'firstSignalPosted') {
          emitEventSignal('first_signal_post', context);
        }
      }
      return next;
    });
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

  useEffect(() => {
    runThemeRegistryDevChecks();
  }, []);

  const resolvedThemeData: ResolvedTheme = useMemo(() => {
    const bestCaseThemeId = 'midnight';
    const previewThemeId = coldStartActive ? (activeThemeId || bestCaseThemeId) : activeThemeId;
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
      urlTheme: previewThemeId,
      jamTheme: jamThemeId,
      jamThemeConfig,
      userTheme: userThemeId,
      userThemeConfig: userThemeConfig || null
    });
  }, [ephemeralRemix, activeThemeId, jamThemeId, jamThemeConfig, userThemeId, userThemeConfig, coldStartActive]);

  const resolvedTheme: ThemeConfigV1 = resolvedThemeData.config;
  const resolvedBehavior = resolvedThemeData.behavior;
  const resolvedDominance = resolvedThemeData.dominance;
  const resolvedContrast = resolvedThemeData.contrast;
  const resolvedMaterial = resolvedThemeData.material;
  const [followInsightLabel, setFollowInsightLabel] = useState<string | null>(null);

  const credibility: CredibilityState = useMemo(() => {
    const raw = loadedProject as any;
    return deriveCredibilityState({
      milestones: previewTruth.Timeline.props.milestones,
      proofUrl: previewTruth.Proof.props.proofUrl,
      updatedAt: raw?.updatedAt || raw?.updated_at || null,
      publishedAt: raw?.publishedAt || raw?.published_at || null,
      createdAt: raw?.createdAt || raw?.created_at || null,
      proofFirst: resolvedContrast?.emphasizes === 'proof',
      heroFirst: resolvedContrast?.emphasizes === 'hero'
    });
  }, [loadedProject, previewTruth, resolvedContrast]);

  const effectiveCredibility = coldStartActive
    ? {
      ...credibility,
      momentumLevel: 'compounding' as const,
      consistencyWindow: '7d' as const,
      proofFreshness: 'current' as const,
      silencePenalty: false,
      silenceDays: 0
    }
    : credibility;

  const hasCommitment = hasAnyCommitmentMoment(commitmentMoments);
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
      identityWeight === 'committed' ? (hasCommitment ? 'stable' : 'semi-stable') : 'fluid';
  const narrativeLock = identityWeight === 'locked';

  const themeIdentity: ThemeIdentityV1 = {
    version: 1,
    identityWeight,
    authoredBy,
    stability,
    narrativeLock
  };

  const showBackButton = showChrome;
  const canShowControlCenter = typeof showControlCenter === 'boolean' ? showControlCenter : showChrome;
  const canShowRemixControls = canShowControlCenter && isOwner && !coldStartActive;

  const lockedContrast = useMemo(() => {
    if (!narrativeLock || !isPreviewing) return resolvedContrast;
    if (committedTheme?.type === 'theme') return getThemeContrastById(committedTheme.id);
    return resolvedContrast;
  }, [narrativeLock, isPreviewing, resolvedContrast, committedTheme]);

  const credibilityLabel = effectiveCredibility.silencePenalty
    ? `Credibility: Silent (${effectiveCredibility.silenceDays} days)`
    : `Credibility: ${effectiveCredibility.momentumLevel === 'compounding' ? 'Compounding' : effectiveCredibility.momentumLevel === 'active' ? 'Active' : 'Dormant'}`;

  useEffect(() => {
    let cancelled = false;
    const checkSignals = async () => {
      if (!coldStartActive || !loadedProject?.id) return;
      const backend = await getBackend();
      const res = await backend.listSignals(loadedProject.id);
      if (cancelled) return;
      if (res?.items?.length) setColdStartActive(false);
    };
    checkSignals();
    return () => { cancelled = true; };
  }, [coldStartActive, loadedProject?.id]);

  useEffect(() => {
    let cancelled = false;
    const checkSignalsForCommitment = async () => {
      if (!loadedProject?.id || commitmentMoments.firstSignalPosted) return;
      const backend = await getBackend();
      const res = await backend.listSignals(loadedProject.id);
      if (cancelled) return;
      if (res?.items?.length) {
        registerCommitmentMoment('firstSignalPosted');
      }
    };
    checkSignalsForCommitment();
    return () => { cancelled = true; };
  }, [loadedProject?.id, commitmentMoments.firstSignalPosted]);

  useEffect(() => {
    let cancelled = false;
    const checkFollowers = async () => {
      if (!resolvedIsOwner) return;
      if (commitmentMoments.firstFollower) return;
      const handle = loadedProject?.creator?.handle;
      if (!handle) return;
      const backend = await getBackend();
      const res = await backend.getFollowStatus({ handle });
      if (cancelled) return;
      if (res?.followersCount && res.followersCount > 0) {
        registerCommitmentMoment('firstFollower');
      }
    };
    checkFollowers();
    return () => { cancelled = true; };
  }, [resolvedIsOwner, loadedProject?.creator?.handle, commitmentMoments.firstFollower]);

  useEffect(() => {
    let cancelled = false;
    const loadFollowers = async () => {
      const handle = loadedProject?.creator?.handle;
      if (!handle) return;
      const backend = await getBackend();
      const res = await backend.getFollowStatus({ handle });
      if (cancelled) return;
      if (typeof res.followersCount === 'number') {
        setFollowersCount(res.followersCount);
      }
    };
    loadFollowers();
    return () => { cancelled = true; };
  }, [loadedProject?.creator?.handle]);

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

  const resolvedThemeName = (() => {
    const registry = getThemeRegistry();
    if (ephemeralRemix) return 'ai-remix';
    if (activeThemeId && registry[activeThemeId]) return activeThemeId;
    if (jamThemeId && registry[jamThemeId]) return jamThemeId;
    if (jamThemeConfig) return 'custom';
    if (userThemeId && registry[userThemeId]) return userThemeId;
    if (userThemeConfig) return 'custom';
    return 'default';
  })();

  const eventContext = useMemo(() => normalizeEventContext({
    jamId: loadedProject?.id,
    theme: resolvedThemeName,
    narrative: resolvedBehavior?.narrativeFlow,
    credibility: effectiveCredibility.momentumLevel,
    surface: showChrome ? 'in-app' : 'public'
  }), [loadedProject?.id, resolvedThemeName, resolvedBehavior?.narrativeFlow, effectiveCredibility.momentumLevel, showChrome]);

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
    if (!loadedProject?.id || pageViewLogged.current) return;
    emitEventSignal('jam_page_view', eventContext, {
      source: showChrome ? 'in-app' : 'public',
      themeSource,
      proof: !!truth.Proof.props.proofUrl,
      credibility: effectiveCredibility
    });
    pageViewLogged.current = true;
  }, [loadedProject?.id, eventContext, showChrome, themeSource, truth.Proof.props.proofUrl, effectiveCredibility]);

  useEffect(() => {
    if (themeSource !== 'url' || !activeThemeId || previewThemeLogged.current) return;
    emitEventSignal('theme_switch', normalizeEventContext({ ...eventContext, theme: activeThemeId }), {
      mode: 'preview',
      source: 'url'
    });
    previewThemeLogged.current = true;
  }, [themeSource, activeThemeId, eventContext]);

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

  const trustSignals: TrustSignalsV1 = useMemo(() => {
    const raw = loadedProject as any;
    return deriveTrustSignals({
      proofUrl: previewTruth.Proof.props.proofUrl,
      milestones: previewTruth.Timeline.props.milestones,
      updatedAt: raw?.updatedAt || raw?.updated_at || null,
      publishedAt: raw?.publishedAt || raw?.published_at || null,
      createdAt: raw?.createdAt || raw?.created_at || null
    });
  }, [loadedProject, previewTruth]);

  const socialSignals = useMemo(() => {
    const signals: string[] = [];
    if (typeof followersCount === 'number' && followersCount >= 3) {
      signals.push(`Followed by ${followersCount} builders`);
    }
    const watchedBy = loadedProject?.stats?.bookmarks || 0;
    if (watchedBy >= 10) {
      signals.push(`Watched by ${watchedBy} people`);
    }
    return signals;
  }, [followersCount, loadedProject?.stats?.bookmarks]);

  const trustSignalsWithSocial: TrustSignalsV1 = {
    ...trustSignals,
    socialSignals
  };

  const hasMilestones = previewTruth.Timeline.props.milestones?.length > 0;
  const hasProof = !!previewTruth.Proof.props.proofUrl;
  const narrativeInput = useMemo(() => ({
    proofUrl: previewTruth.Proof.props.proofUrl,
    milestones: previewTruth.Timeline.props.milestones,
    updatedAt: (loadedProject as any)?.updatedAt || (loadedProject as any)?.updated_at || null,
    publishedAt: (loadedProject as any)?.publishedAt || (loadedProject as any)?.published_at || null,
    createdAt: (loadedProject as any)?.createdAt || (loadedProject as any)?.created_at || null
  }), [loadedProject, previewTruth.Proof.props.proofUrl, previewTruth.Timeline.props.milestones]);

  const narrativeMode: JamNarrativeMode = useMemo(() => (
    deriveJamNarrativeMode(narrativeInput)
  ), [narrativeInput]);

  const narrativeReason = useMemo(() => (
    deriveJamNarrativeReason(narrativeInput)
  ), [narrativeInput]);
  const activityState: 'silent' | 'light' | 'active' =
    (!hasMilestones && !hasProof) || trustSignals.activityPattern === 'silent'
      ? 'silent'
      : hasMilestones && (previewTruth.Timeline.props.milestones?.length || 0) >= 4
        ? 'active'
        : 'light';

  const proofLevel = useMemo(() => (
    deriveProofLevel({
      proofUrl: previewTruth.Proof.props.proofUrl,
      proofFreshness: effectiveCredibility.proofFreshness
    })
  ), [previewTruth.Proof.props.proofUrl, effectiveCredibility.proofFreshness]);

  const proofEmphasis = useMemo(() => PROOF_EMPHASIS_MAP[proofLevel], [proofLevel]);

  const silenceState = useMemo(() => (
    deriveSilenceState({
      proofUrl: previewTruth.Proof.props.proofUrl,
      milestones: previewTruth.Timeline.props.milestones,
      updateRecencyDays: trustSignals.updateRecencyDays
    })
  ), [previewTruth.Proof.props.proofUrl, previewTruth.Timeline.props.milestones, trustSignals.updateRecencyDays]);

  const silenceActive = (!hasMilestones && !hasProof) || trustSignals.activityPattern === 'silent';
  const silenceFraming = silenceActive ? SILENCE_FRAMING_MAP[silenceState] : null;

  const densityProfile = useMemo(() => (
    deriveDensityProfile(narrativeMode, silenceState)
  ), [narrativeMode, silenceState]);

  const densityIntent = useMemo(() => ACTIVITY_DENSITY_MAP[densityProfile], [densityProfile]);

  // Creative substrate is inert by default and cannot override proof/narrative/silence.
  const defaultCreativeSurface = useMemo(() => resolveCreativeSurface(), []);
  const [creativeSurface, setCreativeSurface] = useState<CreativeSurfaceConfig>(defaultCreativeSurface);
  const [creativeSurfaceUndo, setCreativeSurfaceUndo] = useState<CreativeSurfaceConfig | null>(null);

  const applyCreativeSurfacePatch = (patch: Partial<CreativeSurfaceConfig>) => {
    setCreativeSurfaceUndo(creativeSurface);
    if (patch.templateId) {
      const template = PREMIUM_JAM_TEMPLATES[patch.templateId as PremiumJamTemplateId] || PREMIUM_JAM_TEMPLATES.default;
      setCreativeSurface(enforceCreativeSafety({
        ...creativeSurface,
        ...template.creativeOverrides,
        templateId: patch.templateId,
        ...patch,
        colorSlots: { ...creativeSurface.colorSlots, ...(patch.colorSlots || {}) },
        typographySlots: { ...creativeSurface.typographySlots, ...(patch.typographySlots || {}) }
      }));
      return;
    }

    setCreativeSurface(enforceCreativeSafety({
      ...creativeSurface,
      ...patch,
      colorSlots: { ...creativeSurface.colorSlots, ...(patch.colorSlots || {}) },
      typographySlots: { ...creativeSurface.typographySlots, ...(patch.typographySlots || {}) }
    }));
  };

  const handleCreativeReset = () => {
    setCreativeSurfaceUndo(creativeSurface);
    setCreativeSurface(enforceCreativeSafety(defaultCreativeSurface));
  };

  const handleCreativeUndo = () => {
    if (!creativeSurfaceUndo) return;
    setCreativeSurface(creativeSurfaceUndo);
    setCreativeSurfaceUndo(null);
  };

  const effectiveCreativeSurface = useMemo(() => (
    enforceCreativeSafety(resolvePremiumTemplate(creativeSurface, creativeSurface.templateId))
  ), [creativeSurface]);

  const creativeGrid = useMemo(() => resolveCreativeGrid(effectiveCreativeSurface.gridVariant), [effectiveCreativeSurface.gridVariant]);

  const identityStatusLabel = hasCommitment
    ? 'Authored'
    : isPreviewing
      ? 'Previewing'
      : 'Committed';

  const themeClasses: ThemeClasses = useMemo(() => {
    if (ephemeralRemix) return ephemeralRemix.classes;
    return resolveThemeClasses(resolvedTheme);
  }, [ephemeralRemix, resolvedTheme]);

  useEffect(() => {
    const showDevWarning = typeof import.meta !== 'undefined' && !(import.meta as any).env?.PROD;
    if (!showDevWarning) return;
    console.info(`[jam:narrative] mode=${narrativeMode} reason=${narrativeReason}`);
  }, [narrativeMode, narrativeReason]);

  const handleRemix = async (prompt: string) => {
    if (!loadedProject?.id) return null;
    setIsRemixing(true);
    try {
      const backend = await getBackend();
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
    emitEventSignal('theme_switch', normalizeEventContext({ ...eventContext, theme: themeName }), {
      mode: 'commit',
      from: resolvedThemeName,
      to: themeName,
      source: 'control'
    });
    if (!coldStartActive) {
      lastIdentityAction.current = 'explicit';
      persistCommittedTheme({ type: 'theme', id: themeName });
      incrementCommitCount();
    }
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
  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/jam/${routeSlug || loadedProject.slug || loadedProject.id}`
    : `/jam/${routeSlug || loadedProject.slug || loadedProject.id}`;

  const usePosterCanvas = false;
  const canvasPlan = usePosterCanvas ? POSTER_CANVAS : EDITORIAL_CANVAS;

  return (
    <div className={`relative ${themeClasses.page} jam-editorial`}>
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
      <style>{`
        .jam-editorial .jam-reading h1 {
          font-family: ui-serif, "Iowan Old Style", "Times New Roman", serif;
          letter-spacing: -0.03em;
          text-transform: none;
        }

        .jam-editorial .jam-reading > div > div {
          row-gap: 4.5rem;
        }

        .jam-editorial .jam-reading > div > div > div + div {
          border-top: 1px solid rgba(15, 23, 42, 0.18);
          padding-top: 2.5rem;
        }

        .jam-editorial .jam-reading .tracking-widest {
          letter-spacing: 0.32em;
          font-size: 10px;
        }

        .jam-editorial .jam-reading .uppercase {
          text-transform: none;
        }

        .jam-editorial .jam-reading [class*="shadow"] {
          box-shadow: none !important;
        }

        .jam-editorial .jam-reading .rounded-2xl,
        .jam-editorial .jam-reading .rounded-3xl,
        .jam-editorial .jam-reading .rounded-xl,
        .jam-editorial .jam-reading .rounded-lg {
          border-radius: 6px !important;
        }

        .jam-editorial .jam-reading .text-sm.text-gray-500 {
          border-top: 1px solid rgba(15, 23, 42, 0.25);
          border-bottom: 1px solid rgba(15, 23, 42, 0.25);
          padding: 0.75rem 0;
          gap: 1.25rem;
        }

        .jam-editorial .jam-reading .text-sm.text-gray-500 a {
          letter-spacing: 0.28em;
          font-size: 10px;
          text-transform: uppercase;
          border-bottom: 1px solid currentColor;
          padding-bottom: 2px;
        }

        .jam-editorial .jam-reading img {
          filter: saturate(0.85) contrast(1.05);
        }

        .jam-editorial .jam-reading .border {
          border-color: rgba(15, 23, 42, 0.18) !important;
        }

        .jam-editorial .jam-reading {
          transition: opacity 240ms ease;
        }

        .jam-editorial .jam-reading[data-activity="silent"] .jam-timeline-empty {
          border-color: rgba(15, 23, 42, 0.28);
          background: rgba(15, 23, 42, 0.02);
        }

        .jam-editorial .jam-reading[data-activity="silent"] .jam-timeline-empty-title {
          color: rgba(15, 23, 42, 0.55);
          font-weight: 600;
        }

        .jam-editorial .jam-reading[data-activity="silent"] .jam-timeline-empty-body {
          color: rgba(15, 23, 42, 0.55);
          max-width: 32rem;
        }

        .jam-editorial .jam-reading .jam-timeline-empty-rule {
          height: 1px;
          background: rgba(15, 23, 42, 0.2);
        }

        .jam-editorial .jam-reading[data-activity="silent"] .jam-timeline {
          padding-top: 3rem;
          padding-bottom: 3rem;
        }

        .jam-editorial .jam-reading[data-activity="active"] .jam-timeline {
          row-gap: 0.75rem;
        }

        .jam-editorial .jam-reading[data-activity="active"] .jam-timeline-item {
          padding-bottom: 1.75rem;
        }

        .jam-editorial .jam-reading[data-activity="active"] .jam-timeline-title {
          font-weight: 700;
        }

        .jam-editorial .jam-reading[data-activity="active"] .jam-timeline-meta {
          margin-bottom: 0.35rem;
        }

        .jam-editorial .jam-reading[data-activity="light"] .jam-timeline {
          row-gap: 1.25rem;
        }

        .jam-editorial .jam-reading[data-activity="light"] .jam-timeline-item {
          padding-bottom: 2.25rem;
        }

        .jam-editorial .jam-reading[data-activity="silent"] .text-sm.text-gray-500 {
          opacity: 0.55;
        }

        .jam-editorial .jam-reading[data-activity="active"] .text-sm.text-gray-500 {
          opacity: 0.95;
          border-color: rgba(15, 23, 42, 0.4);
        }

        .jam-editorial .jam-reading[data-activity="active"] .text-sm.text-gray-500 span {
          font-weight: 600;
          letter-spacing: 0.04em;
        }

        .jam-editorial .jam-reading[data-activity="active"][data-proof="off"] .text-sm.text-gray-500 {
          opacity: 0.7;
        }

        .jam-editorial .jam-reading[data-activity="silent"] .jam-timeline-line {
          border-left-style: dashed;
          opacity: 0.2;
        }

        .jam-editorial .jam-reading[data-activity="active"] .jam-timeline-line {
          border-left-style: solid;
          opacity: 0.45;
        }

        .jam-editorial .jam-reading[data-activity="active"] .jam-timeline-dot {
          width: 10px;
          height: 10px;
          border-width: 2px;
        }

        .jam-reading[data-template="black_label"] {
          background: #0b0b0c;
          color: #e6e1d6;
        }

        .jam-reading[data-template="black_label"] .jam-grid-editorial {
          max-width: 52rem;
        }

        .jam-reading[data-template="black_label"] h1,
        .jam-reading[data-template="black_label"] h4 {
          font-family: "Avenir Next", "Helvetica Neue", system-ui, sans-serif;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        .jam-reading[data-template="black_label"] .jam-timeline-item {
          border-left: 2px solid rgba(255,255,255,0.08);
        }

        .jam-reading[data-template="black_label"] .jam-timeline-dot {
          background: #0b0b0c;
          border-color: rgba(255,255,255,0.45);
        }

        .jam-reading[data-template="black_label"] .text-sm.text-gray-500 {
          border-color: rgba(255,255,255,0.35) !important;
          color: rgba(230,225,214,0.85) !important;
        }

        .jam-reading[data-template="black_label"] a {
          color: #e6e1d6;
        }

        .jam-reading[data-template="black_label"] img {
          filter: grayscale(0.6) contrast(1.1);
        }

        .jam-reading[data-template="deep_focus"] {
          background: #11151b;
          color: #e3e8ef;
        }

        .jam-reading[data-template="deep_focus"] .jam-grid-editorial {
          max-width: 64rem;
        }

        .jam-reading[data-template="deep_focus"] h1 {
          font-family: "Iowan Old Style", "Times New Roman", serif;
          letter-spacing: -0.02em;
        }

        .jam-reading[data-template="deep_focus"] .jam-timeline {
          padding-top: 3rem;
          padding-bottom: 3rem;
        }

        .jam-reading[data-template="deep_focus"] .jam-timeline-title {
          font-weight: 600;
        }

        .jam-reading[data-template="deep_focus"] .text-sm.text-gray-500 {
          border-color: rgba(227,232,239,0.25) !important;
          color: rgba(227,232,239,0.75) !important;
        }

        .jam-reading[data-template="neon_brutal"] {
          background: #050507;
          color: #f7f5ff;
        }

        .jam-reading[data-template="neon_brutal"] .jam-grid-freeform {
          max-width: 72rem;
        }

        .jam-reading[data-template="neon_brutal"] h1,
        .jam-reading[data-template="neon_brutal"] h4 {
          font-family: "Impact", "Arial Black", system-ui, sans-serif;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .jam-reading[data-template="neon_brutal"] .jam-timeline-item {
          margin-left: -1rem;
        }

        .jam-reading[data-template="neon_brutal"] .jam-timeline-dot {
          background: #05f2ff;
          border-color: #ff1cf7;
        }

        .jam-reading[data-template="neon_brutal"] .text-sm.text-gray-500 {
          border-color: rgba(255,28,247,0.6) !important;
          color: rgba(255,28,247,0.85) !important;
        }

        .jam-reading[data-template="neon_brutal"] a {
          color: #05f2ff;
        }

      `}</style>

      {showBackButton && (
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

      {coldStartActive && (
        <div className="max-w-5xl mx-auto px-4 md:px-8 pt-6">
          <div className="rounded-2xl border border-gray-100 bg-white/80 backdrop-blur-sm px-5 py-4 text-left">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest border border-amber-100">
                Preview
              </span>
              <span className="text-xs font-semibold text-gray-700">
                This is how your build looks when it's real.
              </span>
            </div>
            {loadedProject?.slug && (
              <div className="mt-3 text-[11px] font-mono text-gray-500">
                {typeof window !== 'undefined' ? `${window.location.origin}/jam/${loadedProject.slug}` : `/jam/${loadedProject.slug}`}
              </div>
            )}
            <div className="mt-1 text-[10px] uppercase tracking-widest text-gray-400">
              This link updates as you ship.
            </div>
          </div>
        </div>
      )}

      <div
        className="jam-reading"
        data-activity={activityState}
        data-proof={hasProof ? 'on' : 'off'}
        data-milestones={hasMilestones ? 'on' : 'off'}
        data-template={effectiveCreativeSurface.templateId}
      >
        <CanvasRenderer
          plan={canvasPlan}
          truth={previewTruth}
          theme={themeClasses}
          behavior={resolvedBehavior}
          dominance={resolvedDominance}
          contrast={lockedContrast}
          identity={themeIdentity}
          material={resolvedMaterial}
          credibility={effectiveCredibility}
          trustSignals={trustSignalsWithSocial}
          proofEmphasis={proofEmphasis}
          silenceFraming={silenceFraming}
          densityIntent={densityIntent}
        />
      </div>

      {canShowControlCenter && (
        <ThemeControlCenter
          currentThemeId={resolvedThemeName}
          currentLayoutId={activeConfig.archetype}
          identityWeight={themeIdentity.identityWeight}
          identityStatusLabel={identityStatusLabel}
          materialLabel={resolvedMaterial.displayLabel}
          credibilityLabel={credibilityLabel}
          followInsightLabel={followInsightLabel || undefined}
          publicUrl={resolvedIsOwner ? publicUrl : undefined}
          onPublicShare={() => registerCommitmentMoment('firstPublicShare')}
          themeOnly={coldStartActive}
          onThemeChange={handleThemeChange}
          onLayoutChange={handleArchetypeChange}
          onReset={handleReset}
          creativeSurface={effectiveCreativeSurface}
          onCreativeSurfaceChange={applyCreativeSurfacePatch}
          onCreativeReset={handleCreativeReset}
          onCreativeUndo={handleCreativeUndo}
          canUndoCreative={!!creativeSurfaceUndo}
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
          requiresIntent={themeIdentity.stability === 'stable'}
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
