import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mine Semesterplaner',
  description: 'Gense dine gemte semesterplaner fra Semester-Planlæggeren.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function MineSemesterplanerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
