import AuthLoadingScreen from '@/components/AuthLoadingScreen';

export default function Loading() {
  // This is a convention in Next.js App Router.
  // This component will be shown as a fallback while the page content loads.
  return <AuthLoadingScreen />;
}
