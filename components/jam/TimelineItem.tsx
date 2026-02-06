import React from 'react';

interface TimelineItemProps {
    date?: string;
    label: string;
    body?: string;
    statusChip?: string;
    isLast?: boolean;
    onDiscussionClick?: () => void;
}

const TimelineItem: React.FC<TimelineItemProps> = ({
    date,
    label,
    body,
    statusChip,
    isLast = false,
    onDiscussionClick
}) => {
    return (
        <div className={`jam-timeline-item relative pl-12 pb-10 ${isLast ? 'pb-0' : ''}`}>
            {/* Line */}
            {!isLast && (
                <div className="jam-timeline-line absolute left-[5.5px] top-4 bottom-0 w-[1.5px] border-l-[1.5px] border-dashed border-current/20" />
            )}

            {/* Dot */}
            <div className="jam-timeline-dot absolute left-0 top-[6px] w-2.5 h-2.5 rounded-full bg-white border border-current z-10" />

            <div className="jam-timeline-content animate-in fade-in slide-in-from-left-4 duration-700">
                <div className="jam-timeline-meta flex flex-wrap items-center gap-3 mb-2">
                    {date && (
                        <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-current/70">{date}</span>
                    )}
                    {statusChip && (
                        <span className="jam-timeline-chip px-2 py-0.5 border border-current/20 text-[8px] font-semibold uppercase tracking-[0.3em] text-current/70">{statusChip}</span>
                    )}
                </div>

                <h4 className="jam-timeline-title text-xl md:text-2xl font-semibold text-current tracking-tight mb-2">{label}</h4>

                {body && (
                    <p className="jam-timeline-body opacity-70 leading-relaxed max-w-2xl mb-4">{body}</p>
                )}

                {onDiscussionClick && (
                    <button
                        onClick={onDiscussionClick}
                        className="group flex items-center gap-2 text-[10px] font-black text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-all"
                    >
                        <div className="w-8 h-8 rounded-full border border-current/10 flex items-center justify-center group-hover:bg-current/5 group-hover:border-current/20 transition-all">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        Signal discussion
                    </button>
                )}
            </div>
        </div>
    );
};

export default TimelineItem;
