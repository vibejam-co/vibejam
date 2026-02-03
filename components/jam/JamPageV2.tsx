import React, { useEffect, useMemo, useState } from 'react';
import { AppProject } from '../../types';
import { backend } from '../../lib/backend';
import { mapJamToAppProject } from '../../lib/jamMapping';
import LayoutRenderer from '../../layout/renderer/LayoutRenderer';
import { createTruthModel } from '../../layout/truth';
import { DEFAULT_LAYOUT_CONFIG, LAYOUT_PRESETS, LayoutArchetype, LayoutConfigV1, validateLayoutConfig } from '../../layout/LayoutConfig';
import { DEFAULT_THEME_CONFIG, THEME_PRESETS, ThemeConfigV1, validateThemeConfig } from '../../layout/ThemeConfig';

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
  isOwner
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
  const initialTheme = searchTheme && THEME_PRESETS[searchTheme]
    ? validateThemeConfig(THEME_PRESETS[searchTheme])
    : validateThemeConfig(DEFAULT_THEME_CONFIG);
  const [activeTheme] = useState<ThemeConfigV1>(initialTheme);

  const showDevLabel = typeof import.meta !== 'undefined' && !(import.meta as any).env?.PROD;
  if (layoutConfig && layoutConfig.version !== 1 && showDevLabel) {
    console.warn('Invalid layoutConfig provided. Falling back to DEFAULT_LAYOUT_CONFIG.');
  }

  const handleArchetypeChange = (archetype: LayoutArchetype) => {
    setActiveConfig(validateLayoutConfig(LAYOUT_PRESETS[archetype] || DEFAULT_LAYOUT_CONFIG));
  };

  return (
    <div className="relative min-h-screen">
      <LayoutRenderer config={activeConfig} truth={truth} theme={activeTheme} />

      <button
        type="button"
        onClick={() => setIsControlOpen(prev => !prev)}
        className="fixed bottom-5 right-5 z-[200] rounded-full border border-gray-200 bg-white px-3 py-2 text-[11px] font-semibold text-gray-700 shadow-sm"
      >
        Control
      </button>

      {isControlOpen && (
        <div className="fixed bottom-16 right-5 z-[200] w-48 rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
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
        </div>
      )}

      {showDevLabel && (
        <div className="fixed bottom-4 right-4 text-[10px] font-semibold uppercase tracking-widest text-gray-300">
          Layout: {activeConfig.archetype} · v{activeConfig.version}
        </div>
      )}
    </div>
  );
};

export default JamPageV2;
