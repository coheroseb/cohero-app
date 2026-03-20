import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Min Portal',
  robots: {
    index: false,
    follow: false,
  },
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
