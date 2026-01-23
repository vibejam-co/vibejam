
import React from 'react';

interface GuidelinesPageProps {
  onStartJam: () => void;
  onBrowseJams: () => void;
}

const GuidelinesPage: React.FC<GuidelinesPageProps> = ({ onStartJam, onBrowseJams }) => {
  return (
    <div className="min-h-screen bg-white animate-in fade-in duration-700">
      <section className="pt-48 pb-32 border-b border-gray-50 text-center">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-5xl md:text-8xl font-black text-gray-900 tracking-tighter leading-[1] mb-10 max-w-4xl mx-auto">Build in public <br/> <span className="text-blue-500">with respect.</span></h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-16 leading-relaxed font-medium">Guidelines to keep VibeJam a high-signal sanctuary for creators.</p>
          <button onClick={onStartJam} className="vibe-pill text-white text-[11px] font-black uppercase tracking-[0.2em] py-5 px-12 rounded-full shadow-2xl shadow-blue-500/20 active:scale-95 transition-all bg-blue-500">Submit an App</button>
        </div>
      </section>
      <section className="py-32">
        <div className="max-w-3xl mx-auto px-6 space-y-12">
          <h2 className="text-3xl font-bold tracking-tight">The Golden Rules</h2>
          <div className="space-y-8">
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Be real</h3>
              <p className="text-gray-500">No fake numbers or inflated stats. Transparency builds long-term trust.</p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Respect creators</h3>
              <p className="text-gray-500">Constructive feedback is welcome; harassment is not.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GuidelinesPage;
