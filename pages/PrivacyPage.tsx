
import React from 'react';

interface PrivacyPageProps {
  onBack: () => void;
}

const PrivacyPage: React.FC<PrivacyPageProps> = ({ onBack }) => {
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
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-4">Privacy Policy</h1>
          <p className="text-gray-400 font-bold text-[11px] uppercase tracking-widest">Last updated: May 24, 2024</p>
        </header>

        <div className="vj-legal-content space-y-12">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">1. Overview</h2>
            <p className="text-gray-500 leading-relaxed font-medium">
              VibeJam ("we," "our," or "us") respects your privacy. This policy explains how we collect, use, and protect your information when you use our platform. By accessing VibeJam, you agree to the practices described here.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">2. Information We Collect</h2>
            <p className="text-gray-500 leading-relaxed font-medium mb-4">
              We collect information to provide better services to all our users. This includes:
            </p>
            <ul className="list-disc list-inside text-gray-500 font-medium space-y-2 ml-4">
              <li>Account data (name, email, avatar) via Google or GitHub OAuth.</li>
              <li>Content you provide (Jams, comments, profile bio).</li>
              <li>Usage data (clicks, navigation paths, feature engagement).</li>
              <li>Device information (IP address, browser type, operating system).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">3. How We Use Information</h2>
            <p className="text-gray-500 leading-relaxed font-medium">
              We use collected data to maintain the platform, personalize your experience, facilitate community interaction, and analyze usage to improve v12.2 features. We may use your email to send platform updates or community alerts.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">4. Sharing</h2>
            <p className="text-gray-500 leading-relaxed font-medium">
              We do not sell your personal data. We share information only with service providers (like Supabase or Vercel) necessary for operations, or when required by law to protect our rights or the safety of our users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">5. Cookies</h2>
            <p className="text-gray-500 leading-relaxed font-medium">
              We use essential cookies and localStorage to manage your session and preferences. These are necessary for the platform to function. You can manage cookie settings in your browser, though some features may be limited.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">6. Data Retention</h2>
            <p className="text-gray-500 leading-relaxed font-medium">
              We retain your information as long as your account is active. If you delete your account, we will remove your personal data from our active databases, though some metadata may persist in backups for a limited period.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">7. Security</h2>
            <p className="text-gray-500 leading-relaxed font-medium">
              We implement industry-standard security measures (SSL, encrypted databases) to protect your data. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">8. Children's Privacy</h2>
            <p className="text-gray-500 leading-relaxed font-medium">
              VibeJam is intended for creators aged 13 and older. We do not knowingly collect information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">9. International Users</h2>
            <p className="text-gray-500 leading-relaxed font-medium">
              Your data may be processed in the United States or other countries where our service providers operate. By using VibeJam, you consent to this transfer.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">10. Changes</h2>
            <p className="text-gray-500 leading-relaxed font-medium">
              We may update this policy. Significant changes will be announced on the platform or via email. Your continued use after updates constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">11. Contact</h2>
            <p className="text-gray-500 leading-relaxed font-medium">
              Questions about this policy? Reach out to our stewards at <span className="text-gray-900 font-bold">vibejamco@gmail.com</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
