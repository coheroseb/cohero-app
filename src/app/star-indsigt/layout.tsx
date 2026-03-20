
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'STAR Indsigt',
  description: 'Udforsk statistiske emner og data fra Styrelsen for Arbejdsmarked og Rekruttering (STAR).',
  robots: {
    index: true,
    follow: true,
  },
};

export default function StarIndsigtLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
