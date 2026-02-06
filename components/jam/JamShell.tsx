import React from 'react';

interface JamShellProps {
  children: React.ReactNode;
}

const JamShell: React.FC<JamShellProps> = ({ children }) => (
  <div className="min-h-screen w-screen max-w-none overflow-x-visible">
    {children}
  </div>
);

export default JamShell;
