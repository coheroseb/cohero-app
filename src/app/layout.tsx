import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/app/provider';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from "@/components/ui/toaster";
import Script from 'next/script';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import MetaPixel from '@/components/MetaPixel';
import GoogleTagManager from '@/components/GoogleTagManager';
import { Suspense } from 'react';
import { MaintenanceGuard } from '@/components/MaintenanceGuard';
import SourceKeeper from '@/components/SourceKeeper';
import MobileNativeLayout from '@/components/MobileNativeLayout';
const siteUrl = 'https://cohero.dk';
const siteTitle = 'Cohéro (Cohero) - Din Digitale Kollega for Socialrådgiverstuderende';
const siteDescription = 'Cohéro er din professionelle rygdækning på velfærdsstudierne. Vi tilbyder intelligente værktøjer som sags-analytiker, journal-feedback og lovportal, der sikrer din faglige præcision og tryghed fra studiestart til eksamen.';
const ogImageUrl = '/team_cohero.png';



async function getSeoData() {
  try {
    const { adminFirestore } = await import('@/firebase/server-init');
    const seoRef = adminFirestore.collection('systemSettings').doc('seo');
    const snapshot = await seoRef.get();
    if (snapshot.exists) {
      return snapshot.data();
    }
  } catch (error) {
    console.error('Error fetching SEO data:', error);
  }
  return null;
}

export async function generateMetadata(): Promise<Metadata> {
  const customSeo = await getSeoData();
  
  const title = customSeo?.siteTitle || siteTitle;
  const description = customSeo?.siteDescription || siteDescription;
  const keywords = customSeo?.keywords ? customSeo.keywords.split(',').map((s: string) => s.trim()) : ['cohero', 'socialrådgiverstuderende', 'socialrådgiver', 'socialt arbejde', 'case-træning', 'jura', 'pædagogik', 'studieværktøjer', 'intelligent rygdækning', 'Barnets Lov', 'Serviceloven', 'Forvaltningsloven', 'VUM', 'ICS', 'journalføring', 'eksamenshjælp', 'socialfaglig', 'kollega', 'sparring', 'generative engine optimization', 'GEO'];
  const ogImage = customSeo?.ogImage || ogImageUrl;
  const indexing = customSeo?.indexing !== undefined ? customSeo.indexing : true;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s | Cohéro`,
    },
    description: description,
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: 'Cohéro',
    },
    other: {
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'black-translucent',
    },
    keywords: keywords,
    authors: [{ name: 'Cohéro Team', url: `${siteUrl}/om-os` }],
    creator: 'Cohéro I/S',
    publisher: 'Cohéro I/S',
    openGraph: {
      title: title,
      description: description,
      url: siteUrl,
      siteName: 'Cohéro / Cohero',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: 'Cohéro - Din digitale kollega.',
        },
      ],
      locale: 'da_DK',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [ogImage],
    },
    robots: {
      index: indexing,
      follow: indexing,
      googleBot: {
        index: indexing,
        follow: indexing,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#451a03',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Cohéro',
    alternateName: 'Cohero',
    url: siteUrl,
    logo: `${siteUrl}${ogImageUrl}`,
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'kontakt@cohero.dk',
      contactType: 'Customer Service',
      areaServed: 'DK',
      availableLanguage: ['Danish']
    },
    address: {
      '@type': 'PostalAddress',
      'streetAddress': 'Ben Websters Vej 14',
      'addressLocality': 'København',
      'postalCode': '2450',
      'addressCountry': 'DK'
    },
    sameAs: [
      "https://www.facebook.com/profile.php?id=61586618395097",
      "https://www.instagram.com/cohero_is",
      "https://linkedin.com/company/coherois"
    ]
  };

  return (
    <html lang="da">
      <body className="bg-background text-foreground antialiased min-h-screen font-sans">
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Script id="service-worker-registration" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/service-worker.js').then(function(registration) {
                  console.log('ServiceWorker registration successful');
                }).catch(function(err) {
                  console.log('ServiceWorker registration failed: ', err);
                });
              });
            }
          `}
        </Script>
        <FirebaseClientProvider>
          <AppProvider>
            <Suspense fallback={null}>
              <GoogleAnalytics />
              <MetaPixel />
              <GoogleTagManager />
              <SourceKeeper />
            </Suspense>
            <MaintenanceGuard>
              <MobileNativeLayout>
                {children}
              </MobileNativeLayout>
            </MaintenanceGuard>
          </AppProvider>
        </FirebaseClientProvider>
        <Toaster />
        <Script
          type="text/javascript"
          src="//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
          async
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
