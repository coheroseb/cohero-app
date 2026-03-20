import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ugens Dilemma',
  description: 'Deltag i ugens faglige dilemma, stem, og se hvordan dine medstuderende har stemt.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function UgensDilemmaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
