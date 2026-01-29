
import React from 'react';
import { JamPublished } from '../lib/jamLocalStore';
import AppView from './AppView';

interface StartJamPreviewOverlayProps {
  open: boolean;
  jam: JamPublished | null;
  onClose: () => void;
  onOpenJam?: (jam: JamPublished) => void;
}

const StartJamPreviewOverlay: React.FC<StartJamPreviewOverlayProps> = ({ open, jam, onClose, onOpenJam }) => {
  if (!open || !jam) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-white/40 backdrop-blur-2xl" />
      
      <div className="relative w-full h-full flex flex-col pt-10 md:pt-20">
        <header className="fixed top-0 left-0 right-0 h-20 px-8 flex items-center justify-between z-50">
           <div className="flex items-center gap-4">
              <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[11px] font-black text-gray-900 uppercase tracking-[0.3em]">Successfully Launched</span>
           </div>
           
           <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                   // Copy Link
                   const url = `${window.location.origin}/jam/${jam.slug}`;
                   navigator.clipboard.writeText(url);
                   alert(\"Link copied to clipboard!\");
                }}
                className=\"px-6 py-2.5 rounded-full border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-all\"
              >
                Copy Public Link
              </button>
              <button 
                onClick={() => onOpenJam?.(jam)}
                className=\"vibe-pill bg-gray-900 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl\"
              >
                Go to Jam
              </button>
              <button 
                onClick={onClose}
                className=\"w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900\"
              >
                <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth=\"2.5\" d=\"M6 18L18 6M6 6l12 12\" /></svg>
              </button>
           </div>
        </header>

        <div className=\"flex-1 overflow-y-auto pb-20 scrollbar-hide\">
          <AppView 
            project={jam as any} 
            onClose={onClose} 
            isLoggedIn={true}
          />
        </div>
      </div>
    </div>
  );
};

export default StartJamPreviewOverlay;
