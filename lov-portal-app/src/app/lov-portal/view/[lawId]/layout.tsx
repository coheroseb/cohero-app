
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lovvisning',
  description: 'Se lovtekst og tilhørende administrative dokumenter.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function LawViewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
