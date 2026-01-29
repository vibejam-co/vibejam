
import React, { useEffect, useState } from 'react';
import { JamPublished } from '../lib/jamLocalStore';
import Badge, { SEAL_METADATA } from './Badge';

interface StartJamPreviewOverlayProps {
  open: boolean;
  jam: JamPublished | null;
  onClose: () => void;
  onOpenJam?: (jam: JamPublished) => void;
}

const StartJamPreviewOverlay: React.FC<StartJamPreviewOverlayProps> = ({ open, jam, onClose, onOpenJam }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open]);

  if (!open || !jam) return null;

  const handleCopyLink = () => {
    const link = `${window.location.origin}/jam/${jam.slug}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const auraColor = jam.creator.badges?.[0]?.type
    ? SEAL_METADATA[jam.creator.badges[0].type].auraColor
    : '#EAEAEA';

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-white animate-in fade-in duration-300">
      {/* Top Bar */}
      <nav className="h-20 border-b border-gray-50 flex items-center justify-between px-6 md:px-12 bg-white/80 backdrop-blur-xl shrink-0">
        <button onClick={onClose} className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
          <span className="text-[11px] font-black uppercase tracking-widest hidden sm:inline">Back to Editor</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-full bg-green-50 text-green-600 text-[9px] font-black uppercase tracking-widest border border-green-100/50">Published</span>
          <h2 className="text-sm font-bold text-gray-900 truncate max-w-[120px] md:max-w-xs">{jam.name}</h2>
        </div>

        <div className="flex items-center gap-3">
          {onOpenJam && (
            <button
              onClick={() => { onOpenJam(jam); onClose(); }}
              className="px-5 py-2.5 rounded-xl bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
            >
              View Live Page
            </button>
          )}
          <button
            onClick={handleCopyLink}
            className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-900 text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center gap-2"
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </nav>

      {/* Scrollable Preview Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50/30">
        <div className="max-w-5xl mx-auto py-12 px-6">
          <div className="bg-white rounded-[48px] border border-gray-100 shadow-xl overflow-hidden">
            {/* Replicating AppView Logic */}
            <div className="p-8 md:p-16">
              <header className="mb-12">
                <div className="flex items-center gap-4 mb-4">
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-500 text-[10px] font-black uppercase tracking-widest">{jam.category}</span>
                  <span className="px-2 py-0.5 rounded bg-gray-900 text-[8px] font-black text-white uppercase tracking-widest">Live Now</span>
                </div>
                <h1 className="text-4xl md:text-7xl font-black text-gray-900 tracking-tighter leading-none mb-6">{jam.name}</h1>
                <p className="text-xl md:text-2xl text-gray-400 font-medium leading-relaxed max-w-2xl">{jam.description}</p>
              </header>

              <div className="aspect-video rounded-[40px] overflow-hidden bg-gray-100 border border-gray-100 mb-16 shadow-inner">
                <img src={jam.screenshot} className="w-full h-full object-cover" alt="Preview" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
                {[
                  { label: 'Revenue', value: jam.stats.revenue, color: 'text-green-500' },
                  { label: 'Status', value: 'Public', color: 'text-blue-500' },
                  { label: 'Role', value: jam.creator.type, color: 'text-purple-500' },
                  { label: 'Tools', value: jam.vibeTools.length, color: 'text-gray-900' }
                ].map(s => (
                  <div key={s.label} className="p-6 rounded-[32px] border border-gray-50 bg-gray-50/50">
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">{s.label}</p>
                    <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8 pt-12 border-t border-gray-50">
                <div className="flex items-center gap-4">
                  <div className="avatar-shell w-14 h-14">
                    <div className="vj-aura" style={{ background: auraColor }} />
                    <img src={jam.creator.avatar} className="relative z-10 w-full h-full rounded-full border border-white" alt={jam.creator.name} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{jam.creator.name}</p>
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{jam.creator.handle}</p>
                  </div>
                </div>
                <button className="w-full md:w-auto px-12 py-4 rounded-2xl bg-gray-900 text-white text-[11px] font-black uppercase tracking-widest">Follow Creator</button>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <button onClick={onClose} className="text-[11px] font-black text-gray-300 uppercase tracking-widest hover:text-gray-900 transition-colors">
              Return to editor and finish up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartJamPreviewOverlay;
