import React from 'react';
import TimelineItem from './TimelineItem';
import { JamNarrativeMode } from '../../jam/narrative/JamNarrative';

interface Milestone {
    date: string;
    label: string;
    body?: string;
    statusChip?: string;
}

interface TimelineV2Props {
    milestones: Milestone[];
    onDiscussionClick?: (milestoneIndex: number) => void;
    narrativeMode?: JamNarrativeMode;
}

const TimelineV2: React.FC<TimelineV2Props> = ({ milestones, onDiscussionClick }) => {
    if (!milestones || milestones.length === 0) {
        return (
            <div className="jam-timeline-empty py-16 px-10 text-left border border-dashed border-gray-200">
                <div className="jam-timeline-empty-rule mb-6" />
                <p className="jam-timeline-empty-title text-sm uppercase tracking-[0.32em] text-gray-400">No milestones yet</p>
                <p className="jam-timeline-empty-body mt-4 text-base text-gray-500">
                    Silence is the current state. Evidence will accumulate here.
                </p>
                <div className="jam-timeline-empty-rule mt-8" />
            </div>
        );
    }

    return (
        <div className="jam-timeline space-y-2 ml-4 py-6">
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
