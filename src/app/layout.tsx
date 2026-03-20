import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/app/provider';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from "@/components/ui/toaster";
import BugReportButton from '@/components/BugReportButton';
import Script from 'next/script';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import MetaPixel from '@/components/MetaPixel';
import { Suspense } from 'react';
import CookieConsent from '@/components/CookieConsent';
import PageViewTracker from '@/components/PageViewTracker';

const siteUrl = 'https://cohero.dk';
const siteTitle = 'Cohéro (Cohero) - Din Digitale Kollega for Socialrådgiverstuderende';
const siteDescription = 'Cohéro (Cohero) er en AI-drevet platform for socialrådgiverstuderende, der tilbyder værktøjer som case-træner, journal-feedback og lovportal for at bygge bro mellem teori og praksis.';
const ogImageUrl = '/team_cohero.png';


export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: `%s | Cohéro`,
  },
  description: siteDescription,
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Cohéro',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  keywords: ['cohero', 'socialrådgiverstuderende', 'socialrådgiver', 'socialt arbejde', 'case-træning', 'jura', 'pædagogik', 'studieværktøjer', 'AI', 'Barnets Lov', 'Serviceloven', 'Forvaltningsloven', 'VUM', 'ICS', 'journalføring', 'eksamenshjælp', 'socialfaglig', 'kollega', 'sparring', 'generative engine optimization', 'GEO'],
  authors: [{ name: 'Cohéro Team', url: `${siteUrl}/om-os` }],
  creator: 'Cohéro I/S',
  publisher: 'Cohéro I/S',
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    siteName: 'Cohéro / Cohero',
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: 'Teamet bag Cohéro - din digitale kollega.',
      },
    ],
    locale: 'da_DK',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: [ogImageUrl],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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

  const serviceWorkerScript = `
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/service-worker.js').then(function(registration) {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, function(err) {
          console.log('ServiceWorker registration failed: ', err);
        });
      });
    }
  `;

  return (
    <html lang="da">
      <body className="bg-background text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{ __html: serviceWorkerScript }}
        />
        <FirebaseClientProvider>
          <AppProvider>
            <Suspense>
              <GoogleAnalytics />
              <MetaPixel />
              <PageViewTracker />
            </Suspense>
            {children}
            <BugReportButton />
            <CookieConsent />
          </AppProvider>
        </FirebaseClientProvider>
        <Toaster />
        <Script
          type="text/javascript"
          src="//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
          async
        />
      </body>
    </html>
  );
}
