'use client';

import React from 'react';
import { motion } from 'framer-motion';

const AuthLoadingScreen = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] relative overflow-hidden">
      {/* Dynamic Ambient Background */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-200/30 rounded-full blur-[100px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1.1, 1, 1.1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-blue-200/25 rounded-full blur-[90px]" 
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center max-w-sm w-full px-6"
      >
        {/* Card Container */}
        <div className="w-full bg-white/90 backdrop-blur-2xl border border-slate-200/80 p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-200/50 flex flex-col items-center text-center">
            
          {/* Logo with Ambient Orbit */}
          <div className="relative mb-8 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-4 border border-dashed border-indigo-200 rounded-full"
            />
            <motion.div
              animate={{ 
                scale: [1, 1.04, 1],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10 flex flex-col items-center gap-1 bg-white p-4 rounded-2xl shadow-sm border border-slate-100"
            >
              <img 
                src="/cohero-logo.png" 
                alt="Cohéro Student" 
                className="h-8 w-auto max-w-[130px] object-contain" 
              />
              <span className="text-[8px] font-black tracking-widest uppercase bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2 py-0.5 rounded-full">
                Student
              </span>
            </motion.div>
          </div>

          {/* Typography */}
          <div className="space-y-2">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Gør din studieplatform klar
            </h2>
            <p className="text-[11px] font-bold text-slate-400 leading-relaxed">
              Strukturering · Planlægning · Organisering · Videnssøgning
            </p>
          </div>
            
          {/* Progress Bar */}
          <div className="w-44 h-1.5 bg-slate-100 rounded-full overflow-hidden relative mt-6">
            <motion.div 
              animate={{ 
                x: [-176, 176] 
              }}
              transition={{ 
                duration: 1.4, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="absolute inset-0 w-44 bg-gradient-to-r from-transparent via-indigo-600 to-transparent"
            />
          </div>
        </div>
      </motion.div>

      {/* Footer Branding */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-8 flex items-center gap-2 text-slate-400 text-xs font-semibold"
      >
        <span>Cohéro Student</span>
        <span>&bull;</span>
        <span className="text-indigo-600 font-bold">Din Digitale Studiepartner</span>
      </motion.div>
    </div>
  );
};

export default AuthLoadingScreen;


