
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'STAR Indsigt',
  description: 'Udforsk statistiske emner og data fra Styrelsen for Arbejdsmarked og Rekruttering (STAR).',
  robots: {
    index: true,
    follow: true,
  },
};

import { StarSidebar } from '@/components/star-indsigt/StarSidebar';

export default function StarIndsigtLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col lg:flex-row text-slate-900 font-sans selection:bg-indigo-100 overflow-x-hidden">
      <StarSidebar />
      <main className="flex-1 min-w-0 h-screen overflow-y-auto relative pt-0 custom-scrollbar bg-[#FDFCF8]">
        {children}
      </main>
    </div>
  );
}
