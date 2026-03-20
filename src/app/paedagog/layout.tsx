import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cohéro for Pædagoger',
  description: 'Styrk din tværfaglige forståelse og praksisnære kompetencer. Cohéro tilbyder AI-værktøjer, der bygger bro mellem pædagogik og socialt arbejde.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function PaedagogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
