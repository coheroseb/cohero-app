
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mine Gemte Artikler',
  description: 'Gense dine gemte artikler og rapporter fra VIVE.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function MineGemteArtiklerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
