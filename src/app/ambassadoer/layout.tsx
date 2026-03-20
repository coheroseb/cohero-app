import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bliv Ambassadør',
  description: 'Vil du være med til at forme fremtidens digitale læringsplatform for socialrådgivere? Bliv ambassadør for Cohéro og få indflydelse, netværk og fordele.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function AmbassadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
