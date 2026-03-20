
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Studiegrupper',
  description: 'Organisér dine studiegrupper, tilføj kolleger og styr styr på jeres fælles opgaver og planlægning.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function GroupsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
