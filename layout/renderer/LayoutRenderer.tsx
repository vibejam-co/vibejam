import React from 'react';
import { LayoutBlockSpec, LayoutSpecV1 } from '../spec';
import { TruthBlocks } from '../truth';
import TimelineV2 from '../../components/jam/TimelineV2';

interface LayoutRendererProps {
  spec: LayoutSpecV1;
  truth: TruthBlocks;
}

const BlockHero: React.FC<{ block: TruthBlocks['Hero']; variant?: string }> = ({ block }) => {
  const { title, description, imageUrl, category, daysLive } = block.props;
  return (
    <div className="relative">
      <h1 className="text-[12vw] md:text-[8vw] font-black tracking-tighter leading-[0.85] text-gray-900 uppercase">
        {title}
      </h1>
      {description && (
        <p className="mt-6 text-lg md:text-xl font-semibold text-gray-700 max-w-2xl">
          {description}
        </p>
      )}
      {imageUrl && (
        <div className="mt-8 overflow-hidden rounded-[32px] shadow-2xl">
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="mt-6 flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-gray-400">
        {category && <span>{category}</span>}
        {typeof daysLive === 'number' && daysLive > 0 && <span>Day {daysLive}</span>}
      </div>
    </div>
  );
};

const BlockIdentity: React.FC<{ block: TruthBlocks['Identity']; variant?: string }> = ({ block }) => {
  const { name, handle, avatarUrl } = block.props;
  return (
    <div className="flex items-center gap-4">
      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100">
        {avatarUrl && <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />}
      </div>
      <div>
        <div className="font-bold text-lg text-gray-900">{name}</div>
        {handle && <div className="text-xs font-mono text-gray-400">{handle}</div>}
      </div>
    </div>
  );
};

const BlockProof: React.FC<{ block: TruthBlocks['Proof']; variant?: string }> = ({ block }) => {
  if (!block.props.proofUrl) return null;
  return (
    <a href={block.props.proofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-700">
      Source Verified
    </a>
  );
};

const BlockMetrics: React.FC<{ block: TruthBlocks['Metrics']; variant?: string }> = ({ block }) => {
  const { growth, revenue } = block.props;
  return (
    <div className="flex flex-wrap gap-3">
      <div className="px-4 py-3 rounded-2xl border border-gray-100">
        <div className="text-[9px] font-black uppercase text-gray-300">Growth</div>
        <div className="text-sm font-bold text-blue-600 font-mono">{growth || '0%'}</div>
      </div>
      <div className="px-4 py-3 rounded-2xl border border-gray-100">
        <div className="text-[9px] font-black uppercase text-gray-300">Revenue</div>
        <div className="text-sm font-bold text-emerald-600 font-mono">{revenue || '-'}</div>
      </div>
    </div>
  );
};

const BlockLinks: React.FC<{ block: TruthBlocks['Links']; variant?: string }> = ({ block }) => {
  if (!block.props.websiteUrl) return null;
  return (
    <a href={block.props.websiteUrl} target="_blank" rel="noreferrer" className="text-xs font-black uppercase tracking-[0.3em] text-gray-300 hover:text-gray-900">
      Visit Website ↗
    </a>
  );
};

const BlockTimeline: React.FC<{ block: TruthBlocks['Timeline']; variant?: string }> = ({ block }) => {
  return (
    <TimelineV2 milestones={block.props.milestones} onDiscussionClick={() => undefined} />
  );
};

const BlockSignals: React.FC<{ block: TruthBlocks['Signals']; variant?: string }> = () => {
  return null;
};

const BlockActions: React.FC<{ block: TruthBlocks['Actions']; variant?: string }> = () => {
  return (
    <div className="bg-gray-900/90 backdrop-blur-xl text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4">
      <span className="text-xs font-mono font-bold tracking-widest uppercase">Add to collection</span>
      <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      </div>
    </div>
  );
};

const blockMap: Record<string, React.FC<any>> = {
  Hero: BlockHero,
  Identity: BlockIdentity,
  Proof: BlockProof,
  Metrics: BlockMetrics,
  Links: BlockLinks,
  Timeline: BlockTimeline,
  Signals: BlockSignals,
  Actions: BlockActions
};

const renderBlock = (spec: LayoutBlockSpec, truth: TruthBlocks) => {
  const Component = blockMap[spec.type];
  if (!Component) return null;
  const block = truth[spec.type as keyof TruthBlocks] as any;
  if (!block) return null;
  return (
    <div key={spec.id} style={spec.style}>
      <Component block={block} variant={spec.variant} />
    </div>
  );
};

const LayoutRenderer: React.FC<LayoutRendererProps> = ({ spec, truth }) => {
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${spec.layout.grid.columns}, minmax(0, 1fr))`,
    gridAutoRows: spec.layout.grid.rows ? undefined : 'min-content',
    gap: spec.layout.grid.gap || '24px',
    alignItems: spec.layout.grid.align || 'start',
    justifyItems: spec.layout.grid.justify || 'start',
    padding: spec.layout.grid.padding || '48px',
    maxWidth: spec.layout.grid.maxWidth || '1400px',
    margin: '0 auto',
    width: '100%'
  };

  const resolveRegionPosition = (regionType: string) => {
    if (regionType === 'fixed') return 'fixed' as const;
    if (regionType === 'overlay') return 'absolute' as const;
    return 'relative' as const;
  };

  return (
    <div
      className="min-h-screen"
      style={{
        minHeight: spec.canvas.minHeight || '100vh',
        overflowX: spec.canvas.overflowX || 'hidden',
        overflowY: spec.canvas.overflowY || 'visible',
        background: spec.theme.background || 'white',
        color: spec.theme.textColor || '#111827'
      }}
    >
      <div className="relative" style={gridStyle}>
        {spec.layout.regions.map(region => (
          <div
            key={region.id}
            style={{
              gridArea: region.gridArea,
              position: resolveRegionPosition(region.type),
              zIndex: region.zIndex,
              top: region.position?.top,
              right: region.position?.right,
              bottom: region.position?.bottom,
              left: region.position?.left
            }}
          >
            {spec.blocks
              .filter(block => block.regionId === region.id)
              .map(block => renderBlock(block, truth))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LayoutRenderer;
