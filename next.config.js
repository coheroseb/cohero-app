/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🔥 KRITISK for Firebase SSR (reducerer bundle size markant)
  output: "standalone",

  // ⚠️ Midlertidigt – fjern senere når du har styr på types
  typescript: {
    ignoreBuildErrors: true,
  },

  // ⚠️ Midlertidigt – fjern senere
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Removed Firebase/Genkit experimental external packages since Genkit is now in Firebase Functions

  // 🖼️ Images config (din eksisterende)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "multimediaserver.gyldendal.dk",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "studybox.dk",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },

  // 🔥 Ekstra: reducer unødvendig tracing (mindre bundle)
  productionBrowserSourceMaps: false,

  async redirects() {
    return [
      {
        source: '/rum/groups/:path*',
        destination: 'https://group.cohero.dk/:path*',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;