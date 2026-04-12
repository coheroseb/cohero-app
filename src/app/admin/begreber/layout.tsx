import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vidensbase Styring',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ConceptsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
