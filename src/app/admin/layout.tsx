
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    LayoutDashboard, 
    FileSearch,
    Users, 
    BookOpen, 
    Sparkles, 
    Database, 
    Shield, 
    ChevronRight, 
    Search, 
    Mail, 
    BarChart, 
    Menu, 
    X, 
    MessageSquare, 
    Bell, 
    HandHelping, 
    GraduationCap, 
    CreditCard, 
    Megaphone, 
    TrendingUp,
    LogOut,
    CheckCircle2,
    Command,
    Plus,
    Activity,
    Scale,
    Layers,
    History as HistoryIcon,
    Target,
    Inbox,
    ShieldAlert,
    Trophy,
    Gavel,
    Globe,
    Lightbulb
} from 'lucide-react';

import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirestore } from '@/firebase';
import { getUnreadCount } from './inbox/actions';

// Navigation structure categorized for better visibility
const navigationGroups = [
  {
    title: 'Operations',
    items: [
      { id: 'overview', href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'users', href: '/admin/users', label: 'Brugerstyring', icon: Users },
      { id: 'realtime', href: '/admin/realtime', label: 'Live Platform Puls', icon: Activity },
      { id: 'finans', href: '/admin/finans', label: 'Økonomi & MMR', icon: TrendingUp },
      { id: 'stats', href: '/admin/stats', label: 'Bruger-Analyse', icon: BarChart },
      { id: 'costs', href: '/admin/costs', label: 'AI Omkostninger', icon: CreditCard },
    ]
  },
  {
    title: 'Marketing & Leads',
    items: [
        { id: 'korrektur', href: '/admin/korrektur', label: 'Korrektur-styring', icon: FileSearch },
        { id: 'markedsplads', href: '/admin/markedsplads', label: 'Markedsplads', icon: HandHelping },
        { id: 'marketing', href: '/admin/marketing', label: 'Koder & Tilbud', icon: Sparkles },
        { id: 'campaigns', href: '/admin/campaigns', label: 'Salgskampagner', icon: Megaphone },
        { id: 'emails', href: '/admin/emails', label: 'E-mail Blasts', icon: Mail },
        { id: 'inbox', href: '/admin/inbox', label: 'Indbakke (Simply)', icon: Inbox },
        { id: 'seo', href: '/admin/seo', label: 'SEO & Meta-Data', icon: Globe },
    ]
  },
  {
    title: 'Indhold & Intelligence',
    items: [
        { id: 'content', href: '/admin/content', label: 'Platform Indhold', icon: BookOpen },
        { id: 'begreber', href: '/admin/begreber', label: 'Faglige Begreber', icon: Lightbulb },
        { id: 'education', href: '/admin/education', label: 'Uddannelsesdata', icon: GraduationCap },
        { id: 'studieordninger', href: '/admin/education/studieordninger', label: 'Studieordninger', icon: Layers },
        { id: 'dokument-analysator', href: '/admin/dokument-analysator', label: 'PDF Dokument Analysator', icon: FileSearch },
    ]
  },
  {
    title: 'Brugeroplevelse',
    items: [
        { id: 'notifications', href: '/admin/notifications', label: 'Push Beskeder', icon: Bell },
        { id: 'surveys', href: '/admin/surveys', label: 'Brugerfeedback', icon: MessageSquare },
        { id: 'support', href: '/admin/support', label: 'Support & Tickets', icon: ShieldAlert },
        { id: 'gamification', href: '/admin/gamification', label: 'Challenges & Ritualer', icon: Trophy },
        { id: 'medbestemmelse', href: '/admin/medbestemmelse', label: 'Medbestemmelse', icon: Sparkles },
        { id: 'second-opinions', href: '/admin/second-opinions', label: 'Second Opinions', icon: Scale },
    ]
  },
  {
    title: 'Sikkerhed & System',
    items: [
        { id: 'audit-logs', href: '/admin/audit-logs', label: 'Audit Logs', icon: HistoryIcon },
        { id: 'system', href: '/admin/system', label: 'System Puls', icon: Database },
        { id: 'security', href: '/admin/system/security', label: 'Sikkerhed & Deling', icon: Shield },
        { id: 'compliance', href: '/admin/system/compliance', label: 'Juridisk & GDPR', icon: Gavel },
    ]
  }
];

