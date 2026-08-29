'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, BookOpen, Search, Zap, FileText, Scale, Brain, 
  TrendingUp, Bell, Settings, ShoppingBag, LogOut, Menu, X, 
  Presentation, Shield, FileBox, ExternalLink, GraduationCap,
  ChevronRight, CalendarDays, Clock, Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/app/provider';
import { BookSpine } from '@/components/BookSpine';
import { useFunctions } from '@/firebase';
import { httpsCallable } from 'firebase/functions';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

/* ─── Nav item types ──────────────────────────────────── */
interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  isSSO?: boolean;
  isExternal?: boolean;
  badge?: number | null;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

/* ─── Individual nav link ─────────────────────────────── */
const NavLink = ({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) => {
  const Tag = onClick ? 'button' : Link;
  const props = onClick
    ? { onClick, className: '' }
    : { href: item.path, className: '' };

  return (
    <Tag
      {...(props as any)}
      className={`
        group relative flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)]
        text-[13px] font-semibold transition-all duration-150
        ${isActive
          ? 'text-indigo-600 bg-indigo-50/80'
          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
        }
      `}
    >
      {/* Active left-bar indicator */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-indigo-500 rounded-r-full" />
      )}

      {/* Icon */}
      <span className={`shrink-0 transition-colors ${isActive ? 'text-indigo-500' : 'text-slate-400 group-hover:text-slate-600'}`}>
        {item.icon}
      </span>

      {/* Label */}
      <span className="flex-1 text-left leading-none">{item.label}</span>

      {/* Badge */}
      {item.badge != null && item.badge > 0 && (
        <span className="ml-auto bg-indigo-500 text-white text-[9px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
          {item.badge > 99 ? '99+' : item.badge}
        </span>
      )}

      {/* External indicator */}
      {item.isExternal && (
        <ExternalLink className="w-3 h-3 opacity-40 group-hover:opacity-70 transition-opacity" />
      )}
    </Tag>
  );
};

