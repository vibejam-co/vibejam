import React, { useEffect, useMemo, useState } from 'react';
import { AppProject } from '../../types';
import { backend } from '../../lib/backend';
import { mapJamToAppProject } from '../../lib/jamMapping';
import LayoutRenderer from '../../layout/renderer/LayoutRenderer';
import { createTruthModel } from '../../layout/truth';
import { DEFAULT_LAYOUT_CONFIG, LAYOUT_PRESETS, LayoutArchetype, LayoutConfigV1, validateLayoutConfig } from '../../layout/LayoutConfig';
import { resolveTheme } from '../../theme/ThemeResolver';
import { resolveThemeClasses } from '../../theme/ThemeClasses';
import ThemeControlDock from '../creator/ThemeControlDock';
import { THEME_REGISTRY, getThemeById } from '../../theme/ThemeRegistry';
import ThemeRemixDrawer from '../creator/ThemeRemixDrawer';
import { ThemeRemixResult, validateRemix } from '../../theme/ThemeRemix';
import { ThemeConfigV1 } from '../../theme/ThemeConfig';
import { ThemeClasses } from '../../theme/ThemeClasses';
import ThemeControlCenter from '../control-center/ThemeControlCenter';

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
  userThemeConfig
}) => {
  const [loadedProject, setLoadedProject] = useState<AppProject | null>(project ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
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

  const resolvedTheme: ThemeConfigV1 = useMemo(() => {
    if (ephemeralRemix) return ephemeralRemix.config;
    return resolveTheme({
      urlTheme: activeThemeId,
      jamTheme: jamThemeId,
      jamThemeConfig,
      userTheme: userThemeId,
      userThemeConfig: userThemeConfig || null
    });
  }, [ephemeralRemix, activeThemeId, jamThemeId, jamThemeConfig, userThemeId, userThemeConfig]);

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
    setActiveThemeId(themeName);
    setEphemeralRemix(null);
    setThemeSource('control');
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

      <LayoutRenderer config={activeConfig} truth={truth} theme={themeClasses} />

      <ThemeControlCenter
        currentThemeId={resolvedThemeName}
        currentLayoutId={activeConfig.archetype}
        onThemeChange={handleThemeChange}
        onLayoutChange={handleArchetypeChange}
        onReset={handleReset}
      />

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

      <ThemeRemixDrawer
        isOpen={isRemixDrawerOpen}
        onClose={() => setIsRemixDrawerOpen(false)}
        isProcessing={isRemixing}
        onRemix={handleRemix}
        lastRemix={ephemeralRemix || undefined}
      />

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
