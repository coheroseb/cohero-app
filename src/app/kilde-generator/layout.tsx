import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kildegenerator (APA)',
  description: 'Opret korrekte kildehenvisninger til love og bøger med Cohéros APA-kildegenerator, designet for socialrådgiverstuderende.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function KildeGeneratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
