
import React from 'react';

interface GuidelinesPageProps {
  onStartJam: () => void;
  onBrowseJams: () => void;
}

const RuleCard: React.FC<{ title: string, desc: string }> = ({ title, desc }) => (
  <div className="premium-card rounded-[32px] p-8 border border-gray-50 bg-[#F9F9FB]/40">
    <h3 className="text-lg font-bold text-gray-900 mb-2 tracking-tight">{title}</h3>
    <p className="text-sm text-gray-500 font-medium leading-relaxed">{desc}</p>
  </div>
);

const ListSection: React.FC<{ title: string, items: string[], type: 'allowed' | 'not-allowed' }> = ({ title, items, type }) => (
  <div className="space-y-6">
    <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] ${type === 'allowed' ? 'text-green-500' : 'text-red-500'}`}>
      {title}
    </h3>
    <ul className="space-y-4">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${type === 'allowed' ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-gray-600 font-medium leading-tight">{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

const ChecklistItem: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-4 py-4 border-b border-gray-50 last:border-0 group cursor-default">
    <div className="w-6 h-6 rounded-lg border-2 border-gray-100 flex items-center justify-center transition-colors group-hover:border-blue-200">
      <svg className="w-3.5 h-3.5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <span className="text-gray-700 font-bold text-sm tracking-tight">{label}</span>
  </div>
);

const GuidelinesPage: React.FC<GuidelinesPageProps> = ({ onStartJam, onBrowseJams }) => {
  return (
    <div className="min-h-screen bg-white animate-in fade-in duration-700">
      {/* Hero Section */}
      <section className="pt-48 pb-32 border-b border-gray-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {["Community-first", "No spam", "Quality over noise"].map(tag => (
              <span key={tag} className="px-4 py-1.5 rounded-full bg-gray-50 text-gray-400 text-[9px] font-black uppercase tracking-widest border border-gray-100/50">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-5xl md:text-8xl font-black text-gray-900 tracking-tighter leading-[1] mb-10 max-w-4xl mx-auto">
            Build in public <br/> <span className="text-blue-500">with respect.</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-16 leading-relaxed font-medium">
            Guidelines to keep VibeJam a high-signal sanctuary for creators, founders, and creative engineers.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <button 
              onClick={onStartJam}
              className="vibe-pill text-white text-[11px] font-black uppercase tracking-[0.2em] py-5 px-12 rounded-full shadow-2xl shadow-blue-500/20 active:scale-95 transition-all bg-blue-500"
            >
              Submit an App
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

      {/* The Golden Rules */}
      <section className="py-32 bg-[#fafafa]/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">The Golden Rules</h2>
            <p className="text-gray-400 font-medium text-lg mt-2">The core ethos of our community.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <RuleCard title="Be real" desc="No fake numbers or inflated stats. Transparency builds long-term trust." />
            <RuleCard title="Ship updates, not hype" desc="Focus on tangible progress and product value over marketing buzz." />
            <RuleCard title="Respect creators" desc="Constructive feedback is welcome; harassment or toxicity is not." />
            <RuleCard title="No spam" desc="Quality over quantity. Avoid growth hacks or link-dumping." />
            <RuleCard title="Credit others" desc="Always attribute the tools, collaborators, and inspiration behind your Jam." />
            <RuleCard title="Keep it safe" desc="Ensure your content is lawful and safe for our global community." />
          </div>
        </div>
      </section>

      {/* Content Lists */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 md:gap-40">
            <ListSection 
              title="What you can post" 
              type="allowed"
              items={[
                "Real software products and SaaS apps",
                "Working demos and interactive prototypes",
                "Open-source libraries and templates",
                "Meaningful learning projects (if shipped)",
                "Transparent revenue and growth stories"
              ]} 
            />
            <ListSection 
              title="What we remove" 
              type="not-allowed"
              items={[
                "Impersonation or scammy claims",
                "Affiliate link farms and low-effort dumps",
                "Plagiarized projects and stolen UI",
                "Hate speech, harassment, or bullying",
                "Deceptive downloads or malware",
                "Adult or illegal content"
              ]} 
            />
          </div>
        </div>
      </section>

      {/* Quality Checklist */}
      <section className="py-32 bg-gray-50/30">
        <div className="max-w-3xl mx-auto px-6">
          <div className="premium-card rounded-[40px] p-10 md:p-16 border-gray-100 shadow-sm">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-4">Quality Checklist</h2>
            <p className="text-gray-400 font-medium mb-12">Ensure your Jam is ready for the front page.</p>
            
            <div className="flex flex-col">
              <ChecklistItem label="Clear, punchy one-liner description" />
              <ChecklistItem label="High-quality real screenshots or video" />
              <ChecklistItem label="Category accurately reflects the product" />
              <ChecklistItem label="Vibe tools and tech stack are tagged" />
              <ChecklistItem label="Honest revenue range selected" />
              <ChecklistItem label="One meaningful launch note or update" />
            </div>
          </div>
        </div>
      </section>

      {/* Moderation */}
      <section className="py-32">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-[11px] font-black text-gray-300 uppercase tracking-[0.4em] mb-10 text-center">Moderation & Reporting</h2>
          <div className="space-y-8">
            <div className="flex items-start gap-6">
              <span className="text-xl">🛡️</span>
              <p className="text-gray-500 font-medium leading-relaxed">We prioritize community safety and quality curation. Jams that violate guidelines may be unlisted or removed.</p>
            </div>
            <div className="flex items-start gap-6">
              <span className="text-xl">🚫</span>
              <p className="text-gray-500 font-medium leading-relaxed">Repeated spam or malicious behavior will lead to permanent account restrictions.</p>
            </div>
            <div className="flex items-start gap-6">
              <span className="text-xl">📬</span>
              <p className="text-gray-500 font-medium leading-relaxed">See something that doesn't fit? Report issues via email at <span className="text-gray-900 font-bold">vibejamco@gmail.com</span>.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="premium-card rounded-[60px] p-20 text-center bg-gray-900 relative overflow-hidden">
             <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle at 70% 80%, #3b82f6 0%, transparent 50%)' }} />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-10 leading-tight">
                Ready to ship <br/> something real?
              </h2>
              <button 
                onClick={onStartJam}
                className="vibe-pill text-white text-[11px] font-black uppercase tracking-[0.2em] py-5 px-12 rounded-full shadow-2xl shadow-blue-500/40 active:scale-95 transition-all bg-blue-500"
              >
                Start Your Jam
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GuidelinesPage;
