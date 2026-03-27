'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronRight,
  ArrowRight,
  HandHelping,
  Star
} from 'lucide-react';
import { User } from 'firebase/auth';
import { DocumentData } from 'firebase/firestore';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationBell from './NotificationBell';

const BookSpine: React.FC<{
  letter?: string;
  height: string;
  width: string;
  color: string;
  tilt?: string;
  decoration?: 'bands' | 'stripes' | 'plain' | 'gold' | 'ornament';
  index?: number;
}> = ({ letter, height, width, color, tilt = '', decoration = 'plain', index = 0 }) => (
  <motion.div
    initial={{ y: 0 }}
    animate={{ 
      y: [0, -10, 0],
    }}
    transition={{
      duration: 1.5,
      repeat: Infinity,
      repeatDelay: 3,
      ease: [0.34, 1.56, 0.64, 1], // Bouncy Cubic Bezier (Spring-like)
      delay: index * 0.12
    }}
    whileHover={{ 
      y: -12, 
      transition: { type: "spring", stiffness: 400, damping: 10 } 
    }}
    className={`relative flex flex-col items-center justify-end ${width} ${height} ${color} 
    rounded-t-[2px] shadow-[inset_-1px_0_3px_rgba(0,0,0,0.1),2px_0_5px_rgba(0,0,0,0.05)] 
    transition-all duration-300 ease-out
    ${tilt} border border-black/20 z-10 cursor-pointer group/book`}
  >
    <div className="absolute inset-0 opacity-15 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] pointer-events-none"></div>

    {/* Elegant Gold Glint Effect */}
    {decoration === 'gold' && (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 + index }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]"
        />
      </div>
    )}

    {decoration === 'bands' && (
      <>
        <div className="absolute top-3 w-full h-[1px] bg-black/20"></div>
        <div className="absolute top-4 w-full h-[1px] bg-black/5"></div>
        <div className="absolute bottom-8 w-full h-[2px] bg-black/10"></div>
        <div className="absolute bottom-10 w-full h-[1px] bg-black/10"></div>
      </>
    )}
    {decoration === 'gold' && (
      <>
        <div className="absolute top-2 w-[80%] h-[1px] bg-black/10"></div>
        <div className="absolute top-4 w-[60%] h-[1px] bg-black/5"></div>
        <div className="absolute bottom-6 w-[80%] h-[1px] bg-black/10"></div>
      </>
    )}
    {decoration === 'ornament' && (
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-2 h-6 border border-black/10 rounded-full opacity-20 group-hover/book:opacity-40 transition-opacity"></div>
    )}
    {decoration === 'stripes' && (
      <div className="absolute inset-y-4 left-1/2 -translate-x-1/2 w-[2px] bg-black/5 border-x border-black/5"></div>
    )}

    {letter && (
      <motion.span 
        whileHover={{ scale: 1.1 }}
        className="mb-3 text-[12px] font-black text-black/80 uppercase tracking-tighter select-none z-20"
      >
        {letter}
      </motion.span>
    )}
    
    {/* Subtle Glow on Hover */}
    <div className="absolute inset-0 bg-white/0 group-hover/book:bg-white/5 transition-colors pointer-events-none rounded-t-[2px]"></div>
  </motion.div>
);

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
  const hasAccess = !isPremium || (userMembership && ['Kollega+', 'Semesterpakken', 'Kollega++'].includes(userMembership));

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
  onAuth: (mode: 'login' | 'signup') => void;
  onLogout: () => void;
  user: User | null;
  userProfile: DocumentData | null | undefined;
}

