
'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { useApp } from '@/app/provider';

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const { cookieConsent } = useApp();
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_ID;

  if (!gaMeasurementId || pathname?.startsWith('/admin') || cookieConsent !== 'granted') {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaMeasurementId}');
          `,
        }}
      />
    </>
  );
}
