import React, { useState } from 'react';

interface SignalComposerProps {
    jamId: string;
    parentId?: string | null;
    isLoggedIn: boolean;
    onAuthTrigger?: () => void;
    onSuccess: (item: any) => void;
    placeholder?: string;
    minHeight?: string;
    className?: string;
    eventContext?: {
        jamId?: string;
        theme?: string;
        narrative?: string;
        credibility?: string;
        surface?: 'public' | 'in-app' | 'internal' | 'unknown';
    };
}

const SignalComposer: React.FC<SignalComposerProps> = ({
    jamId,
    parentId = null,
    isLoggedIn,
    onAuthTrigger,
    onSuccess,
    placeholder = "Write a signal...",
    minHeight = "100px",
    className = "",
    eventContext
}) => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePost = async () => {
        if (!isLoggedIn) {
            onAuthTrigger?.();
            return;
        }
        if (!content.trim() || loading) return;

        setLoading(true);
        try {
            const { backend } = await import('../../lib/backend');
            const res = await backend.createSignal({ jamId, content: content.trim(), parentId });
            if (res?.ok && res.item) {
                onSuccess(res.item);
                setContent('');
                try {
                    const { emitEventSignal } = await import('../../lib/EventSignals');
                    const storageKey = `vibejam.signal.first.${jamId}`;
                    if (typeof window !== 'undefined' && !window.localStorage.getItem(storageKey)) {
                        window.localStorage.setItem(storageKey, '1');
                        emitEventSignal('first_signal_post', eventContext || { jamId });
                    }
                } catch (eventError) {
                    console.warn('[EventSignals] Failed to emit first_signal_post', eventError);
                }
            }
        } catch (e) {
            console.error('Signal create failed', e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`space-y-3 ${className}`}>
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost();
                }}
                placeholder={isLoggedIn ? placeholder : "Sign in to join the discussion"}
                onClick={() => !isLoggedIn && onAuthTrigger?.()}
                readOnly={!isLoggedIn}
                style={{ minHeight }}
                className="w-full bg-[#F9F9FB] border border-gray-100 rounded-2xl p-4 text-sm focus:bg-white focus:border-blue-200 transition-all outline-none resize-none placeholder:text-gray-400 text-gray-900"
            />
            <div className="flex justify-end">
                <button
                    onClick={handlePost}
                    disabled={!content.trim() || loading}
                    className="px-6 py-2 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest transition-all hover:bg-gray-800 disabled:opacity-20 flex items-center gap-2"
                >
                    {loading && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    {isLoggedIn ? (parentId ? "Reply" : "Post Signal") : "Sign In"}
                </button>
            </div>
        </div>
    );
};

export default SignalComposer;
