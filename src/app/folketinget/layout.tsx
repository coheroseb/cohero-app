import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politisk Puls | Følg lovgivningen i Folketinget',
  description: 'Få realtidsopdateringer og AI-analyser af nye lovforslag og politiske beslutninger, der påvirker det socialfaglige område. Cohéro overvåger Folketinget for dig.',
  keywords: ['folketinget', 'lovforslag', 'socialrådgiver', 'Barnets Lov', 'politisk monitorering', 'lovgivning', 'Cohéro'],
  openGraph: {
    title: 'Politisk Puls - Cohéro',
    description: 'Realtids-monitorering af Folketinget skræddersyet til socialrådgivere.',
    images: ['/team_cohero.png'],
  },
};

export default function FolketingetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
