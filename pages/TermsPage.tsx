
import React from 'react';

interface TermsPageProps {
  onBack: () => void;
}

const TermsPage: React.FC<TermsPageProps> = ({ onBack }) => {
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
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-4">Terms of Service</h1>
          <p className="text-gray-400 font-bold text-[11px] uppercase tracking-widest">Last updated: May 24, 2024</p>
        </header>

        <div className="vj-legal-content space-y-12">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">1. Agreement to Terms</h2>
            <p className="text-gray-500 leading-relaxed font-medium">
              By accessing or using VibeJam, you agree to be bound by these Terms of Service. If you do not agree, you may not use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">2. User Accounts</h2>
            <p className="text-gray-500 leading-relaxed font-medium">
              You are responsible for maintaining the confidentiality of your account credentials. You must be at least 13 years old to use this service. You agree to provide accurate information and keep it up to date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">3. Content Ownership</h2>
            <p className="text-gray-500 leading-relaxed font-medium">
              You retain ownership of the "Jams" and comments you post. However, by posting content to VibeJam, you grant us a worldwide, non-exclusive license to use, display, and distribute that content on our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">4. Prohibited Conduct</h2>
            <p className="text-gray-500 leading-relaxed font-medium">
              You agree not to use the platform for any illegal activities, harassment, spam, or to infringe upon the intellectual property rights of others. We reserve the right to remove any content that violates these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">5. Termination</h2>
            <p className="text-gray-500 leading-relaxed font-medium">
              We reserve the right to suspend or terminate your account at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users or the VibeJam community.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">6. Disclaimer of Warranties</h2>
            <p className="text-gray-500 leading-relaxed font-medium">
              VibeJam is provided "as is" and "as available" without any warranties of any kind. We do not guarantee that the platform will be uninterrupted or error-free.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">7. Limitation of Liability</h2>
            <p className="text-gray-500 leading-relaxed font-medium">
              In no event shall VibeJam be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">8. Governing Law</h2>
            <p className="text-gray-500 leading-relaxed font-medium">
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which VibeJam operates, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">9. Contact Us</h2>
            <p className="text-gray-500 leading-relaxed font-medium">
              If you have any questions about these Terms, please contact us at <span className="text-gray-900 font-bold">vibejamco@gmail.com</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
