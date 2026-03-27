'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  ShoppingBag, 
  Brain, 
  Sparkles, 
  BookOpen,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Clock
} from 'lucide-react';

const HeroIllustration = () => {
    const [activeTab, setActiveTab] = useState(0);
    const tabs = [
        { id: 'ai', title: 'AI Sparring', color: 'indigo' },
        { id: 'market', title: 'Markedsplads', color: 'cyan' },
        { id: 'praktik', title: 'Praktik-Arkiv', color: 'amber' }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setActiveTab((prev) => (prev + 1) % tabs.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative w-full h-[500px] lg:h-[600px] flex items-center justify-center pt-8">
            {/* Ambient Background */}
            <motion.div 
                animate={{ 
                    opacity: [0.3, 0.5, 0.3],
                    scale: [1, 1.05, 1]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[350px] bg-amber-500/5 blur-[100px] rounded-full -z-10"
            />

            <div className="relative w-full max-w-2xl px-4 sm:px-0">
                {/* Main Dashboard Container */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[40px] shadow-[0_32px_80px_rgba(0,0,0,0.06)] overflow-hidden min-h-[400px]"
                >
                    {/* Interior Gradient Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
                    
                    {/* Header/Tabs */}
                    <div className="relative z-10 p-8 border-b border-slate-200/40 flex items-center justify-between">
                        <div className="flex gap-4 sm:gap-6">
                            {tabs.map((tab, idx) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(idx)}
                                    className={`relative py-1 text-[11px] sm:text-[13px] font-black uppercase tracking-widest transition-colors ${activeTab === idx ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {tab.title}
                                    {activeTab === idx && (
                                        <motion.div 
                                            layoutId="activeTab"
                                            className="absolute -bottom-2 left-0 right-0 h-1 bg-amber-500 rounded-full"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="hidden sm:flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live System</span>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="relative p-8 h-[300px]">
                        <AnimatePresence mode="wait">
                            {activeTab === 0 && (
                                <motion.div
                                    key="ai"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.4 }}
                                    className="flex flex-col gap-6"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                            <Brain className="w-7 h-7 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-slate-900 tracking-tight">AI Sparring & Feedback</h4>
                                            <p className="text-slate-500 text-sm font-medium">Få faglig rygdækning på dine journaler i realtid.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 flex flex-col gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                            </div>
                                            <div className="h-4 w-2/3 bg-slate-200 rounded-full animate-pulse" />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-3 w-full bg-slate-100 rounded-full" />
                                            <div className="h-3 w-4/5 bg-slate-100 rounded-full" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 1 && (
                                <motion.div
                                    key="market"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.4 }}
                                    className="flex flex-col gap-6"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                                            <ShoppingBag className="w-7 h-7 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-slate-900 tracking-tight">Studie-Markedsplads</h4>
                                            <p className="text-slate-500 text-sm font-medium">Køb og sælg Danmarks bedste studiemateriale.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        {[1, 2].map(i => (
                                            <div key={i} className="bg-white rounded-[24px] p-4 border border-slate-100 shadow-sm flex flex-col gap-3">
                                                <div className="w-full aspect-video bg-slate-50 rounded-xl flex items-center justify-center text-slate-200">
                                                    <BookOpen className="w-6 h-6" />
                                                </div>
                                                <div className="h-3 w-3/4 bg-slate-100 rounded-full" />
                                                <div className="flex justify-between items-center">
                                                    <div className="h-3 w-8 bg-emerald-50 rounded-full" />
                                                    <ArrowRight className="w-3 h-3 text-slate-300" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 2 && (
                                <motion.div
                                    key="praktik"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.4 }}
                                    className="flex flex-col gap-6"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                                            <Star className="w-7 h-7 fill-white text-white" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-slate-900 tracking-tight">Faglige Praktik-Indblik</h4>
                                            <p className="text-slate-500 text-sm font-medium">Se ratings og læs anmeldelser fra studerende i praktik.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm flex flex-col gap-5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-full" />
                                                <div>
                                                    <div className="h-3 w-20 bg-slate-200 rounded-full mb-1" />
                                                    <div className="flex gap-0.5">
                                                        {[1,2,3,4,5].map(s => <Star key={s} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="px-3 py-1 bg-amber-50 rounded-full text-[9px] font-black text-amber-600 uppercase tracking-widest">Verificeret</div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-3 w-full bg-slate-50 rounded-full" />
                                            <div className="h-3 w-2/3 bg-slate-50 rounded-full" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Bottom Status Bar */}
                    <div className="relative z-10 p-6 bg-slate-50/50 border-t border-slate-200/40 flex items-center justify-around">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sikkert miljø</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">|</div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Support dygnet rundt</span>
                        </div>
                    </div>
                </motion.div>

                {/* Subtle Floating Elements to add depth */}
                <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-12 -right-8 w-16 h-16 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl flex items-center justify-center border border-white/50 z-30"
                >
                    <TrendingUp className="w-8 h-8 text-emerald-500" />
                </motion.div>

                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute -bottom-8 -left-8 w-20 h-20 bg-white/80 backdrop-blur-md rounded-3xl shadow-xl flex items-center justify-center border border-white/50 z-30"
                >
                    <div className="relative">
                        <Sparkles className="w-10 h-10 text-amber-500" />
                        <motion.div 
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full"
                        />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default HeroIllustration;
