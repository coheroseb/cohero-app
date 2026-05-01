'use client';

import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Mail, Linkedin, Instagram, MapPin, Facebook, ArrowUpRight, Sparkles, ShieldCheck, Music } from 'lucide-react';
import Link from 'next/link';
import { BookSpine } from './BookSpine';

const Footer: React.FC = () => {
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  if (isNative) return null;
  
  return (
    <footer className="bg-white border-t border-slate-100 relative overflow-hidden">
      {/* Subtle Architectural Grid Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="max-w-[1600px] mx-auto px-8 sm:px-12 pt-32 pb-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 mb-32">
          
          {/* BRAND STORY */}
          <div className="lg:col-span-4 space-y-12">
            <Link href="/" className="flex items-center space-x-4 group w-fit">
              <BookSpine className="w-12 h-12 text-slate-950" />
              <span className="text-3xl font-black text-slate-950 uppercase tracking-tighter italic serif">Cohéro</span>
            </Link>
            
            <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-sm italic border-l-2 border-indigo-500/20 pl-8">
              "Vi nytænker velfærdsuddannelse gennem teknologisk præcision og faglig tryghed."
            </p>

            <div className="flex items-center gap-4">
              {[
                { icon: <Linkedin className="w-5 h-5" />, href: "https://linkedin.com/company/coherois/" },
                { icon: <Instagram className="w-5 h-5" />, href: "https://www.instagram.com/cohero_is" },
                { icon: <Facebook className="w-5 h-5" />, href: "https://www.facebook.com/profile.php?id=61586618395097" },
                { icon: <Music className="w-5 h-5" />, href: "https://www.tiktok.com/@cohro" }
              ].map((social, i) => (
                <a 
                  key={i}
                  href={social.href} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-950 hover:text-white hover:scale-110 transition-all shadow-sm"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
          
          {/* NAVIGATION GRID */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-12">
            <div>
              <h4 className="font-black text-slate-950 mb-10 uppercase tracking-[0.4em] text-[10px]">Læringsunivers</h4>
              <ul className="space-y-6">
                {[
                  { name: 'Forside', href: '/' },
                  { name: 'Om os', href: '/om-os' },
                  { name: 'Filosofi', href: '/hvorfor' },
                  { name: 'Videnskabsteori', href: '/videnskabsteori' },
                  { name: 'Ambassadør', href: '/ambassadoer', highlight: true }
                ].map(link => (
                  <li key={link.name}>
                    <Link 
                      href={link.href} 
                      prefetch={false}
                      className={`text-[13px] font-black uppercase tracking-widest flex items-center gap-2 group transition-colors ${link.highlight ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-950'}`}
                    >
                      {link.name}
                      <ArrowUpRight className="w-4 h-4 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all text-indigo-500" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-black text-slate-950 mb-10 uppercase tracking-[0.4em] text-[10px]">Juridisk & Tillid</h4>
              <ul className="space-y-6">
                {[
                  { name: 'Betingelser', href: '/terms-of-service' },
                  { name: 'Privatliv', href: '/privacy-policy' },
                  { name: 'Cookiepolitik', href: '/cookie-policy' },
                  { name: 'Etiske regler', href: '/etik' }
                ].map(link => (
                  <li key={link.name}>
                    <Link 
                      href={link.href} 
                      prefetch={false}
                      className="text-[13px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-950 flex items-center gap-2 group transition-colors"
                    >
                      {link.name}
                      <ArrowUpRight className="w-4 h-4 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all text-indigo-500" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CONTACT & STATUS */}
          <div className="lg:col-span-3 space-y-12">
            <div className="bg-slate-50 p-10 rounded-[4rem] border border-slate-100 shadow-sm space-y-8 relative overflow-hidden group">
              <h4 className="font-black text-slate-950 uppercase tracking-[0.4em] text-[10px] relative z-10">Kontakt</h4>
              <div className="space-y-8 relative z-10">
                <a href="mailto:kontakt@cohero.dk" className="flex items-center gap-5 group/mail">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover/mail:bg-slate-950 group-hover/mail:text-white transition-all shadow-sm"><Mail className="w-5 h-5" /></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">Direkte</span>
                    <span className="text-sm font-black text-slate-600 group-hover/mail:text-slate-950 transition-colors">kontakt@cohero.dk</span>
                  </div>
                </a>
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm"><MapPin className="w-5 h-5" /></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">Lokation</span>
                    <span className="text-sm font-bold text-slate-500">København, Danmark</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 px-8 py-5 bg-emerald-50/50 rounded-[2.5rem] border border-emerald-100">
              <div className="relative">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping absolute inset-0" />
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full relative" />
              </div>
              <p className="text-[10px] font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> System Status: Online
              </p>
            </div>
          </div>
        </div>
        
        {/* BOTTOM BAR */}
        <div className="pt-16 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              &copy; {currentYear} Cohéro I/S · CVR: 46181425
            </p>
            <div className="h-1 w-1 bg-slate-200 rounded-full hidden md:block" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Pioneering Welfare Technology
            </p>
          </div>
          
          <div className="flex items-center gap-3 text-slate-300">
             <style jsx>{`
               .serif { font-family: 'Playfair Display', serif; }
             `}</style>
            <span className="text-[10px] uppercase font-black tracking-[0.5em] text-slate-400">Designet til fremtiden</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
