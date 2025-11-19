import React from 'react';

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#0b0b0f]">
      {children}
    </div>
  );
}
