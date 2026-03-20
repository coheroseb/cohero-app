import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Etik og Anvendelse',
  description: 'Læs om de etiske overvejelser ved brug af AI i socialt arbejde og hvordan du bruger Cohéro (Cohero) på en fagligt forsvarlig måde.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function EtikLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
