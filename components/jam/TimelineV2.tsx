import React from 'react';
import TimelineItem from './TimelineItem';

interface Milestone {
    date: string;
    label: string;
    body?: string;
    statusChip?: string;
}

interface TimelineV2Props {
    milestones: Milestone[];
    onDiscussionClick?: (milestoneIndex: number) => void;
}

const TimelineV2: React.FC<TimelineV2Props> = ({ milestones, onDiscussionClick }) => {
    if (!milestones || milestones.length === 0) {
        return (
            <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-[32px]">
                <p className="text-gray-300 font-medium italic">The journey is just beginning. No milestones yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-0 ml-4 py-8">
            {milestones.map((m, i) => (
                <TimelineItem
                    key={i}
                    date={m.date}
                    label={m.label}
                    body={m.body}
                    statusChip={m.statusChip || (i === 0 ? "Latest" : "Shipped")}
                    isLast={i === milestones.length - 1}
                    onDiscussionClick={() => onDiscussionClick?.(i)}
                />
            ))}
        </div>
    );
};

export default TimelineV2;
