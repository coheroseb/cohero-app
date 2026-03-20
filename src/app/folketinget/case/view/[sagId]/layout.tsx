import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sagsdetaljer',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SagViewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
