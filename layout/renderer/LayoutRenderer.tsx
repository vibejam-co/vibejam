import React from 'react';
import { LayoutConfigV1 } from '../LayoutConfig';
import { ThemeClasses } from '../../theme/ThemeClasses';
import { ThemeBehaviorProfile } from '../../theme/ThemeBehavior';
import { ThemeDominanceProfile } from '../../theme/ThemeDominance';
import { ThemeContrastProfile } from '../../theme/ThemeContrast';
import { ThemeIdentityV1 } from '../../theme/ThemeIdentity';
import { MaterialResponseProfile } from '../../theme/MaterialResponse';
import { CredibilityState } from '../../theme/CredibilityState';
import { TrustSignalsV1 } from '../../theme/TrustSignals';
import { TruthBlocks } from '../truth';
import TimelineV2 from '../../components/jam/TimelineV2';
import { FEATURE_FLAGS } from '../../constants';
import { JamNarrativeMode } from '../../jam/narrative/JamNarrative';
import { ProofEmphasisIntent } from '../../jam/proof/ProofEmphasis';
import { SilenceFramingIntent } from '../../jam/silence/SilenceFraming';
import { ActivityDensityIntent } from '../../jam/density/ActivityDensity';
import { CreativeSurfaceConfig } from '../../jam/creative/CreativeSurfaceConfig';
import { CreativeGridDefinition } from '../../jam/creative/CreativeGrid';

interface LayoutRendererProps {
  config: LayoutConfigV1;
  truth: TruthBlocks;
  theme: ThemeClasses;
  behavior?: ThemeBehaviorProfile;
  dominance?: ThemeDominanceProfile;
  contrast?: ThemeContrastProfile;
  identity?: ThemeIdentityV1;
  material?: MaterialResponseProfile;
  credibility?: CredibilityState;
  trustSignals?: TrustSignalsV1;
  narrativeMode?: JamNarrativeMode;
  proofEmphasis?: ProofEmphasisIntent;
  silenceFraming?: SilenceFramingIntent | null;
  densityIntent?: ActivityDensityIntent | null;
  creativeSurface?: CreativeSurfaceConfig;
  creativeGrid?: CreativeGridDefinition;
}

export const resolveGrid = (config: LayoutConfigV1) => {
  const densityMap: Record<LayoutConfigV1['spacingDensity'], string> = {
    compact: 'gap-5 md:gap-8',
    comfortable: 'gap-8 md:gap-12',
    loose: 'gap-10 md:gap-16'
  };

  const maxWidth = config.grid === 'asymmetric' ? 'max-w-6xl' : 'max-w-5xl';

  return {
    container: `grid grid-cols-12 ${densityMap[config.spacingDensity]} ${maxWidth} mx-auto px-4 md:px-8 pt-16 pb-24`
  };
};

export const resolveHeroPlacement = (config: LayoutConfigV1) => {
  if (config.heroPlacement === 'center') return { wrapper: 'col-span-12 text-center' };
  if (config.heroPlacement === 'offset') return { wrapper: 'col-span-12 lg:col-span-10 lg:col-start-2 text-left' };
  return { wrapper: 'col-span-12 text-left' };
};

export const resolveTimelinePlacement = (config: LayoutConfigV1) => {
  const wide = config.grid === 'asymmetric' ? 'lg:col-span-9' : 'lg:col-span-8';
  if (config.timelinePlacement === 'center') return `col-span-12 ${wide} lg:col-start-3`;
  if (config.timelinePlacement === 'right') return `col-span-12 ${wide} lg:col-start-4`;
  return `col-span-12 ${wide}`;
};

export const resolveTitleScale = (config: LayoutConfigV1, behavior?: ThemeBehaviorProfile) => {
  // BEHAVIOR OVERRIDE: HeroWeight affects title scale feel
  const heroBoost = behavior?.heroWeight === 'dominant' ? 'md:text-[clamp(7rem,16vw,20rem)]' : '';
  const heroRestrained = behavior?.heroWeight === 'restrained' ? 'md:text-[clamp(3rem,6vw,5rem)] font-light' : '';
  
  if (config.typographyScale === 'oversized') {
    return `text-[clamp(4rem,11vw,9rem)] md:text-[clamp(8rem,14vw,18rem)] leading-[0.85] tracking-tight ${heroBoost || heroRestrained}`;
  }
  if (config.typographyScale === 'large') return `text-4xl md:text-6xl ${heroBoost || heroRestrained}`;
  return `text-3xl md:text-5xl ${heroBoost || heroRestrained}`;
};

