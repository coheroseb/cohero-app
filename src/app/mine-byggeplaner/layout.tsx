import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mine Byggeplaner',
  robots: {
    index: false,
    follow: false,
  },
};

export default function MineByggeplanerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
