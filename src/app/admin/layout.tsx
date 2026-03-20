
'use client';
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, BookOpen, Sparkles, Database, Shield, ChevronRight, Search, Mail, BarChart, Menu, X, MessageSquare, Bell } from 'lucide-react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';

const navigation = [
  { id: 'overview', href: '/admin', label: 'Overblik', icon: LayoutDashboard },
  { id: 'users', href: '/admin/users', label: 'Brugerstyring', icon: Users },
  { id: 'surveys', href: '/admin/surveys', label: 'Bruger-Indsigt', icon: MessageSquare },
  { id: 'notifications', href: '/admin/notifications', label: 'Push Beskeder', icon: Bell },
  { id: 'content', href: '/admin/content', label: 'Indhold & AI', icon: BookOpen },
  { id: 'marketing', href: '/admin/marketing', label: 'Marketing & Koder', icon: Sparkles },
  { id: 'stats', href: '/admin/stats', label: 'SaaS Statistik', icon: BarChart },
  { id: 'system', href: '/admin/system', label: 'Aktivitetslog', icon: Database },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, userProfile, isUserLoading, handleLogout } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isUserLoading && (!user || userProfile?.role !== 'admin')) {
      router.replace('/portal');
    }
  }, [user, userProfile, isUserLoading, router]);

  if (isUserLoading || !userProfile || userProfile.role !== 'admin') {
    return <AuthLoadingScreen />;
  }

  const getActiveSection = () => {
    if (pathname === '/admin') return 'overview';
    const section = pathname.split('/')[2];
    return navigation.find(nav => nav.id === section) ? section : 'overview';
  }
  const activeSection = getActiveSection();

  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex">
      {/* DESKTOP SIDEBAR */}
      <aside className="w-72 bg-white border-r border-amber-100 hidden lg:flex flex-col sticky top-0 h-screen">
        <div className="p-8">
          <Link href="/portal" className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 bg-amber-950 rounded-[1.2rem] flex items-center justify-center text-amber-400 shadow-xl shadow-amber-950/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] leading-none mb-1">Cohéro Admin</div>
              <h2 className="text-xl font-bold text-amber-950 serif">Kontrolrummet</h2>
            </div>
          </Link>

          <nav className="space-y-1.5">
            {navigation.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-sm font-bold transition-all group ${
                  activeSection === item.id 
                  ? 'bg-amber-950 text-white shadow-2xl shadow-amber-950/20' 
                  : 'text-slate-500 hover:bg-amber-50 hover:text-amber-950'
                }`}
              >
                <div className="flex items-center gap-4">
                  <item.icon className={`w-5 h-5 ${activeSection === item.id ? 'text-amber-400' : 'text-slate-300 group-hover:text-amber-700'}`} />
                  {item.label}
                </div>
                {activeSection === item.id && <ChevronRight className="w-4 h-4 text-amber-400/50" />}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-amber-50">
           <div className="p-5 bg-amber-50/50 rounded-3xl border border-amber-100 relative overflow-hidden group">
              <div className="relative z-10">
                <div className="text-[10px] font-black uppercase text-amber-900 mb-3 tracking-widest flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  System Status
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950">AI Engine Aktiv</span>
                  <span className="text-[10px] text-slate-400">99.9% oppetid</span>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-1000"></div>
           </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col w-full lg:max-w-[calc(100vw-18rem)]">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8 p-6 md:p-12 pb-6 md:pb-6 sticky top-0 bg-[#FDFCF8]/80 backdrop-blur-md z-20 border-b border-amber-50">
          <div className="flex items-center justify-between w-full md:w-auto">
              <div className="animate-ink">
                <h1 className="text-3xl md:text-4xl font-bold text-amber-950 serif capitalize">
                  {navigation.find(n => n.id === activeSection)?.label}
                </h1>
              </div>
              <div className="lg:hidden">
                  <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -mr-2">
                    <Menu className="w-6 h-6 text-slate-600" />
                  </button>
              </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
             <div className="relative group w-full md:w-80">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-amber-700 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Hurtig søgning..." 
                  className="w-full pl-12 pr-5 py-4 bg-white border border-amber-100 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-amber-950/5 focus:border-amber-950 text-sm shadow-sm transition-all"
                />
             </div>
             <button className="p-4 bg-white border border-amber-100 rounded-2xl relative hover:bg-amber-50 transition-all shadow-sm">
                <Mail className="w-5 h-5 text-amber-950" />
                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
             </button>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-12 overflow-y-auto">
            {children}
        </main>
      </div>

       {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-[#FDFCF8] p-6 flex flex-col lg:hidden animate-fade-in-up">
            <div className="flex items-center justify-between mb-16">
                 <Link href="/admin" onClick={handleMobileLinkClick} className="font-bold serif text-2xl text-amber-950">Kontrolrummet</Link>
                 <button onClick={handleMobileLinkClick} className="p-2 -mr-2">
                    <X className="w-6 h-6 text-slate-600" />
                </button>
            </div>
             <nav className="flex-grow">
              <ul className="space-y-4">
                {navigation.map((item) => (
                   <li key={item.id}>
                      <Link 
                        href={item.href} 
                        onClick={handleMobileLinkClick} 
                        className={`flex items-center gap-6 p-4 rounded-xl text-lg font-bold transition-all ${
                            activeSection === item.id 
                            ? 'bg-amber-950 text-white' 
                            : 'text-slate-600 hover:bg-amber-50'
                        }`}
                      >
                         <item.icon className={`w-5 h-5 ${activeSection === item.id ? 'text-amber-400' : 'text-slate-400'}`} />
                         {item.label}
                      </Link>
                   </li>
                ))}
              </ul>
            </nav>
            <div className="py-6 border-t border-amber-100/60 flex items-center justify-between">
                <Link href="/settings" onClick={handleMobileLinkClick} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-900 font-bold text-xs">{user?.displayName?.charAt(0)}</div>
                    <div>
                        <p className="font-bold text-amber-950 text-sm">{user?.displayName}</p>
                        <p className="text-xs text-slate-500">Se indstillinger</p>
                    </div>
                </Link>
                <button onClick={() => {handleMobileLinkClick(); handleLogout();}} className="text-red-500 font-bold text-sm">Log ud</button>
            </div>
        </div>
      )}
    </div>
  );
}
