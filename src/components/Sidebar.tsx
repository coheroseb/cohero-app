'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, BookOpen, Search, Zap, FileText, Scale, Brain, 
  TrendingUp, Bell, Settings, ShoppingBag, LogOut, Menu, X, 
  ChevronRight, Presentation, Star, Lightbulb, User, Building, Shield, FileBox
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/app/provider';
import { BookSpine } from '@/components/BookSpine';
import { useFunctions } from '@/firebase';
import { httpsCallable } from 'firebase/functions';

export default function Sidebar() {
  const { user, userProfile, handleLogout, effectiveTheme } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const functions = useFunctions();
  
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSSOLoading, setIsSSOLoading] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const handleSSORedirect = async (url: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!functions || isSSOLoading) {
      window.open(url, '_blank');
      return;
    }

    setIsSSOLoading(true);
    try {
      const generateSSOToken = httpsCallable(functions, 'generateSSOToken');
      const result = await generateSSOToken();
      const token = (result.data as any).token;
      
      const targetUrl = new URL(url);
      targetUrl.searchParams.set('token', token);
      window.open(targetUrl.toString(), '_blank');
    } catch (err) {
      console.error("SSO failed", err);
      window.open(url, '_blank');
    } finally {
      setIsSSOLoading(false);
    }
  };

  const navItems = [
    { label: "Overblik", path: "/portal", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Mit Pensum", path: "/mine-materialer", icon: <FileBox className="w-5 h-5" /> },
    { label: "Pensumsøgning", path: "/pensum-search", icon: <BookOpen className="w-5 h-5" /> },
    { label: "Case-træner", path: "/case-trainer", icon: <Zap className="w-5 h-5" /> },
    { label: "Journal-træner", path: "/journal-trainer", icon: <FileText className="w-5 h-5" /> },
    { label: "Second Opinion", path: "/second-opinion", icon: <Scale className="w-5 h-5" /> },
    { label: "Begreber", path: "/concept-explainer", icon: <Brain className="w-5 h-5" /> },
    { label: "Lovportal", path: "https://law.cohero.dk/", icon: <Scale className="w-5 h-5 text-amber-500" />, isSSO: true },
    { label: "Slides", path: "/mine-seminarer", icon: <Presentation className="w-5 h-5" /> },
    { label: "Notifikationer", path: "/notifications", icon: <Bell className="w-5 h-5" /> },
    { label: "Shop", path: "/shop", icon: <ShoppingBag className="w-5 h-5" /> },
  ];

  if (userProfile?.role === 'admin') {
    navItems.push({ label: "Admin Panel", path: "/admin", icon: <Shield className="w-5 h-5" /> });
  }

  // Common Sidebar Inner Contents
  const SidebarContent = () => (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-6">
        {/* Brand/Logo */}
        <div className="flex items-center gap-3 px-2">
          <Link href="/portal" className="flex items-end -space-x-[1.5px] scale-[0.8] origin-left">
            <BookSpine index={0} theme={effectiveTheme} width="w-1.5 sm:w-2" height="h-5 sm:h-6" color="bg-slate-900" decoration="plain" tilt="-rotate-1" />
            <BookSpine index={1} theme={effectiveTheme} width="w-2 sm:w-2.5" height="h-7 sm:h-8" color="bg-slate-900" decoration="bands" />
            <BookSpine index={2} theme={effectiveTheme} width="w-1 sm:w-1.5" height="h-6 sm:h-7" color="bg-slate-900" decoration="plain" />

            <BookSpine index={3} theme={effectiveTheme} letter="C" width="w-3 sm:w-3.5" height="h-8 sm:h-9" color="bg-slate-900" decoration="bands" />
            <BookSpine index={4} theme={effectiveTheme} letter="o" width="w-3 sm:w-3.5" height="h-6 sm:h-7" color="bg-slate-900" decoration="gold" />
            <BookSpine index={5} theme={effectiveTheme} letter="h" width="w-3 sm:w-3.5" height="h-9 sm:h-10" color="bg-slate-900" decoration="bands" tilt="-rotate-[1.5deg]" />
            <BookSpine index={6} theme={effectiveTheme} letter="é" width="w-3 sm:w-3.5" height="h-7 sm:h-8" color="bg-slate-900" decoration="stripes" />
            <BookSpine index={7} theme={effectiveTheme} letter="r" width="w-3 sm:w-3.5" height="h-8 sm:h-9" color="bg-slate-900" decoration="bands" />
            <BookSpine index={8} theme={effectiveTheme} letter="o" width="w-3 sm:w-3.5" height="h-6 sm:h-7" color="bg-slate-900" decoration="gold" tilt="rotate-[1deg]" />

            <BookSpine index={9} theme={effectiveTheme} width="w-1.5 sm:w-2" height="h-7 sm:h-8" color="bg-slate-900" decoration="ornament" />
            <BookSpine index={10} theme={effectiveTheme} width="w-2 sm:w-2.5" height="h-5 sm:h-6" color="bg-slate-900" decoration="plain" tilt="rotate-2" />
            <BookSpine index={11} theme={effectiveTheme} width="w-1.5 sm:w-2" height="h-6 sm:h-7" color="bg-slate-900" decoration="bands" />
          </Link>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item, idx) => {
            const isActive = pathname === item.path || (item.path !== '/portal' && pathname?.startsWith(item.path));
            
            if (item.isSSO) {
              return (
                <button
                  key={idx}
                  onClick={(e) => handleSSORedirect(item.path, e)}
                  disabled={isSSOLoading}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className="text-left flex-1">{isSSOLoading ? "Forbinder..." : item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={idx}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-black uppercase tracking-wider transition-colors ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-600' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Profile & Settings section */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-black uppercase tracking-wider transition-colors ${
            pathname === '/settings' 
              ? 'bg-indigo-50 text-indigo-600' 
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span>Indstillinger</span>
        </Link>
        
        {/* User Card */}
        {user && (
          <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-100 p-3 rounded-2xl">
            <Link href="/settings" className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-950 flex items-center justify-center text-amber-400 font-black text-sm">
                {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-slate-900 text-xs truncate leading-none mb-1">
                  {user.displayName || user.email?.split('@')[0]}
                </p>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none truncate">
                  {userProfile?.membership || "Basis"}
                </p>
              </div>
            </Link>
            <button 
              onClick={handleLogout} 
              className="p-2 text-slate-400 hover:text-rose-500 active:scale-95 transition-all"
              title="Log ud"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* 1. MOBILE TOP HEADER */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-100/60 z-30 flex items-center justify-between px-6 md:hidden">
        <div className="flex items-center gap-2">
          {/* Compact brand text */}
          <Link href="/portal" className="font-black text-lg text-slate-900 tracking-tight">Cohéro</Link>
        </div>
        <button 
          onClick={() => setIsMobileOpen(true)}
          className="p-2 text-slate-600 hover:text-slate-950 active:scale-90 transition-transform"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* 2. MOBILE DRAWER SIDEBAR */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200/60 shadow-2xl z-50 flex flex-col justify-between py-6 px-4 md:hidden"
            >
              <button 
                onClick={() => setIsMobileOpen(false)}
                className="absolute top-6 right-4 p-2 text-slate-400 hover:text-slate-600 active:scale-90 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 3. DESKTOP SIDEBAR */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200/50 shadow-sm flex-col justify-between py-6 px-4 z-30">
        <SidebarContent />
      </aside>
    </>
  );
}
