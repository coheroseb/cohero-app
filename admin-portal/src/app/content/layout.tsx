import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Indhold & AI',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
