
import React, { useState } from 'react';

interface ContactPageProps {
  onBack: () => void;
}

const ContactPage: React.FC<ContactPageProps> = ({ onBack }) => {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`VibeJam — Contact from ${name}`);
    const body = encodeURIComponent(message);
    window.location.href = `mailto:vibejamco@gmail.com?subject=${subject}&body=${body}`;
  };

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
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return</span>
        </button>

        <header className="mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-4 text-center">Contact</h1>
          <p className="text-gray-400 font-medium text-lg text-center max-w-md mx-auto leading-relaxed">
            For partnerships, support, or press—reach us anytime.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-12">
          <section className="text-center">
            <h2 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mb-6">Direct Channels</h2>
            <a 
              href="mailto:vibejamco@gmail.com" 
              className="text-2xl font-bold text-gray-900 hover:text-blue-500 transition-colors underline decoration-blue-500/30 underline-offset-8"
            >
              vibejamco@gmail.com
            </a>
          </section>

          <div className="h-px bg-gray-50" />

          <section>
            <h2 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mb-8 text-center">Send a message</h2>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Name</label>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name" 
                    className="w-full h-14 px-6 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-blue-100 outline-none font-medium transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                  <input 
                    type="email" 
                    required
                    placeholder="your@email.com" 
                    className="w-full h-14 px-6 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-blue-100 outline-none font-medium transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Message</label>
                <textarea 
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what's on your mind..." 
                  className="w-full h-40 p-6 rounded-3xl bg-gray-50 border border-transparent focus:bg-white focus:border-blue-100 outline-none font-medium transition-all resize-none"
                />
              </div>
              <div className="flex justify-center pt-4">
                <button 
                  type="submit"
                  className="vibe-pill text-white text-[11px] font-black uppercase tracking-[0.2em] py-5 px-16 rounded-full shadow-2xl shadow-blue-500/20 active:scale-95 transition-all bg-gray-900"
                >
                  Send via Email
                </button>
              </div>
            </form>
          </section>
        </div>

        <div className="mt-24 pt-12 border-t border-gray-50 text-center">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">Stewardship</p>
          <p className="mt-4 text-xs text-gray-400 leading-relaxed max-w-sm mx-auto">
            Our team reviews all inquiries within 48 hours. Thank you for building in public.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
