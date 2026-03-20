import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mine Studieplaner',
  description: 'Gense dine gemte, AI-genererede studieplaner, og hold styr på din studieuge.',
  robots: {
    index: false,
    follow: false,
  },
};

export const maxDuration = 120;

export default function MineStudieplanerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