// BEHAVIOR: Content density affects grid gap
export const resolveBehaviorSpacing = (config: LayoutConfigV1, behavior?: ThemeBehaviorProfile) => {
  if (!behavior) return resolveGrid(config).container;
  
  const baseGrid = resolveGrid(config);
  
  // Override spacing based on contentDensity + whitespaceBias
  const gapMap: Record<string, string> = {
    'sparse-generous': 'gap-12 md:gap-24',
    'sparse-neutral': 'gap-10 md:gap-16',
    'sparse-compressed': 'gap-8 md:gap-12',
    'editorial-generous': 'gap-8 md:gap-16',
    'editorial-neutral': 'gap-5 md:gap-8',
    'editorial-compressed': 'gap-4 md:gap-6',
    'dense-generous': 'gap-6 md:gap-10',
    'dense-neutral': 'gap-4 md:gap-6',
    'dense-compressed': 'gap-2 md:gap-4'
  };
  
  const key = `${behavior.contentDensity}-${behavior.whitespaceBias}`;
  const behaviorGap = gapMap[key] || '';
  
  return behaviorGap ? baseGrid.container.replace(/gap-\S+\smd:gap-\S+/, behaviorGap) : baseGrid.container;
};

  // BEHAVIOR: Proof prominence affects proof block emphasis/visibility
  export const resolveProofEmphasis = (config: LayoutConfigV1, behavior?: ThemeBehaviorProfile) => {
    const proofEnabled = config.emphasis.proof;
    if (!proofEnabled && behavior?.proofProminence !== 'confrontational') return '';
  
  const prominenceMap: Record<string, string> = {
    quiet: 'opacity-50 hover:opacity-100 transition-opacity duration-300',
    featured: 'border border-dashed border-emerald-200 px-3 py-2 rounded-full translate-x-1',
    confrontational: 'block w-full text-center border-2 border-emerald-400 bg-emerald-50/50 px-4 py-3 rounded-lg font-bold text-emerald-800 shadow-lg shadow-emerald-100'
  };
  
  return prominenceMap[behavior?.proofProminence || 'featured'];
};

// BEHAVIOR: Timeline grouping rhythm based on narrativeFlow
export const resolveTimelineRhythm = (config: LayoutConfigV1, behavior?: ThemeBehaviorProfile) => {
  if (!behavior) return '';
  
  const rhythmMap: Record<string, string> = {
    linear: 'space-y-8',
    fragmented: 'space-y-4 md:space-y-2 divide-y divide-dashed divide-current opacity-80',
    immersive: 'space-y-12 md:space-y-16'
  };
  
  return rhythmMap[behavior.narrativeFlow];
};

