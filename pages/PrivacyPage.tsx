
import React from 'react';

const PrivacyPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className=\"min-h-screen bg-white pt-48 pb-20 px-6\">
      <div className=\"max-w-3xl mx-auto\">
        <button onClick={onBack} className=\"mb-12 text-gray-400 hover:text-gray-900 transition-colors flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest\">
          <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth=\"2.5\" d=\"M15 19l-7-7 7-7\" /></svg>
          Back to Home
        </button>
        
        <h1 className=\"text-5xl font-black text-gray-900 tracking-tighter mb-8\">Privacy Policy.</h1>
        <p className=\"text-[10px] font-black text-gray-300 uppercase tracking-[.3em] mb-16\">Last Updated: Jan 24, 2026</p>

        <div className=\"prose prose-gray prose-lg max-w-none\">
          <section className=\"mb-16\">
            <h2 className=\"text-2xl font-bold text-gray-900 mb-6\">1. Introduction</h2>
            <p className=\"text-gray-500 leading-relaxed font-medium\">
              At VibeJam, we treat your data with the same level of care we put into our aesthetics. This Privacy Policy describes how your personal information is collected, used, and shared when you visit or make a purchase from vibejam.co.
            </p>
          </section>

          <section className=\"mb-16\">
            <h2 className=\"text-2xl font-bold text-gray-900 mb-6\">2. Information We Collect</h2>
            <p className=\"text-gray-500 leading-relaxed font-medium\">
              When you visit the site, we automatically collect certain information about your device, including information about your web browser, IP address, and some of the cookies that are installed on your device. Additionally, when you join as a creator, we collect your display name, handle, and website URLs.
            </p>
          </section>

          <section className=\"mb-16\">
            <h2 className=\"text-2xl font-bold text-gray-900 mb-6\">3. How We Use Informtion</h2>
            <p className=\"text-gray-500 leading-relaxed font-medium\">
              We use the information we collect to curate and personalize the Jams shown to you, to communicate with you about your account, and to provide tools like revenue transparency and milestone tracking.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
