import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cohéro for KP Studerende',
  description: 'En særlig velkomst til socialrådgiverstuderende fra Københavns Professionshøjskole. Find AI-værktøjer og ressourcer, der bygger bro mellem din undervisning og praksis.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function KpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
