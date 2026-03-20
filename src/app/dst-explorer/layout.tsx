import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Statistik-Explorer',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DstExplorerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
