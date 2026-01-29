import React, { useState } from 'react';
import { AppProject } from '../types';

interface AppViewProps {
  app: AppProject;
  onClose: () => void;
  onCreatorClick?: (creator: AppProject['creator']) => void;
  isOwner?: boolean;
  onManageJam?: () => void;
  onAuthTrigger?: () => void;
  isLoggedIn?: boolean;
  onOpenJam?: (id: string) => void;
}

interface Comment {
  id: string;
  author: {
    name: string;
    avatar: string;
    handle: string;
  };
  text: string;
  timestamp: string;
  replies?: Comment[];
}

const AppView: React.FC<AppViewProps> = ({ 
  app, 
  onClose, 
  onCreatorClick, 
  isOwner, 
  onManageJam, 
  isLoggedIn, 
  onAuthTrigger,
  onOpenJam
}) => {
  const [newComment, setNewComment] = useState('');
  const [bookmarked, setBookmarked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      author: { name: 'Alex Rivera', handle: '@arivera', avatar: 'https://picsum.photos/seed/arivera/100' },
      text: "The aesthetic here is incredible. Love how minimal and focused it is.",
      timestamp: '2h ago',
      replies: [
        {
          id: '2',
          author: { name: 'Sara Chen', handle: '@schen', avatar: 'https://picsum.photos/seed/schen/100' },
          text: "Agreed. The performance is also surprisingly snappy.",
          timestamp: '1h ago'
        }
      ]
    }
  ]);

  const toggleBookmark = (jam: AppProject) => {
    if (!isLoggedIn) {
      onAuthTrigger?.();
      return;
    }
    setBookmarked(!bookmarked);
  };

  const handlePostComment = () => {
    if (!isLoggedIn) {
      onAuthTrigger?.();
      return;
    }
    if (!newComment.trim()) return;
    
    const comment: Comment = {
      id: Date.now().toString(),
      author: {
        name: 'You',
        handle: '@me',
        avatar: 'https://picsum.photos/seed/current/100'
      },
      text: newComment,
      timestamp: 'Just now'
    };
    setComments([comment, ...comments]);
    setNewComment('');
  };

  // Convert legacy AppProject to internal display needs if necessary
  const project = app;

  const renderComment = (comment: Comment, isReply = false) => {
    return (
      <div key={comment.id} className={`flex gap-4 ${isReply ? 'mt-6 ml-12 border-l border-gray-100 pl-6' : 'mb-8'}`}>
        <img src={comment.author.avatar} alt={comment.author.name} className="w-8 h-8 rounded-full border border-gray-50 shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold text-gray-900">{comment.author.name}</span>
            <span className="text-[9px] text-gray-400 font-medium">{comment.timestamp}</span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed mb-4">{comment.text}</p>
          {!isReply && (
            <button className="text-[9px] font-black text-gray-300 uppercase tracking-widest hover:text-blue-500 transition-colors">Reply</button>
          )}
          {comment.replies && comment.replies.map(reply => renderComment(reply, true))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-start justify-center overflow-y-auto bg-white/40 backdrop-blur-md pt-10 md:pt-20 pb-20 px-4 md:px-0">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-5xl bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-8 duration-500">

        <div className="sticky top-0 z-30 flex items-center justify-between px-8 h-20 bg-white/90 backdrop-blur-md border-b border-gray-50/50">
          <button onClick={onClose} className="group flex items-center gap-2 text-gray-400 hover:text-gray-900">
            <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Close View</span>
          </button>

          <div className="flex items-center gap-3">
            {isOwner && (
              <button
                onClick={onManageJam}
                className="px-5 py-2 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest mr-4"
              >
                Manage Jam
              </button>
            )}
            <button
              onClick={() => toggleBookmark(project)}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${bookmarked ? 'bg-blue-50 border-blue-200 text-blue-500' : 'bg-white border-gray-100 text-gray-400 hover:text-gray-900'}`}
            >
              <svg className="w-5 h-5" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-8 md:p-12 lg:p-16 border-r border-gray-50">
            <header className="mb-12">
              <div className="flex items-center gap-4 mb-4">
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-500 text-[10px] font-black uppercase tracking-widest">{project.category}</span>
                {isOwner && <span className="px-2 py-0.5 rounded bg-gray-100 text-[8px] font-black text-gray-400 uppercase tracking-widest">Owner</span>}
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter leading-none mb-6">{project.name}</h1>
              <p className="text-xl md:text-2xl text-gray-400 font-medium leading-relaxed max-w-2xl">{project.description}</p>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
              {[
                { label: 'MRR', value: project.stats.revenue, accent: 'text-green-600' },
                { label: 'Upvotes', value: project.stats.upvotes, accent: 'text-blue-500' },
                { label: 'Growth', value: project.stats.growth, accent: 'text-purple-600' },
                { label: 'Days Live', value: project.stats.daysLive, accent: 'text-gray-900' }
              ].map((stat) => (
                <div key={stat.label} className="p-6 rounded-[32px] border border-gray-50 bg-[#F9F9FB]/50">
                  <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{stat.label}</span>
                  <span className={`text-2xl font-black ${stat.accent}`}>{stat.value}</span>
                </div>
              ))}
            </div>

            <div className="relative aspect-[16/10] rounded-[40px] overflow-hidden bg-gray-100 mb-16">
              <img src={project.screenshot} alt="Product Insight" className="w-full h-full object-cover" />
            </div>

            <section className="mb-20">
              <h2 className="text-[11px] font-black text-gray-300 uppercase tracking-[0.3em] mb-12">Journey</h2>
              <div className="space-y-0 border-l-[1.5px] border-dashed border-gray-100 ml-4">
                {project.milestones?.map((m, i) => (
                  <div key={i} className="relative pl-12 pb-12 last:pb-0">
                    <div className="absolute left-[-6px] top-1 w-3 h-3 rounded-full bg-white border-2 border-blue-500" />
                    <span className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">{m.date}</span>
                    <h4 className="text-xl font-bold text-gray-900">{m.label}</h4>
                  </div>
                ))}
              </div>
            </section>

            <section className="pt-16 border-t border-gray-50">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-10">Signals</h3>

              <div className="flex gap-4 mb-12">
                <img src={isLoggedIn ? "https://picsum.photos/seed/user-curator/100" : "https://picsum.photos/seed/current/100"} className="w-8 h-8 rounded-full border border-gray-100" alt="Me" />
                <div className="flex-1 space-y-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePostComment(); }}
                    placeholder={isLoggedIn ? "Write a signal..." : "Sign in to join the discussion"}
                    onClick={() => !isLoggedIn && onAuthTrigger?.()}
                    readOnly={!isLoggedIn}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm focus:bg-white focus:border-blue-200 transition-all outline-none min-h-[100px] resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handlePostComment}
                      className="px-6 py-2 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      {isLoggedIn ? "Post Signal" : "Sign In"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {comments.map(c => renderComment(c))}
              </div>
            </section>
          </div>

          <div className="w-full md:w-[320px] lg:w-[380px] p-8 lg:p-12 shrink-0 bg-[#F9F9FB]/30">
            <div className="sticky top-28">
              <div
                onClick={() => onCreatorClick?.(project.creator)}
                className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:border-blue-100 transition-all cursor-pointer text-center"
              >
                <div className="mb-6 relative mx-auto w-24 h-24 aura-clip">
                  <img src={project.creator.avatar} className="w-full h-full rounded-full object-cover relative z-10" alt={project.creator.name} />
                  <div className="aura-halo" style={{ background: project.creator.color, opacity: 0.2, inset: '-6px' }} />
                </div>
                <h3 className="font-bold text-gray-900 text-xl leading-none mb-1">{project.creator.name}</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">{project.creator.handle}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isLoggedIn) onAuthTrigger?.();
                  }}
                  className="w-full py-4 rounded-2xl bg-gray-900 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-gray-900/10 active:scale-95"
                >
                  Follow
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppView;
