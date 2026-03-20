'use client';

import React from 'react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import GroupsPage from './home-page';
import { UserPlus, LogIn } from 'lucide-react';

export default function RumGroupsPage() {
  const { user, userProfile, isUserLoading, openAuthPage } = useApp();

  if (isUserLoading) return <AuthLoadingScreen />;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner text-amber-700">
            <UserPlus className="w-10 h-10" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-amber-950 serif mb-4">Cohéro Project Group</h1>
        <p className="text-slate-500 mb-12 max-w-md italic leading-relaxed">
            Professionalisér jeres studiegruppe. <br /> Log ind eller opret en profil for at få adgang til jeres fælles rum.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-sm">
            <button 
                onClick={() => openAuthPage('signup')}
                className="w-full px-10 py-5 bg-amber-950 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
                <UserPlus className="w-5 h-5" />
                Opret profil
            </button>
            <button 
                onClick={() => openAuthPage('login')}
                className="w-full px-10 py-5 bg-white border-2 border-amber-950 text-amber-950 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-amber-50 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
                <LogIn className="w-5 h-5" />
                Log ind
            </button>
        </div>
        
        <p className="mt-12 text-[10px] font-black uppercase tracking-widest text-slate-300">En del af Cohéro-universet</p>
      </div>
    );
  }

  // If user only has access to groups or we want to force this "standalone" view
  // We can eventually add logic here to redirect if they try to see other things
  
  return <GroupsPage />;
}
