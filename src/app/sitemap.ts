import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  // IMPORTANT: Remember to change this to your actual production URL
  const baseUrl = 'https://student.cohero.dk';

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
    '/upgrade',
    '/second-opinion',
    '/etik',
    '/pensum',
    '/vive-indsigt',
    '/seminar-architect',
    '/semester-planlaegger',
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