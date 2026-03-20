import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VIVE Indsigt',
  description: 'Søg og udforsk de seneste udgivelser og analyser fra VIVE – Det Nationale Forsknings- og Analysecenter for Velfærd.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function ViveIndsigtLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
