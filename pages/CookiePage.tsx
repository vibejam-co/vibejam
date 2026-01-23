
import React from 'react';

interface CookiePageProps {
  onBack: () => void;
}

const CookiePage: React.FC<CookiePageProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-white pt-48 pb-32 animate-in fade-in duration-500">
      <div className="max-w-3xl mx-auto px-6">
        <button 
          onClick={onBack} 
          className="mb-12 flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-all group"
        >
          <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/>
            </svg>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return Home</span>
        </button>

        <header className="mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-4">Cookie Policy</h1>
          <p className="text-gray-400 font-bold text-[11px] uppercase tracking-widest">Last updated: May 24, 2024</p>
        </header>

        <div className="vj-legal-content space-y-12">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">1. Use of Cookies</h2>
            <p className="text-gray-500 leading-relaxed font-medium">
              VibeJam uses cookies and similar technologies to provide, protect, and improve our services. This policy explains how and why we use these technologies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">2. What are Cookies?</h2>
            <p className="text-gray-500 leading-relaxed font-medium">
              Cookies are small text files that are stored on your device when you visit a website. They help the website remember your preferences and provide a more personalized experience.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">3. Types of Cookies We Use</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1 uppercase tracking-wider">Essential Cookies</h3>
                <p className="text-gray-500 leading-relaxed font-medium">Necessary for the platform to function, such as authentication and security features.</p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1 uppercase tracking-wider">Preference Cookies</h3>
                <p className="text-gray-500 leading-relaxed font-medium">Used to remember your settings and preferences like theme or language.</p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1 uppercase tracking-wider">Analytics Cookies</h3>
                <p className="text-gray-500 leading-relaxed font-medium">Help us understand how users interact with the platform so we can improve the experience.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">4. Third-Party Cookies</h2>
            <p className="text-gray-500 leading-relaxed font-medium">
              We may use third-party services like Supabase or Vercel that may set their own cookies to enable their services on our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">5. Managing Cookies</h2>
            <p className="text-gray-500 leading-relaxed font-medium">
              Most web browsers allow you to control cookies through their settings. However, disabling certain cookies may impact your ability to use some features of VibeJam.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">6. Local Storage</h2>
            <p className="text-gray-500 leading-relaxed font-medium">
              In addition to cookies, we use browser local storage to save data like your draft Jams and UI state for a smoother, faster experience across sessions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">7. Changes to This Policy</h2>
            <p className="text-gray-500 leading-relaxed font-medium">
              We may update this Cookie Policy from time to time. We will notify you of any changes by posting the new policy on this page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">8. Contact Us</h2>
            <p className="text-gray-500 leading-relaxed font-medium">
              If you have any questions about our use of cookies, please contact us at <span className="text-gray-900 font-bold">vibejamco@gmail.com</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CookiePage;
