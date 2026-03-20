import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Journal-træner',
  description: 'Træn din journalføring og få feedback fra AI-kollegaer på realistiske cases.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function JournalTrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
