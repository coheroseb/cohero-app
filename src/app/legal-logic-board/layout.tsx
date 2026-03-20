import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Interventions-Tavlen',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LegalLogicBoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
