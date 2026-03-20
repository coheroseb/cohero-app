import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mundtlig Eksamens-Træner',
  description: 'Træn dit mundtlige eksamensoplæg og få AI-drevet feedback på din faglige terminologi, struktur og argumentation.',
  robots: {
    index: false,
    follow: false,
  },
};

export const maxDuration = 180;

export default function MundtligEksamenstraenerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
