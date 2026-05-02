import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Begrebsguiden | Forklaring af Socialfaglige Begreber',
  description: 'Slå komplekse begreber op og få dem forklaret i øjenhøjde. Begrebsguiden hjælper dig med at forstå pensum og anvende teorier i praksis.',
  keywords: ['begrebsafklaring', 'socialrådgiver begreber', 'fagbegreber', 'socialt arbejde teori', 'studiehjælp', 'Cohéro'],
  openGraph: {
    title: 'Begrebsguiden - Din digitale ordbog til studiet',
    description: 'Få pædagogiske forklaringer på alle de svære begreber fra socialrådgiveruddannelsen.',
    images: ['/team_cohero.png'],
  },
};

export default function ConceptExplainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
