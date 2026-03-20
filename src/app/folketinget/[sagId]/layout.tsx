import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sag',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SagLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
