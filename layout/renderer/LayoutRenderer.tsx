import React from 'react';
import { LayoutConfigV1 } from '../LayoutConfig';
import { ThemeClasses } from '../../theme/ThemeClasses';
import { ThemeBehaviorProfile } from '../../theme/ThemeBehavior';
import { TruthBlocks } from '../truth';
import TimelineV2 from '../../components/jam/TimelineV2';

interface LayoutRendererProps {
  config: LayoutConfigV1;
  truth: TruthBlocks;
  theme: ThemeClasses;
  behavior?: ThemeBehaviorProfile;
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

const LayoutRenderer: React.FC<LayoutRendererProps> = ({ config, truth, theme, behavior }) => {
  // BEHAVIOR-AWARE COMPOSITION: Adjust layout feel without changing grid math
  const grid = { container: resolveBehaviorSpacing(config, behavior) };
  const heroPlacement = resolveHeroPlacement(config);
  const timelinePlacement = resolveTimelinePlacement(config);
  const titleScale = resolveTitleScale(config, behavior);
  const identityPlacement = config.grid === 'asymmetric'
    ? 'col-span-12 lg:col-span-3 lg:col-start-10'
    : 'col-span-12 lg:col-span-4';
  const identityOffset = config.grid === 'asymmetric' ? 'lg:mt-16' : '';
  const heroOffsetLayout = config.grid === 'asymmetric' ? 'lg:grid-cols-[repeat(12,minmax(0,1fr))]' : '';
  const proofArtifact = resolveProofEmphasis(config, behavior);
  const proofVisible = config.emphasis.proof || behavior?.proofProminence === 'confrontational';
  
  // BEHAVIOR: Adjust spacing based on whitespaceBias
  const looseSpacing = behavior?.whitespaceBias === 'generous' ? 'mt-12 md:mt-20' : 
                       behavior?.whitespaceBias === 'compressed' ? 'mt-4 md:mt-6' :
                       config.spacingDensity === 'loose' ? 'mt-8 md:mt-12' : 'mt-6';
  
  // BEHAVIOR: Timeline rhythm based on narrativeFlow
  const timelineRhythm = resolveTimelineRhythm(config, behavior);

  return (
    <div className={theme.page}>
      <div className={grid.container}>
        {config.emphasis.hero && (
          <div className={heroPlacement.wrapper}>
            {config.heroPlacement === 'offset' ? (
              <div className={`grid grid-cols-12 gap-8 items-start ${heroOffsetLayout}`}>
                <div className="col-span-12 lg:col-span-5 lg:row-span-2">
                  {config.emphasis.title && (
                    <h1 className={`${titleScale} font-black ${theme.title}`}>
                      {truth.Hero.props.title}
                    </h1>
                  )}
                  {truth.Hero.props.description && (
                    <p className={`mt-6 text-base md:text-lg opacity-70 max-w-3xl ${theme.body}`}>
                      {truth.Hero.props.description}
                    </p>
                  )}
                </div>
                {truth.Hero.props.imageUrl && (
                  <div className="col-span-12 lg:col-span-7 lg:col-start-6 lg:row-start-2">
                    <div className={`overflow-hidden border border-gray-100 ${theme.card} ${theme.surface}`}>
                      <img src={truth.Hero.props.imageUrl} alt={truth.Hero.props.title} className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {config.emphasis.title && (
                  <h1 className={`${titleScale} font-bold tracking-tight ${theme.title}`}>
                    {truth.Hero.props.title}
                  </h1>
                )}
                {truth.Hero.props.description && (
                  <p className={`mt-4 text-base md:text-lg text-gray-600 max-w-3xl ${theme.body}`}>
                    {truth.Hero.props.description}
                  </p>
                )}
                {truth.Hero.props.imageUrl && (
                  <div className={`${looseSpacing} overflow-hidden border border-gray-100 ${theme.card} ${theme.surface}`}>
                    <img src={truth.Hero.props.imageUrl} alt={truth.Hero.props.title} className="w-full h-full object-cover" />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className={`${timelinePlacement} ${timelineRhythm}`}>
          <TimelineV2 milestones={truth.Timeline.props.milestones} onDiscussionClick={() => undefined} />
        </div>

        <div className={`${identityPlacement} ${identityOffset} space-y-5 ${theme.body}`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100">
              {truth.Identity.props.avatarUrl && (
                <img src={truth.Identity.props.avatarUrl} alt={truth.Identity.props.name} className="w-full h-full object-cover" />
              )}
            </div>
            <div>
              <div className="text-base font-semibold">{truth.Identity.props.name}</div>
              {truth.Identity.props.handle && (
                <div className="text-xs font-mono text-gray-400">{truth.Identity.props.handle}</div>
              )}
            </div>
          </div>

          {(proofVisible || truth.Metrics.props.growth || truth.Metrics.props.revenue) && (
            <div className={`flex flex-wrap gap-4 text-sm text-gray-500 ${theme.body}`}>
              {proofVisible && truth.Proof.props.proofUrl && (
                <a href={truth.Proof.props.proofUrl} target="_blank" rel="noreferrer" className={`font-semibold uppercase tracking-widest ${theme.accent} ${proofArtifact}`}>
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
