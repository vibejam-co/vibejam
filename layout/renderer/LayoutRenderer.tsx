import React from 'react';
import { LayoutConfigV1 } from '../LayoutConfig';
import { ThemeClasses } from '../../theme/ThemeClasses';
import { TruthBlocks } from '../truth';
import TimelineV2 from '../../components/jam/TimelineV2';

interface LayoutRendererProps {
  config: LayoutConfigV1;
  truth: TruthBlocks;
  theme: ThemeClasses;
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

export const resolveTitleScale = (config: LayoutConfigV1) => {
  if (config.typographyScale === 'oversized') {
    return 'text-[clamp(4rem,11vw,9rem)] md:text-[clamp(8rem,14vw,18rem)] leading-[0.85] tracking-tight';
  }
  if (config.typographyScale === 'large') return 'text-4xl md:text-6xl';
  return 'text-3xl md:text-5xl';
};

const LayoutRenderer: React.FC<LayoutRendererProps> = ({ config, truth, theme }) => {
  const grid = resolveGrid(config);
  const heroPlacement = resolveHeroPlacement(config);
  const timelinePlacement = resolveTimelinePlacement(config);
  const titleScale = resolveTitleScale(config);
  const identityPlacement = config.grid === 'asymmetric'
    ? 'col-span-12 lg:col-span-3 lg:col-start-10'
    : 'col-span-12 lg:col-span-4';
  const identityOffset = config.grid === 'asymmetric' ? 'lg:mt-16' : '';
  const heroOffsetLayout = config.grid === 'asymmetric' ? 'lg:grid-cols-[repeat(12,minmax(0,1fr))]' : '';
  const proofArtifact = config.emphasis.proof ? 'border border-dashed border-emerald-200 px-3 py-2 rounded-full translate-x-1' : '';
  const looseSpacing = config.spacingDensity === 'loose' ? 'mt-8 md:mt-12' : 'mt-6';

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

        <div className={timelinePlacement}>
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

          {(config.emphasis.proof || truth.Metrics.props.growth || truth.Metrics.props.revenue) && (
            <div className={`flex flex-wrap gap-4 text-sm text-gray-500 ${theme.body}`}>
              {config.emphasis.proof && truth.Proof.props.proofUrl && (
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
