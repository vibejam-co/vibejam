
import React from 'react';

interface CreatorToolsPageProps {
  onStartJam: () => void;
  onBrowseJams: () => void;
}

const ToolCard: React.FC<{ icon: string, title: string, desc: string, tags: string[] }> = ({ icon, title, desc, tags }) => (
  <div className="premium-card rounded-[40px] p-10 hover:shadow-xl hover:shadow-blue-500/5 transition-all group">
    <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 mb-8 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">{icon}</div>
    <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">{title}</h3>
    <p className="text-gray-500 font-medium leading-relaxed mb-8">{desc}</p>
    <div className="flex flex-wrap gap-2">
      {tags.map(tag => (
        <span key={tag} className="px-3 py-1 rounded-full bg-blue-50/50 text-blue-500 text-[9px] font-black uppercase tracking-widest border border-blue-100/50">{tag}</span>
      ))}
    </div>
  </div>
);

const CreatorToolsPage: React.FC<CreatorToolsPageProps> = ({ onStartJam, onBrowseJams }) => {
  return (
    <div className="min-h-screen bg-white animate-in fade-in duration-700">
      <section className="pt-48 pb-32 border-b border-gray-50 bg-[#fafafa]/30 text-center">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-5xl md:text-8xl font-black text-gray-900 tracking-tighter leading-[1] mb-10 max-w-4xl mx-auto">Everything you need to <span className="text-blue-500">launch</span> and grow.</h1>
          <button onClick={onStartJam} className="vibe-pill text-white text-[11px] font-black uppercase tracking-[0.2em] py-5 px-12 rounded-full shadow-2xl shadow-blue-500/20 active:scale-95 transition-all bg-blue-500">Start Your Jam</button>
        </div>
      </section>
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <ToolCard icon="🚀" title="Launch Wizard" desc="Draft your project in seconds using our URL-scraping engine." tags={["Fast Setup", "Social-Ready"]} />
            <ToolCard icon="📡" title="Revenue Signals" desc="Share verified MRR and growth metrics." tags={["Transparency", "Growth"]} />
            <ToolCard icon="📈" title="Pulse Analytics" desc="Real-time feedback on upvotes and comments." tags={["Feedback", "Beta Access"]} />
          </div>
        </div>
      </section>
    </div>
  );
};

export default CreatorToolsPage;
