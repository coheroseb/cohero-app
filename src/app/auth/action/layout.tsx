import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bekræft Handling',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ActionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
