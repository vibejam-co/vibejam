import React from 'react';
import TimelineItem from './TimelineItem';
import { JamNarrativeMode } from '../../jam/narrative/JamNarrative';
import { SilenceFramingIntent } from '../../jam/silence/SilenceFraming';
import { ActivityDensityIntent } from '../../jam/density/ActivityDensity';

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
    silenceFraming?: SilenceFramingIntent | null;
    densityIntent?: ActivityDensityIntent | null;
}

const TimelineV2: React.FC<TimelineV2Props> = ({ milestones, onDiscussionClick, silenceFraming, densityIntent }) => {
    const silenceOpacity = silenceFraming?.timelineOpacityBias === 'muted' ? 'opacity-70' : '';
    const silenceSpacing = silenceFraming?.sectionBreathingRoom === 'expanded' ? 'py-10' : 'py-6';
    const densityGap = densityIntent?.verticalGapBias === 'wide'
        ? 'space-y-6'
        : densityIntent?.verticalGapBias === 'tight'
            ? 'space-y-1'
            : 'space-y-3';
    const densityPadding = densityIntent?.groupingStrength === 'strong'
        ? 'py-4'
        : densityIntent?.groupingStrength === 'loose'
            ? 'py-8'
            : 'py-6';

    if (!milestones || milestones.length === 0) {
        return (
            <div className={`jam-timeline-empty px-10 border border-dashed border-gray-200 ${silenceSpacing} ${silenceOpacity}`} aria-hidden="true">
                <div className="jam-timeline-empty-rule mb-6" />
                <div className="jam-timeline-empty-rule mt-6" />
            </div>
        );
    }

    return (
        <div className={`jam-timeline ml-4 ${silenceSpacing} ${silenceOpacity} ${densityGap} ${densityPadding}`}>
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
