'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

const AuthLoadingScreen = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDFCF8] relative overflow-hidden">
      {/* Dynamic Ambient Background */}
      <div className="absolute top-0 left-0 w-full h-full">
          <motion.div 
            animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
                opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0%,transparent_70%)]" 
          />
          <motion.div 
            animate={{ 
                scale: [1.2, 1, 1.2],
                rotate: [0, -90, 0],
                opacity: [0.05, 0.15, 0.05]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-1/4 -right-1/4 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08)_0%,transparent_70%)]" 
          />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* The Card */}
        <div className="bg-white/40 backdrop-blur-3xl border border-white p-12 sm:p-16 rounded-[3rem] sm:rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.03)] flex flex-col items-center mx-4">
            
            {/* Logo Area with Orbit */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 mb-10 sm:mb-12 flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-2 border-dashed border-slate-200 rounded-full"
                />
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-4 border border-slate-100 rounded-full"
                />
                <motion.div
                    animate={{ 
                        y: [0, -8, 0],
                        filter: ["drop-shadow(0 0 0px rgba(0,0,0,0))", "drop-shadow(0 10px 20px rgba(99,102,241,0.2))", "drop-shadow(0 0 0px rgba(0,0,0,0))"]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="relative z-10"
                >
                    <Image 
                        src="/main_logo.png" 
                        alt="Cohéro Logo" 
                        width={80} 
                        height={80} 
                        priority
                        className="w-16 h-16 sm:w-20 sm:h-20 grayscale brightness-0 opacity-90"
                    />
                </motion.div>
                
                {/* Orbiting Dot */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0"
                >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
                </motion.div>
            </div>

            {/* Typography */}
            <div className="text-center space-y-4">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 serif tracking-tighter">Gør din kollega klar</h2>
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-2">Synkroniserer Vidensbibliotek</p>
                </motion.div>
                
                {/* Progress Line */}
                <div className="w-40 sm:w-48 h-1 bg-slate-100 rounded-full overflow-hidden relative mt-8">
                    <motion.div 
                        animate={{ 
                            x: [-192, 192] 
                        }}
                        transition={{ 
                            duration: 1.5, 
                            repeat: Infinity, 
                            ease: "easeInOut" 
                        }}
                        className="absolute inset-0 w-48 bg-gradient-to-r from-transparent via-indigo-600 to-transparent"
                    />
                </div>
            </div>
        </div>
      </motion.div>

      {/* Footer Branding */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-12 flex flex-col items-center gap-3"
      >
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
          Cohéro &bull; Professionel Rygdækning
        </p>
      </motion.div>
    </div>
  );
};

export default AuthLoadingScreen;

