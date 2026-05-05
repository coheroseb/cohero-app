'use client';

import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Home, Search, Bookmark, User, Bell, LogIn, Info } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { triggerHapticFeedback } from '@/lib/haptics';
import { ImpactStyle } from '@capacitor/haptics';
import { useApp } from '@/app/provider';
import { Gavel, Layout, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

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
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 relative mb-2">
              <img src="/App_Icon.png" alt="Cohéro Logo" className="w-full h-full object-contain rounded-[2rem] shadow-xl" />
            </div>
            <h1 className="text-3xl font-black text-amber-950 serif tracking-tighter">Cohéro</h1>
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
    { name: 'Doks', icon: Bookmark, href: '/mine-seminarer' },
    { name: 'Notifikationer', icon: Bell, href: '/notifications' },
    { name: 'Indstillinger', icon: Settings, href: '/settings' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      {/* iOS Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-2xl border-b border-black/[0.03] h-[calc(50px+env(safe-area-inset-top))] flex flex-col justify-end pb-3 px-6 shadow-sm">
        <h1 className="text-lg font-black text-amber-950 serif tracking-tight text-center truncate">
          {tabs.find(t => t.href === pathname)?.name || 'Cohéro'}
        </h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-0 pt-[calc(44px+env(safe-area-inset-top))] pb-[calc(84px+env(safe-area-inset-bottom))] relative z-10 overflow-x-hidden">
        <div className="w-full max-w-full overflow-x-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
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
                className="flex flex-col items-center justify-center w-full h-[54px] space-y-1 active:opacity-50 transition-opacity"
              >
                <div className={`relative ${isActive ? 'scale-110' : 'scale-100'} transition-transform duration-300`}>
                  <Icon 
                    className={`w-6 h-6 ${isActive ? 'text-rose-900 fill-rose-900/5' : 'text-slate-400'}`} 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {isActive && (
                    <motion.div 
                      layoutId="active-dot"
                      className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-rose-500 rounded-full"
                    />
                  )}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-rose-900' : 'text-slate-300'}`}>
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
