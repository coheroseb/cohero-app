import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pensum & Anbefalinger',
  description: 'Se den anbefalede pensumliste til socialrådgiveruddannelsen. Find de bøger, vi anbefaler for at bygge et stærkt fagligt fundament.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function PensumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
