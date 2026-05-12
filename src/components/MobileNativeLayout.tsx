'use client';

import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Gavel, Layout, Settings, BookMarked, MessageSquare, Scale, Bell, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { triggerHapticFeedback } from '@/lib/haptics';
import { ImpactStyle } from '@capacitor/haptics';
import { useApp } from '@/app/provider';
import { NativeAuth } from './native/NativeAuth';

interface MobileNativeLayoutProps {
  children: React.ReactNode;
}

const MobileNativeLayout: React.FC<MobileNativeLayoutProps> = ({ children }) => {
  const [isNative, setIsNative] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useApp();

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
    
    // Tilføj safe-area-inset klasser til body
    if (Capacitor.isNativePlatform()) {
      document.documentElement.classList.add('is-native');
    }
  }, []);

  // Vi håndterer auth direkte i render logikken nedenfor for native brugere
  // for at undgå unødvendige redirects til web-auth siden.

  if (!isNative) return <>{children}</>;

  // Vis en ren splash screen mens vi tjekker login eller redirecter
  if (isUserLoading || (!user && pathname !== '/auth')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white animate-in fade-in duration-500">
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 relative mb-2">
              <img src="/App_Icon.png" alt="Cohéro Logo" className="w-full h-full object-contain rounded-[2rem] shadow-xl" />
            </div>
            <h1 className="text-3xl font-black text-amber-950 serif tracking-tighter">Cohéro Student</h1>
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

  // Hvis man ikke er logget ind på native, vis den dedikerede NativeAuth side
  if (!user) {
    return <NativeAuth />;
  }

  const tabs = [
    { name: 'Hjem', icon: Home, href: '/portal' },
    { name: 'Materialer', icon: BookMarked, href: '/mine-materialer' },
    { name: 'Profil', icon: Settings, href: '/settings' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      {/* iOS Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-2xl border-b border-black/[0.03] h-[calc(50px+env(safe-area-inset-top))] flex flex-col justify-end pb-3 px-6 shadow-sm">
        <h1 className="text-lg font-black text-amber-950 serif tracking-tight text-center truncate">
          {tabs.find(t => t.href === pathname)?.name || 'Cohéro Student'}
        </h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-0 pt-[calc(44px+env(safe-area-inset-top))] pb-[calc(100px+env(safe-area-inset-bottom))] relative z-10 overflow-x-hidden">
        <div className="w-full max-w-full overflow-x-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </div>
      </main>

      {/* iOS Floating Tab Bar */}
      <nav className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-4 right-4 z-[100] bg-white/85 backdrop-blur-3xl border border-black/[0.05] rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden">
        <div className="h-[72px] flex items-center justify-around px-4">
          {tabs.map((tab) => {
            const currentPath = pathname || '';
            const isActive = currentPath === tab.href || (tab.href !== '/portal' && currentPath.startsWith(tab.href));
            const Icon = tab.icon;
            
            return (
              <Link 
                key={tab.name} 
                href={tab.href}
                onClick={() => triggerHapticFeedback(ImpactStyle.Light)}
                className="flex flex-col items-center justify-center w-full h-full space-y-1.5 relative active:scale-90 transition-all duration-200"
              >
                <div className={`relative flex items-center justify-center transition-all duration-500 ${isActive ? 'scale-110 -translate-y-0.5' : 'scale-100'}`}>
                  <Icon 
                    className={`w-5 h-5 sm:w-6 sm:h-6 ${isActive ? 'text-rose-950' : 'text-slate-400'}`} 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {isActive && (
                    <motion.div 
                      layoutId="active-pill"
                      className="absolute -inset-2.5 bg-rose-50 rounded-2xl -z-10"
                      transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                    />
                  )}
                </div>
                <span className={`text-[8px] font-black uppercase tracking-[0.15em] transition-colors duration-300 ${isActive ? 'text-rose-950' : 'text-slate-400'}`}>
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
