import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Second Opinion',
  description: 'Få en AI-vurdering af, om der er grundlag for at klage over en karakter.',
  robots: {
    index: false,
    follow: false,
  },
};

export const maxDuration = 120;

export default function SecondOpinionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
