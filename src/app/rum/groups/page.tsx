'use client';

import React from 'react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import GroupsPage from './home-page';
import { UserPlus, LogIn, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RumGroupsPage() {
  const { user, userProfile, isUserLoading, openAuthPage } = useApp();

  if (isUserLoading) return <AuthLoadingScreen />;

  if (!user) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-24 h-24 bg-slate-900 text-white rounded-[32px] flex items-center justify-center mb-10 shadow-2xl shadow-slate-900/20"
        >
            <Users className="w-10 h-10" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4 mb-12"
        >
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9]">
                Cohéro <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-400">Project.</span>
            </h1>
            <p className="text-lg text-slate-500 max-w-sm mx-auto font-medium leading-relaxed">
                Professionalisér jeres studiegruppe. Log ind eller opret en profil for at få adgang til jeres fælles rum.
            </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-sm"
        >
            <button 
                onClick={() => openAuthPage('signup')}
                className="w-full px-10 py-6 bg-slate-900 text-white rounded-[20px] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-slate-900/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
                <UserPlus className="w-5 h-5" />
                Opret profil
            </button>
            <button 
                onClick={() => openAuthPage('login')}
                className="w-full px-10 py-6 bg-white border border-slate-200 text-slate-900 rounded-[20px] font-black uppercase text-xs tracking-[0.2em] hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-sm"
            >
                <LogIn className="w-5 h-5" />
                Log ind
            </button>
        </motion.div>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-[10px] font-black uppercase tracking-[0.4em] text-slate-300"
        >
            En del af Cohéro-universet
        </motion.p>
      </div>
    );
  }

  // If user only has access to groups or we want to force this "standalone" view
  // We can eventually add logic here to redirect if they try to see other things
  
  return <GroupsPage />;
}
