import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Studieteknikker for Socialrådgivere',
  description: 'Lær effektive læse- og notatteknikker, skræddersyet til socialrådgiveruddannelsen. Brug AI til at få teknikkerne forklaret på en letforståelig måde.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function TeknikkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
