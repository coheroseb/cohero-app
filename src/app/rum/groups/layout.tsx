
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Cohéro Project Group | Studiegrupper',
  description: 'Det særskilte rum til dine studiegrupper og professionelt samarbejde.',
  manifest: '/manifest-groups.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Project Group',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#451a03',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RumGroupsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="standalone-groups-app">
      {/* Her kan vi tilføje en særskilt navbar kun for grupper hvis ønsket */}
      {children}
    </div>
  );
}
