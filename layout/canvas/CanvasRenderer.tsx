import React from 'react';
import { TruthBlocks } from '../truth';
import { ThemeClasses } from '../../theme/ThemeClasses';
import { ThemeBehaviorProfile } from '../../theme/ThemeBehavior';
import { ThemeDominanceProfile } from '../../theme/ThemeDominance';
import { ThemeContrastProfile } from '../../theme/ThemeContrast';
import { ThemeIdentityV1 } from '../../theme/ThemeIdentity';
import { MaterialResponseProfile } from '../../theme/MaterialResponse';
import { CredibilityState } from '../../theme/CredibilityState';
import { TrustSignalsV1 } from '../../theme/TrustSignals';
import TimelineV2 from '../../components/jam/TimelineV2';
import { JamCanvasPlan, JamCanvasRegionId } from '../../jam/canvas/JamCanvasPlan';
import { ProofEmphasisIntent } from '../../jam/proof/ProofEmphasis';
import { SilenceFramingIntent } from '../../jam/silence/SilenceFraming';
import { ActivityDensityIntent } from '../../jam/density/ActivityDensity';

interface CanvasRendererProps {
  truth: TruthBlocks;
  theme: ThemeClasses;
  behavior?: ThemeBehaviorProfile;
  dominance?: ThemeDominanceProfile;
  contrast?: ThemeContrastProfile;
  identity?: ThemeIdentityV1;
  material?: MaterialResponseProfile;
  credibility?: CredibilityState;
  trustSignals?: TrustSignalsV1;
  plan: JamCanvasPlan;
  proofEmphasis?: ProofEmphasisIntent;
  silenceFraming?: SilenceFramingIntent | null;
  densityIntent?: ActivityDensityIntent | null;
}

const widthClass = (width: string) => {
  if (width === 'narrow') return 'col-span-4';
  if (width === 'medium') return 'col-span-8';
  return 'col-span-12';
};

const placementRow = (placement: string) => {
  if (placement === 'top') return 'row-start-1';
  if (placement === 'center') return 'row-start-2';
  if (placement === 'bottom') return 'row-start-3';
  if (placement === 'side') return 'row-start-2';
  return 'row-start-2';
};

const placementCol = (placement: string, alignment: string, width: string) => {
  if (placement === 'side') return 'col-start-9';
  if (alignment === 'asymmetric') {
    return width === 'narrow' ? 'col-start-2' : width === 'medium' ? 'col-start-2' : 'col-start-1';
  }
  return width === 'narrow' ? 'col-start-5' : width === 'medium' ? 'col-start-3' : 'col-start-1';
};

const CanvasRenderer: React.FC<CanvasRendererProps> = ({
  truth,
  theme,
  behavior,
  dominance,
  contrast,
  identity,
  material,
  credibility,
  trustSignals,
  plan,
  proofEmphasis,
  silenceFraming,
  densityIntent
}) => {
  const containerDensity = plan.spatialRules.density === 'compressed' ? 'gap-4' : plan.spatialRules.density === 'airy' ? 'gap-12' : 'gap-8';
  const breathing = plan.spatialRules.breathingRoom === 'wide' ? 'py-16' : plan.spatialRules.breathingRoom === 'tight' ? 'py-6' : 'py-10';
  const overlapAllowed = plan.spatialRules.overlap === 'allowed';

  const proofEmphasisClass = (() => {
    if (!proofEmphasis) return '';
    if (proofEmphasis.weight === 'heavy') return 'font-semibold border-y-2 border-current/40 py-3';
    if (proofEmphasis.weight === 'medium') return 'font-semibold border-y border-current/30 py-2';
    return 'border-y border-current/15 py-1';
  })();

  const renderHero = () => (
    <div className={`space-y-4 ${theme.body}`}>
      <h1 className={`text-4xl md:text-6xl font-bold ${theme.title}`}>{truth.Hero.props.title}</h1>
      {truth.Hero.props.description && (
        <p className={`text-base md:text-lg opacity-70 ${theme.body}`}>{truth.Hero.props.description}</p>
      )}
      {truth.Hero.props.imageUrl && (
        <div className={`overflow-hidden border ${theme.card} ${theme.surface}`}>
          <img src={truth.Hero.props.imageUrl} alt={truth.Hero.props.title} className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );

  const renderNarrative = () => (
    <TimelineV2 milestones={truth.Timeline.props.milestones} onDiscussionClick={() => undefined} silenceFraming={silenceFraming} densityIntent={densityIntent} />
  );

  const renderProof = () => {
    if (!truth.Proof.props.proofUrl && !truth.Metrics.props.growth && !truth.Metrics.props.revenue) return null;
    return (
      <div className={`space-y-3 ${theme.body}`}>
        <div className={`flex flex-wrap gap-4 text-sm ${proofEmphasisClass}`}>
          {truth.Proof.props.proofUrl && (
            <a href={truth.Proof.props.proofUrl} target="_blank" rel="noreferrer" className={`font-semibold ${theme.accent}`}>
              Source Verified
            </a>
          )}
          <span className="font-mono">Growth: {truth.Metrics.props.growth || '0%'}</span>
          <span className="font-mono">Revenue: {truth.Metrics.props.revenue || '-'}</span>
        </div>
      </div>
    );
  };

  const renderIdentity = () => (
    <div className={`flex items-center gap-3 ${theme.body}`}>
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100">
        {truth.Identity.props.avatarUrl && (
          <img src={truth.Identity.props.avatarUrl} alt={truth.Identity.props.name} className="w-full h-full object-cover" />
        )}
      </div>
      <div>
        <div className="text-sm font-semibold">{truth.Identity.props.name}</div>
        {truth.Identity.props.handle && (
          <div className="text-xs font-mono opacity-60">{truth.Identity.props.handle}</div>
        )}
      </div>
    </div>
  );

  const renderRegion = (regionId: JamCanvasRegionId) => {
    const region = plan.regions[regionId];
    const baseClass = `relative ${widthClass(region.width)} ${placementRow(region.placement)} ${placementCol(region.placement, plan.spatialRules.alignment, region.width)}`;
    const overlayClass = region.stacking === 'overlay' && overlapAllowed ? 'absolute z-20 top-8 right-8' : '';

    const content = (() => {
      switch (regionId) {
        case 'hero':
          return renderHero();
        case 'narrative':
          return renderNarrative();
        case 'proof':
          return renderProof();
        case 'identity':
          return renderIdentity();
        default:
          return null;
      }
    })();

    if (!content) return null;

    return (
      <div key={regionId} className={`${baseClass} ${overlayClass}`.trim()}>
        {content}
      </div>
    );
  };

  return (
    <div className={`${theme.page} ${breathing}`}>
      <div className={`relative grid grid-cols-12 ${containerDensity} max-w-6xl mx-auto px-4 md:px-8`}>
        {plan.order.map((regionId) => renderRegion(regionId))}
      </div>
    </div>
  );
};

export default CanvasRenderer;
