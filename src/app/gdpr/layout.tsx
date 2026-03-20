import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GDPR & Databehandling',
  description: 'Forstå hvordan Cohéro overholder GDPR og beskytter dine data. Læs om vores databehandlingsprincipper og dine rettigheder som bruger.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function GdprLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
