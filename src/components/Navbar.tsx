'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import Link from 'next/link';
import {
  LogOut,
  Shield,
  Scale,
  ChevronDown,
  PlayCircle,
  FileText,
  Users,
  Brain,
  Home,
  BookCopy,
  DraftingCompass,
  BookMarked,
  MessageSquare,
  HelpCircle,
  Layers,
  Presentation,
  CalendarDays,
  Wand2,
  Building,
  Mic,
  Gavel,
  Bookmark,
  Library,
  UserPlus,
  Menu,
  X,
  BookOpen,
  BrainCircuit,
  Target,
  Sparkles,
  Lightbulb,
  ChevronRight,
  ArrowRight,
  HandHelping,
  Star,
  ShoppingBag,
  Rocket,
  User as UserIcon,
  FileBox
} from 'lucide-react';

import { User } from 'firebase/auth';
import { DocumentData } from 'firebase/firestore';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationBell from './NotificationBell';
import { useApp } from '@/app/provider';
import { Snowflake, Bird, Ghost } from 'lucide-react';

import { BookSpine } from "./BookSpine";

const NavDropdown: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, children }) => {
  return (
    <div className="group relative z-30">
      <button className="flex items-center gap-2 text-[14px] font-bold text-slate-500 group-hover:text-slate-900 transition-colors pb-4 -mb-4 pt-4 -mt-4 tracking-wide">
        {icon}
        <span>{title}</span>
        <ChevronDown className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" />
      </button>
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-64 bg-white/95 backdrop-blur-xl rounded-[24px] shadow-2xl shadow-slate-900/10 border border-slate-100 p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto origin-top-center scale-95 group-hover:scale-100 duration-200">
        <ul className="space-y-1">{children}</ul>
      </div>
    </div>
  );
};

const NavDropdownLink: React.FC<{
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  isPremium?: boolean;
  userMembership?: string;
}> = ({ href, icon, children, onClick, isPremium = false, userMembership }) => {
  const hasAccess = !isPremium || (userMembership && ['Kollega+', 'Semesterpakken'].includes(userMembership));

  if (!hasAccess) {
      return (
          <li>
              <Link
                  href="/upgrade"
                  onClick={onClick}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl text-sm font-semibold text-slate-400 lg:hover:bg-slate-50 lg:hover:text-slate-900 transition-colors active:scale-[0.98]"
              >
                  <div className='flex items-center gap-3'>
                      <div className="w-8 h-8 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-lg text-slate-400">
                          {icon}
                      </div>
                      <span>{children}</span>
                  </div>
                  <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-widest">Kollega+</span>
              </Link>
          </li>
      )
  }

  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        prefetch={false}
        className="flex items-center gap-3 p-3 rounded-xl text-sm font-semibold text-slate-600 lg:hover:bg-slate-50 lg:hover:text-slate-900 transition-colors active:scale-[0.98]"
      >
        <div className="w-8 h-8 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-lg text-slate-500">
            {icon}
        </div>
        <span>{children}</span>
      </Link>
    </li>
  );
};

interface NavbarProps {
  onAuth: (mode: 'signin' | 'signup') => void;
  onLogout: () => void;
  user: User | null;
  userProfile: DocumentData | null | undefined;
  topOffset?: number;
}