const LayoutRenderer: React.FC<LayoutRendererProps> = ({
  config,
  truth,
  theme,
  behavior,
  dominance,
  contrast,
  identity,
  material,
  credibility,
  trustSignals,
  narrativeMode,
  proofEmphasis,
  silenceFraming,
  densityIntent,
  creativeSurface,
  creativeGrid
}) => {
  const credibilityEnabled = FEATURE_FLAGS.VITE_FEATURE_CREDIBILITY_VISUALS;
  const activeCredibility = credibilityEnabled ? credibility : undefined;
  // BEHAVIOR-AWARE COMPOSITION: Adjust layout feel without changing grid math
  const grid = { container: resolveBehaviorSpacing(config, behavior) };
  const heroPlacement = resolveHeroPlacement(config);
  const timelinePlacement = resolveTimelinePlacement(config);
  const titleScale = resolveTitleScale(config, behavior);
  const heroWidth = dominance?.heroDominance === 'overpowering'
    ? 'max-w-6xl'
    : dominance?.heroDominance === 'subdued'
      ? 'max-w-2xl'
      : 'max-w-4xl';
  const dominanceTitleAmp = dominance?.heroDominance === 'overpowering'
    ? 'md:text-[clamp(9rem,18vw,22rem)]'
    : dominance?.heroDominance === 'subdued'
      ? 'md:text-[clamp(3rem,6vw,5rem)] font-light'
      : '';
  const identityPlacement = config.grid === 'asymmetric'
    ? 'col-span-12 lg:col-span-3 lg:col-start-10'
    : 'col-span-12 lg:col-span-4';
  const identityOffset = config.grid === 'asymmetric' ? 'lg:mt-16' : '';
  const heroOffsetLayout = config.grid === 'asymmetric' ? 'lg:grid-cols-[repeat(12,minmax(0,1fr))]' : '';
  const proofArtifact = resolveProofEmphasis(config, behavior);
  const proofVisible = config.emphasis.proof || behavior?.proofProminence === 'confrontational';

  const primarySection = dominance?.contentGravity || 'hero';
  const nonPrimaryOpacity = dominance?.hierarchyBreaks === 'forbidden'
    ? 'opacity-80 contrast-75 saturate-50'
    : dominance?.hierarchyBreaks === 'discouraged'
      ? 'opacity-70'
      : 'opacity-60';
  const primaryBoost = dominance?.hierarchyBreaks === 'allowed'
    ? 'contrast-125 saturate-125'
    : '';
  const sectionEmphasis = (section: 'hero' | 'timeline' | 'proof') =>
    section === primarySection ? `opacity-100 ${primaryBoost}` : nonPrimaryOpacity;

  const silenceBackdrop = dominance?.visualSilence === 'extreme'
    ? 'brightness-90 saturate-50'
    : dominance?.visualSilence === 'partial'
      ? 'brightness-95'
      : '';
  const secondaryTextTone = dominance?.visualSilence === 'extreme'
    ? 'opacity-60'
    : dominance?.visualSilence === 'partial'
      ? 'opacity-80'
      : '';

  const contrastPrimary = contrast?.emphasizes || 'hero';
  const contrastSuppressed = contrast?.suppresses || 'proof';
  const contrastEmphasis = 'scale-[1.02] contrast-125 saturate-125';
  const contrastSuppression = 'opacity-60 scale-[0.98] saturate-50';
  const contrastClass = (section: 'hero' | 'timeline' | 'proof') =>
    section === contrastPrimary ? contrastEmphasis : section === contrastSuppressed ? contrastSuppression : '';

  const trustSignalStyle = (() => {
    if (!contrast) return '';
    const styles: Record<string, string> = {
      quiet: 'uppercase tracking-[0.3em] text-[10px] border border-dashed rounded-full px-3 py-1',
      loud: 'uppercase tracking-widest text-[11px] bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg shadow-emerald-500/20',
      institutional: 'font-mono text-[11px] bg-slate-100 text-slate-700 border border-slate-300 px-3 py-2 rounded-none',
      chaotic: 'uppercase tracking-wide text-[10px] border-l-4 border-yellow-400 bg-yellow-50 text-yellow-900 px-3 py-2 rounded-sm'
    };
    return styles[contrast.trustSignal] || '';
  })();

  const materialMotion = (() => {
    if (!material) return '';
    const tension = material.interactionTension === 'soft'
      ? 'active:scale-[0.99]'
      : material.interactionTension === 'rigid'
        ? 'active:scale-[0.97]'
        : 'active:scale-[0.98]';
    const settle = material.settleBehavior === 'float'
      ? 'hover:-translate-y-0.5'
      : material.settleBehavior === 'sink'
        ? 'hover:translate-y-0.5'
        : '';
    const feedback = material.feedbackVisibility === 'assertive'
      ? 'focus-visible:ring-2 focus-visible:ring-emerald-400/40'
      : material.feedbackVisibility === 'present'
        ? 'focus-visible:ring-1 focus-visible:ring-emerald-300/30'
        : 'focus-visible:ring-1 focus-visible:ring-black/10';
    const weight = material.surfaceWeight === 'heavy'
      ? 'shadow-lg'
      : material.surfaceWeight === 'light'
        ? 'shadow-sm'
        : 'shadow-md';
    return `transition-[transform,box-shadow,opacity] duration-150 ease-out ${tension} ${settle} ${feedback} ${weight}`;
  })();

  const proofEmphasisClass = (() => {
    // Proof emphasis is structural and cannot be overridden by creative surface controls.
    if (!proofEmphasis) return '';
    if (proofEmphasis.weight === 'heavy') return 'font-semibold border-y-2 border-current/40 py-3';
    if (proofEmphasis.weight === 'medium') return 'font-semibold border-y border-current/30 py-2';
    return 'border-y border-current/15 py-1';
  })();

  const proofProximityClass = (() => {
    if (!proofEmphasis) return '';
    if (proofEmphasis.proximityBias === 'dominant') return 'mt-4';
    if (proofEmphasis.proximityBias === 'near') return 'mt-2';
    return 'mt-1';
  })();

  const silenceSpacingClass = silenceFraming?.sectionBreathingRoom === 'expanded'
    ? 'mt-10 md:mt-14'
    : '';
  const silenceToneClass = silenceFraming?.contrastSoftening ? 'opacity-85' : '';
  const silenceTimelineClass = silenceFraming?.timelineOpacityBias === 'muted' ? 'opacity-80' : '';
  const densitySectionSpacing = densityIntent?.typographyProximity === 'compact'
    ? 'space-y-3'
    : densityIntent?.typographyProximity === 'relaxed'
      ? 'space-y-6'
      : '';

  const materialProof = material?.feedbackVisibility === 'assertive'
    ? 'tracking-[0.25em]'
    : material?.feedbackVisibility === 'present'
      ? 'tracking-[0.2em]'
      : 'tracking-[0.15em]';

  const followUrl = truth.Identity.props.handle
    ? `https://x.com/${truth.Identity.props.handle.replace('@', '')}`
    : truth.Links.props.websiteUrl || '';

  const isStableIdentity = identity?.stability === 'stable';
  const identityVolatility = identity?.identityWeight === 'light'
    ? 'contrast-105 saturate-105'
    : isStableIdentity
      ? 'contrast-95 saturate-95'
      : '';
  const identityTextDensity = identity?.identityWeight === 'light'
    ? 'leading-snug'
    : isStableIdentity
      ? 'leading-relaxed'
      : 'leading-normal';

  const credibilityTone = activeCredibility?.momentumLevel === 'compounding'
    ? 'contrast-110'
    : activeCredibility?.momentumLevel === 'dormant'
      ? 'opacity-70'
      : '';
  const credibilitySilence = activeCredibility?.silencePenalty
    ? 'opacity-60'
    : '';
  const credibilityProof = activeCredibility?.proofFreshness === 'current'
    ? 'opacity-100'
    : activeCredibility?.proofFreshness === 'recent'
      ? 'opacity-80'
      : 'opacity-55';
  const credibilityTimeline = activeCredibility?.momentumLevel === 'compounding'
    ? 'space-y-3 md:space-y-4'
    : activeCredibility?.momentumLevel === 'dormant'
      ? 'space-y-10 md:space-y-14'
      : '';
  const credibilityHeroGap = activeCredibility?.silencePenalty && contrast?.emphasizes === 'hero'
    ? 'mt-10 md:mt-14'
    : '';

  const trustSilenceTone = trustSignals?.silencePenalty ? 'opacity-70' : '';
  const trustRecencyTone = trustSignals && trustSignals.updateRecencyDays >= 14 ? 'opacity-80' : '';
  const trustTone = `${trustSilenceTone} ${trustRecencyTone}`.trim();
  const trustProofLabel = trustSignals ? (trustSignals.proofPresence ? 'Proof linked' : 'Proof missing') : null;
  const trustBaseItems = [
    trustSignals?.buildAgeLabel,
    trustSignals?.updateRecencyLabel,
    trustSignals?.activityPattern ? `Activity: ${trustSignals.activityPattern}` : null,
    ...(trustSignals?.socialSignals || [])
  ].filter((item): item is string => !!item);
  const trustItems = (contrast?.emphasizes === 'proof'
    ? [trustProofLabel, ...trustBaseItems]
    : [...trustBaseItems, trustProofLabel]
  ).filter((item): item is string => !!item);
  const showTrustSignals = trustItems.length > 0;
  
  // BEHAVIOR: Adjust spacing based on whitespaceBias
  const looseSpacing = dominance?.heroDominance === 'overpowering' ? 'mt-14 md:mt-24' :
                       dominance?.heroDominance === 'subdued' ? 'mt-4 md:mt-6' :
                       behavior?.whitespaceBias === 'generous' ? 'mt-12 md:mt-20' : 
                       behavior?.whitespaceBias === 'compressed' ? 'mt-4 md:mt-6' :
                       config.spacingDensity === 'loose' ? 'mt-8 md:mt-12' : 'mt-6';
  
  // BEHAVIOR: Timeline rhythm based on narrativeFlow
  const timelineRhythm = resolveTimelineRhythm(config, behavior);
  const trustBar = showTrustSignals ? (
    <div className={`mt-4 flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-widest ${theme.body} ${trustTone}`}>
      {trustItems.map((item, index) => (
        <span key={`${item}-${index}`} className="inline-flex items-center gap-2">
          <span className="opacity-40">•</span>
          <span>{item}</span>
        </span>
      ))}
    </div>
  ) : null;

  return (
    <div className={`${theme.page} ${silenceBackdrop} ${identityVolatility}`}>
      <div className={`${grid.container} ${creativeGrid?.containerClass || ''}`} style={creativeGrid?.containerStyle}>
        {config.emphasis.hero && (
          <div className={`${heroPlacement.wrapper} ${sectionEmphasis('hero')} ${contrastClass('hero')}`}>
            {config.heroPlacement === 'offset' ? (
              <div className={`grid grid-cols-12 gap-8 items-start ${heroOffsetLayout}`}>
                <div className="col-span-12 lg:col-span-5 lg:row-span-2">
                  {config.emphasis.title && (
                    <h1 className={`${titleScale} ${dominanceTitleAmp} ${heroWidth} font-black ${theme.title}`}>
                      {truth.Hero.props.title}
                    </h1>
                  )}
                  {(truth.Identity.props.name || truth.Proof.props.proofUrl) && (
                    <div className={`mt-4 flex flex-wrap items-center gap-3 text-xs uppercase tracking-widest ${theme.body}`}>
                      {truth.Identity.props.name && (
                        <span className="inline-flex items-center gap-2">
                          <span className="opacity-50">Built by</span>
                          <span className="font-semibold">{truth.Identity.props.name}</span>
                        </span>
                      )}
                      {truth.Proof.props.proofUrl && (
                        <a
                          href={truth.Proof.props.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                        className={`inline-flex items-center gap-2 ${trustSignalStyle} ${materialMotion}`}
                        >
                          <span>Proof</span>
                          <span className="text-[10px] opacity-70">Verified</span>
                        </a>
                      )}
                      {followUrl && (
                        <a
                          href={followUrl}
                          target="_blank"
                          rel="noreferrer"
                        className={`inline-flex items-center gap-2 ${theme.accent} ${materialMotion}`}
                        >
                          Follow Build
                        </a>
                      )}
                    </div>
                  )}
                  {trustBar}
                  {truth.Hero.props.description && (
                    <p className={`mt-6 text-base md:text-lg opacity-70 ${secondaryTextTone} ${identityTextDensity} ${heroWidth} ${theme.body}`}>
                      {truth.Hero.props.description}
                    </p>
                  )}
                </div>
                {truth.Hero.props.imageUrl && (
                  <div className="col-span-12 lg:col-span-7 lg:col-start-6 lg:row-start-2">
                    <div className={`overflow-hidden border border-gray-100 ${theme.card} ${theme.surface} ${materialMotion}`}>
                      <img src={truth.Hero.props.imageUrl} alt={truth.Hero.props.title} className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {config.emphasis.title && (
                  <h1 className={`${titleScale} ${dominanceTitleAmp} ${heroWidth} font-bold tracking-tight ${theme.title}`}>
                    {truth.Hero.props.title}
                  </h1>
                )}
                {(truth.Identity.props.name || truth.Proof.props.proofUrl) && (
                  <div className={`mt-3 flex flex-wrap items-center gap-3 text-xs uppercase tracking-widest ${theme.body}`}>
                    {truth.Identity.props.name && (
                      <span className="inline-flex items-center gap-2">
                        <span className="opacity-50">Built by</span>
                        <span className="font-semibold">{truth.Identity.props.name}</span>
                      </span>
                    )}
                    {truth.Proof.props.proofUrl && (
                      <a
                        href={truth.Proof.props.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex items-center gap-2 ${trustSignalStyle} ${materialMotion}`}
                      >
                        <span>Proof</span>
                        <span className="text-[10px] opacity-70">Verified</span>
                      </a>
                    )}
                    {followUrl && (
                      <a
                        href={followUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex items-center gap-2 ${theme.accent} ${materialMotion}`}
                      >
                        Follow Build
                      </a>
                    )}
                  </div>
                )}
                {trustBar}
                {truth.Hero.props.description && (
                  <p className={`mt-4 text-base md:text-lg text-gray-600 ${secondaryTextTone} ${identityTextDensity} ${heroWidth} ${theme.body}`}>
                    {truth.Hero.props.description}
                  </p>
                )}
                {truth.Hero.props.imageUrl && (
                  <div className={`${looseSpacing} overflow-hidden border border-gray-100 ${theme.card} ${theme.surface} ${materialMotion}`}>
                    <img src={truth.Hero.props.imageUrl} alt={truth.Hero.props.title} className="w-full h-full object-cover" />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className={`${timelinePlacement} ${timelineRhythm} ${credibilityTimeline} ${sectionEmphasis('timeline')} ${contrastClass('timeline')} ${credibilityTone} ${credibilitySilence} ${primarySection !== 'timeline' ? 'mt-6 md:mt-10' : ''} ${credibilityHeroGap} ${silenceTimelineClass}`}>
          <TimelineV2
            milestones={truth.Timeline.props.milestones}
            onDiscussionClick={() => undefined}
            narrativeMode={narrativeMode}
            silenceFraming={silenceFraming}
            densityIntent={densityIntent}
          />
        </div>

        <div
          className={`${identityPlacement} ${identityOffset} ${sectionEmphasis('proof')} ${contrastClass('proof')} ${credibilityTone} ${credibilitySilence} ${trustTone} ${primarySection !== 'proof' ? 'mt-6 md:mt-10' : ''} space-y-5 ${theme.body} ${identityTextDensity} ${silenceSpacingClass} ${silenceToneClass} ${densitySectionSpacing}`}
          data-narrative-mode={narrativeMode}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100">
              {truth.Identity.props.avatarUrl && (
                <img src={truth.Identity.props.avatarUrl} alt={truth.Identity.props.name} className="w-full h-full object-cover" />
              )}
            </div>
            <div>
              <div className="text-base font-semibold">{truth.Identity.props.name}</div>
              {truth.Identity.props.handle && (
                <div className={`text-xs font-mono text-gray-400 ${secondaryTextTone}`}>{truth.Identity.props.handle}</div>
              )}
            </div>
          </div>

          {(proofVisible || truth.Metrics.props.growth || truth.Metrics.props.revenue) && (
            <div className={`flex flex-wrap gap-4 text-sm text-gray-500 ${theme.body} ${proofEmphasisClass} ${proofProximityClass}`}>
              {proofVisible && truth.Proof.props.proofUrl && (
                <a href={truth.Proof.props.proofUrl} target="_blank" rel="noreferrer" className={`font-semibold ${materialProof} ${theme.accent} ${proofArtifact} ${trustSignalStyle} ${materialMotion} ${credibilityProof}`}>
                  Source Verified
                </a>
              )}
              <span className="font-mono">Growth: {truth.Metrics.props.growth || '0%'}</span>
              <span className="font-mono">Revenue: {truth.Metrics.props.revenue || '-'}</span>
            </div>
          )}

          {truth.Links.props.websiteUrl && (
            <a href={truth.Links.props.websiteUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900">
              Visit Website ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default LayoutRenderer;
