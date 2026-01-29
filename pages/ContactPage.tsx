
import React from 'react';

const ContactPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className=\"min-h-screen bg-white pt-48 pb-20 px-6\">
      <div className=\"max-w-3xl mx-auto\">
        <button onClick={onBack} className=\"mb-12 text-gray-400 hover:text-gray-900 transition-colors flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest\">
          <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth=\"2.5\" d=\"M15 19l-7-7 7-7\" /></svg>
          Back to Home
        </button>
        
        <h1 className=\"text-5xl font-black text-gray-900 tracking-tighter mb-8\">Get in touch.</h1>
        <p className=\"text-xl text-gray-400 font-medium leading-relaxed mb-16\">
          Whether you're a founder, a curator, or just vibe with what we're building — we'd love to hear from you.
        </p>

        <div className=\"grid grid-cols-1 md:grid-cols-2 gap-12\">
          <div>
            <h3 className=\"text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-6\">General</h3>
            <a href=\"mailto:hello@vibejam.co\" className=\"text-2xl font-bold text-gray-900 hover:text-blue-500 transition-colors\">hello@vibejam.co</a>
          </div>
          <div>
            <h3 className=\"text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-6\">Partnerships</h3>
            <a href=\"mailto:partners@vibejam.co\" className=\"text-2xl font-bold text-gray-900 hover:text-blue-500 transition-colors\">partners@vibejam.co</a>
          </div>
          <div>
            <h3 className=\"text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-6\">Twitter</h3>
            <a href=\"https://x.com/vibejam_co\" target=\"_blank\" rel=\"noopener noreferrer\" className=\"text-2xl font-bold text-gray-900 hover:text-blue-500 transition-colors\">@vibejam_co</a>
          </div>
        </div>

        <div className=\"mt-24 p-12 rounded-[40px] bg-gray-50 border border-gray-100\">
          <h3 className=\"text-xl font-bold text-gray-900 mb-4\">Support</h3>
          <p className=\"text-gray-500 font-medium mb-8 leading-relaxed\">
            Need help with your account or listing? Our team is available 9am-5pm EST.
          </p>
          <button className=\"px-8 py-4 rounded-2xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-gray-900/10\">
            Chat with Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
