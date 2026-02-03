
import React from 'react';
import { AppProject } from '../types';
import Badge, { SEAL_METADATA } from './Badge';

interface AppCardProps {
  project: AppProject;
  onClick: () => void;
  onCreatorClick?: (creator: AppProject['creator']) => void;
}

const AppCard: React.FC<AppCardProps> = ({ project, onClick, onCreatorClick }) => {
  const handleCreatorClick = (e: React.MouseEvent) => {
    if (onCreatorClick) {
      e.stopPropagation();
      onCreatorClick(project.creator);
    }
  };

  const primaryBadgeType = project.creator.badges?.[0]?.type;
  const auraColor = primaryBadgeType 
    ? SEAL_METADATA[primaryBadgeType].auraColor 
    : '#EAEAEA';

  return (
    <div 
      onClick={onClick}
      className="premium-card relative rounded-[40px] overflow-hidden group cursor-pointer"
    >
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"
        style={{
          background: `radial-gradient(circle at top right, ${project.creator.color}08 0%, transparent 70%)`
        }}
      />

      <div className="p-2">
        <div className="relative aspect-[16/10] rounded-[34px] overflow-hidden bg-gray-50 border border-gray-50">
          <img 
            src={project.screenshot} 
            alt={project.name}
            className="w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="absolute top-5 left-5">
             <div className="px-4 py-2 rounded-2xl bg-white/90 backdrop-blur-xl border border-white/50 shadow-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[11px] font-black text-gray-900 tracking-tight">{project.stats.revenue}<span className="text-[9px] text-gray-400 font-bold ml-1">/mo</span></span>
             </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 md:pb-10">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-5">
            <div 
              className="w-14 h-14 rounded-[22px] flex items-center justify-center text-2xl shadow-sm border border-gray-50 transition-all duration-500 group-hover:scale-105"
              style={{ backgroundColor: `${project.creator.color}05` }}
            >
              {project.icon}
            </div>
            <div>
              <h3 className="font-bold text-2xl text-gray-900 tracking-tight leading-none mb-2 group-hover:text-blue-600 transition-colors">{project.name}</h3>
              <div className="flex items-center gap-3">
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{project.category}</span>
                 {project.proofUrl && (
                   <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-50 via-white to-emerald-50 text-[8px] font-black text-emerald-700 border border-emerald-100 uppercase tracking-widest inline-flex items-center gap-1">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                     Verified
                   </span>
                 )}
                 {parseFloat(project.stats.revenue.replace(/[^0-9.]/g, '')) > 0 && (
                   <>
                    <span className="w-1 h-1 rounded-full bg-gray-200" />
                    <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Growing</span>
                   </>
                 )}
              </div>
            </div>
          </div>
          <button 
            className="flex flex-col items-center justify-center w-14 h-16 rounded-[22px] bg-gray-50/50 border border-gray-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-all active:scale-95"
            onClick={(e) => { e.stopPropagation(); }}
          >
            <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l-8 8h16l-8-8z"/></svg>
            <span className="text-[11px] font-black text-gray-500 mt-1.5">{project.stats.upvotes}</span>
          </button>
        </div>
        
        <p className="text-gray-500 text-base leading-relaxed line-clamp-2 font-medium">
          {project.description}
        </p>

        {project.stack?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {project.stack.slice(0, 3).map((t) => (
              <span key={t} className="px-2.5 py-1 rounded-lg bg-gray-50 text-[9px] font-black text-gray-600 border border-gray-100 uppercase tracking-widest">
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-10 pt-8 border-t border-gray-50 flex items-center justify-between">
          <div 
            onClick={handleCreatorClick}
            className="flex-1 flex items-center gap-4 cursor-pointer group/creator min-w-0"
          >
             <div className="relative shrink-0">
                <div className="avatar-shell w-10 h-10">
                  <div
                    className="vj-aura"
                    aria-hidden="true"
                    style={{ background: auraColor }}
                  />
                  <div 
                    className="relative z-10 w-full h-full rounded-full border-[2px] p-0.5 transition-all duration-700 bg-transparent"
                    style={{ borderColor: auraColor }}
                  >
                    <img 
                      src={project.creator.avatar} 
                      className="w-full h-full rounded-full object-cover block bg-transparent border border-white shadow-sm" 
                      alt={project.creator.name} 
                      draggable={false}
                    />
                  </div>
                </div>
             </div>
             <div className="flex flex-col min-w-0">
               <span className="text-[11px] font-bold text-gray-900 group-hover/creator:text-blue-500 transition-colors truncate">{project.creator.name}</span>
               <span className="text-[8px] font-black text-gray-300 uppercase tracking-[0.2em]">{project.creator.type}</span>
             </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {primaryBadgeType && (
              <Badge type={primaryBadgeType} size="sm" showTooltip />
            )}
            <div className="h-4 w-px bg-gray-100" />
            <span className="px-3 py-1.5 rounded-xl bg-blue-50/50 text-[10px] font-black text-blue-500 border border-blue-100 uppercase tracking-widest">{project.vibeTools[0]}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppCard;
