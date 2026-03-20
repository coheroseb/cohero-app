import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fagligt Mycelium',
  description: 'Opdag de skjulte faglige forbindelser mellem dine egne refleksioner og kernepensum i socialt arbejde.',
  robots: {
    index: false,
    follow: false,
  },
};

export const maxDuration = 120;

export default function FagligtMyceliumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
