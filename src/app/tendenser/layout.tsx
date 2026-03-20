import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Faglige Tendenser',
  description: 'Se hvilke emner, begreber og love der trender blandt socialrådgiverstuderende på Cohéro.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function TendenserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
