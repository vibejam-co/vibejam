import React, { useEffect, useMemo, useState } from 'react';
import { AppProject } from '../../types';
import { backend } from '../../lib/backend';
import { mapJamToAppProject } from '../../lib/jamMapping';
import LayoutRenderer from '../../layout/renderer/LayoutRenderer';
import { createTruthModel } from '../../layout/truth';
import { DEFAULT_LAYOUT_CONFIG, LAYOUT_PRESETS, LayoutArchetype, LayoutConfigV1, validateLayoutConfig } from '../../layout/LayoutConfig';
import { resolveTheme } from '../../theme/ThemeResolver';
import { resolveThemeClasses } from '../../theme/ThemeClasses';
import { THEME_REGISTRY } from '../../theme/ThemeRegistry';

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
  userThemeId
}) => {
  const [loadedProject, setLoadedProject] = useState<AppProject | null>(project ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isControlOpen, setIsControlOpen] = useState(false);

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

  const jamThemeId = (loadedProject as any)?.theme_id || null;
  const [activeThemeId, setActiveThemeId] = useState<string | null>(searchTheme);

  const resolvedTheme = resolveTheme({
    urlTheme: activeThemeId,
    jamTheme: jamThemeId,
    userTheme: userThemeId
  });

  const resolvedThemeName = (() => {
    if (activeThemeId && THEME_REGISTRY[activeThemeId]) return activeThemeId;
    if (jamThemeId && THEME_REGISTRY[jamThemeId]) return jamThemeId;
    if (userThemeId && THEME_REGISTRY[userThemeId]) return userThemeId;
    return 'default';
  })();

  const resolvedThemeClasses = resolveThemeClasses(resolvedTheme);

  const showDevLabel = typeof import.meta !== 'undefined' && !(import.meta as any).env?.PROD;

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
    setActiveThemeId(themeName);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('theme', themeName);
      const query = params.toString();
      const url = `${window.location.pathname}${query ? `?${query}` : ''}`;
      window.history.replaceState(window.history.state, '', url);
    }
  };

  return (
    <div className={`relative ${resolvedThemeClasses.page}`}>
      <LayoutRenderer config={activeConfig} truth={truth} theme={resolvedThemeClasses} />

      {showDevLabel && (
        <>
          <button
            type="button"
            onClick={() => setIsControlOpen(prev => !prev)}
            className="fixed bottom-5 right-5 z-[200] rounded-full border border-gray-200 bg-white px-3 py-2 text-[11px] font-semibold text-gray-700 shadow-sm"
          >
            Control
          </button>

          {isControlOpen && (
            <div className="fixed bottom-16 right-5 z-[200] w-56 rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                Archetype
              </div>
              <div className="space-y-2">
                {(['chronicle', 'gallery', 'minimal', 'narrative', 'experimental'] as LayoutArchetype[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleArchetypeChange(type)}
                    className={`w-full rounded-md px-2 py-1 text-left text-xs ${activeConfig.archetype === type ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-700'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mt-4 mb-2">
                Theme
              </div>
              <div className="space-y-2">
                {Object.keys(THEME_REGISTRY).filter(name => name !== 'default').map((themeName) => (
                  <button
                    key={themeName}
                    type="button"
                    onClick={() => handleThemeChange(themeName)}
                    className={`w-full rounded-md px-2 py-1 text-left text-xs ${resolvedThemeName === themeName ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-700'}`}
                  >
                    {themeName} · v1
                  </button>
                ))}
              </div>
            </div>
          )}

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
