
import React from 'react';

interface SocialListPanelProps {
  onClose: () => void;
  title: string;
  users: any[];
}

const SocialListPanel: React.FC<SocialListPanelProps> = ({ onClose, title, users }) => {
  return (
    <div className="fixed inset-0 z-[600] flex justify-end animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/5 backdrop-blur-[2px]" onClick={onClose} />
      
      <div className="relative w-full max-w-[440px] h-full bg-white shadow-[-24px_0_80px_rgba(0,0,0,0.08)] flex flex-col animate-in slide-in-from-right duration-500 ease-out">
        <header className="h-24 px-8 border-b border-gray-50 flex items-center justify-between shrink-0">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h2>
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{users.length} Users</span>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors hover:bg-gray-50">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
          {users.map((user, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
              <div className="flex items-center gap-4">
                <img src={user.avatar} className="w-12 h-12 rounded-full border border-gray-100" alt={user.name} />
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{user.name}</h3>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{user.handle}</p>
                </div>
              </div>
              <button className="px-4 py-1.5 rounded-lg border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 hover:border-gray-900 transition-all">Follow</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SocialListPanel;
