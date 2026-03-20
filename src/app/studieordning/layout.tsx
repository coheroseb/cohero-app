
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Studieordnings-Analysator',
  description: 'Upload og indeksér din studieordning for at få automatisk kobling til læringsmål i dine opgaver.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function StudyRegulationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
