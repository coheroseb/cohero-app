import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Folketinget Direkte',
  description: 'Få den nyeste viden og analyser direkte fra Folketinget, skræddersyet til socialfagligt arbejde.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function FolketingetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
