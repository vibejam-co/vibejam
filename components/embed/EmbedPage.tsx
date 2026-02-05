import React, { useEffect, useMemo, useState } from 'react';
import { backend } from '../../lib/backend';
import { mapJamToAppProject } from '../../lib/jamMapping';
import { AppProject } from '../../types';
import { resolveTheme } from '../../theme/ThemeResolver';
import { resolveThemeClasses } from '../../theme/ThemeClasses';
import { createTruthModel } from '../../layout/truth';
import { deriveCredibilityState } from '../../theme/CredibilityState';
import { deriveTrustSignals } from '../../theme/TrustSignals';
import { FEATURE_FLAGS } from '../../constants';

interface EmbedPageProps {
  slug: string;
}

const EmbedPage: React.FC<EmbedPageProps> = ({ slug }) => {
  const [project, setProject] = useState<AppProject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!FEATURE_FLAGS.VITE_FEATURE_EMBEDS) return;
      setLoading(true);
      try {
        const bySlug = await backend.getJamBySlug(slug);
        let jam = bySlug.ok ? bySlug.jam : null;
        if (!jam) {
          const fallback = await backend.getJam(slug);
          if (fallback.ok) jam = fallback.jam;
        }
        if (cancelled) return;
        setProject(jam ? mapJamToAppProject(jam) : null);
      } catch (e) {
        if (!cancelled) setProject(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [slug]);

  const resolvedTheme = useMemo(() => {
    if (!project) return null;
    return resolveTheme({
      urlTheme: null,
      jamTheme: (project as any)?.themeId || null,
      jamThemeConfig: (project as any)?.themeConfig || null,
      userTheme: null,
      userThemeConfig: null
    });
  }, [project]);

  const themeClasses = useMemo(() => {
    if (!resolvedTheme) return null;
    return resolveThemeClasses(resolvedTheme.config);
  }, [resolvedTheme]);

  const truth = useMemo(() => (project ? createTruthModel(project) : null), [project]);

  const credibility = useMemo(() => {
    if (!project || !truth) return null;
    const raw = project as any;
    return deriveCredibilityState({
      milestones: truth.Timeline.props.milestones,
      proofUrl: truth.Proof.props.proofUrl,
      updatedAt: raw?.updatedAt || raw?.updated_at || null,
      publishedAt: raw?.publishedAt || raw?.published_at || null,
      createdAt: raw?.createdAt || raw?.created_at || null
    });
  }, [project, truth]);

  const trustSignals = useMemo(() => {
    if (!project || !truth) return null;
    const raw = project as any;
    return deriveTrustSignals({
      proofUrl: truth.Proof.props.proofUrl,
      milestones: truth.Timeline.props.milestones,
      updatedAt: raw?.updatedAt || raw?.updated_at || null,
      publishedAt: raw?.publishedAt || raw?.published_at || null,
      createdAt: raw?.createdAt || raw?.created_at || null
    });
  }, [project, truth]);

  useEffect(() => {
    if (!project || !truth || !trustSignals) return;
    if (typeof document === 'undefined') return;

    const title = `${truth.Hero.props.title} — ${truth.Identity.props.name}`;
    const description = `${trustSignals.updateRecencyLabel}. ${trustSignals.proofPresence ? 'Proof linked.' : 'Proof missing.'} ${trustSignals.activityPattern ? `Activity: ${trustSignals.activityPattern}.` : ''}`;

    const setMeta = (selector: string, attr: 'content' | 'href', value: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | null;
      if (!el) {
        const [tag, key, keyValue] = selector.startsWith('meta')
          ? ['meta', 'name', selector.match(/\"(.*?)\"/)?.[1]]
          : ['link', 'rel', selector.match(/\"(.*?)\"/)?.[1]];
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
    setMeta('meta[property="og:type"]', 'content', 'website');
    setMeta('meta[name="twitter:card"]', 'content', 'summary');
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', description);
  }, [project, truth, trustSignals]);

  if (!FEATURE_FLAGS.VITE_FEATURE_EMBEDS) return null;
  if (loading) return null;
  if (!project || !truth || !themeClasses || !trustSignals) return null;

  const quietTone = trustSignals.silencePenalty || !trustSignals.proofPresence ? 'opacity-80' : '';
  const credibilityTone = credibility?.momentumLevel === 'compounding'
    ? 'tracking-[0.25em]'
    : credibility?.momentumLevel === 'dormant'
      ? 'opacity-60'
      : '';

  const jamUrl = `/jam/${project.slug || project.id}`;

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-10 ${themeClasses.page}`}>
      <a
        href={jamUrl}
        className={`w-full max-w-xl rounded-[28px] border border-black/5 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.2)] overflow-hidden ${themeClasses.surface} ${quietTone} transition-opacity`}
      >
        <div className={`px-6 py-6 ${themeClasses.card}`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className={`text-[10px] uppercase tracking-[0.3em] ${themeClasses.body} opacity-60`}>Live Build</div>
              <h1 className={`text-xl md:text-2xl font-black mt-2 ${themeClasses.title}`}>{truth.Hero.props.title}</h1>
              <div className={`mt-2 text-xs uppercase tracking-widest ${themeClasses.body} opacity-60`}>Built by {truth.Identity.props.name}</div>
            </div>
            {truth.Hero.props.imageUrl && (
              <div className="w-20 h-20 rounded-2xl overflow-hidden border border-black/5">
                <img src={truth.Hero.props.imageUrl} alt={truth.Hero.props.title} className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className={`mt-5 flex flex-wrap gap-3 text-[10px] uppercase tracking-widest ${themeClasses.body} ${credibilityTone}`}>
            <span>{trustSignals.updateRecencyLabel}</span>
            <span>{trustSignals.buildAgeLabel}</span>
            <span>{trustSignals.proofPresence ? 'Proof linked' : 'Proof missing'}</span>
            {trustSignals.activityPattern && <span>Activity: {trustSignals.activityPattern}</span>}
          </div>

          {truth.Hero.props.description && (
            <p className={`mt-4 text-sm ${themeClasses.body} opacity-70`}>{truth.Hero.props.description}</p>
          )}

          <div className={`mt-5 text-[10px] uppercase tracking-[0.3em] ${themeClasses.body} opacity-40`}>
            {trustSignals.silencePenalty ? 'Silence visible' : 'Progress visible'}
          </div>
        </div>
      </a>
    </div>
  );
};

export default EmbedPage;