const Navbar: React.FC<NavbarProps> = ({
  onAuth,
  onLogout,
  user,
  userProfile,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
    const categories = [
      {
        title: "Træning",
        items: [
          { title: "Case-træner", path: "/case-trainer", icon: <BookCopy className="w-5 h-5" /> },
          { title: "Journal-træner", path: "/journal-trainer", icon: <FileText className="w-5 h-5" /> },
          { title: "Eksamens-Arkitekten", path: "/exam-architect", icon: <DraftingCompass className="w-5 h-5" /> },
          { title: "Seminar-Arkitekten", path: "/seminar-architect", icon: <Presentation className="w-5 h-5" /> },
          { title: "Mundtlig Eksamens-Træner", path: "/mundtlig-eksamenstraener", icon: <Mic className="w-5 h-5" /> },
          { title: "Semester-Planlægger", path: "/semester-planlaegger", icon: <CalendarDays className="w-5 h-5" />, isPremium: true },
          { title: "Memento", path: "/memento", icon: <Brain className="w-5 h-5" /> },
        ]
      },
      {
        title: "Viden",
        items: [
          { title: "Lovportal", path: "/lov-portal", icon: <Scale className="w-5 h-5" /> },
          { title: "Begrebsguide", path: "/concept-explainer", icon: <Wand2 className="w-5 h-5" /> },
          { title: "Folketinget Direkte", path: "/folketinget", icon: <Building className="w-5 h-5" /> },
          { title: "VIVE Indsigt", path: "/vive-indsigt", icon: <BookCopy className="w-5 h-5" /> },
          { title: "Studieteknikker", path: "/teknikker", icon: <BrainCircuit className="w-5 h-5" /> },
        ]
      },
      {
        title: "Fællesskab",
        items: [
          { title: "Studiegrupper", path: "https://group.cohero.dk", icon: <UserPlus className="w-5 h-5" /> },
        ]
      },
      {
        title: "Mit Arkiv",
        items: [
          { title: "Min Logbog", path: "/min-logbog", icon: <BookMarked className="w-5 h-5" /> },
          { title: "Mine Byggeplaner", path: "/mine-byggeplaner", icon: <DraftingCompass className="w-5 h-5" /> },
          { title: "Gemte Paragraffer", path: "/mine-gemte-paragraffer", icon: <Gavel className="w-5 h-5" /> },
        ]
      }
    ];

    if (userProfile?.isQualified) {
      // Filter Viden to only Lovportal and Folketinget
      const viden = categories.find(c => c.title === "Viden");
      if (viden) {
        viden.items = viden.items.filter(i => ["Lovportal", "Folketinget Direkte"].includes(i.title));
      }
      // Hide Træning, Fællesskab, Arkiv
      return categories.filter(c => c.title === "Viden");
    }

    return categories;
  }, [userProfile?.isQualified]);

  return (
    <>
    {/* Soft transition mask for scrolled state */}
    <motion.div 
      initial={false}
      animate={{ opacity: scrolled ? 1 : 0 }}
      className="fixed top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/90 via-white/40 to-transparent z-[90] pointer-events-none backdrop-blur-sm"
    />

    <nav className={`fixed top-0 left-0 right-0 z-[200] transition-all duration-700 ease-in-out px-4 py-4 md:px-8 pointer-events-none`}>
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className={`max-w-7xl mx-auto w-full transition-all duration-500 pointer-events-auto will-change-transform
          ${scrolled 
            ? 'bg-[#FDFCF8]/90 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(45,35,15,0.1)] border border-white/60 h-16 px-6' 
            : 'bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/20 h-20 px-6 sm:px-8 shadow-sm'
          }`}
      >
        <div className="flex items-center justify-between h-full">
          
          {/* Brand - Bookshelf Logo (Keep as requested) */}
          <div className={`flex items-end h-12 mb-1 relative active:scale-[0.98] transition-all origin-bottom ${scrolled ? 'scale-[0.85]' : 'scale-100'}`}>
            <Link
              href={user ? "/portal" : "/"}
              className="flex items-end -space-x-[1px]"
              aria-label="Cohéro Hjem"
            >
              <BookSpine index={0} width="w-2 sm:w-2.5" height="h-6 sm:h-7" color="bg-white" decoration="plain" tilt="-rotate-1" />
              <BookSpine index={1} width="w-2.5 sm:w-3" height="h-9 sm:h-10" color="bg-white" decoration="bands" />
              <BookSpine index={2} width="w-1 sm:w-1.5" height="h-7 sm:h-8" color="bg-white" decoration="plain" />

              <BookSpine index={3} letter="C" width="w-3.5 sm:w-4" height="h-10 sm:h-11" color="bg-white" decoration="bands" />
              <BookSpine index={4} letter="o" width="w-3.5 sm:w-4" height="h-8 sm:h-9" color="bg-white" decoration="gold" />
              <BookSpine index={5} letter="h" width="w-3.5 sm:w-4" height="h-11 sm:h-12" color="bg-white" decoration="bands" tilt="-rotate-[1.5deg]" />
              <BookSpine index={6} letter="é" width="w-3.5 sm:w-4" height="h-9 sm:h-10" color="bg-white" decoration="stripes" />
              <BookSpine index={7} letter="r" width="w-3.5 sm:w-4" height="h-10 sm:h-11" color="bg-white" decoration="bands" />
              <BookSpine index={8} letter="o" width="w-3.5 sm:w-4" height="h-7 sm:h-8" color="bg-white" decoration="gold" tilt="rotate-[1deg]" />

              <BookSpine index={9} width="w-2 sm:w-2.5" height="h-9 sm:h-10" color="bg-white" decoration="ornament" />
              <BookSpine index={10} width="w-2.5 sm:w-3" height="h-6 sm:h-7" color="bg-white" decoration="plain" tilt="rotate-2" />
              <BookSpine index={11} width="w-2 sm:w-2.5" height="h-8 sm:h-9" color="bg-white" decoration="bands" />
            </Link>
          </div>

          {/* Desktop menu - Modern Sleek Links */}
          <div className="hidden lg:flex items-center space-x-2">
            {user ? (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center space-x-2"
              >
                <Link href="/portal" className={`flex items-center gap-2 group px-4 py-2 rounded-2xl transition-all duration-300 ${scrolled ? 'hover:bg-slate-50' : 'hover:bg-white/40'}`}>
                  <div className={`p-1.5 rounded-lg transition-colors group-hover:bg-amber-100 group-hover:text-amber-700 ${scrolled ? 'bg-slate-100 text-slate-500' : 'bg-white/60 text-slate-600'}`}>
                    <Home className="w-3.5 h-3.5"/>
                  </div>
                  <span className="text-[13px] font-black uppercase tracking-widest text-slate-700 group-hover:text-amber-950 transition-colors">Portal</span>
                </Link>
                
                <div className="w-[1px] h-4 bg-slate-200/50 mx-2"></div>
                
                {!userProfile?.isQualified && (
                    <>
                    <NavDropdown title="Træning" icon={<PlayCircle className="w-4 h-4 text-slate-400"/>}>
                    <NavDropdownLink href="/case-trainer" icon={<BookCopy className="w-4 h-4"/>}>Case-træner</NavDropdownLink>
                    <NavDropdownLink href="/journal-trainer" icon={<FileText className="w-4 h-4"/>}>Journal-træner</NavDropdownLink>
                    <NavDropdownLink href="/exam-architect" icon={<DraftingCompass className="w-4 h-4" />}>Eksamens-Arkitekten</NavDropdownLink>
                    <NavDropdownLink href="/seminar-architect" icon={<Presentation className="w-4 h-4" />}>Seminar-Arkitekten</NavDropdownLink>
                    <NavDropdownLink href="/mundtlig-eksamenstraener" icon={<Mic className="w-4 h-4" />}>Mundtlig Træner</NavDropdownLink>
                    <NavDropdownLink href="/semester-planlaegger" icon={<CalendarDays className="w-4 h-4" />} isPremium={true} userMembership={userProfile?.membership}>Semester-Planlægger</NavDropdownLink>
                    <NavDropdownLink href="/memento" icon={<Brain className="w-4 h-4"/>}>Memento</NavDropdownLink>
                    </NavDropdown>

                    <NavDropdown title="Viden" icon={<BookOpen className="w-4 h-4 text-slate-400"/>}>
                    <NavDropdownLink href="/lov-portal" icon={<Scale className="w-4 h-4"/>}>Lovportal</NavDropdownLink>
                    <NavDropdownLink href="/concept-explainer" icon={<Wand2 className="w-4 h-4" />}>Begrebsguide</NavDropdownLink>
                    <NavDropdownLink href="/folketinget" icon={<Building className="w-4 h-4" />}>Folketinget</NavDropdownLink>
                    <NavDropdownLink href="/vive-indsigt" icon={<BookCopy className="w-4 h-4"/>}>VIVE Indsigt</NavDropdownLink>
                    <NavDropdownLink href="/teknikker" icon={<BrainCircuit className="w-4 h-4"/>}>Studieteknikker</NavDropdownLink>
                    </NavDropdown>

                    <NavDropdown title="Fællesskab" icon={<Users className="w-4 h-4 text-slate-400"/>}>
                    <NavDropdownLink href="https://group.cohero.dk" icon={<UserPlus className="w-4 h-4"/>}>Studiegrupper</NavDropdownLink>
                    </NavDropdown>
                    
                    <NavDropdown title="Arkiv" icon={<Layers className="w-4 h-4 text-slate-400"/>}>
                    <NavDropdownLink href="/min-logbog" icon={<BookMarked className="w-4 h-4"/>}>Min Logbog</NavDropdownLink>
                    <NavDropdownLink href="/mine-byggeplaner" icon={<DraftingCompass className="w-4 h-4"/>}>Mine Byggeplaner</NavDropdownLink>
                    <NavDropdownLink href="/mine-gemte-paragraffer" icon={<Gavel className="w-4 h-4"/>}>Gemte Paragraffer</NavDropdownLink>
                    </NavDropdown>
                    </>
                )}

                {userProfile?.isQualified && (
                    <NavDropdown title="Viden" icon={<BookOpen className="w-4 h-4 text-slate-400"/>}>
                        <NavDropdownLink href="/lov-portal" icon={<Scale className="w-4 h-4"/>}>Lovportal</NavDropdownLink>
                        <NavDropdownLink href="/folketinget" icon={<Building className="w-4 h-4" />}>Folketinget</NavDropdownLink>
                    </NavDropdown>
                )}

                {userProfile?.role === 'admin' && (
                  <>
                    <div className="w-[1px] h-4 bg-slate-200/50 mx-2"></div>
                    <Link href="/admin" className="group flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-rose-50 transition-all">
                      <Shield className="w-4 h-4 text-rose-500" />
                      <span className="text-[13px] font-black uppercase tracking-widest text-rose-500">Admin</span>
                    </Link>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center space-x-1"
              >
                {[
                  { label: "Rådgivning (Borger)", href: "/raadgivning", type: "link", highlight: true },
                  { label: "Hvorfor Cohéro?", href: "/hvorfor", type: "link" },
                  { label: "Værktøjer", href: "#vaerktojer", type: "anchor" },
                  { label: "Priser", href: "#priser", type: "anchor" }
                ].map((link, idx) => (
                  <motion.div key={link.label} className="relative group overflow-hidden">
                    {link.type === 'link' ? (
                      <Link 
                        href={link.href} 
                        className={`block px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all relative z-10 
                        ${link.highlight ? 'text-rose-600' : 'text-slate-600'}
                        ${scrolled ? 'hover:text-slate-950' : 'hover:text-slate-950'}
                      `}>
                        {link.label}
                      </Link>
                    ) : (
                      <a 
                        href={link.href} 
                        className={`block px-5 py-2.5 rounded-xl text-[13px] font-bold text-slate-600 transition-all relative z-10
                        ${scrolled ? 'hover:text-slate-950' : 'hover:text-slate-950'}
                      `}>
                        {link.label}
                      </a>
                    )}
                    {/* Animated Underline */}
                    <div className="absolute bottom-1 left-5 right-5 h-[2px] bg-amber-500 translate-y-[4px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out" />
                    
                    {/* Hover Glow */}
                    <div className="absolute inset-0 bg-amber-50/50 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-300 rounded-xl -z-0" />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>


          {/* Right Side - Auth & Profile Area */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Upgrade CTA for free users */}
                {(userProfile?.membership === 'Kollega' || !userProfile?.membership) && (
                  <Link href="/upgrade" className="hidden lg:flex items-center gap-2 px-4 py-2 bg-amber-500 text-amber-950 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/10 active:scale-95 whitespace-nowrap">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    Opgrader
                  </Link>
                )}
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
              <div className="hidden lg:flex items-center gap-4">
                <button onClick={() => onAuth('login')} className="px-5 py-2.5 text-[14px] font-bold text-slate-700 hover:text-slate-950 transition-colors">Log ind</button>
                <button onClick={() => onAuth('signup')} className="relative px-6 py-2.5 bg-gradient-to-br from-amber-950 to-slate-900 text-amber-400 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-[0_10px_30px_-10px_rgba(45,35,15,0.4)] active:scale-95 transition-all flex items-center gap-2 group border border-white/5">
                  <span className="relative z-10">Bliv medlem</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform relative z-10"/>
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
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
            className="fixed inset-0 z-[150] bg-white lg:hidden"
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
                            const hasAccess = !item.isPremium || (userProfile?.membership && ['Kollega+', 'Semesterpakken', 'Kollega++'].includes(userProfile.membership));
                            return (
                              <li key={i}>
                                <Link 
                                  href={hasAccess ? item.path : '/upgrade'} 
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-[20px] active:scale-[0.98] active:bg-slate-50 transition-all shadow-sm"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                                      {item.icon}
                                    </div>
                                    <span className="font-bold text-slate-900 text-[15px]">{item.title}</span>
                                  </div>
                                  {!hasAccess ? (
                                    <span className="text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full shrink-0">Kollega+</span>
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                                  )}
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
                    <motion.li initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.02 }}>
                        <Link href="/raadgivning" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between p-6 bg-rose-50 border border-rose-100 rounded-[24px] text-[18px] font-extrabold text-rose-600 shadow-sm active:scale-[0.98] transition-all">
                            Rådgivning (Borger) <HandHelping className="w-5 h-5 text-rose-400" />
                        </Link>
                    </motion.li>
                    <motion.li initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}>
                        <a href="#vaerktojer" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-[24px] text-[18px] font-extrabold text-slate-900 shadow-sm active:scale-[0.98] transition-all">
                            Værktøjer <ChevronRight className="w-5 h-5 text-slate-300" />
                        </a>
                    </motion.li>
                    <motion.li initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                        <a href="#priser" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-[24px] text-[18px] font-extrabold text-slate-900 shadow-sm active:scale-[0.98] transition-all">
                            Priser <ChevronRight className="w-5 h-5 text-slate-300" />
                        </a>
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
                    <Button onClick={() => handleMobileLinkClick(() => onAuth('login'))} variant="outline" className="h-[56px] rounded-[20px] font-bold text-[15px] active:scale-[0.98]">Log ind</Button>
                    <Button onClick={() => handleMobileLinkClick(() => onAuth('signup'))} className="h-[56px] rounded-[20px] font-bold text-[15px] bg-slate-900 text-white active:scale-[0.98]">Bliv medlem</Button>
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
