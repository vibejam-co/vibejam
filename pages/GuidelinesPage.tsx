
import React from 'react';

const GuidelinesPage: React.FC<{ onStartJam: () => void; onBrowseJams: () => void }> = ({ onStartJam, onBrowseJams }) => {
  const rules = [
    {
       title: 'Quality over Quantity',
       desc: 'We prioritize Jams with high attention to detail, unique aesthetics, and meaningful utility. Generic templates and spam will be unlisted.',
       icon: '💎'
    },
    {
       title: 'Build in Public',
       desc: 'Transparency is our core. Public revenue metrics and milestone updates gain significantly more reach in the feed.',
       icon: '📡'
    },
    {
       title: 'Community Respect',
       desc: 'Trolling, hate speech, or malicious signals toward other makers will result in permanent aura revocation.',
       icon: '🤝'
    }
  ];

  return (
    <div className=\"min-h-screen bg-white pt-48 pb-20 px-6\">
      <div className=\"max-w-5xl mx-auto\">
        <header className=\"mb-24\">
          <h1 className=\"text-5xl font-black text-gray-900 tracking-tighter mb-8\">The Vibe Code.</h1>
          <p className=\"text-xl text-gray-400 font-medium leading-relaxed\">
            VibeJam is a curated ecosystem. We uphold these standards to ensure the highest signal-to-noise ratio for both makers and curators.
          </p>
        </header>

        <div className=\"space-y-16\">
           {rules.map((rule, i) => (
             <div key={i} className=\"flex flex-col md:flex-row gap-8 md:gap-16 items-start\">
                <div className=\"w-16 h-16 rounded-[22px] bg-gray-50 flex items-center justify-center text-3xl shrink-0\">{rule.icon}</div>
                <div className=\"flex-1\">
                   <h3 className=\"text-2xl font-bold text-gray-900 mb-4\">{rule.title}</h3>
                   <p className=\"text-lg text-gray-500 font-medium leading-relaxed\">{rule.desc}</p>
                </div>
             </div>
           ))}
        </div>

        <div className=\"mt-32 p-12 md:p-20 rounded-[50px] bg-gray-900 text-center\">
            <h2 className=\"text-3xl md:text-4xl font-black text-white tracking-tight mb-6\">Ready to join the culture?</h2>
            <p className=\"text-gray-400 font-medium mb-12 max-w-xl mx-auto\">Once you understand the vibe, you're ready to launch your first Jam.</p>
            <div className=\"flex flex-wrap justify-center gap-6\">
               <button onClick={onStartJam} className=\"vibe-pill bg-white text-gray-900 px-10 py-5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-2xl\">Start Your Jam</button>
               <button onClick={onBrowseJams} className=\"px-10 py-5 rounded-full border border-white/10 text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all\">Explore Jams</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default GuidelinesPage;
