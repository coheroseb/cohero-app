'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Share, 
  PlusSquare, 
  MoreVertical, 
  Download, 
  Smartphone, 
  Monitor,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PWAInstallGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const PWAInstallGuide: React.FC<PWAInstallGuideProps> = ({ isOpen, onClose }) => {
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'other'>('desktop');

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }
  }, []);

  if (!isOpen) return null;

  const iOSGuide = (
    <div className="space-y-8">
      <div className="flex items-start gap-4 p-6 bg-white rounded-3xl border border-amber-100 shadow-sm animate-ink">
        <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
          <span className="text-lg font-black">1</span>
        </div>
        <div className="space-y-2">
            <p className="text-amber-950 font-bold leading-tight">Tryk på "Del"-ikonet i bunden af Safari</p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-400">
                <Share className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Del</span>
            </div>
        </div>
      </div>

      <div className="flex items-start gap-4 p-6 bg-white rounded-3xl border border-amber-100 shadow-sm animate-ink">
        <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
          <span className="text-lg font-black">2</span>
        </div>
        <div className="space-y-2">
            <p className="text-amber-950 font-bold leading-tight">Rul ned og vælg "Føj til hjemmeskærm"</p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-400">
                <PlusSquare className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Føj til hjemmeskærm</span>
            </div>
        </div>
      </div>
      
      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
          <p className="text-xs font-bold text-emerald-800 italic">Nu er Cohero klar som en app på din telefon! 🚀</p>
      </div>
    </div>
  );

  const androidGuide = (
    <div className="space-y-6">
      <div className="flex items-start gap-4 p-6 bg-white rounded-3xl border border-amber-100 shadow-sm animate-ink">
        <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
          <span className="text-lg font-black">1</span>
        </div>
        <div className="space-y-2">
            <p className="text-amber-950 font-bold leading-tight">Tryk på de tre prikker i øverste hjørne af Chrome</p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-400">
                <MoreVertical className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Menu</span>
            </div>
        </div>
      </div>

      <div className="flex items-start gap-4 p-6 bg-white rounded-3xl border border-amber-100 shadow-sm animate-ink">
        <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
          <span className="text-lg font-black">2</span>
        </div>
        <div className="space-y-2">
            <p className="text-amber-950 font-bold leading-tight">Vælg "Installer app" eller "Føj til startskærm"</p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-400">
                <Download className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Installer</span>
            </div>
        </div>
      </div>

       <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
          <p className="text-xs font-bold text-emerald-800 italic">Nu er Cohero klar som en app på din telefon! 🚀</p>
      </div>
    </div>
  );

  const desktopGuide = (
    <div className="space-y-6">
      <div className="flex items-start gap-4 p-6 bg-white rounded-3xl border border-amber-100 shadow-sm animate-ink">
        <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
          <span className="text-lg font-black">1</span>
        </div>
        <div className="space-y-2">
            <p className="text-amber-950 font-bold leading-tight">Tryk på installations-ikonet i adressefeltet</p>
            <p className="text-xs text-slate-400">Det ligner ofte en lille skærm med en pil eller tre stjerner.</p>
        </div>
      </div>

      <div className="flex items-start gap-4 p-6 bg-white rounded-3xl border border-amber-100 shadow-sm animate-ink">
        <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
          <span className="text-lg font-black">2</span>
        </div>
        <div className="space-y-2">
            <p className="text-amber-950 font-bold leading-tight">Bekræft installationen</p>
            <p className="text-xs text-slate-400">Nu kan du åbne Cohero direkte fra din computer.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-amber-950/40 backdrop-blur-md" 
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-[#FDFCF8] w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden p-8 md:p-12 border-4 border-amber-950/5"
      >
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 p-2 text-slate-400 hover:text-amber-950 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <header className="text-center space-y-3 mb-12">
            <div className="w-20 h-20 bg-amber-950 text-amber-400 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-xl">
               <Download className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold text-amber-950 serif">Hent Cohero som app</h2>
            <p className="text-slate-500 italic max-w-sm mx-auto">
                Få hurtig adgang til din faglige rygdækning direkte fra din hjemmeskærm.
            </p>
        </header>

        <div className="flex gap-2 p-1.5 bg-amber-50/50 rounded-2xl border border-amber-100 mb-10">
            <button 
                onClick={() => setPlatform('ios')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${platform === 'ios' ? 'bg-white shadow-md text-amber-950' : 'text-slate-400 hover:text-amber-600'}`}
            >
                iPhone / iPad
            </button>
            <button 
                onClick={() => setPlatform('android')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${platform === 'android' ? 'bg-white shadow-md text-amber-950' : 'text-slate-400 hover:text-amber-600'}`}
            >
                Android
            </button>
            <button 
                onClick={() => setPlatform('desktop')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${platform === 'desktop' ? 'bg-white shadow-md text-amber-950' : 'text-slate-400 hover:text-amber-600'}`}
            >
                Computer
            </button>
        </div>

        <div className="min-h-[300px]">
            {platform === 'ios' && iOSGuide}
            {platform === 'android' && androidGuide}
            {platform === 'desktop' && desktopGuide}
        </div>

        <div className="mt-12 flex justify-center">
            <button 
                onClick={onClose}
                className="px-10 py-5 bg-amber-950 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-amber-950/20"
            >
                Det har jeg gjort!
            </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-tighter text-slate-300">
            <Info className="w-3 h-3" />
            <span>Ingen download påkrævet • Fungerer som en web-app</span>
        </div>
      </motion.div>
    </div>
  );
};

export default PWAInstallGuide;
