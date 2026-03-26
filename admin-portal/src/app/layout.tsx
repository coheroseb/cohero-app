import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/app/provider';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from "@/components/ui/toaster";
import AdminDashboardLayout from './AdminDashboardLayout';

const siteTitle = 'Cohéro Admin Portal';
const siteDescription = 'Administrationspanel for Cohéro platformen.';

export const metadata: Metadata = {
  title: siteTitle,
  description: siteDescription,
};

export const viewport: Viewport = {
  themeColor: '#451a03',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="da">
      <body className="bg-background text-foreground antialiased min-h-screen font-sans">
        <FirebaseClientProvider>
          <AppProvider>
            <AdminDashboardLayout>
              {children}
            </AdminDashboardLayout>
          </AppProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
