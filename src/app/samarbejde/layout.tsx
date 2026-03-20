import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Samarbejde & Partnerskaber',
  description: 'Tilbyd Cohéro til jeres socialrådgiverstuderende eller praktikanter. Styrk deres faglige udvikling med praksisnære AI-værktøjer.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function SamarbejdeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
