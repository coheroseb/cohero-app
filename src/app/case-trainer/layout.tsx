import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Case-træner',
  description: 'Test dine faglige vurderinger i realistiske, AI-genererede socialfaglige scenarier.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CaseTrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
