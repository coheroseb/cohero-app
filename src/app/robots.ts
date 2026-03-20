import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  // IMPORTANT: Remember to change this to your actual production URL
  const baseUrl = 'https://cohero.dk';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Disallow crawling of user-specific and administrative pages
      disallow: [
        '/admin/',
        '/portal/',
        '/settings/',
        '/upgrade/',
        '/admin/second-opinions/',
        '/min-logbog/',
        '/mine-byggeplaner/',
        '/mine-seminarer/',
        '/mine-semesterplaner/',
        '/mine-studieplaner/',
        '/admin/studieplaner/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
