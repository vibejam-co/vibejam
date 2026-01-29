
import React from 'react';

const CookiePage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className=\"min-h-screen bg-white pt-48 pb-20 px-6\">
      <div className=\"max-w-3xl mx-auto\">
        <button onClick={onBack} className=\"mb-12 text-gray-400 hover:text-gray-900 transition-colors flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest\">
          <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth=\"2.5\" d=\"M15 19l-7-7 7-7\" /></svg>
          Back to Home
        </button>
        
        <h1 className=\"text-5xl font-black text-gray-900 tracking-tighter mb-8\">Cookie Policy.</h1>
        <p className=\"text-[10px] font-black text-gray-300 uppercase tracking-[.3em] mb-16\">Last Updated: Jan 24, 2026</p>

        <div className=\"prose prose-gray prose-lg max-w-none\">
          <section className=\"mb-16\">
            <h2 className=\"text-2xl font-bold text-gray-900 mb-6\">1. What are cookies?</h2>
            <p className=\"text-gray-500 leading-relaxed font-medium\">
              Cookies are small pieces of text sent by your web browser by a website you visit. A cookie file is stored in your web browser and allows the Service or a third-party to recognize you and make your next visit easier and the Service more useful to you.
            </p>
          </section>

          <section className=\"mb-16\">
            <h2 className=\"text-2xl font-bold text-gray-900 mb-6\">2. How VibeJam uses cookies</h2>
            <p className=\"text-gray-500 leading-relaxed font-medium mb-6\">
              When you use and access the Service, we may place a number of cookies files in your web browser. We use cookies for the following purposes:
            </p>
            <ul className=\"space-y-4 text-gray-500 font-medium\">
              <li className=\"flex gap-4\"><span className=\"font-bold text-gray-900 shrink-0\">Essential Check:</span> Necessary for authentication and secure account features.</li>
              <li className=\"flex gap-4\"><span className=\"font-bold text-gray-900 shrink-0\">Preferences:</span> We remember your dark mode settings and filter selections.</li>
              <li className=\"flex gap-4\"><span className=\"font-bold text-gray-900 shrink-0\">Analytics:</span> We use aggregate data to understand how curators discover jams.</li>
            </ul>
          </section>

          <section className=\"mb-16\">
            <h2 className=\"text-2xl font-bold text-gray-900 mb-6\">3. Your choices</h2>
            <p className=\"text-gray-500 leading-relaxed font-medium\">
              If you'd like to delete cookies or instruct your web browser to delete or refuse cookies, please visit the help pages of your web browser. Please note, however, that if you delete cookies or refuse to accept them, you might not be able to use all of the features we offer.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CookiePage;
