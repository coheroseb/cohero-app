import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Brugerstyring',
  robots: {
    index: false,
    follow: false,
  },
};

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
