
import React from 'react';

interface TermsPageProps {
  onBack: () => void;
}

const TermsPage: React.FC<TermsPageProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-white pt-48 pb-32 animate-in fade-in duration-500">
      <div className="max-w-3xl mx-auto px-6">
        <button onClick={onBack} className="mb-12 flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-all group">
          <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg></div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return Home</span>
        </button>
        <header className="mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-4">Terms of Service</h1>
          <p className="text-gray-400 font-bold text-[11px] uppercase tracking-widest">Last updated: May 24, 2024</p>
        </header>
        <div className="space-y-12 text-gray-500 leading-relaxed font-medium">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">1. Agreement to Terms</h2>
            <p>By accessing VibeJam, you agree to be bound by these Terms. If you do not agree, you may not use the platform.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">2. Content Ownership</h2>
            <p>You retain ownership of the content you post. However, you grant us a license to display and distribute that content on our platform.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
