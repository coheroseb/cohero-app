
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mine VIVE-analyser',
  description: 'Gense dine gemte analyser af VIVE-rapporter.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function MineViveAnalyserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
