'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/app/provider';

export default function HeaderNavbar() {
  const { openAuthPage, user } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleNavAuth = (mode: 'signin' | 'signup') => {
    if (typeof openAuthPage === 'function') {
      openAuthPage(mode);
    } else {
      router.push(`/auth?mode=${mode}`);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 py-4 md:px-12">
      <div className="max-w-7xl mx-auto w-full bg-white/85 backdrop-blur-2xl border border-slate-200/80 rounded-[2rem] h-20 px-6 sm:px-8 flex items-center justify-between shadow-xl shadow-slate-900/5">
        <div className="flex items-center gap-3">
           <Link href="/" className="flex items-center gap-2 group">
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Cohéro Student
              </span>
           </Link>
        </div>
        
        <div className="hidden md:flex items-center gap-1.5">
           <Link href="/#pro-tools" className="px-4 py-2 text-xs font-extrabold text-slate-500 hover:text-slate-900 uppercase tracking-wider transition-colors">Værktøjer</Link>
           <Link href="/#solutions" className="px-4 py-2 text-xs font-extrabold text-slate-500 hover:text-slate-900 uppercase tracking-wider transition-colors">Uddannelser</Link>
           <Link href="/#pricing" className="px-4 py-2 text-xs font-extrabold text-slate-500 hover:text-slate-900 uppercase tracking-wider transition-colors">Priser</Link>
           <Link href="/om-second-opinion" className="px-4 py-2 text-xs font-extrabold text-slate-500 hover:text-slate-900 uppercase tracking-wider transition-colors">Second Opinion</Link>
        </div>

        <div className="flex items-center gap-4">
           {user ? (
              <Link 
                href="/portal"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all shadow-md shadow-indigo-600/20"
              >
                 Min Portal
              </Link>
           ) : (
              <>
                 <button 
                   onClick={() => handleNavAuth('signin')} 
                   className="text-xs font-extrabold uppercase tracking-widest text-slate-600 hover:text-slate-900 transition-colors"
                 >
                    Log ind
                 </button>
                 <button 
                   onClick={() => handleNavAuth('signup')} 
                   className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all shadow-md shadow-slate-900/10"
                 >
                    Opret gratis profil
                 </button>
              </>
           )}
           
           {/* Mobile Hamburger menu button */}
           <button 
             className="md:hidden p-2 text-slate-600 hover:text-slate-900"
             onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
           >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
           </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
           <motion.div
             initial={{ opacity: 0, y: -10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -10 }}
             className="absolute top-24 left-4 right-4 bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-3xl p-6 flex flex-col gap-4 shadow-2xl z-40"
           >
              <Link href="/#pro-tools" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-slate-700 hover:text-slate-900 uppercase tracking-wider py-2">Værktøjer</Link>
              <Link href="/#solutions" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-slate-700 hover:text-slate-900 uppercase tracking-wider py-2">Uddannelser</Link>
              <Link href="/#pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-slate-700 hover:text-slate-900 uppercase tracking-wider py-2">Priser</Link>
              <Link href="/om-second-opinion" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-slate-700 hover:text-slate-900 uppercase tracking-wider py-2">Second Opinion</Link>
              
              <div className="w-full h-[1px] bg-slate-100 my-2" />
              
              {user ? (
                 <Link 
                   href="/portal" 
                   className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-center font-bold text-sm uppercase tracking-widest transition-all"
                 >
                    Min Portal
                 </Link>
              ) : (
                 <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => { handleNavAuth('signin'); setIsMobileMenuOpen(false); }} 
                      className="py-4 border border-slate-200 text-slate-900 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                       Log ind
                    </button>
                    <button 
                      onClick={() => { handleNavAuth('signup'); setIsMobileMenuOpen(false); }} 
                      className="py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-slate-800 transition-all"
                    >
                       Opret profil
                    </button>
                 </div>
              )}
           </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
