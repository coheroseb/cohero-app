'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  ShoppingBag, 
  Brain, 
  Sparkles, 
  Zap,
  Layout,
  MessageSquare,
  Search,
  Users
} from 'lucide-react';

const HeroIllustration = () => {
    return (
        <div className="relative w-full h-[500px] lg:h-[650px] flex items-center justify-center">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.05)_0,transparent_70%)] pointer-events-none" />
            <motion.div 
                animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[400px] bg-amber-500/5 blur-[120px] rounded-full -z-10"
            />

            <div className="relative w-full max-w-lg aspect-square">
                {/* Central Core - The Cohéro Portal */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
                >
                    <div className="relative group">
                        <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                        <div className="relative w-48 h-48 sm:w-64 sm:h-64 bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[48px] sm:rounded-[64px] shadow-2xl flex flex-col items-center justify-center gap-4 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent" />
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 opacity-[0.03]"
                                style={{ 
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20L0 0M20 20L40 0M20 20L40 40M20 20L0 40' stroke='%23000' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")` 
                                }}
                            />
                            
                            <motion.div 
                                animate={{ 
                                    scale: [1, 1.1, 1],
                                    rotate: [0, 5, -5, 0]
                                }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-950 rounded-[20px] sm:rounded-[28px] flex items-center justify-center shadow-xl shadow-slate-900/20 z-10"
                            >
                                <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400" />
                            </motion.div>
                            <div className="text-center z-10 px-4">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-900/40 mb-1">Ecosytem</h3>
                                <p className="text-[14px] sm:text-[16px] font-black text-slate-800 tracking-tight">Cohéro v4.0</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Satellite 1: Praktik & Indsigt (Top Left) */}
                <motion.div
                    initial={{ x: -50, y: -50, opacity: 0 }}
                    animate={{ x: -140, y: -160, opacity: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
                    whileHover={{ scale: 1.05 }}
                    className="absolute top-1/2 left-1/2 z-30"
                >
                    <div className="group relative">
                        <div className="absolute -inset-4 bg-amber-500/5 blur-xl group-hover:bg-amber-500/10 transition-all" />
                        <div className="relative p-5 sm:p-7 bg-white/90 backdrop-blur-md rounded-[32px] sm:rounded-[40px] shadow-xl border border-white/50 flex flex-col gap-3 min-w-[200px] sm:min-w-[240px]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-50 rounded-2xl flex items-center justify-center shadow-inner">
                                    <Star className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 fill-amber-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-amber-900/40 uppercase tracking-widest">Studerende siger</p>
                                    <h4 className="text-[13px] sm:text-[15px] font-black text-slate-800">Praktik-indsigt</h4>
                                </div>
                            </div>
                            <p className="text-[11px] sm:text-[12px] text-slate-500 font-medium italic leading-relaxed">
                                "Vejledningen her var helt unik..."
                            </p>
                            <div className="flex items-center gap-1">
                                {[1,2,3,4,5].map(s => <Star key={s} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />)}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Satellite 2: Markedsplads (Mid Right) */}
                <motion.div
                    initial={{ x: 50, y: 0, opacity: 0 }}
                    animate={{ x: 150, y: -20, opacity: 1 }}
                    transition={{ delay: 0.7, type: "spring", stiffness: 100 }}
                    whileHover={{ scale: 1.05 }}
                    className="absolute top-1/2 left-1/2 z-30"
                >
                    <div className="group relative">
                        <div className="absolute -inset-4 bg-cyan-500/5 blur-xl group-hover:bg-cyan-500/10 transition-all" />
                        <div className="relative p-5 sm:p-7 bg-white/90 backdrop-blur-md rounded-[32px] sm:rounded-[40px] shadow-xl border border-white/50 flex items-center gap-4 min-w-[180px] sm:min-w-[220px]">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-cyan-50 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                                <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-600" />
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <p className="text-[10px] font-black text-cyan-900/30 uppercase tracking-widest">Resources</p>
                                <h4 className="text-[13px] sm:text-[15px] font-black text-slate-800">Markedsplads</h4>
                                <div className="mt-1 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span className="text-[9px] font-bold text-slate-400">800+ dokumenter</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Satellite 3: AI Sparring (Bottom Center) */}
                <motion.div
                    initial={{ x: 0, y: 50, opacity: 0 }}
                    animate={{ x: -100, y: 140, opacity: 1 }}
                    transition={{ delay: 0.9, type: "spring", stiffness: 100 }}
                    whileHover={{ scale: 1.05 }}
                    className="absolute top-1/2 left-1/2 z-30"
                >
                    <div className="group relative">
                        <div className="absolute -inset-4 bg-indigo-500/5 blur-xl group-hover:bg-indigo-500/10 transition-all" />
                        <div className="relative p-5 sm:p-7 bg-slate-900 rounded-[32px] sm:rounded-[40px] shadow-2xl border border-slate-700/30 flex flex-col gap-4 min-w-[200px] sm:min-w-[260px] overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Zap className="w-16 h-16 text-white -rotate-12" />
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/20">
                                    <Brain className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-indigo-300/40 uppercase tracking-widest">Intelligent</p>
                                    <h4 className="text-[13px] sm:text-[15px] font-black text-white">AI Studiepartner</h4>
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                     <motion.div 
                                        animate={{ width: ["0%", "85%", "85%", "0%"] }}
                                        transition={{ duration: 4, repeat: Infinity, times: [0, 0.3, 0.8, 1] }}
                                        className="h-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" 
                                     />
                                </div>
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[8px] font-black text-slate-500 tracking-wider">ANALYSERER CASE...</span>
                                    <Sparkles className="w-2.5 h-2.5 text-indigo-400 animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Connecting Lines (Subtle SVG) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03]" viewBox="0 0 600 600">
                    <motion.path 
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, delay: 1 }}
                        d="M300 300 L160 140 M300 300 L450 280 M300 300 L200 440" 
                        stroke="black" 
                        strokeWidth="2" 
                        strokeDasharray="4 4" 
                        fill="none" 
                    />
                </svg>
            </div>
        </div>
    );
};

export default HeroIllustration;
