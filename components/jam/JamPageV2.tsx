import React, { useEffect, useMemo, useState } from 'react';
import { AppProject } from '../../types';
import { backend } from '../../lib/backend';
import { mapJamToAppProject } from '../../lib/jamMapping';
import LayoutRenderer from '../../layout/renderer/LayoutRenderer';
import { LayoutArchetype } from '../../layout/spec';
import { createTruthModel } from '../../layout/truth';
import ChroniclePreset from '../../layout/archetypes/ChroniclePreset';
import GalleryPreset from '../../layout/archetypes/GalleryPreset';
import MinimalPreset from '../../layout/archetypes/MinimalPreset';
import NarrativePreset from '../../layout/archetypes/NarrativePreset';
import ExperimentalPreset from '../../layout/archetypes/ExperimentalPreset';
import MonolithPreset from '../../layout/archetypes/MonolithPreset';
import JamPageV1 from './JamPageV1';

interface JamPageV2Props {
    project?: AppProject | null;
    jamSlug?: string | null;
    layout?: LayoutArchetype;
    renderVersion?: 'v1' | 'v2';
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
    layout = 'monolith',
    renderVersion = 'v2',
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
    const routeSlug = useMemo(() => {
        if (jamSlug) return jamSlug;
        if (typeof window === 'undefined') return null;
        const path = window.location.pathname;
        if (!path.startsWith('/jam/')) return null;
        return path.split('/jam/')[1] || null;
    }, [jamSlug]);

    useEffect(() => {
        setLoadedProject(project ?? null);
        if (project) {
            setIsLoading(false);
            setLoadError(null);
        }
    }, [project]);

    useEffect(() => {
        if (project || !routeSlug) return;
        let cancelled = false;
        const loadJam = async () => {
            setIsLoading(true);
            setLoadError(null);
            setLoadedProject(null);
            try {
                const bySlug = await backend.getJamBySlug(routeSlug);
                let jam = bySlug.ok ? bySlug.jam : null;
                if (!jam) {
                    const fallback = await backend.getJam(routeSlug);
                    if (fallback.ok) jam = fallback.jam;
                }

                if (cancelled) return;

                if (jam) {
                    const mapped = mapJamToAppProject(jam);
                    if ((jam as any).creator) {
                        const c = (jam as any).creator;
                        mapped.creator = {
                            name: c.display_name || 'Maker',
                            avatar: c.avatar_url || '',
                            handle: c.handle || '',
                            type: mapped.creator.type,
                            color: '#3b82f6'
                        };
                    }
                    setLoadedProject(mapped);
                    return;
                }
                setLoadError('Jam not found.');
            } catch (e) {
                console.warn('Jam load failed', e);
                setLoadError('Failed to load jam.');
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        loadJam();
        return () => { cancelled = true; };
    }, [project, routeSlug]);

    const resolvedProject = loadedProject;
    const resolvedIsOwner = useMemo(() => {
        if (typeof isOwner === 'boolean') return isOwner;
        if (!currentUserHandle || !resolvedProject?.creator?.handle) return false;
        return currentUserHandle === resolvedProject.creator.handle;
    }, [currentUserHandle, isOwner, resolvedProject]);

    if (isLoading || (!resolvedProject && routeSlug)) {
        return null;
    }

    if (!resolvedProject || loadError) {
        return null;
    }

    if (renderVersion === 'v1') {
        return (
            <JamPageV1
                project={resolvedProject}
                onBack={onClose}
                onCreatorClick={(creator) => onCreatorClick?.(creator, resolvedProject)}
                isLoggedIn={isLoggedIn}
                onAuthTrigger={onAuthTrigger}
                onManageJam={onManageJam}
                isOwner={resolvedIsOwner}
            />
        );
    }

    const truth = createTruthModel(resolvedProject);
    const searchLayout = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('layout')
        : null;
    const isValidLayout = (value: string | null): value is LayoutArchetype => {
        return value === 'chronicle'
            || value === 'gallery'
            || value === 'minimal'
            || value === 'narrative'
            || value === 'experimental'
            || value === 'monolith';
    };
    const resolvedLayout = isValidLayout(searchLayout) ? searchLayout : layout;
    const presets: Record<LayoutArchetype, any> = {
        chronicle: ChroniclePreset,
        gallery: GalleryPreset,
        minimal: MinimalPreset,
        narrative: NarrativePreset,
        experimental: ExperimentalPreset,
        monolith: MonolithPreset
    };
    const spec = presets[resolvedLayout] || MonolithPreset;

    return <LayoutRenderer spec={spec} truth={truth} />;
};

export default JamPageV2;
