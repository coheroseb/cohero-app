import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mine Seminarer',
  description: 'Gense dine gemte videnskort fra Seminar-Arkitekten.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function MineSeminarerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