/* ─── Main Sidebar component ──────────────────────────── */
export default function Sidebar() {
  const { user, userProfile, handleLogout, effectiveTheme } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const functions = useFunctions();
  const firestore = useFirestore();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSSOLoading, setIsSSOLoading] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Unread notification count
  const notifQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'users', user.uid, 'notifications'),
      where('read', '==', false),
      limit(10)
    );
  }, [firestore, user?.uid]);
  const { data: unreadNotifs } = useCollection<any>(notifQuery);
  const unreadCount = unreadNotifs?.length ?? 0;

  // SSO redirect handler
  const handleSSORedirect = async (url: string, e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!functions || isSSOLoading) { window.open(url, '_blank'); return; }
    setIsSSOLoading(true);
    try {
      const generateSSOToken = httpsCallable(functions, 'generateSSOToken');
      const result = await generateSSOToken();
      const token = (result.data as any).token;
      const targetUrl = new URL(url);
      targetUrl.searchParams.set('token', token);
      window.open(targetUrl.toString(), '_blank');
    } catch {
      window.open(url, '_blank');
    } finally {
      setIsSSOLoading(false);
    }
  };

  // Active module label
  const activeModuleLabel = userProfile?.semester
    ? typeof userProfile.semester === 'string' && userProfile.semester.length > 4
      ? userProfile.semester.split(' ').slice(0, 3).join(' ')
      : `Semester ${userProfile.semester}`
    : null;

  // Navigation structure - 4 Kernesøjler
  const sections: NavSection[] = [
    {
      label: 'Struktur',
      items: [
        { label: 'Dashboard', path: '/portal', icon: <LayoutDashboard className="w-4 h-4" /> },
        { label: 'Sagsanalyse', path: '/case-analyser', icon: <FileText className="w-4 h-4 text-indigo-500" /> },
      ],
    },
    {
      label: 'Planlægning',
      items: [
        { label: 'Semesterplanlægger', path: '/semester-planlaegger', icon: <CalendarDays className="w-4 h-4" /> },
        { label: 'Studie- & Læseplan', path: '/studieplanlaegger', icon: <Clock className="w-4 h-4" /> },
        { label: 'Oplægsarkitekt', path: '/seminar-architect', icon: <Presentation className="w-4 h-4" /> },
      ],
    },
    {
      label: 'Organisering',
      items: [
        { label: 'Mit Pensum & Noter', path: '/mine-materialer', icon: <FileBox className="w-4 h-4" /> },
        { label: 'Mine Semesterplaner', path: '/mine-semesterplaner', icon: <CalendarDays className="w-4 h-4" /> },
      ],
    },
    {
      label: 'Videnssøgning',
      items: [
        { label: 'Pensumsøgning', path: '/pensum-search', icon: <Search className="w-4 h-4" /> },
        { label: 'Begrebsguide', path: '/concept-explainer', icon: <Brain className="w-4 h-4" /> },
        { label: 'Second Opinion', path: '/second-opinion', icon: <Scale className="w-4 h-4" /> },
        { label: 'Lovportal', path: 'https://law.cohero.dk/', icon: <Scale className="w-4 h-4 text-indigo-500" />, isSSO: true, isExternal: true },
        { label: 'Forskningsrapporter', path: '/vive-indsigt', icon: <TrendingUp className="w-4 h-4" /> },
      ],
    },
    {
      label: 'Konto',
      items: [
        { label: 'Notifikationer', path: '/notifications', icon: <Bell className="w-4 h-4" />, badge: unreadCount },
      ],
    },
  ];

  if (userProfile?.role === 'admin') {
    sections[sections.length - 1].items.push({ label: 'Admin Panel', path: '/admin', icon: <Shield className="w-4 h-4" /> });
  }

  // Inner sidebar contents
  const SidebarContent = () => (
    <div className="flex flex-col h-full justify-between overflow-y-auto no-scrollbar">
      <div className="space-y-5">
        {/* Brand */}
        <div className="px-3 pb-3 pt-2">
          <Link href="/portal" className="flex items-center gap-2 select-none group">
            <img 
              src="/cohero-logo.png" 
              alt="Cohéro Student" 
              className="h-7 w-auto max-w-[130px] object-contain block -translate-y-0.5" 
            />
            <span className="text-[9px] font-black tracking-widest uppercase bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2 py-0.5 rounded-full">
              Student
            </span>
          </Link>
        </div>

        {/* Nav sections */}
        {sections.map((section) => (
          <div key={section.label}>
            <p className="label-2xs text-slate-300 px-3 mb-1.5">{section.label}</p>
            <nav className="space-y-0.5">
              {section.items.map((item, idx) => {
                const isActive = pathname === item.path || 
                  (item.path !== '/portal' && !item.isSSO && pathname?.startsWith(item.path));

                if (item.isSSO) {
                  return (
                    <NavLink
                      key={idx}
                      item={item}
                      isActive={false}
                      onClick={(e) => handleSSORedirect(item.path, e)}
                    />
                  );
                }

                return <NavLink key={idx} item={item} isActive={Boolean(isActive)} />;
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Bottom: Settings + User card */}
      <div className="pt-4 border-t border-slate-100/80 space-y-1">
        <NavLink
          item={{ label: 'Indstillinger', path: '/settings', icon: <Settings className="w-4 h-4" /> }}
          isActive={pathname === '/settings'}
        />

        {user && (
          <div className="mt-2 flex items-center justify-between gap-2 bg-slate-50 border border-slate-200/80 rounded-[var(--radius-md)] p-2.5 shadow-sm">
            <Link href="/settings" className="flex items-center gap-3 overflow-hidden flex-1 min-w-0 group hover:opacity-80 transition-opacity">
              {/* Avatar */}
              <div className="w-9 h-9 shrink-0 rounded-[10px] bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white font-black text-sm shadow-sm">
                {(user.displayName?.charAt(0) || user.email?.charAt(0) || '?').toUpperCase()}
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="font-semibold text-slate-900 text-[13px] truncate leading-tight group-hover:text-indigo-600 transition-colors">
                  {user.displayName || user.email?.split('@')[0]}
                </p>
                <p className="label-2xs text-slate-400 truncate">
                  {activeModuleLabel || userProfile?.membership || 'Basis'}
                </p>
              </div>
            </Link>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleLogout();
              }}
              className="w-9 h-9 flex items-center justify-center bg-rose-50 border border-rose-100/80 text-rose-600 hover:bg-rose-100 hover:text-rose-700 rounded-xl transition-all shrink-0 cursor-pointer shadow-sm active:scale-95 z-30"
              title="Log ud af Cohéro"
              aria-label="Log ud"
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
      {/* ── Mobile top header ── */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white/90 backdrop-blur-md border-b border-slate-100/60 z-30 flex items-center justify-between px-5 md:hidden">
        <Link href="/portal" className="flex items-center gap-2">
          <img 
            src="/cohero-logo.png" 
            alt="Cohéro Student" 
            className="h-6 w-auto max-w-[110px] object-contain block" 
          />
          <span className="text-[8px] font-black tracking-widest uppercase bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-1.5 py-0.5 rounded-full">
            Student
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Link href="/notifications" className="relative p-2">
              <Bell className="w-5 h-5 text-slate-500" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full" />
            </Link>
          )}
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 text-slate-600 hover:text-slate-900 active:scale-90 transition-transform rounded-xl hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200/60 shadow-2xl z-50 flex flex-col py-6 px-4 md:hidden"
            >
              <button
                onClick={() => setIsMobileOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-4 h-4" />
              </button>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-white/85 backdrop-blur-xl border-r border-slate-200/50 flex-col py-6 px-4 z-[100] shadow-sm">
        <SidebarContent />
      </aside>
    </>
  );
}
