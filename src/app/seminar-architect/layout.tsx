import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Seminar-Arkitekten',
  description: 'Upload dine slides fra et seminar og få AI-hjælp til at strukturere og udtrække de vigtigste faglige pointer.',
  robots: {
    index: false,
    follow: false,
  },
};

export const maxDuration = 120;

export default function SeminarArchitectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
