
import React, { useEffect } from 'react';
import { BookmarkItem, useBookmarks } from '../lib/useBookmarks';

interface BookmarksPanelProps {
  onClose: () => void;
  onSelectJam: (jamId: string) => void;
  onDiscover: () => void;
}

const BookmarksPanel: React.FC<BookmarksPanelProps> = ({ onClose, onSelectJam, onDiscover }) => {
  const { bookmarks, removeBookmark, count } = useBookmarks();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[600] flex justify-end animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/5 backdrop-blur-[2px]" onClick={onClose} />
      
      <div className="relative w-full max-w-[440px] h-full bg-white shadow-[-24px_0_80px_rgba(0,0,0,0.08)] flex flex-col animate-in slide-in-from-right duration-500 ease-out">
        <header className="h-24 px-8 border-b border-gray-50 flex items-center justify-between shrink-0">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Bookmarks</h2>
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{count} Saved Jams</span>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors hover:bg-gray-50">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
          {bookmarks.length > 0 ? (
            bookmarks.map((jam) => (
              <div 
                key={jam.id}
                className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100"
              >
                <div 
                  className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 cursor-pointer"
                  onClick={() => onSelectJam(jam.id)}
                >
                  <img src={jam.screenshot} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={jam.name} />
                </div>
                
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelectJam(jam.id)}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-500 transition-colors">{jam.name}</h3>
                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest px-1.5 py-0.5 bg-gray-100/50 rounded-md">{jam.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <img src={jam.creator.avatar} className="w-4 h-4 rounded-full border border-white shadow-sm" alt="" />
                    <span className="text-[10px] font-medium text-gray-400 truncate">{jam.creator.handle}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-[11px] font-black text-green-500">{jam.mrr}</span>
                  <button 
                    onClick={() => removeBookmark(jam.id)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Remove bookmark"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-200 mb-6">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">No bookmarks yet.</h3>
              <p className="text-xs font-medium text-gray-400 max-w-[200px] leading-relaxed mb-8">Save a Jam to find it here later.</p>
              <button 
                onClick={onDiscover}
                className="px-6 py-2.5 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
              >
                Discover Jams
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookmarksPanel;
