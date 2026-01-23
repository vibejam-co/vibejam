
import React from 'react';

interface CreatorToolsPageProps {
  onStartJam: () => void;
  onBrowseJams: () => void;
}

const ToolCard: React.FC<{ icon: string, title: string, desc: string, tags: string[] }> = ({ icon, title, desc, tags }) => (
  <div className="premium-card rounded-[40px] p-10 hover:shadow-xl hover:shadow-blue-500/5 transition-all group">
    <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 mb-8 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
      {icon}
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">{title}</h3>
    <p className="text-gray-500 font-medium leading-relaxed mb-8">{desc}</p>
    <div className="flex flex-wrap gap-2">
      {tags.map(tag => (
        <span key={tag} className="px-3 py-1 rounded-full bg-blue-50/50 text-blue-500 text-[9px] font-black uppercase tracking-widest border border-blue-100/50">
          {tag}
        </span>
      ))}
    </div>
  </div>
);

const StepItem: React.FC<{ num: string, title: string, desc: string }> = ({ num, title, desc }) => (
  <div className="flex flex-col gap-6">
    <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">{num}</span>
    <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h3>
    <p className="text-gray-500 font-medium leading-relaxed">{desc}</p>
  </div>
);

const FAQItem: React.FC<{ q: string, a: string }> = ({ q, a }) => (
  <div className="py-8 border-b border-gray-100">
    <h4 className="text-lg font-bold text-gray-900 mb-3 tracking-tight">{q}</h4>
    <p className="text-gray-500 font-medium leading-relaxed">{a}</p>
  </div>
);

const CreatorToolsPage: React.FC<CreatorToolsPageProps> = ({ onStartJam, onBrowseJams }) => {
  return (
    <div className="min-h-screen bg-white animate-in fade-in duration-700">
      {/* Hero Section */}
      <section className="pt-48 pb-32 border-b border-gray-50 bg-[#fafafa]/30">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <span className="inline-block px-5 py-2 rounded-full bg-blue-50 text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] mb-8 border border-blue-100/50">
            For Builders & Founders
          </span>
          <h1 className="text-5xl md:text-8xl font-black text-gray-900 tracking-tighter leading-[1] mb-10 max-w-4xl mx-auto">
            Everything you need to <span className="text-blue-500">launch</span> and grow.
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-16 leading-relaxed font-medium">
            Launch, iterate, and build resonance with a community that values high-signal creative engineering.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <button 
              onClick={onStartJam}
              className="vibe-pill text-white text-[11px] font-black uppercase tracking-[0.2em] py-5 px-12 rounded-full shadow-2xl shadow-blue-500/20 active:scale-95 transition-all bg-blue-500"
            >
              Start Your Jam
            </button>
            <button 
              onClick={onBrowseJams}
              className="text-gray-400 text-[11px] font-black uppercase tracking-[0.2em] hover:text-gray-900 transition-colors font-bold px-12 py-5"
            >
              Browse Jams →
            </button>
          </div>
        </div>
      </section>

      {/* Tool Grid */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">The Core Toolkit</h2>
            <p className="text-gray-400 font-medium text-lg mt-2">Precision instruments for modern public building.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <ToolCard 
              icon="🚀" 
              title="Launch Wizard" 
              desc="Draft your project in seconds using our URL-scraping engine or manual editor." 
              tags={["Fast Setup", "Social-Ready"]} 
            />
            <ToolCard 
              icon="🖼️" 
              title="Media Gallery" 
              desc="High-fidelity screenshot and video support to showcase your UI in its best light." 
              tags={["4K Optimized", "Premium View"]} 
            />
            <ToolCard 
              icon="📡" 
              title="Revenue Signals" 
              desc="Share verified MRR and growth metrics to build trust with high-intent curators." 
              tags={["Transparency", "Growth"]} 
            />
            <ToolCard 
              icon="👤" 
              title="Creator Profile" 
              desc="A permanent home for your shipping history, prestige badges, and audience." 
              tags={["Network", "Prestige"]} 
            />
            <ToolCard 
              icon="🔖" 
              title="Bookmarks" 
              desc="Save inspiration and track competitor moves in your private curator vault." 
              tags={["Research", "Curation"]} 
            />
            <ToolCard 
              icon="📈" 
              title="Pulse Analytics" 
              desc="Real-time feedback on upvotes, comments, and conversion resonance." 
              tags={["Feedback", "Beta Access"]} 
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-32 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
            <StepItem 
              num="STEP 01" 
              title="Draft" 
              desc="Paste your landing page URL. We’ll automatically extract your stack, vibe, and branding." 
            />
            <StepItem 
              num="STEP 02" 
              title="Signals" 
              desc="Add your growth metrics, tech stack details, and your journey’s key milestones." 
            />
            <StepItem 
              num="STEP 03" 
              title="Publish" 
              desc="Launch to the front page and start collecting high-quality signals from real builders." 
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-32">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-12">FAQ</h2>
          <div className="flex flex-col">
            <FAQItem 
              q="Is it free to launch?" 
              a="Yes. VibeJam is currently free for all creators to launch their first 3 Jams. Premium tier for unlimited launches coming in v13." 
            />
            <FAQItem 
              q="Do I need revenue to post?" 
              a="Absolutely not. We love pre-revenue Jams. Focus on the craft and the vibe—the numbers can follow later." 
            />
            <FAQItem 
              q="Can I edit my Jam after publishing?" 
              a="Yes, you can update your one-liner, screenshots, and stack at any time from your Creator Studio." 
            />
            <FAQItem 
              q="What counts as a 'tool'?" 
              a="Any software product built in public—from SaaS and DevTools to creative utilities and AI agents." 
            />
            <FAQItem 
              q="How do bookmarks work?" 
              a="Bookmarks are private to you. They help you build a collection of inspiration and track products you care about." 
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="premium-card rounded-[60px] p-20 text-center bg-gray-900 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle at 30% 20%, #3b82f6 0%, transparent 60%)' }} />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-10 leading-tight">
                Ready to show the world <br/> what you’re building?
              </h2>
              <button 
                onClick={onStartJam}
                className="vibe-pill text-white text-[11px] font-black uppercase tracking-[0.2em] py-5 px-12 rounded-full shadow-2xl shadow-blue-500/40 active:scale-95 transition-all bg-blue-500"
              >
                Start Your Jam Now
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CreatorToolsPage;
