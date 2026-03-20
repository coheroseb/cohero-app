
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Opslagstavle',
  description: 'Deltag i faglige diskussioner med andre socialrådgiverstuderende på Cohéros opslagstavle.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function OpslagstavleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
