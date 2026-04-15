import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Akademisk Korrekturlæsning | Cohéro',
  description: 'Professionel korrekturlæsning af opgaver til socialrådgiver- og pædagoguddannelsen. Kun 35 kr. pr. side (2400 tegn). Sikr din faglige formidling.',
};

export default function KorrekturLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
