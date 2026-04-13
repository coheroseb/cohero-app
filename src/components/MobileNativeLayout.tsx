'use client';

import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Home, Search, Bookmark, User, Bell, LogIn, Info } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { triggerHapticFeedback } from '@/lib/haptics';
import { ImpactStyle } from '@capacitor/haptics';
import { useApp } from '@/app/provider';

interface MobileNativeLayoutProps {
  children: React.ReactNode;
}

const MobileNativeLayout: React.FC<MobileNativeLayoutProps> = ({ children }) => {
  const [isNative, setIsNative] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useApp();

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
    
    // Tilføj safe-area-inset klasser til body
    if (Capacitor.isNativePlatform()) {
      document.documentElement.classList.add('is-native');
    }
  }, []);

  // Redirect ulogget brugere til /auth i native app
  useEffect(() => {
    if (isNative && !loading && !user && pathname !== '/auth') {
      router.replace('/auth');
    }
  }, [isNative, user, loading, pathname, router]);

  if (!isNative) return <>{children}</>;

  const authTabs = [
    { name: 'Hjem', icon: Home, href: '/portal' },
    { name: 'Søg', icon: Search, href: '/concept-explainer' },
    { name: 'Gemt', icon: Bookmark, href: '/mine-gemte-begreber' },
    { name: 'Beskeder', icon: Bell, href: '/notifications' },
    { name: 'Profil', icon: User, href: '/settings' },
  ];

  const guestTabs = [
    { name: 'Velkommen', icon: Home, href: '/' },
    { name: 'Log Ind', icon: LogIn, href: '/auth' },
    { name: 'Om Os', icon: Info, href: '/om-os' },
  ];

  const tabs = user ? authTabs : guestTabs;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans select-none">
      {/* iOS Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5 pt-[env(safe-area-inset-top)]">
        <div className="h-11 flex items-center justify-between px-4">
          <h1 className="text-[17px] font-semibold text-black tracking-tight w-full text-center">
            {tabs.find(t => t.href === pathname)?.name || 'Cohéro'}
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-[calc(44px+env(safe-area-inset-top))] pb-[calc(84px+env(safe-area-inset-bottom))]">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </div>
      </main>

      {/* iOS Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-black/5 pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_0_0_rgba(0,0,0,0.05)]">
        <div className="h-[49px] flex items-center justify-around">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;
            
            return (
              <Link 
                key={tab.name} 
                href={tab.href}
                onClick={() => triggerHapticFeedback(ImpactStyle.Light)}
                className="flex flex-col items-center justify-center w-full h-full space-y-0.5 active:opacity-50 transition-opacity"
              >
                <Icon 
                  className={`w-6 h-6 ${isActive ? 'text-indigo-600 fill-indigo-600/10' : 'text-slate-400'}`} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={`text-[10px] font-medium ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                  {tab.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default MobileNativeLayout;
