import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ny Refleksion',
  description: 'Skriv en ny refleksion, få AI-sparring på dine tanker, og gem dine indsigter i din personlige logbog.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RefleksionslogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
