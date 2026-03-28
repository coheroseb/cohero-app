import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mit Semester | Cohero',
  description: 'Gå i dybden med dit aktuelle semester – kalender, studieplan, læringsmål og AI-analyse samlet ét sted.',
};

export default function MitSemesterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
