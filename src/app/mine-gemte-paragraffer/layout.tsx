
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mine Gemte Paragraffer',
  description: 'Gense dine gemte lovparagraffer og vejledningspunkter.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function MineGemteParagrafferLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
