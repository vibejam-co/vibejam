import React, { useState, useEffect, useMemo } from 'react';
import { backend } from '../../lib/backend';
import { SEAL_METADATA } from '../Badge';
import SignalComposer from './SignalComposer';

interface Signal {
    id: string;
    user: {
        name: string;
        avatar: string;
        handle: string;
        badge?: string;
    };
    text: string;
    timestamp: string;
    parentId: string | null;
    isCreator?: boolean;
    rawCreatedAt: string;
}

interface SignalsThreadProps {
    jamId: string;
    isLoggedIn: boolean;
    onAuthTrigger?: () => void;
    creatorHandle?: string;
}

const formatTime = (iso?: string) => {
    if (!iso) return 'Just now';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return 'Just now';
    const diffMs = Date.now() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
};

const SignalsThread: React.FC<SignalsThreadProps> = ({
    jamId,
    isLoggedIn,
    onAuthTrigger,
    creatorHandle
}) => {
    const [signals, setSignals] = useState<Signal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);

    const loadSignals = async () => {
        setLoading(true);
        setError(null);
        const res = await backend.listSignals(jamId);
        if (!res.ok) {
            setError('Failed to load discussion.');
            setLoading(false);
            return;
        }

        const mapped: Signal[] = (res.items || []).map((item: any) => {
            const profile = item.profile || {};
            const handle = profile.handle ? `@${profile.handle}` : '@maker';
            const isCreator = creatorHandle && profile.handle === creatorHandle.replace('@', '');
            return {
                id: item.id,
                user: {
                    name: profile.display_name || 'Maker',
                    avatar: profile.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + profile.handle,
                    handle,
                    badge: profile.badges?.[0]?.type
                },
                text: item.content,
                timestamp: formatTime(item.created_at),
                parentId: item.parent_id,
                isCreator,
                rawCreatedAt: item.created_at
            };
        });
        setSignals(mapped);
        setLoading(false);
    };

    useEffect(() => {
        loadSignals();
    }, [jamId]);

    const handleNewSignal = (item: any) => {
        const profile = item.profile || {};
        const handle = profile.handle ? `@${profile.handle}` : '@maker';
        const isCreator = creatorHandle && profile.handle === creatorHandle.replace('@', '');
        const newSignal: Signal = {
            id: item.id,
            user: {
                name: profile.display_name || 'Maker',
                avatar: profile.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + profile.handle,
                handle,
                badge: profile.badges?.[0]?.type
            },
            text: item.content,
            timestamp: formatTime(item.created_at),
            parentId: item.parent_id,
            isCreator,
            rawCreatedAt: item.created_at
        };
        setSignals(prev => [...prev, newSignal]);
        setReplyingTo(null);
    };

    const rootSignals = useMemo(() =>
        signals.filter(s => !s.parentId).sort((a, b) => new Date(a.rawCreatedAt).getTime() - new Date(b.rawCreatedAt).getTime()),
        [signals]
    );

    const getReplies = (pid: string) =>
        signals.filter(s => s.parentId === pid).sort((a, b) => new Date(a.rawCreatedAt).getTime() - new Date(b.rawCreatedAt).getTime());

    const renderSignal = (s: Signal, isReply = false) => {
        const auraColor = s.user.badge ? SEAL_METADATA[s.user.badge as any]?.auraColor : '#EAEAEA';

        return (
            <div key={s.id} className={`flex gap-3 ${isReply ? 'ml-8 mt-6' : 'mt-10 first:mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500'}`}>
                <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-full border border-gray-100 overflow-hidden relative z-10 bg-white">
                        <img src={s.user.avatar} className="w-full h-full object-cover" alt={s.user.name} />
                    </div>
                    {s.isCreator && (
                        <div className="absolute -inset-1 rounded-full opacity-20 blur-[2px]" style={{ background: auraColor }} />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-900">{s.user.name}</span>
                        {s.isCreator && (
                            <span className="px-1.5 py-0.5 rounded-full bg-gray-900 text-[7px] font-black text-white uppercase tracking-wider">Creator</span>
                        )}
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{s.timestamp}</span>
                    </div>

                    <p className="text-gray-600 text-sm leading-relaxed mb-3 break-words">
                        {s.text}
                    </p>

                    {!isReply && (
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setReplyingTo(replyingTo === s.id ? null : s.id)}
                                className="text-[10px] font-black text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-colors"
                            >
                                Reply
                            </button>
                        </div>
                    )}

                    {replyingTo === s.id && (
                        <div className="mt-4">
                            <SignalComposer
                                jamId={jamId}
                                parentId={s.id}
                                isLoggedIn={isLoggedIn}
                                onAuthTrigger={onAuthTrigger}
                                onSuccess={handleNewSignal}
                                placeholder={`Reply to ${s.user.name}...`}
                                minHeight="80px"
                            />
                        </div>
                    )}

                    {!isReply && getReplies(s.id).map(reply => renderSignal(reply, true))}
                </div>
            </div>
        );
    };

    if (loading && signals.length === 0) {
        return (
            <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-6 h-6 border-2 border-gray-100 border-t-gray-400 rounded-full animate-spin mb-4" />
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Loading signals…</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-12 text-center">
                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">{error}</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="pb-12 border-b border-gray-50">
                <SignalComposer
                    jamId={jamId}
                    isLoggedIn={isLoggedIn}
                    onAuthTrigger={onAuthTrigger}
                    onSuccess={handleNewSignal}
                    placeholder="Write a signal..."
                />
            </div>

            <div className="pt-4">
                {rootSignals.length === 0 ? (
                    <div className="py-20 text-center">
                        <p className="text-gray-300 text-sm font-medium italic">No signals yet. Be the first to start the conversation.</p>
                    </div>
                ) : (
                    rootSignals.map(s => renderSignal(s))
                )}
            </div>
        </div>
    );
};

export default SignalsThread;
