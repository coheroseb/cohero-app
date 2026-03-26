'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Linkedin, Instagram, MapPin, Facebook, ArrowUpRight, Sparkles, ShieldCheck, Music } from 'lucide-react';
import Link from 'next/link';

const Footer: React.FC = () => {
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);
  
  return (
    <footer className="bg-[#FDFCF8] border-t border-amber-100 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-100/30 blur-[100px] rounded-full -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-50/30 blur-[100px] rounded-full translate-y-1/2 pointer-events-none" />

      <div className="max-w-[1600px] mx-auto px-8 sm:px-12 pt-32 pb-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 mb-32">
          
          {/* BRAND STORY */}
          <div className="lg:col-span-4 space-y-10">
            <Link href="/" className="flex items-center space-x-3 group w-fit">
              <div className="flex -space-x-1 items-end">
                <div className="w-1.5 h-6 bg-amber-800 rounded-t-sm shadow-lg group-hover:scale-y-110 transition-transform origin-bottom" />
                <div className="w-1.5 h-9 bg-amber-950 rounded-t-sm shadow-lg group-hover:scale-y-125 transition-transform origin-bottom delay-75" />
                <div className="w-1.5 h-7 bg-amber-700 rounded-t-sm shadow-lg group-hover:scale-y-110 transition-transform origin-bottom delay-150" />
              </div>
              <span className="text-3xl font-black text-amber-950 serif tracking-tighter">Cohéro</span>
            </Link>
            
            <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-sm italic">
              "Vi bygger bro mellem kompleks teori og nærværende socialfaglig praksis – skabt af studerende, til studerende."
            </p>

            <div className="flex items-center gap-3">
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
                  className="w-12 h-12 bg-white border border-amber-100 rounded-2xl flex items-center justify-center text-amber-950 hover:bg-amber-950 hover:text-amber-400 hover:scale-105 transition-all shadow-sm"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
          
          {/* NAVIGATION GRID */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-12">
            <div>
              <h4 className="font-black text-amber-950 mb-10 uppercase tracking-[0.3em] text-[10px]">Læringsunivers</h4>
              <ul className="space-y-5">
                {[
                  { name: 'Forside', href: '/' },
                  { name: 'Om Cohéro', href: '/om-os' },
                  { name: 'Vores filosofi', href: '/hvorfor' },
                  { name: 'Pensum Bank', href: '/pensum' },
                  { name: 'FAQ', href: '/faq' },
                  { name: 'Ambassadør', href: '/ambassadoer', highlight: true }
                ].map(link => (
                  <li key={link.name}>
                    <Link 
                      href={link.href} 
                      className={`text-sm flex items-center gap-2 group transition-colors ${link.highlight ? 'text-amber-600 font-bold' : 'text-slate-500 hover:text-amber-950'}`}
                    >
                      {link.name}
                      <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all text-amber-400" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-black text-amber-950 mb-10 uppercase tracking-[0.3em] text-[10px]">Juridisk & Tillid</h4>
              <ul className="space-y-5">
                {[
                  { name: 'Betingelser', href: '/terms-of-service' },
                  { name: 'Privatliv', href: '/privacy-policy' },
                  { name: 'Cookiepolitik', href: '/cookie-policy' },
                  { name: 'GDPR status', href: '/gdpr' },
                  { name: 'Etiske regler', href: '/etik' }
                ].map(link => (
                  <li key={link.name}>
                    <Link 
                      href={link.href} 
                      className="text-sm text-slate-500 hover:text-amber-950 flex items-center gap-2 group transition-colors"
                    >
                      {link.name}
                      <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all text-amber-400" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CONTACT & STATUS */}
          <div className="lg:col-span-3 space-y-12">
            <div className="bg-white p-8 rounded-[3rem] border border-amber-100 shadow-sm space-y-8 relative overflow-hidden group">
              <Sparkles className="absolute top-0 right-0 p-8 w-24 h-24 text-amber-50 opacity-50 group-hover:rotate-12 transition-transform" />
              <h4 className="font-black text-amber-950 uppercase tracking-[0.3em] text-[10px] relative z-10">Kontakt kollegiet</h4>
              <div className="space-y-6 relative z-10">
                <a href="mailto:kontakt@cohero.dk" className="flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-700 group-hover:bg-amber-950 group-hover:text-amber-400 transition-colors"><Mail className="w-4 h-4" /></div>
                  <span className="text-sm font-bold text-slate-600 group-hover:text-amber-950 transition-colors">kontakt@cohero.dk</span>
                </a>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-700"><MapPin className="w-4 h-4" /></div>
                  <span className="text-sm font-medium text-slate-500">2450 København SV</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 py-4 bg-emerald-50/50 rounded-3xl border border-emerald-100">
              <div className="relative">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping absolute inset-0" />
                <div className="w-3 h-3 bg-emerald-500 rounded-full relative" />
              </div>
              <p className="text-[10px] font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-3 h-3" /> System Status: Online
              </p>
            </div>
          </div>
        </div>
        
        {/* BOTTOM BAR */}
        <div className="pt-12 border-t border-amber-100 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <p className="text-[10px] font-bold text-slate-400 tracking-wider">
              &copy; {currentYear} Cohéro I/S. CVR: 46181425
            </p>
            <div className="h-4 w-px bg-amber-100 hidden md:block" />
            <p className="text-[10px] font-bold text-slate-400 tracking-wider">
              Alle rettigheder forbeholdes
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-slate-300">
            <span className="text-[10px] uppercase font-black tracking-[0.4em]">Handmade with passion in Denmark</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
