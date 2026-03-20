import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leaderboard',
  description: 'Se hvem der har optjent flest Cohéro Points og er mest aktiv på platformen.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
