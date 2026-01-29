
import React from 'react';

interface CreatorToolsPageProps {
  onStartJam: () => void;
  onBrowseJams: () => void;
}

const CreatorToolsPage: React.FC<CreatorToolsPageProps> = ({ onStartJam, onBrowseJams }) => {
  const tools = [
    {
      title: 'Vibe Analytics',
      desc: 'Deep insights into your audience reach and signal quality.',
      status: 'Available',
      icon: '📊'
    },
    {
      title: 'Aura Verification',
      desc: 'Verify your creator identity and unlock premium badges.',
      status: 'Manual',
      icon: '✨'
    },
    {
      title: 'Paid Exposure',
      desc: 'Boost your Jam to the top of the discovery feed.',
      status: 'Soon',
      icon: '🚀'
    }
  ];

  return (
    <div className=\"min-h-screen bg-white pt-48 pb-20 px-6\">
      <div className=\"max-w-7xl mx-auto\">
        <header className=\"mb-20 text-center lg:text-left\">
          <span className=\"text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-6 block\">Creator Hub</span>
          <h1 className=\"text-5xl md:text-7xl font-black text-gray-900 tracking-tighter mb-8 leading-tight\">
             Tools for the <br className=\"hidden lg:block\" /> next generation.
          </h1>
          <p className=\"text-xl text-gray-400 font-medium max-w-2xl leading-relaxed mb-12\">
            VibeJam provides builders with the insights and distribution needed to scale cult-favorite products.
          </p>
          <div className=\"flex flex-wrap justify-center lg:justify-start gap-4\">
             <button onClick={onStartJam} className=\"vibe-pill bg-gray-900 text-white px-8 py-4 rounded-full text-[11px] font-black uppercase tracking-widest\">Start Your Jam</button>
             <button onClick={onBrowseJams} className=\"px-8 py-4 rounded-full border border-gray-100 text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-all\">View Benchmarks</button>
          </div>
        </header>

        <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8\">
          {tools.map(tool => (
            <div key={tool.title} className=\"premium-card p-10 rounded-[40px] group\">
               <div className=\"w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl mb-8 group-hover:scale-110 transition-transform duration-500\">{tool.icon}</div>
               <h3 className=\"text-2xl font-bold text-gray-900 mb-4\">{tool.title}</h3>
               <p className=\"text-gray-400 font-medium leading-relaxed mb-8\">{tool.desc}</p>
               <div className=\"flex items-center justify-between pt-8 border-t border-gray-50\">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${tool.status === 'Available' ? 'text-green-500' : 'text-gray-300'}`}>{tool.status}</span>
                  <button className=\"text-gray-300 group-hover:text-blue-500 transition-colors\">
                     <svg className=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth=\"2.5\" d=\"M14 5l7 7m0 0l-7 7m7-7H3\" /></svg>
                  </button>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreatorToolsPage;
