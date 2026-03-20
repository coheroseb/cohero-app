import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Eksamens-Arkitekten',
  description: 'Få hjælp til at strukturere din opgave, finde relevant litteratur og skabe den røde tråd i din socialfaglige analyse.',
  robots: {
    index: false,
    follow: false,
  },
};

export const maxDuration = 120;

export default function ExamArchitectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
