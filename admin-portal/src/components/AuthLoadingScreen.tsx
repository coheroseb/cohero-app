'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

const AuthLoadingScreen = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDFCF8] relative overflow-hidden">
      {/* Background Pattern - subtle consistency with the platform */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` 
        }}
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* Pulsing Logo Area */}
        <div className="relative mb-12">
            <motion.div
                animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ 
                    duration: 2.5, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                }}
                className="absolute inset-x-0 -inset-y-4 bg-amber-500/10 blur-2xl rounded-full"
            />
            
            <motion.div
                animate={{ 
                    y: [0, -5, 0]
                }}
                transition={{ 
                    duration: 3, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                }}
            >
                <Image 
                    src="/main_logo.png" 
                    alt="Cohéro Logo" 
                    width={64} 
                    height={64} 
                    priority
                    className="w-16 h-16 grayscale brightness-0 opacity-90 drop-shadow-sm"
                />
            </motion.div>
        </div>

        {/* Sophisticated Layered Spinner */}
        <div className="relative w-20 h-20 mb-10">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-[3px] border-amber-950/5 border-t-amber-950 rounded-full"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-2 border-[2px] border-cyan-500/5 border-t-cyan-500/30 rounded-full"
          />
          <motion.div 
            animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-6 bg-gradient-to-tr from-amber-500/20 to-cyan-500/20 rounded-full blur-sm"
          />
        </div>

        {/* Premium Typography */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <p className="text-[11px] font-black uppercase tracking-[0.5em] text-amber-950/50">
              Synkroniserer
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
          >
            <p className="text-[13px] text-amber-900/30 font-medium italic serif">
              Din digitale kollega gøres klar...
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Footer Branding */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-12 flex flex-col items-center gap-2"
      >
        <div className="h-px w-8 bg-amber-950/10 mb-2" />
        <p className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-950/20">
          Cohéro &copy; 2024
        </p>
      </motion.div>
      
      {/* Decorative Orbs */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-amber-100/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-cyan-100/10 rounded-full blur-[100px] pointer-events-none" />
    </div>
  );
};

export default AuthLoadingScreen;

