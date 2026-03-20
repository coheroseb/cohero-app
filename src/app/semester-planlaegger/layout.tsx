import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Semester-Planlægger',
  description: 'Importer din studiekalender og få et struktureret overblik over dit semester med AI.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SemesterPlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
