
'use client';

import React, { useEffect, useState } from 'react';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useApp } from '@/app/provider';
import { Shield, Hammer, Clock, Mail, ExternalLink, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export const MaintenanceGuard = ({ children }: { children: React.ReactNode }) => {
    const { userProfile } = useApp();
    const pathname = usePathname();
    const firestore = useFirestore();
    const maintenanceQuery = doc(firestore!, 'systemSettings', 'maintenance');
    const { data: maintenance, isLoading } = useDoc<any>(maintenanceQuery);

    if (isLoading) return <>{children}</>;

    const isMaintenance = maintenance?.enabled || false;
    const isAdmin = userProfile?.role === 'admin';
    const isAuthPath = pathname?.startsWith('/auth');

    if (isMaintenance && !isAdmin && !isAuthPath) {
        return (
            <div className="fixed inset-0 z-[9999] bg-[#0A0A0A] flex items-center justify-center p-6 font-sans">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -mt-64 animate-pulse"></div>
                    <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[120px] -mb-64"></div>
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-2xl w-full text-center space-y-12 relative z-10"
                >
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-center shadow-2xl backdrop-blur-xl relative">
                            <Hammer className="w-10 h-10 text-indigo-400" />
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center border-4 border-[#0A0A0A] animate-bounce">
                                <Clock className="w-4 h-4 text-black" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                                Vi udfører lige nu en <span className="text-indigo-400">system-opdatering</span>
                            </h1>
                            <p className="text-lg md:text-xl text-white/50 font-medium max-w-lg mx-auto">
                                Cohéro er midlertidigt offline mens vi ruller forbedringer ud til din digitale kollega. Vi er snart tilbage!
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-8 bg-white/5 border border-white/5 rounded-[2rem] text-left space-y-3">
                            <div className="flex items-center gap-3 text-indigo-400">
                                <Shield className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Status</span>
                            </div>
                            <p className="text-sm font-bold text-white uppercase tracking-tight">Kritiske Systemer: Sikre</p>
                        </div>
                         <div className="p-8 bg-white/5 border border-white/5 rounded-[2rem] text-left space-y-3">
                            <div className="flex items-center gap-3 text-emerald-400">
                                <Mail className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Support</span>
                            </div>
                            <p className="text-sm font-bold text-white uppercase tracking-tight">kontakt@cohero.dk</p>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 flex flex-col items-center gap-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Tak for din tålmodighed</p>
                        <a 
                            href="https://facebook.com/cohero_is" 
                            target="_blank" 
                            className="flex items-center gap-3 text-sm font-bold text-white/40 hover:text-indigo-400 transition-colors group"
                        >
                            Følg opdateringer på Facebook <ExternalLink className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </a>
                        
                        {/* Subtle backdoor for admins */}
                        <a href="/auth" className="mt-8 flex items-center gap-2 text-[8px] font-black uppercase text-white/5 tracking-[0.3em] hover:text-white/20 transition-all">
                           <Lock className="w-2.5 h-2.5" /> Backdoor Access
                        </a>
                    </div>
                </motion.div>
            </div>
        );
    }

    return <>{children}</>;
};