// Flatten for easier active section lookup
const allNavItems = navigationGroups.flatMap(g => g.items);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, userProfile, isUserLoading, handleLogout } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
        const count = await getUnreadCount();
        setUnreadCount(count);
    }
    fetchCount();
    // Poll every 5 mins
    const interval = setInterval(fetchCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isUserLoading && (!user || userProfile?.role !== 'admin')) {
      router.replace('/portal');
    }
  }, [user, userProfile, isUserLoading, router]);

  const activeSection = useMemo(() => {
    if (pathname === '/admin') return 'overview';
    
    // Sort by href length descending to prioritize most specific matches (e.g. /admin/system/security over /admin/system)
    const sortedNavItems = [...allNavItems].sort((a, b) => b.href.length - a.href.length);
    const matched = sortedNavItems.find(nav => nav.href !== '/admin' && pathname?.startsWith(nav.href));
    
    return matched ? matched.id : 'overview';
  }, [pathname]);

  if (isUserLoading || !userProfile || userProfile.role !== 'admin') {
    return <AuthLoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* SIDEBAR - Full completeness restored */}
      <aside className="w-80 bg-white border-r border-slate-200 hidden lg:flex flex-col sticky top-0 h-screen z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)] overflow-y-auto custom-scrollbar">
        <div className="flex flex-col h-full py-8">
          
          {/* Brand Logo */}
          <div className="px-10 pb-10">
            <Link href="/portal" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center text-white shadow-xl shadow-slate-900/10 group-hover:scale-105 transition-all">
                <Command className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-slate-900 serif tracking-tight">Cohéro <span className="text-indigo-600 font-bold ml-0.5">Admin</span></h2>
            </Link>
          </div>

          {/* Categorized Navigation */}
          <div className="px-6 flex-1 space-y-10">
            {navigationGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 px-4 leading-none mb-1">{group.title}</p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-bold transition-all duration-200 group relative
                          ${isActive 
                            ? 'bg-slate-950 text-white shadow-2xl shadow-slate-900/20' 
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                      >
                        <div className="flex items-center gap-3.5 relative z-10">
                          <item.icon className={`w-4 h-4 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-300 group-hover:text-slate-600'}`} />
                          {item.label}
                          {item.id === 'inbox' && unreadCount > 0 && (
                            <span className="flex-shrink-0 w-5 h-5 bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg shadow-rose-600/20 translate-x-1">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                        </div>
                        {isActive && (
                          <motion.div layoutId="activeNavIndicator" className="w-1.5 h-1.5 bg-indigo-400 rounded-full shadow-[0_0_12px_rgba(129,140,248,0.8)]" />
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Profile & Footer */}
          <div className="px-6 mt-12 pt-8 border-t border-slate-100">
             <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between group transition-all hover:bg-slate-100 border border-slate-100/50">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-900 font-black text-sm">
                      {userProfile.displayName?.charAt(0)}
                   </div>
                   <div className="min-w-0">
                      <p className="text-[13px] font-black text-slate-900 truncate serif leading-none">{userProfile.displayName?.split(' ')[0]}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Master Ops</p>
                   </div>
                </div>
                <button onClick={handleLogout} className="p-2.5 text-slate-300 hover:text-rose-500 transition-colors"><LogOut className="w-4 h-4" /></button>
             </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* TOP BAR */}
        <header className="h-20 flex-shrink-0 flex items-center justify-between px-8 md:px-12 bg-white/80 backdrop-blur-xl z-[40] border-b border-slate-200">
          <div className="flex items-center gap-12">
              <div className="hidden xl:flex items-center gap-4 bg-slate-100/50 p-2 rounded-xl border border-slate-200 group focus-within:border-indigo-600/30 transition-all">
                <Search className="w-4 h-4 ml-2 text-slate-300 group-focus-within:text-indigo-600" />
                <input type="text" placeholder="Hurtig søgning..." className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 w-64" />
              </div>
              
              <div className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-300 tracking-[0.2em]">
                <Link href="/admin" className="hover:text-slate-900 transition-colors">Workspace</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-slate-900">{allNavItems.find(n => n.id === activeSection)?.label}</span>
              </div>
          </div>

          <div className="flex items-center gap-5">
              <div className="flex items-center gap-3 pl-5 border-l border-slate-100 ml-5">
                <button className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl relative group">
                   <Bell className="w-5 h-5" />
                   <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-indigo-600 rounded-full border-2 border-white" />
                </button>
                <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-3 text-slate-600 bg-slate-100 rounded-xl active:scale-95 transition-transform"><Menu className="w-5 h-5" /></button>
              </div>
          </div>
        </header>

        {/* CONTAINER FOR CHILDREN */}
        <main className="flex-1 overflow-y-auto relative scroll-smooth overscroll-none scrollbar-hide">
            <div className="relative p-8 md:p-14 pb-32">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="max-w-[1600px] mx-auto w-full"
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
            </div>
        </main>
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
      {isMobileMenuOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 z-[60] bg-slate-950/40 backdrop-blur-sm lg:hidden" />
          <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-y-0 left-0 z-[70] w-[85%] max-w-sm bg-white shadow-2xl flex flex-col lg:hidden" >
              <div className="p-8 flex items-center justify-between border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white"><Command className="w-5 h-5" /></div>
                    <span className="font-black serif text-xl text-slate-900">Admin</span>
                  </div>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-100 rounded-lg text-slate-600 active:scale-90 transition-transform"><X className="w-6 h-6" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {navigationGroups.map((group, gIdx) => (
                    <div key={gIdx} className="mb-8">
                        <p className="text-[10px] font-black uppercase text-slate-300 px-4 mb-3 tracking-widest">{group.title}</p>
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const isActive = activeSection === item.id;
                                return (
                                    <Link key={item.id} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center justify-between p-4 rounded-xl transition-all ${isActive ? 'bg-slate-950 text-white' : 'bg-transparent text-slate-500'}`}>
                                        <div className="flex items-center gap-4">
                                            <item.icon className="w-5 h-5" />
                                            <span className="font-bold">{item.label}</span>
                                            {item.id === 'inbox' && unreadCount > 0 && (
                                                <span className="bg-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">{unreadCount}</span>
                                            )}
                                        </div>
                                        <ChevronRight className="w-4 h-4 opacity-20" />
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                ))}
              </div>
              <div className="p-8 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-900 font-black text-sm">{userProfile.displayName?.charAt(0)}</div>
                  <div><p className="font-black text-slate-900 leading-tight">{userProfile.displayName}</p><p className="text-[9px] font-bold text-slate-400">Master Ops</p></div>
                </div>
                <button onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }} className="p-3 bg-white border border-slate-200 rounded-xl text-rose-600 shadow-sm"><LogOut className="w-5 h-5" /></button>
              </div>
          </motion.div>
        </>
      )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
}
