import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Second Opinion | Analyse af Eksamensbesvarelser og Klagehjælp',
  description: 'Fik du ikke karakteren du fortjente? Få en uvildig AI-analyse af din eksamensopgave og få hjælp til at formulere en faglig klage.',
  keywords: ['eksamensklage', 'karakter klage', 'opgave analyse', 'second opinion eksamen', 'socialrådgiver studerende klage', 'Cohéro'],
  openGraph: {
    title: 'Second Opinion - Retfærdige karakterer gennem AI-analyse',
    description: 'Få et objektivt grundlag for din eksamensklage med Cohéros Second Opinion.',
    images: ['/team_cohero.png'],
  },
};

export default function SecondOpinionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
