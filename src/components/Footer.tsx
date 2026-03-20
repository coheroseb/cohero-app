'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Linkedin, Instagram, MapPin, Phone, Facebook } from 'lucide-react';
import Link from 'next/link';

const Footer: React.FC = () => {
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);
  
  return (
    <footer className="bg-white border-t border-amber-100 pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-6 gap-12 mb-20">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-8 group cursor-pointer">
              <div className="flex -space-x-[1px] items-end">
                <div className="relative w-1.5 h-6 bg-amber-800 rounded-t-sm shadow-[inset_-1px_0_3px_rgba(0,0,0,0.3),inset_1px_0_2px_rgba(255,255,255,0.1),2px_0_5px_rgba(0,0,0,0.2)] border-r border-black/10">
                    <div className="absolute inset-0 opacity-15 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] pointer-events-none"></div>
                </div>
                <div className="relative w-1.5 h-8 bg-amber-900 rounded-t-sm shadow-[inset_-1px_0_3px_rgba(0,0,0,0.3),inset_1px_0_2px_rgba(255,255,255,0.1),2px_0_5px_rgba(0,0,0,0.2)] border-r border-black/10">
                    <div className="absolute inset-0 opacity-15 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] pointer-events-none"></div>
                </div>
                <div className="relative w-1.5 h-5 bg-amber-950 rounded-t-sm rotate-3 shadow-[inset_-1px_0_3px_rgba(0,0,0,0.3),inset_1px_0_2px_rgba(255,255,255,0.1),2px_0_5px_rgba(0,0,0,0.2)] border-r border-black/10">
                    <div className="absolute inset-0 opacity-15 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] pointer-events-none"></div>
                </div>
              </div>
              <span className="text-2xl font-bold text-amber-950 serif">Cohéro</span>
            </div>
            <p className="text-slate-500 max-w-sm leading-relaxed mb-8">
              Cohéro er skabt til socialrådgiverstuderende, der ønsker at blive mødt med faglig respekt og kollegial støtte gennem hele uddannelsen.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://linkedin.com/company/coherois/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-amber-50 text-amber-800 rounded-xl flex items-center justify-center hover:bg-amber-900 hover:text-white transition-all shadow-sm">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/cohero_is" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-amber-50 text-amber-800 rounded-xl flex items-center justify-center hover:bg-amber-900 hover:text-white transition-all shadow-sm">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://www.facebook.com/profile.php?id=61586618395097" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-amber-50 text-amber-800 rounded-xl flex items-center justify-center hover:bg-amber-900 hover:text-white transition-all shadow-sm">
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div className="md:col-span-1">
            <h4 className="font-bold text-amber-950 mb-8 uppercase tracking-widest text-xs">Navigation</h4>
            <ul className="space-y-4 text-slate-500 text-sm">
              <li><Link href="/" className="hover:text-amber-800 transition-colors">Forside</Link></li>
              <li><Link href="/om-os" className="hover:text-amber-800 transition-colors">Om Cohéro</Link></li>
              <li><Link href="/ambassadoer" className="hover:text-amber-800 transition-colors font-bold text-rose-700">Bliv Ambassadør</Link></li>
              <li><Link href="/hvorfor" className="hover:text-amber-800 transition-colors">Vores filosofi</Link></li>
              <li><Link href="/pensum" className="hover:text-amber-800 transition-colors">Pensum</Link></li>
              <li><Link href="/faq" className="hover:text-amber-800 transition-colors">FAQ</Link></li>
              <li><Link href="/samarbejde" className="hover:text-amber-800 transition-colors">Samarbejde</Link></li>
            </ul>
          </div>

          <div className="md:col-span-1">
            <h4 className="font-bold text-amber-950 mb-8 uppercase tracking-widest text-xs">Juridisk</h4>
            <ul className="space-y-4 text-slate-500 text-sm">
              <li><Link href="/terms-of-service" className="hover:text-amber-800 transition-colors">Handelsbetingelser</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-amber-800 transition-colors">Privatlivspolitik</Link></li>
              <li><Link href="/cookie-policy" className="hover:text-amber-800 transition-colors">Cookiepolitik</Link></li>
              <li><Link href="/gdpr" className="hover:text-amber-800 transition-colors">GDPR</Link></li>
              <li><Link href="/etik" className="hover:text-amber-800 transition-colors">Etik & Anvendelse</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="font-bold text-amber-950 mb-8 uppercase tracking-widest text-xs">Kontakt kollegiet</h4>
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-amber-700 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-950">Skriv til os</p>
                  <a href="mailto:kontakt@cohero.dk" className="text-sm text-slate-500 hover:text-amber-800 transition-colors">kontakt@cohero.dk</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-amber-700 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-950">Vores kontor</p>
                  <p className="text-sm text-slate-500">Ben Websters Vej 14<br />2450 København</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-12 border-t border-amber-50 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-slate-400 font-medium">
            &copy; {currentYear} Cohéro I/S. CVR: 46181425. Alle rettigheder forbeholdes.
          </p>
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50/50 rounded-full border border-amber-100">
             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
             <p className="text-[10px] font-bold text-amber-900 uppercase tracking-widest">System Status: Online</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