const Navbar: React.FC<NavbarProps> = ({
  onAuth,
  onLogout,
  user,
  userProfile,
  topOffset = 0,
}) => {
  const { effectiveTheme } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isMobileMenuOpen]);

  const handleMobileLinkClick = (callback?: () => void) => {
    if (callback) callback();
    setIsMobileMenuOpen(false);
  };

  const mobileCategories = useMemo(() => {
    return [
      {
        title: "Hovedmenu",
        items: [

          { title: "Korrektur", path: "/korrektur", icon: <Sparkles className="w-5 h-5" /> },
          { title: "Slides", path: "/mine-seminarer", icon: <Presentation className="w-5 h-5" /> },
          { title: "Mit pensum", path: "/mine-materialer", icon: <FileBox className="w-5 h-5 text-indigo-500" /> },
          { title: "Akademiet", path: "https://akademi.cohero.dk", icon: <Wand2 className="w-5 h-5" /> },
          // { title: "Jura", path: "https://law.cohero.dk", icon: <Scale className="w-5 h-5" /> },
          { title: "Shop", path: "/shop", icon: <ShoppingBag className="w-5 h-5" /> },
          { title: "Vores Rejse", path: "/journey", icon: <Rocket className="w-5 h-5 text-rose-500" /> },
          { title: "Form fremtiden", path: "/medbestemmelse", icon: <Lightbulb className="w-5 h-5" /> },
        ]
      }
    ];

  }, []);

  if (isNative) return null;

  return (
    <>
    {/* Soft transition mask for scrolled state */}
    <motion.div 
      initial={false}
      animate={{ opacity: scrolled ? 1 : 0 }}
      className="fixed left-0 right-0 h-28 bg-gradient-to-b from-white/60 via-white/10 to-transparent z-[85] pointer-events-none backdrop-blur-[2px]"
      style={{ top: topOffset }}
    />

    <nav 
      className={`fixed left-0 right-0 z-[90] transition-all duration-700 ease-in-out px-4 py-6 md:px-12`}
      style={{ top: topOffset }}
    >
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`max-w-7xl mx-auto w-full transition-all duration-700 will-change-transform
          ${scrolled 
            ? 'bg-white/70 backdrop-blur-3xl rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-white h-20 px-8' 
            : 'bg-white/40 backdrop-blur-2xl rounded-[3rem] border border-white/40 h-24 px-10 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.05)]'
          }`}
      >
        <div className="flex items-center justify-between h-full">
          
          {/* Brand - Bookshelf Logo (Keep as requested) */}
          <div className={`flex items-end h-12 mb-1 relative active:scale-[0.98] transition-all origin-bottom ${scrolled ? 'scale-[0.9]' : 'scale-110'}`}>
            <Link
              href={user ? "/portal" : "/"}
              className="flex items-end -space-x-[1.5px]"
              aria-label="Cohéro Hjem"
            >
              <BookSpine index={0} theme={effectiveTheme} width="w-2 sm:w-3" height="h-6 sm:h-8" color="bg-white" decoration="plain" tilt="-rotate-1" />
              <BookSpine index={1} theme={effectiveTheme} width="w-3 sm:w-4" height="h-9 sm:h-11" color="bg-white" decoration="bands" />
              <BookSpine index={2} theme={effectiveTheme} width="w-1.5 sm:w-2" height="h-7 sm:h-9" color="bg-white" decoration="plain" />

              <BookSpine index={3} theme={effectiveTheme} letter="C" width="w-4 sm:w-5" height="h-10 sm:h-12" color="bg-white" decoration="bands" />
              <BookSpine index={4} theme={effectiveTheme} letter="o" width="w-4 sm:w-5" height="h-8 sm:h-10" color="bg-white" decoration="gold" />
              <BookSpine index={5} theme={effectiveTheme} letter="h" width="w-4 sm:w-5" height="h-11 sm:h-13" color="bg-white" decoration="bands" tilt="-rotate-[1.5deg]" />
              <BookSpine index={6} theme={effectiveTheme} letter="é" width="w-4 sm:w-5" height="h-9 sm:h-11" color="bg-white" decoration="stripes" />
              <BookSpine index={7} theme={effectiveTheme} letter="r" width="w-4 sm:w-5" height="h-10 sm:h-12" color="bg-white" decoration="bands" />
              <BookSpine index={8} theme={effectiveTheme} letter="o" width="w-4 sm:w-5" height="h-7 sm:h-9" color="bg-white" decoration="gold" tilt="rotate-[1deg]" />

              <BookSpine index={9} theme={effectiveTheme} width="w-2 sm:w-3" height="h-9 sm:h-11" color="bg-white" decoration="ornament" />
              <BookSpine index={10} theme={effectiveTheme} width="w-3 sm:w-4" height="h-6 sm:h-8" color="bg-white" decoration="plain" tilt="rotate-2" />
              <BookSpine index={11} theme={effectiveTheme} width="w-2 sm:w-3" height="h-8 sm:h-10" color="bg-white" decoration="bands" />
            </Link>
          </div>
          


          {/* Desktop menu - Modern Sleek Links */}
          <div className="hidden lg:flex items-center space-x-2">
            {user ? (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center space-x-1"
              >
                {[
                  { label: "Mit pensum", href: "/mine-materialer", icon: <FileBox className="w-5 h-5"/>, color: "bg-indigo-100 text-indigo-700" },
                  { label: "Akademiet", href: "https://akademi.cohero.dk", icon: <Wand2 className="w-5 h-5"/>, color: "bg-purple-100 text-purple-700" },
                  { label: "Slides", href: "/mine-seminarer", icon: <Presentation className="w-5 h-5"/>, color: "bg-emerald-100 text-emerald-700" },
                  // { label: "Jura", href: "https://law.cohero.dk", icon: <Scale className="w-5 h-5"/>, color: "bg-sky-100 text-sky-700" }
                ].map((item) => (
                  <Link 
                    key={item.label} 
                    href={item.href} 
                    target={item.href.startsWith('http') ? '_blank' : undefined}
                    rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className={`flex items-center gap-2 group px-4 py-2 rounded-2xl transition-all duration-300 ${scrolled ? 'hover:bg-slate-50' : 'hover:bg-white/40'}`}
                  >
                    <div className={`p-1.5 rounded-lg transition-all group-hover:scale-110 ${item.color} ${scrolled ? '' : 'bg-white/60 shadow-sm'}`}>
                      {React.cloneElement(item.icon as React.ReactElement, { className: "w-3.5 h-3.5" })}
                    </div>
                    <span className="text-[13px] font-black uppercase tracking-widest text-slate-700 group-hover:text-slate-950 transition-colors whitespace-nowrap">{item.label}</span>
                  </Link>
                ))}

                <NavDropdown title="Mere" icon={<Layers className="w-3.5 h-3.5 text-slate-400" />}>
                   <NavDropdownLink href="/shop" icon={<ShoppingBag className="w-4 h-4 text-rose-500" />}>Shop</NavDropdownLink>

                   <NavDropdownLink href="/korrektur" icon={<Sparkles className="w-4 h-4 text-amber-500" />}>Korrekturlæsning</NavDropdownLink>
                   <NavDropdownLink href="/medbestemmelse" icon={<Lightbulb className="w-4 h-4 text-amber-500" />}>Vision & Roadmap</NavDropdownLink>
                   <NavDropdownLink href="/praktik-rating" icon={<Star className="w-4 h-4 text-amber-500" />}>Praktik Rating</NavDropdownLink>
                   <NavDropdownLink href="/videnskabsteori" icon={<Scale className="w-4 h-4 text-indigo-500" />}>Videnskabsteori</NavDropdownLink>
                   <NavDropdownLink href="/journey" icon={<Rocket className="w-4 h-4 text-rose-500" />}>Vores Rejse</NavDropdownLink>
                   {userProfile?.role === 'admin' && (
                     <NavDropdownLink href="/admin" icon={<Shield className="w-4 h-4 text-rose-500" />}>Admin Panel</NavDropdownLink>
                   )}
                </NavDropdown>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center space-x-2"
              >
                <Link href="/upgrade" prefetch={false} className={`px-5 py-2.5 rounded-xl text-[13px] font-extrabold text-slate-600 hover:text-slate-950 transition-all`}>Priser</Link>
                <Link href="/shop" prefetch={false} className={`px-5 py-2.5 rounded-xl text-[13px] font-extrabold text-slate-600 hover:text-slate-950 transition-all flex items-center gap-2`}>
                  <ShoppingBag className="w-4 h-4 text-rose-500" />
                  Shop
                </Link>
                
                <NavDropdown title="Udforsk" icon={<Wand2 className="w-4 h-4 text-amber-500" />}>
                   <NavDropdownLink href="/korrektur" icon={<Sparkles className="w-4 h-4 text-amber-500" />}>Korrekturlæsning</NavDropdownLink>

                   <NavDropdownLink href="/om-second-opinion" icon={<Scale className="w-4 h-4 text-emerald-500" />}>Få en Second Opinion</NavDropdownLink>
                   <NavDropdownLink href="/praktik-rating" icon={<Star className="w-4 h-4 text-amber-500" />}>Giv praktik stjerner</NavDropdownLink>
                   <NavDropdownLink href="/journey" icon={<Rocket className="w-4 h-4 text-rose-500" />}>Vores Rejse</NavDropdownLink>
                   <NavDropdownLink href="/medbestemmelse" icon={<Lightbulb className="w-4 h-4 text-indigo-500" />}>Form platformen</NavDropdownLink>
                </NavDropdown>

                <div className="w-[1px] h-4 bg-slate-200/50 mx-4"></div>
              </motion.div>
            )}

          </div>


          {/* Right Side - Auth & Profile Area */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Upgrade CTA removed as per user request */}
                <NotificationBell />
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest leading-none mb-1">
                    {userProfile?.membership || ''}
                  </p>
                  <p className="text-[14px] font-bold text-slate-900 leading-none">
                    {user.displayName?.split(' ')[0]}
                  </p>
                </div>
                <Link href="/settings" className="w-10 h-10 rounded-2xl bg-amber-950 flex items-center justify-center text-amber-400 font-black text-sm shadow-lg shadow-amber-950/20 active:scale-95 transition-all lg:hover:rotate-6">
                    {user.displayName?.charAt(0)}
                </Link>
                <button onClick={onLogout} className="p-2.5 text-slate-400 lg:hover:text-rose-500 transition-all group active:scale-95">
                  <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                </button>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-6">
                <button onClick={() => onAuth('signin')} className="text-[13px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-950 transition-colors">Log ind</button>
                <button 
                  onClick={() => onAuth('signup')} 
                  className="px-8 py-3.5 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-950/20 active:scale-95 transition-all flex items-center gap-3 group"
                >
                  Opret gratis konto
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            )}
            
            {/* Mobile Hamburger - More minimalist */}
            <div className="lg:hidden">
              <button 
                onClick={() => setIsMobileMenuOpen(true)} 
                className={`p-3 rounded-2xl transition-all active:scale-95 shadow-lg shadow-amber-900/5
                  ${scrolled ? 'bg-amber-950 text-amber-400' : 'bg-white text-slate-900'}`}
                aria-label="Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </nav>
      
      {/* MOBILE FULL-SCREEN MENU WITH FRAMER MOTION */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[600] bg-white lg:hidden"
          >
            <div className="p-5 flex flex-col h-[100dvh] overflow-y-auto pb-8 sm:p-8 relative">
              
              {/* Top Modal Navigation Area */}
              <div className="flex items-center justify-between mb-8 shrink-0 bg-white sticky top-0 pt-2 pb-4 z-10 border-b border-slate-100/60">
                <Link href={user ? '/portal' : '/'} onClick={() => setIsMobileMenuOpen(false)} className="font-extrabold text-[22px] text-slate-900 tracking-tight">Cohéro</Link>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="p-2.5 bg-slate-100 rounded-full text-slate-500 active:scale-90 transition-transform"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Scrollable Content */}
              <nav className="flex-grow space-y-10 mt-2">
                {user ? (
                  <>
                    {/* Hovedmenu Link */}
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 }}
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 mb-3">Hovedområde</p>
                      <Link 
                        href="/portal" 
                        onClick={() => setIsMobileMenuOpen(false)} 
                        className="flex items-center justify-between p-5 bg-slate-900 text-white rounded-[24px] shadow-lg shadow-slate-900/10 active:scale-[0.98] transition-transform"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                              <Home className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-bold text-[16px]">Min Portal</span>
                        </div>
                        <ChevronRight className="w-5 h-5 opacity-50" />
                      </Link>
                    </motion.div>

                    {/* All categories dynamically rendered */}
                    {mobileCategories.map((category, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + (idx * 0.05) }}
                        key={idx} 
                        className="space-y-3"
                      >
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">{category.title}</p>
                        <ul className="grid grid-cols-1 gap-2.5">
                          {category.items.map((item, i) => {
                            return (
                              <li key={i}>
                                <Link 
                                  href={item.path} 
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  target={item.path.startsWith('http') ? '_blank' : undefined}
                                  rel={item.path.startsWith('http') ? 'noopener noreferrer' : undefined}
                                  prefetch={false}
                                  className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-[20px] active:scale-[0.98] active:bg-slate-50 transition-all shadow-sm"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                                      {item.icon}
                                    </div>
                                    <span className="font-bold text-slate-900 text-[15px]">{item.title}</span>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                                </Link>
                              </li>
                            )
                          })}
                        </ul>
                      </motion.div>
                    ))}

                    {/* Admin section */}
                    {userProfile?.role === 'admin' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="pt-2">
                        <Link 
                          href="/admin" 
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center justify-between p-5 bg-rose-50 text-rose-600 rounded-[24px] border border-rose-100 font-bold active:scale-[0.98] transition-transform"
                        >
                          <div className="flex items-center gap-4">
                              <Shield className="w-5 h-5" />
                              <span>Admin Kontrolpanel</span>
                          </div>
                          <ChevronRight className="w-4 h-4 opacity-50" />
                        </Link>
                      </motion.div>
                    )}
                  </>
                ) : (
                  <ul className="space-y-4 pt-4">

                    <motion.li initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.03 }}>
                        <Link href="/om-second-opinion" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between p-6 bg-emerald-50 border border-emerald-100 rounded-[24px] text-[18px] font-extrabold text-emerald-600 shadow-sm active:scale-[0.98] transition-all">
                            Få en Second Opinion <Scale className="w-5 h-5 text-emerald-400" />
                        </Link>
                    </motion.li>
                    <motion.li initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 }}>
                        <Link href="/praktik-rating" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between p-6 bg-amber-50 border border-amber-100 rounded-[24px] text-[18px] font-extrabold text-amber-600 shadow-sm active:scale-[0.98] transition-all">
                            Giv din praktik stjerner <Star className="w-5 h-5 text-amber-400" />
                        </Link>
                    </motion.li>
                    <motion.li initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}>
                        <Link href="/medbestemmelse" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-[24px] text-[18px] font-extrabold text-slate-600 shadow-sm active:scale-[0.98] transition-all">
                            Vær med til at forme Cohéro <Lightbulb className="w-5 h-5 text-amber-500" />
                        </Link>
                    </motion.li>
                      <motion.li initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.06 }}>
                        <Link href="/shop" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between p-6 bg-rose-50 border border-rose-100 rounded-[24px] text-[18px] font-extrabold text-rose-600 shadow-sm active:scale-[0.98] transition-all">
                            <span className="flex items-center gap-3">Cohéro Shop</span>
                            <ShoppingBag className="w-5 h-5 text-rose-400" />
                        </Link>
                    </motion.li>
                  </ul>

                )}
              </nav>

              {/* Bottom Sticky User Area */}
              <div className="mt-8 pt-4 shrink-0 -mx-5 px-5 bg-white">
                {user ? (
                   <div className="flex items-center justify-between gap-4 bg-white border border-slate-200 p-3 pr-4 rounded-[24px] shadow-sm">
                       <Link href="/settings" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 active:scale-95 transition-transform">
                          <div className="w-12 h-12 rounded-[16px] bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 font-extrabold text-[18px]">{user.displayName?.charAt(0)}</div>
                          <div>
                            <p className="font-bold text-slate-900 text-[15px]">{user.displayName?.split(' ')[0]}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{userProfile?.membership || "Gratis"}</p>
                          </div>
                       </Link>
                      <button 
                        onClick={() => handleMobileLinkClick(onLogout)} 
                        className="w-12 h-12 flex items-center justify-center bg-rose-50 text-rose-500 rounded-[16px] active:scale-95 transition-transform"
                      >
                        <LogOut className="w-5 h-5" />
                      </button>
                   </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Button onClick={() => handleMobileLinkClick(() => onAuth('signin'))} variant="outline" className="h-[56px] rounded-[20px] font-bold text-[15px] active:scale-[0.98]">Log ind</Button>
                    <Button onClick={() => handleMobileLinkClick(() => onAuth('signup'))} className="h-[56px] rounded-[20px] font-bold text-[15px] bg-slate-900 text-white active:scale-[0.98]">Opret en gratis konto</Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
