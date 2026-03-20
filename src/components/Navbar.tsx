
'use client';

import React, { useState } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { User } from 'firebase/auth';
import { DocumentData } from 'firebase/firestore';
import { Button } from './ui/button';
import Image from 'next/image';

const BookSpine: React.FC<{
  letter?: string;
  height: string;
  width: string;
  color: string;
  tilt?: string;
  decoration?: 'bands' | 'stripes' | 'plain' | 'gold' | 'ornament';
}> = ({ letter, height, width, color, tilt = '', decoration = 'plain' }) => (
  <div
    className={`relative flex flex-col items-center justify-end ${width} ${height} ${color} 
    rounded-t-[2px] shadow-[inset_-1px_0_3px_rgba(0,0,0,0.3),inset_1px_0_2px_rgba(255,255,255,0.1),2px_0_5px_rgba(0,0,0,0.2)] 
    transition-all duration-300 ease-out
    ${tilt} border-r border-black/10 z-10`}
  >
    <div className="absolute inset-0 opacity-15 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] pointer-events-none"></div>

    {decoration === 'bands' && (
      <>
        <div className="absolute top-3 w-full h-[1px] bg-black/30"></div>
        <div className="absolute top-4 w-full h-[1px] bg-white/10"></div>
        <div className="absolute bottom-8 w-full h-[2px] bg-black/20"></div>
        <div className="absolute bottom-10 w-full h-[1px] bg-black/20"></div>
      </>
    )}
    {decoration === 'gold' && (
      <>
        <div className="absolute top-2 w-[80%] h-[1px] bg-amber-200/40 shadow-[0_0_8px_rgba(252,211,77,0.4)]"></div>
        <div className="absolute top-4 w-[60%] h-[1px] bg-amber-200/20"></div>
        <div className="absolute bottom-6 w-[80%] h-[1px] bg-amber-200/30"></div>
      </>
    )}
    {decoration === 'ornament' && (
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-2 h-6 border border-white/10 rounded-full opacity-20"></div>
    )}
    {decoration === 'stripes' && (
      <div className="absolute inset-y-4 left-1/2 -translate-x-1/2 w-[2px] bg-white/5 border-x border-black/10"></div>
    )}

    {letter && (
      <span className="mb-3 text-[12px] font-black text-amber-50/90 uppercase tracking-tighter serif select-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
        {letter}
      </span>
    )}
  </div>
);

