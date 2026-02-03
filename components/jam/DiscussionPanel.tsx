import React, { useEffect, useState } from 'react';
import SignalsThread from '../signals/SignalsThread';
import { useMediaQuery } from '../../lib/useMediaQuery';

interface DiscussionPanelProps {
    isOpen: boolean;
    onClose: () => void;
    jamId: string;
    isLoggedIn: boolean;
    onAuthTrigger?: () => void;
    creatorHandle?: string;
}

const DiscussionPanel: React.FC<DiscussionPanelProps> = ({
    isOpen,
    onClose,
    jamId,
    isLoggedIn,
    onAuthTrigger,
    creatorHandle
}) => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setMounted(false), 300);
            document.body.style.overflow = '';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!mounted && !isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex justify-end items-end md:items-stretch pointer-events-none">
            {/* Backdrop */}
            <div
                onClick={onClose}
                className={`absolute inset-0 bg-black/10 backdrop-blur-[2px] transition-opacity duration-300 pointer-events-auto ${isOpen ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Panel */}
            <div
                className={`
          relative w-full md:w-[480px] bg-white shadow-2xl flex flex-col pointer-events-auto
          transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1)
          ${isMobile
                        ? `h-[85vh] rounded-t-[32px] ${isOpen ? 'translate-y-0' : 'translate-y-full'}`
                        : `h-full border-l border-gray-100 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`
                    }
        `}
            >
                <div className="flex items-center justify-between px-6 py-6 border-b border-gray-50 shrink-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Discussion</h3>
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[9px] font-black text-blue-500 uppercase tracking-widest">Live</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all active:scale-90"
                        aria-label="Close discussion"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    <SignalsThread
                        jamId={jamId}
                        isLoggedIn={isLoggedIn}
                        onAuthTrigger={onAuthTrigger}
                        creatorHandle={creatorHandle}
                    />
                </div>
            </div>
        </div>
    );
};

export default DiscussionPanel;
