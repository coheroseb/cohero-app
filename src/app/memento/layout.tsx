import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Memento',
  description: 'Træn din hukommelse og faglige paratviden med Memento. Match paragraffer, teoretikere og metoder i sjove og lærerige huskespil.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function MementoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
