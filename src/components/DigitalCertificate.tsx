'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Award, CheckCircle2, Shield, Calendar, MapPin, GraduationCap, Star } from 'lucide-react';

interface DigitalCertificateProps {
  username: string;
  profession: string;
  institution?: string;
  completedAt?: string;
  uid: string;
}

const DigitalCertificate: React.FC<DigitalCertificateProps> = ({ username, profession, institution, completedAt, uid }) => {
  const date = completedAt ? new Date(completedAt).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full max-w-4xl mx-auto aspect-[1.414/1] bg-white shadow-2xl rounded-sm overflow-hidden border-[16px] border-slate-900 group"
    >
      {/* Decorative Border Layer */}
      <div className="absolute inset-2 border-[1px] border-slate-200 pointer-events-none" />
      <div className="absolute inset-4 border-[2px] border-amber-200 pointer-events-none" />
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      
      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-between p-12 sm:p-20 text-center">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center text-amber-400">
                <Shield className="w-10 h-10" />
            </div>
          </div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Digitalt Certifikat fra Cohéro</h2>
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 serif tracking-tight">Faglig Dokumentation</h1>
        </div>

        {/* User Info */}
        <div className="space-y-6">
          <p className="text-slate-500 font-medium italic text-lg">Dette certifikat tildeles hermed til</p>
          <div className="relative">
            <h3 className="text-3xl sm:text-5xl font-black text-slate-950 serif py-2">{username}</h3>
             <div className="h-0.5 w-48 bg-amber-200 mx-auto mt-2" />
          </div>
          <div className="flex flex-col items-center gap-1">
             <p className="text-xl font-bold text-slate-800">{profession}</p>
             {institution && (
               <p className="text-sm font-medium text-slate-400 flex items-center gap-2">
                 <GraduationCap className="w-4 h-4" /> {institution}
               </p>
             )}
          </div>
        </div>

        {/* Validation Info */}
        <div className="w-full grid grid-cols-3 gap-8 items-end">
          <div className="flex flex-col items-start gap-1">
             <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Udstedelsesdato</p>
             <p className="text-xs font-bold text-slate-800">{date}</p>
          </div>
          
          <div className="flex flex-col items-center">
             <div className="w-24 h-24 relative">
                <motion.div 
                   animate={{ rotate: 360 }}
                   transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                   className="absolute inset-0 opacity-10"
                >
                   <Award className="w-full h-full text-slate-900" />
                </motion.div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-16 h-16 bg-amber-400 rounded-full shadow-lg flex items-center justify-center text-slate-900">
                      <Star className="w-8 h-8 fill-current" />
                   </div>
                </div>
             </div>
             <p className="text-[8px] font-black uppercase tracking-tighter text-amber-600 mt-2">Valideret af Platformen</p>
          </div>

          <div className="flex flex-col items-end gap-1">
             <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Certifikat ID</p>
             <p className="text-[10px] font-mono text-slate-600 uppercase">{uid.substring(0, 8)}-{uid.substring(uid.length - 4)}</p>
          </div>
        </div>
      </div>

      {/* Glossy Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/20 pointer-events-none" />
      
      {/* Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none scale-150">
        <h1 className="text-[200px] font-black italic select-none">COHERO</h1>
      </div>
    </motion.div>
  );
};

export default DigitalCertificate;
