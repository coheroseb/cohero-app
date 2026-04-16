import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Medarbejderportal | IT Central',
  description: 'Centrum for medarbejderens daglige arbejde, IT-support og vidensdeling.',
};

import PortalSidebar from './components/PortalSidebar';

export default function EmployeePortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200 selection:bg-purple-500/30">
      {/* Background gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full" />
      </div>
      
      <div className="relative flex min-h-screen">
        <PortalSidebar />
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
