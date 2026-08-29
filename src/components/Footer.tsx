'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Capacitor } from '@capacitor/core';
import { Mail, Linkedin, Instagram, MapPin, Facebook, ArrowUpRight, Sparkles, ShieldCheck, Scale, Phone, Globe } from 'lucide-react';

const Footer: React.FC = () => {
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  if (isNative) return null;

  return (
    <footer className="bg-white border-t border-slate-200 brand-font py-16 text-slate-800 relative z-10">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8">
        
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-14">
          
          {/* Kolonne 1: Brand & Virksomhed (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4 max-w-sm">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <img 
                src="/cohero-logo.png" 
                alt="Cohéro Student" 
                className="h-8 w-auto max-w-[160px] object-contain block" 
              />
              <span className="text-[10px] font-black tracking-widest uppercase bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2 py-0.5 rounded-full ml-1">
                Student
              </span>
            </Link>
            
            <p className="text-sm text-slate-500 leading-relaxed font-normal">
              Den digitale kollega og faglige rygdækning for Danmarks velfærdsstuderende. Vi styrker din faglige selvtillid og metode fra første semester til bacheloreksamen.
            </p>

            <div className="flex flex-col gap-1.5 text-xs text-slate-600 mt-2">
              <div className="font-extrabold text-slate-900">
                Cohéro I/S · CVR: 46181425
              </div>
              <div className="text-slate-500">
                København, Danmark · Hostet i ISO 27001 EU-datacenter
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap font-semibold">
                <a href="mailto:kontakt@cohero.dk" className="text-blue-700 hover:underline">kontakt@cohero.dk</a>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600">support@cohero.dk</span>
              </div>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-2.5 mt-2">
              {[
                { icon: <Linkedin className="w-4 h-4" />, href: "https://linkedin.com/company/coherois/", label: "LinkedIn" },
                { icon: <Instagram className="w-4 h-4" />, href: "https://www.instagram.com/cohero_is", label: "Instagram" },
                { icon: <Facebook className="w-4 h-4" />, href: "https://www.facebook.com/profile.php?id=61586618395097", label: "Facebook" }
              ].map((social, i) => (
                <a 
                  key={i}
                  href={social.href} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  aria-label={social.label}
                  className="w-9 h-9 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-xs"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Kolonne 2: Værktøjer & Studieplatform (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-1">
              Faglige Værktøjer
            </h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>
                <a href="#lovportal" className="hover:text-slate-900 transition-colors font-medium">Lovportal & Retsinformation</a>
              </li>
              <li>
                <a href="#ai-agenter" className="hover:text-slate-900 transition-colors font-medium">Cohéro AI Eksamensarkitekt</a>
              </li>
              <li>
                <a href="#moduler" className="hover:text-slate-900 transition-colors font-medium">Juridisk Sagsanalyse (SOAP/VUM)</a>
              </li>
              <li>
                <a href="#moduler" className="hover:text-slate-900 transition-colors font-medium">Pensum & Bog-assistent</a>
              </li>
              <li>
                <a href="#simulator" className="hover:text-slate-900 transition-colors font-medium">AI Sags-Simulator</a>
              </li>
              <li>
                <a href="#moduler" className="hover:text-slate-900 transition-colors font-medium">APA Kildegenerator</a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-slate-900 transition-colors font-medium">Priser & Gratis Oprettelse</a>
              </li>
            </ul>
          </div>

          {/* Kolonne 3: Uddannelser (2 cols) */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-1">
              Uddannelser
            </h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>
                <a href="#uddannelser" className="hover:text-slate-900 transition-colors font-medium">Socialrådgiver</a>
              </li>
              <li>
                <a href="#uddannelser" className="hover:text-slate-900 transition-colors font-medium">Pædagogik</a>
              </li>
              <li>
                <a href="#uddannelser" className="hover:text-slate-900 transition-colors font-medium">Socialpædagogik</a>
              </li>
              <li>
                <a href="#uddannelser" className="hover:text-slate-900 transition-colors font-medium">Sygeplejerske</a>
              </li>
              <li>
                <a href="#uddannelser" className="hover:text-slate-900 transition-colors font-medium">Jordemoder</a>
              </li>
              <li>
                <a href="#uddannelser" className="hover:text-slate-900 transition-colors font-medium">Ergo- & Fysioterapi</a>
              </li>
              <li>
                <a href="#tvaerfagligt" className="hover:text-slate-900 transition-colors font-medium">Tværfagligt</a>
              </li>
            </ul>
          </div>

          {/* Kolonne 4: Virksomhed & Etik (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-1">
              Virksomhed & Tryghed
            </h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>
                <Link href="/hvorfor" className="hover:text-slate-900 transition-colors font-medium">Vores Filosofi & Vision</Link>
              </li>
              <li>
                <Link href="/etik" className="hover:text-slate-900 transition-colors font-medium">Eksamenssikker & Etisk AI</Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="hover:text-slate-900 transition-colors font-medium">Betingelser & Vilkår</Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-slate-900 transition-colors font-medium">Privatlivspolitik & GDPR</Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="hover:text-slate-900 transition-colors font-medium">Cookiepolitik</Link>
              </li>
              <li>
                <a href="#faq" className="hover:text-slate-900 transition-colors font-medium">Ofte Stillede Spørgsmål (FAQ)</a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <div>
            &copy; {currentYear} Cohéro I/S · CVR: 46181425. Alle rettigheder forbeholdes.
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              100% GDPR Compliant · Dansk Hostet
            </span>
            <span>
              E-mail: <a href="mailto:kontakt@cohero.dk" className="text-blue-700 font-semibold hover:underline">kontakt@cohero.dk</a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
