import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reform-Radar',
  description: 'Hold dig ajour med de seneste lovændringer og reformer, analyseret og forklaret for socialrådgiverstuderende.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function ReformRadarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
