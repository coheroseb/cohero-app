import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  // IMPORTANT: Remember to change this to your actual production URL
  const baseUrl = 'https://cohero.dk';

  // List of public-facing pages you want to include in the sitemap
  const staticRoutes = [
    '/',
    '/om-os',
    '/ambassadoer',
    '/hvorfor',
    '/faq',
    '/terms-of-service',
    '/privacy-policy',
    '/cookie-policy',
    '/teknikker',
    '/upgrade',
    '/case-trainer',
    '/journal-trainer',
    '/kilde-generator',
    '/second-opinion',
    '/exam-architect',
    '/etik',
    '/tendenser',
    '/samarbejde',
    '/memento',
    '/lov-portal',
    '/legal-logic-board',
    '/quiz-creator',
    '/pensum',
    '/vive-indsigt',
    '/folketinget',
    '/reform-radar',
    '/seminar-architect',
    '/semester-planlaegger',
    '/paedagog',
    '/proev-begrebsguiden',
    '/star-indsigt',
    '/mine-gemte-artikler',
  ];
  
  const uniqueStaticRoutes = [...new Set(staticRoutes)];

  const sitemapEntries: MetadataRoute.Sitemap = uniqueStaticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    // Adjust changeFrequency and priority based on the page's importance and update frequency
    changeFrequency: 'monthly',
    priority: route === '/' ? 1 : 0.8,
  }));

  return sitemapEntries;
}