import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Min Logbog',
  description: 'Gense dine gemte refleksioner og følg din faglige udvikling over tid.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LogbogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
