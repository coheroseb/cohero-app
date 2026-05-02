import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Journal-træner | AI-drevet Feedback til Socialrådgivere',
  description: 'Træn dine færdigheder i professionel journalisering med Cohéros AI Journal-træner. Få øjeblikkelig feedback på objektivitet, juridisk præcision og fagligt sprog.',
  keywords: ['journalføring', 'socialrådgiver journal', 'journalnotat', 'Barnets Lov journal', 'faglig dokumentation', 'socialt arbejde', 'Cohéro'],
  openGraph: {
    title: 'Journal-træner for Socialrådgiverstuderende',
    description: 'Bliv mester i den faglige journalisering med intelligent AI-feedback.',
    images: ['/team_cohero.png'],
  },
};

export default function JournalTrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
