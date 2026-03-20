import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'System & Logs',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
