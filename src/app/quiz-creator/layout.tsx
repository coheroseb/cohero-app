import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quiz-byggeren',
  description: 'Lav dine egne multiple-choice quizer om selvvalgte faglige emner, og test din paratviden.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function QuizCreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
