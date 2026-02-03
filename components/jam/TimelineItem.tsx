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
        <div className={`relative pl-12 pb-16 ${isLast ? 'pb-0' : ''}`}>
            {/* Line */}
            {!isLast && (
                <div className="absolute left-[5.5px] top-4 bottom-0 w-[1.5px] border-l-[1.5px] border-dashed border-current/10" />
            )}

            {/* Dot */}
            <div className="absolute left-0 top-[6px] w-3 h-3 rounded-full bg-white border-2 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] z-10" />

            <div className="animate-in fade-in slide-in-from-left-4 duration-700">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                    {date && (
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{date}</span>
                    )}
                    {statusChip && (
                        <span className="px-2 py-0.5 rounded bg-gray-900 text-[8px] font-black text-white uppercase tracking-wider">{statusChip}</span>
                    )}
                </div>

                <h4 className="text-2xl font-black text-current tracking-tight mb-3">{label}</h4>

                {body && (
                    <p className="opacity-60 leading-relaxed max-w-2xl mb-6">{body}</p>
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
