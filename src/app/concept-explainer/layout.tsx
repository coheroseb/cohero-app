import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Begrebsguide',
  description: 'Få centrale begreber og metoder fra socialt arbejde forklaret i et praksisnært sprog.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function ConceptExplainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
