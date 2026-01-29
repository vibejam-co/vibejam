
import React from 'react';

const TermsPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className=\"min-h-screen bg-white pt-48 pb-20 px-6\">
      <div className=\"max-w-3xl mx-auto\">
        <button onClick={onBack} className=\"mb-12 text-gray-400 hover:text-gray-900 transition-colors flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest\">
          <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth=\"2.5\" d=\"M15 19l-7-7 7-7\" /></svg>
          Back to Home
        </button>
        
        <h1 className=\"text-5xl font-black text-gray-900 tracking-tighter mb-8\">Terms of Service.</h1>
        <p className=\"text-[10px] font-black text-gray-300 uppercase tracking-[.3em] mb-16\">Last Updated: Jan 24, 2026</p>

        <div className=\"prose prose-gray prose-lg max-w-none\">
          <section className=\"mb-16\">
            <h2 className=\"text-2xl font-bold text-gray-900 mb-6\">1. Acceptance of Terms</h2>
            <p className=\"text-gray-500 leading-relaxed font-medium\">
              By accessing VibeJam, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.
            </p>
          </section>

          <section className=\"mb-16\">
            <h2 className=\"text-2xl font-bold text-gray-900 mb-6\">2. Use License</h2>
            <p className=\"text-gray-500 leading-relaxed font-medium\">
              VibeJam is a curated platform. Permission is granted to temporarily view the content for personal, non-commercial transitory viewing only. You may not scrape data from this site for commercial purposes without explicit written consent.
            </p>
          </section>

          <section className=\"mb-16\">
            <h2 className=\"text-2xl font-bold text-gray-900 mb-6\">3. Revenue Verification</h2>
            <p className=\"text-gray-500 leading-relaxed font-medium\">
              Creators who opt-in to public revenue metrics agree that they may be subject to manual verification. Falsifying metrics is grounds for immediate and permanent account termination.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
