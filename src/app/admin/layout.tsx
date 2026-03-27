
'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, BookOpen, Sparkles, Database, Shield, ChevronRight, Search, Mail, BarChart, Menu, X, MessageSquare, Bell, HandHelping } from 'lucide-react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

const navigation = [
  { id: 'overview', href: '/admin', label: 'Overblik', icon: LayoutDashboard },
  { id: 'users', href: '/admin/users', label: 'Brugerstyring', icon: Users },
  { id: 'surveys', href: '/admin/surveys', label: 'Bruger-Indsigt', icon: MessageSquare },
  { id: 'notifications', href: '/admin/notifications', label: 'Push Beskeder', icon: Bell },
  { id: 'content', href: '/admin/content', label: 'Indhold & AI', icon: BookOpen },
  { id: 'marketing', href: '/admin/marketing', label: 'Marketing & Koder', icon: Sparkles },
  { id: 'emails', href: '/admin/emails', label: 'E-mail Kampagner', icon: Mail },
  { id: 'stats', href: '/admin/stats', label: 'SaaS Statistik', icon: BarChart },
  { id: 'markedsplads', href: '/admin/markedsplads', label: 'Markedsplads', icon: HandHelping },
  { id: 'system', href: '/admin/system', label: 'System & Fejllogs', icon: Database },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, userProfile, isUserLoading, handleLogout } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const firestore = useFirestore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);


  useEffect(() => {
    if (!isUserLoading && (!user || userProfile?.role !== 'admin')) {
      router.replace('/portal');
    }
  }, [user, userProfile, isUserLoading, router]);

  const activeSection = useMemo(() => {
    if (pathname === '/admin') return 'overview';
    const section = pathname?.split('/')[2];
    return navigation.find(nav => nav.id === section) ? section : 'overview';
  }, [pathname]);

  if (isUserLoading || !userProfile || userProfile.role !== 'admin') {
    return <AuthLoadingScreen />;
  }

  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white flex overflow-hidden selection:bg-rose-100 selection:text-rose-900">
      {/* DESKTOP SIDEBAR - Glassmorphism style */}
      <aside className="w-80 bg-slate-50 border-r border-slate-100 hidden lg:flex flex-col sticky top-0 h-screen z-30">
        <div className="p-10 flex flex-col h-full">
          <Link href="/portal" className="flex items-center gap-4 mb-14 group">
            <div className="w-12 h-12 bg-amber-950 rounded-2xl flex items-center justify-center text-amber-400 shadow-2xl shadow-amber-950/20 group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] leading-none mb-1">Cohéro</div>
              <h2 className="text-xl font-bold text-amber-950 serif">Admin</h2>
            </div>
          </Link>

          <nav className="space-y-1.5 flex-grow">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-5 mb-4">Operations</p>
            {navigation.map((item) => {
              const isActive = activeSection === item.id;
              return (
              <Link
                key={item.id}
                href={item.href}
                className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-[13px] font-bold transition-all duration-300 group relative
                  ${isActive 
                    ? 'bg-amber-950 text-white shadow-xl shadow-amber-950/10' 
                    : 'text-slate-500 hover:bg-white hover:text-amber-900 hover:translate-x-1'
                  }`}
              >
                <div className="flex items-center gap-4 relative z-10">
                  <item.icon className={`w-4 h-4 transition-colors ${isActive ? 'text-amber-400' : 'text-slate-300 group-hover:text-amber-700'}`} />
                  {item.label}
                </div>
                {isActive && (
                  <motion.div layoutId="activeNav" className="absolute inset-0 bg-amber-950 rounded-2xl -z-10 shadow-2xl shadow-amber-950/20" />
                )}
                {isActive && <ChevronRight className="w-4 h-4 text-amber-400/50" />}
              </Link>
            )})}
          </nav>

          <div className="mt-8 pt-8 border-t border-slate-200/60">
             <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="text-[9px] font-black uppercase text-amber-900 mb-3 tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    System Engine
                  </div>
                  <div className="flex items-center justify-between group-hover:translate-x-1 transition-transform">
                    <span className="text-xs font-bold text-amber-950">Live & Aktiv</span>
                    <span className="text-[10px] text-slate-400 font-bold">99.9%</span>
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 w-16 h-16 bg-emerald-50 rounded-full blur-2xl -mr-8 -mb-8 group-hover:scale-150 transition-transform duration-700"></div>
             </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* IMPROVED TOP NAV BAR */}
        <header className="h-20 flex-shrink-0 flex items-center justify-between px-8 md:px-12 bg-white/70 backdrop-blur-xl z-[40] border-b border-slate-100">
          <div className="flex items-center gap-8">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">
                  <Link href="/admin" className="hover:text-amber-900 transition-colors">Admin</Link>
                  <ChevronRight className="w-3 h-3 opacity-50" />
                  <span className="text-amber-900">{navigation.find(n => n.id === activeSection)?.label}</span>
                </div>
                <h1 className="text-xl font-bold text-amber-950 serif">
                  {navigation.find(n => n.id === activeSection)?.label}
                </h1>
              </div>
          </div>

          <div className="flex items-center gap-6">
              <div className="hidden md:flex relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-amber-900 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Hurtig søgning (⌘K)" 
                  className="w-72 pl-11 pr-4 py-2.5 bg-slate-50 border border-transparent rounded-[14px] focus:bg-white focus:border-amber-900/20 focus:ring-4 focus:ring-amber-950/5 text-xs font-medium transition-all"
                />
              </div>

              <div className="flex items-center gap-2 pr-4 border-r border-slate-200">
                <button className="p-2.5 text-slate-400 hover:text-amber-950 hover:bg-slate-50 rounded-xl transition-all relative">
                   <Bell className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-4">
                 <div className="text-right hidden sm:block">
                    <p className="text-[14px] font-bold text-slate-800 leading-none mb-1 serif">{user?.displayName?.split(' ')[0]}</p>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Operations</p>
                 </div>
                 <Link href="/settings" className="w-10 h-10 rounded-xl bg-amber-950 flex items-center justify-center text-amber-400 font-black text-sm shadow-xl shadow-amber-950/20 active:scale-95 transition-all">
                    {user?.displayName?.charAt(0)}
                 </Link>
                 <div className="lg:hidden">
                    <button 
                      onClick={() => setIsMobileMenuOpen(true)} 
                      className="p-3 bg-amber-950 text-white rounded-xl shadow-lg active:scale-95 transition-transform"
                    >
                      <Menu className="w-5 h-5" />
                    </button>
                 </div>
              </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-white relative scroll-smooth">
            <div className="relative z-10 p-8 md:p-12 pb-24 max-w-7xl mx-auto w-full">
                {children}
            </div>
        </main>
      </div>

       {/* MOBILE MENU */}
       <AnimatePresence>
       {isMobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          className="fixed inset-0 z-50 bg-white p-8 flex flex-col lg:hidden"
        >
            <div className="flex items-center justify-between mb-16">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-950 rounded-xl flex items-center justify-center text-amber-400 shadow-xl shadow-amber-950/20">
                      <Shield className="w-5 h-5" />
                    </div>
                    <span className="font-bold serif text-xl text-amber-950">Kontrolrummet</span>
                 </div>
                 <button 
                    onClick={handleMobileLinkClick} 
                    className="p-3 bg-slate-100 rounded-full text-slate-600 active:scale-90 transition-transform"
                  >
                    <X className="w-6 h-6" />
                </button>
            </div>
            
             <nav className="flex-grow space-y-2">
                {navigation.map((item) => {
                   const isActive = activeSection === item.id;
                   return (
                      <Link 
                        key={item.id}
                        href={item.href} 
                        onClick={handleMobileLinkClick} 
                        className={`flex items-center justify-between p-5 rounded-2xl transition-all shadow-sm
                          ${isActive 
                            ? 'bg-amber-950 text-white' 
                            : 'bg-slate-50 text-slate-600 active:bg-slate-100'
                          }`}
                      >
                         <div className="flex items-center gap-5">
                            <item.icon className={`w-6 h-6 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                            <span className="font-bold text-lg">{item.label}</span>
                         </div>
                         <ChevronRight className={`w-5 h-5 ${isActive ? 'opacity-50' : 'opacity-20'}`} />
                      </Link>
                   )
                })}
            </nav>
            
            <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-900 font-black text-lg shadow-inner">{user?.displayName?.charAt(0)}</div>
                    <div>
                        <p className="font-black text-amber-950 text-lg leading-tight">{user?.displayName}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Administrator</p>
                    </div>
                </div>
                <button 
                  onClick={() => {handleMobileLinkClick(); handleLogout();}} 
                  className="px-6 py-3 bg-rose-50 text-rose-600 rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-transform"
                >
                  Log ud
                </button>
            </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
