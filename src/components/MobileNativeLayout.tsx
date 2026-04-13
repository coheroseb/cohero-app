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

  // Vis en ren splash screen mens vi tjekker login eller redirecter
  if (loading || (!user && pathname !== '/auth')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white animate-in fade-in duration-500">
         <div className="flex flex-col items-center gap-4">
            <div className="flex -space-x-1 items-end mb-2">
              <div className="w-2 h-8 bg-amber-800 rounded-t-sm shadow-lg" />
              <div className="w-2 h-12 bg-amber-950 rounded-t-sm shadow-lg" />
              <div className="w-2 h-10 bg-amber-700 rounded-t-sm shadow-lg" />
            </div>
            <h1 className="text-4xl font-black text-amber-950 serif tracking-tighter">Cohéro</h1>
            <div className="w-12 h-1 bg-amber-100 rounded-full overflow-hidden mt-4">
              <div className="w-full h-full bg-amber-500 animate-[loading-bar_1.5s_infinite]" />
            </div>
         </div>
         <style jsx>{`
            @keyframes loading-bar {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
         `}</style>
      </div>
    );
  }

  // Hvis man er på /auth og ikke logget ind, vis KUN indholdet (ingen barer)
  if (!user && pathname === '/auth') {
    return <main className="min-h-screen bg-white">{children}</main>;
  }

  const tabs = [
    { name: 'Hjem', icon: Home, href: '/portal' },
    { name: 'Søg', icon: Search, href: '/concept-explainer' },
    { name: 'Gemt', icon: Bookmark, href: '/mine-gemte-begreber' },
    { name: 'Beskeder', icon: Bell, href: '/notifications' },
    { name: 'Profil', icon: User, href: '/settings' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans select-none">
      {/* iOS Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-xl border-b border-black/[0.05] h-[calc(44px+env(safe-area-inset-top))] flex flex-col justify-end pb-2 px-6">
        <h1 className="text-[17px] font-bold text-slate-900 tracking-tight text-center truncate">
          {tabs.find(t => t.href === pathname)?.name || 'Cohéro'}
        </h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-[calc(44px+env(safe-area-inset-top))] pb-[calc(84px+env(safe-area-inset-bottom))] relative z-10">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </div>
      </main>

      {/* iOS Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-2xl border-t border-black/[0.05] pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_12px_rgba(0,0,0,0.03)]">
        <div className="h-[50px] flex items-center justify-around">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;
            
            return (
              <Link 
                key={tab.name} 
                href={tab.href}
                onClick={() => triggerHapticFeedback(ImpactStyle.Light)}
                className="flex flex-col items-center justify-center w-full h-[50px] space-y-0.5 active:opacity-50 transition-opacity"
              >
                <Icon 
                  className={`w-6 h-6 ${isActive ? 'text-indigo-600 fill-indigo-600/10' : 'text-slate-400'}`} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={`text-[10px] font-bold ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
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
