import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SaaS Statistik',
  robots: {
    index: false,
    follow: false,
  },
};

export default function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
