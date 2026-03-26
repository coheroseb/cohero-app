import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Second Opinions',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SecondOpinionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
