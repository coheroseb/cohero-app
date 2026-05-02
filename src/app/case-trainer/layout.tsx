import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Case-træner | Interaktiv Case-træning for Socialrådgivere',
  description: 'Forbered dig på praksis med Cohéros Case-træner. Løs virkelighedsnære cases inden for Børn & Unge, Beskæftigelse og Socialpsykiatri med AI-sparring.',
  keywords: ['case-træning', 'socialrådgiver case', 'eksamensforberedelse', 'socialfaglig træning', 'praksisnær læring', 'Cohéro'],
  openGraph: {
    title: 'Interaktiv Case-træner - Cohéro',
    description: 'Træn virkelighedsnære scenarier og styrk din faglige dømmekraft.',
    images: ['/team_cohero.png'],
  },
};

export default function CaseTrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
