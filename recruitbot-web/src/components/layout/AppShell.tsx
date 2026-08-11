import React from 'react';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen w-screen bg-bg-base overflow-hidden font-sans text-text-primary">
      {children}
    </div>
  );
}

export default AppShell;