const NavDropdown: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, children }) => {
  return (
    <div className="group relative z-30">
      <button className="flex items-center gap-2 text-sm font-bold text-slate-500 group-hover:text-amber-950 transition-colors pb-4 -mb-4 pt-4 -mt-4">
        {icon}
        <span>{title}</span>
        <ChevronDown className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" />
      </button>
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-64 bg-white rounded-2xl shadow-2xl shadow-amber-900/10 border border-amber-100/50 p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
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
                  className="flex items-center justify-between gap-3 p-3 rounded-lg text-sm font-semibold text-slate-400 hover:bg-amber-50/80 hover:text-amber-950 transition-colors"
              >
                  <div className='flex items-center gap-3'>
                      <div className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-md text-slate-500">
                          {icon}
                      </div>
                      <span>{children}</span>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Kollega+</span>
              </Link>
          </li>
      )
  }

  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        className="flex items-center gap-3 p-3 rounded-lg text-sm font-semibold text-slate-600 hover:bg-amber-50/80 hover:text-amber-950 transition-colors"
      >
        <div className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-md text-slate-500">
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

  const handleMobileLinkClick = (callback?: () => void) => {
    if (callback) callback();
    setIsMobileMenuOpen(false);
  };

  const mobileCategories = [
    {
      title: "Træning",
      items: [
        { title: "Case-træner", path: "/case-trainer", icon: <BookCopy className="w-5 h-5" /> },
        { title: "Journal-træner", path: "/journal-trainer", icon: <FileText className="w-5 h-5" /> },
        { title: "Ny Refleksion", path: "/refleksionslog", icon: <BookMarked className="w-5 h-5" /> },
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
        { title: "Opslagstavle", path: "/opslagstavle", icon: <MessageSquare className="w-5 h-5" /> },
        { title: "Studiegrupper", path: "/grupper", icon: <UserPlus className="w-5 h-5" /> },
        { title: "Ugens Dilemma", path: "/ugens-dilemma", icon: <HelpCircle className="w-5 h-5" /> },
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

  return (
    <>
      <nav className="relative z-[100] bg-[#FDFCF8]/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-24">
            {/* Brand - The full bookshelf */}
            <div className="flex items-end h-16 mb-1 relative">
              <div className="absolute bottom-0 left-0 flex items-end -space-x-[1px] opacity-40 -z-10 blur-[0.5px]">
                <div className="w-3 h-10 bg-amber-900 rounded-t-sm" />
                <div className="w-4 h-12 bg-stone-800 rounded-t-sm" />
                <div className="w-3 h-9 bg-amber-950 rounded-t-sm" />
              </div>

              <Link
                href={user ? "/portal" : "/"}
                className="flex items-end -space-x-[1px] transition-transform"
                aria-label="Cohéro Hjem"
              >
                <BookSpine width="w-3" height="h-8" color="bg-stone-800" decoration="plain" tilt="-rotate-1" />
                <BookSpine width="w-4" height="h-11" color="bg-amber-950" decoration="bands" />
                <BookSpine width="w-2" height="h-9" color="bg-stone-700" decoration="plain" />

                <BookSpine letter="C" width="w-5" height="h-12" color="bg-amber-950" decoration="bands" />
                <BookSpine letter="o" width="w-5" height="h-10" color="bg-amber-900" decoration="gold" />
                <BookSpine letter="h" width="w-5" height="h-13" color="bg-amber-950" decoration="bands" tilt="-rotate-[1.5deg]" />
                <BookSpine letter="é" width="w-5" height="h-11" color="bg-amber-800" decoration="stripes" />
                <BookSpine letter="r" width="w-5" height="h-12" color="bg-amber-950" decoration="bands" />
                <BookSpine letter="o" width="w-5" height="h-9" color="bg-amber-900" decoration="gold" tilt="rotate-[1deg]" />

                <BookSpine width="w-3" height="h-11" color="bg-stone-900" decoration="ornament" />
                <BookSpine width="w-4" height="h-8" color="bg-amber-950" decoration="plain" tilt="rotate-2" />
                <BookSpine width="w-3" height="h-10" color="bg-stone-800" decoration="bands" />
              </Link>
            </div>

            <div className="hidden lg:flex items-center space-x-6">
              {user ? (
                <>
                  <Link href="/portal" className="text-sm font-bold text-amber-950 hover:text-amber-700 transition-colors flex items-center gap-2">
                    <Home className="w-4 h-4"/>Min Portal
                  </Link>
                  <div className="w-[1px] h-4 bg-amber-100"></div>
                  
                  <NavDropdown title="Træning" icon={<PlayCircle className="w-4 h-4"/>}>
                    <NavDropdownLink href="/case-trainer" icon={<BookCopy className="w-4 h-4"/>}>Case-træner</NavDropdownLink>
                    <NavDropdownLink href="/journal-trainer" icon={<FileText className="w-4 h-4"/>}>Journal-træner</NavDropdownLink>
                    <NavDropdownLink href="/refleksionslog" icon={<BookMarked className="w-4 h-4"/>}>Ny Refleksion</NavDropdownLink>
                    <NavDropdownLink href="/exam-architect" icon={<DraftingCompass className="w-4 h-4" />}>Eksamens-Arkitekten</NavDropdownLink>
                    <NavDropdownLink href="/seminar-architect" icon={<Presentation className="w-4 h-4" />}>Seminar-Arkitekten</NavDropdownLink>
                    <NavDropdownLink href="/mundtlig-eksamenstraener" icon={<Mic className="w-4 h-4" />}>Mundtlig Eksamens-Træner</NavDropdownLink>
                    <NavDropdownLink href="/semester-planlaegger" icon={<CalendarDays className="w-4 h-4" />} isPremium={true} userMembership={userProfile?.membership}>Semester-Planlægger</NavDropdownLink>
                    <NavDropdownLink href="/memento" icon={<Brain className="w-4 h-4"/>}>Memento</NavDropdownLink>
                  </NavDropdown>

                  <NavDropdown title="Viden" icon={<BookOpen className="w-4 h-4"/>}>
                    <NavDropdownLink href="/lov-portal" icon={<Scale className="w-4 h-4"/>}>Lovportal</NavDropdownLink>
                    <NavDropdownLink href="/concept-explainer" icon={<Wand2 className="w-4 h-4" />}>Begrebsguide</NavDropdownLink>
                    <NavDropdownLink href="/folketinget" icon={<Building className="w-4 h-4" />}>Folketinget Direkte</NavDropdownLink>
                    <NavDropdownLink href="/vive-indsigt" icon={<BookCopy className="w-4 h-4"/>}>VIVE Indsigt</NavDropdownLink>
                    <NavDropdownLink href="/teknikker" icon={<BrainCircuit className="w-4 h-4"/>}>Studieteknikker</NavDropdownLink>
                  </NavDropdown>

                  <NavDropdown title="Fællesskab" icon={<Users className="w-4 h-4"/>}>
                    <NavDropdownLink href="/opslagstavle" icon={<MessageSquare className="w-4 h-4"/>}>Opslagstavle</NavDropdownLink>
                    <NavDropdownLink href="/grupper" icon={<UserPlus className="w-4 h-4"/>}>Studiegrupper</NavDropdownLink>
                    <NavDropdownLink href="/ugens-dilemma" icon={<HelpCircle className="w-4 h-4"/>}>Ugens Dilemma</NavDropdownLink>
                  </NavDropdown>
                  
                  <NavDropdown title="Mit Arkiv" icon={<Layers className="w-4 h-4"/>}>
                    <NavDropdownLink href="/min-logbog" icon={<BookMarked className="w-4 h-4"/>}>Min Logbog</NavDropdownLink>
                    <NavDropdownLink href="/mine-byggeplaner" icon={<DraftingCompass className="w-4 h-4"/>}>Mine Byggeplaner</NavDropdownLink>
                    <NavDropdownLink href="/mine-gemte-paragraffer" icon={<Gavel className="w-4 h-4"/>}>Gemte Paragraffer</NavDropdownLink>
                  </NavDropdown>

                  {userProfile?.role === 'admin' && (
                    <>
                      <div className="w-[1px] h-4 bg-amber-100"></div>
                      <Link href="/admin" className="group flex items-center gap-2">
                        <Shield className="w-5 h-5 text-red-500" />
                        <span className="text-sm font-bold text-red-500 group-hover:text-red-700">Admin</span>
                      </Link>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Link href="/hvorfor" className="text-sm font-bold text-slate-500 hover:text-amber-950 transition-colors">Hvorfor Cohéro?</Link>
                  <a href="#vaerktojer" className="text-sm font-bold text-slate-500 hover:text-amber-950 transition-colors">Værktøjer</a>
                  <a href="#priser" className="text-sm font-bold text-slate-500 hover:text-amber-950 transition-colors">Priser</a>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-2">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black uppercase text-amber-700 tracking-widest leading-none mb-1">
                      {userProfile?.membership || ''}
                    </p>
                    <p className="text-sm font-bold text-amber-950 leading-none">
                      {user.displayName?.split(' ')[0]}
                    </p>
                  </div>
                  <Link href="/settings" className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-900 font-bold text-xs shadow-inner">
                      {user.displayName?.charAt(0)}
                  </Link>
                  <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors hidden sm:inline-flex">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="hidden lg:flex items-center gap-2">
                  <button onClick={() => onAuth('login')} className="px-6 py-3 text-sm font-bold text-amber-950 hover:bg-amber-100/50 rounded-xl transition-colors">Log ind</button>
                  <button onClick={() => onAuth('signup')} className="relative px-8 py-3 bg-amber-950 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.3em] overflow-hidden group shadow-xl shadow-amber-950/20 active:scale-95 transition-all">
                    <span className="relative z-10">Bliv medlem</span>
                    <div className="absolute inset-0 bg-amber-900 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  </button>
                </div>
              )}
              <div className="lg:hidden relative z-[110]">
                <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-600">
                  <Menu className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* THE SHELF */}
        <div className="relative w-full z-20">
          <div className="absolute top-0 w-full h-8 bg-gradient-to-b from-black/10 to-transparent pointer-events-none"></div>
          <div className="relative w-full h-[12px] bg-[#2d1403] shadow-[0_10px_20px_rgba(0,0,0,0.15),0_2px_4px_rgba(0,0,0,0.1)]">
            <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
            <div className="absolute top-0 w-full h-[1px] bg-white/10"></div>
            <div className="absolute bottom-0 w-full h-[1px] bg-black/40"></div>
            <div className="absolute -bottom-[4px] left-0 w-full h-[4px] bg-[#1a0c02] opacity-80"></div>
          </div>
        </div>
      </nav>
      
       {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[150] bg-[#FDFCF8] lg:hidden">
          <div className="p-6 flex flex-col h-full overflow-y-auto pb-20">
            <div className="flex items-center justify-between mb-10 shrink-0">
              <Link href={user ? '/portal' : '/'} onClick={() => setIsMobileMenuOpen(false)} className="font-bold serif text-2xl text-amber-950">Cohéro</Link>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 -mr-2">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            
            <nav className="flex-grow space-y-10">
              {user ? (
                <>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-900/40 px-2">Hovedmenu</p>
                    <Link 
                      href="/portal" 
                      onClick={() => setIsMobileMenuOpen(false)} 
                      className="flex items-center justify-between p-4 bg-amber-950 text-white rounded-2xl shadow-xl"
                    >
                      <div className="flex items-center gap-3">
                        <Home className="w-5 h-5" />
                        <span className="font-bold">Min Portal</span>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </Link>
                  </div>

                  {mobileCategories.map((category, idx) => (
                    <div key={idx} className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-900/40 px-2">{category.title}</p>
                      <ul className="grid grid-cols-1 gap-2">
                        {category.items.map((item, i) => {
                          const hasAccess = !item.isPremium || (userProfile?.membership && ['Kollega+', 'Semesterpakken', 'Kollega++'].includes(userProfile.membership));
                          return (
                            <li key={i}>
                              <Link 
                                href={hasAccess ? item.path : '/upgrade'} 
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center justify-between p-4 bg-white border border-amber-100 rounded-2xl active:bg-amber-50"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-900 shadow-inner">
                                    {item.icon}
                                  </div>
                                  <span className="font-bold text-amber-950 text-sm">{item.title}</span>
                                </div>
                                {!hasAccess ? (
                                  <span className="text-[8px] font-black uppercase bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Kollega+</span>
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-amber-200" />
                                )}
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ))}

                  {userProfile?.role === 'admin' && (
                    <div className="pt-4">
                      <Link 
                        href="/admin" 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-bold"
                      >
                        <Shield className="w-5 h-5" />
                        <span>Admin Kontrolpanel</span>
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                <ul className="space-y-4">
                  <li><Link href="/hvorfor" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between p-5 bg-white border border-amber-100 rounded-[2rem] text-xl font-bold text-amber-950 serif">Hvorfor Cohéro? <ChevronRight className="w-5 h-5 text-amber-200" /></Link></li>
                  <li><a href="#vaerktojer" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between p-5 bg-white border border-amber-100 rounded-[2rem] text-xl font-bold text-amber-950 serif">Værktøjer <ChevronRight className="w-5 h-5 text-amber-200" /></a></li>
                  <li><a href="#priser" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between p-5 bg-white border border-amber-100 rounded-[2rem] text-xl font-bold text-amber-950 serif">Priser <ChevronRight className="w-5 h-5 text-amber-200" /></a></li>
                </ul>
              )}
            </nav>

            <div className="mt-10 py-6 border-t border-amber-100/60 shrink-0">
              {user ? (
                 <div className="flex items-center justify-between gap-4">
                     <Link href="/settings" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 bg-amber-50/50 p-2 pr-4 rounded-2xl border border-amber-100">
                        <div className="w-12 h-12 rounded-xl bg-amber-950 flex items-center justify-center text-amber-100 font-bold text-lg shadow-lg">{user.displayName?.charAt(0)}</div>
                        <div>
                          <p className="font-bold text-amber-950 text-sm">{user.displayName?.split(' ')[0]}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-amber-700/50">{userProfile?.membership}</p>
                        </div>
                     </Link>
                    <button 
                      onClick={() => handleMobileLinkClick(onLogout)} 
                      className="p-4 text-rose-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Log ud
                    </button>
                 </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <Button onClick={() => handleMobileLinkClick(() => onAuth('login'))} variant="outline" className="h-14 rounded-2xl font-bold">Log ind</Button>
                  <Button onClick={() => handleMobileLinkClick(() => onAuth('signup'))} className="h-14 rounded-2xl font-bold">Bliv medlem</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
