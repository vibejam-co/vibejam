
import React from 'react';

const Logo: React.FC = () => {
  const letters = [
    { char: 'v', color: 'text-blue-500/80' },
    { char: 'i', color: 'text-red-500/80' },
    { char: 'b', color: 'text-yellow-500/80' },
    { char: 'e', color: 'text-green-500/80' },
    { char: 'j', color: 'text-purple-500/80' },
    { char: 'a', color: 'text-blue-500/80' },
    { char: 'm', color: 'text-red-500/80' },
  ];

  return (
    <div className="flex items-center cursor-pointer group">
      <div className="text-2xl font-bold tracking-wider leading-none">
        {letters.map((l, i) => (
          <span 
            key={i} 
            className={`vibe-logo-letter ${l.color} group-hover:brightness-125`}
          >
            {l.char}
          </span>
        ))}
      </div>
    </div>
  );
};

export default Logo;
