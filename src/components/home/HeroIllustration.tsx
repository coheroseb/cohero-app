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
  Clock,
  FileText,
  HandHelping,
  Scale,
  Zap,
  Layout
} from 'lucide-react';

const HeroIllustration = () => {
    const [activeTab, setActiveTab] = useState(0);
    const tabs = [
        { id: 'praksis', title: 'Praksis-Træning', color: 'emerald' },
        { id: 'raadgivning', title: 'Borger-Hjælp', color: 'rose' },
        { id: 'akademisk', title: 'Akademisk Design', color: 'indigo' }
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
                    className="relative bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[40px] shadow-[0_32px_80px_rgba(0,0,0,0.06)] overflow-hidden min-h-[420px]"
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
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Studie-Sync</span>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="relative p-8 h-[320px]">
                        <AnimatePresence mode="wait">
                            {activeTab === 0 && (
                                <motion.div
                                    key="praksis"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.4 }}
                                    className="flex flex-col gap-6"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                            <FileText className="w-7 h-7 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-slate-900 tracking-tight">Journal- & Case-træner</h4>
                                            <p className="text-slate-500 text-sm font-medium">Brug AI som din faglige sparringspartner.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 flex flex-col gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                                <Sparkles className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Intelligent Feedback</div>
                                        </div>
                                        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-3">
                                            <p className="text-[11px] text-slate-600 font-medium italic">"Din vurdering af handleplanen for Børnefaglig undersøgelse er velbegrundet, men overvej..."</p>
                                            <div className="h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
                                                <motion.div 
                                                    animate={{ width: ["30%", "100%"] }}
                                                    className="h-full bg-emerald-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 1 && (
                                <motion.div
                                    key="raadgivning"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.4 }}
                                    className="flex flex-col gap-6"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                                            <HandHelping className="w-7 h-7 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-slate-900 tracking-tight">Borger-Rådgivning</h4>
                                            <p className="text-slate-500 text-sm font-medium">Vær bisidder eller rådgiver for borgere i nød.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white rounded-[2.5rem] p-6 border border-rose-100 shadow-sm flex flex-col gap-5 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4">
                                            <div className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Ny anmodning!</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                                                <TrendingUp className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-900 tracking-tight">Bisidder til møde i kommunen</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Budget: 350 kr.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="h-8 flex-1 bg-slate-900 rounded-xl flex items-center justify-center text-[9px] font-black text-white uppercase tracking-widest">Tag opgave</div>
                                            <div className="h-8 flex-1 bg-slate-50 rounded-xl flex items-center justify-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Gem</div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 2 && (
                                <motion.div
                                    key="akademisk"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.4 }}
                                    className="flex flex-col gap-6"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                            <Layout className="w-7 h-7 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-slate-900 tracking-tight">Eksamens-Arkitekten</h4>
                                            <p className="text-slate-500 text-sm font-medium">Byg den perfekte struktur til dine opgaver.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white rounded-3xl p-5 border border-indigo-100 shadow-sm flex flex-col gap-4">
                                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                                                <Scale className="w-5 h-5 text-indigo-500" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <p className="text-[10px] font-black text-indigo-950 uppercase tracking-widest">§ 81 Opslag</p>
                                                <div className="h-2 w-full bg-indigo-50 rounded-full" />
                                                <div className="h-2 w-2/3 bg-indigo-50 rounded-full" />
                                            </div>
                                        </div>
                                        <div className="bg-indigo-900 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
                                            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Struktur-tjek</p>
                                            <div className="flex flex-col gap-2">
                                                <div className="h-1.5 w-full bg-indigo-500/30 rounded-full" />
                                                <div className="h-1.5 w-full bg-white rounded-full" />
                                                <div className="h-1.5 w-4/5 bg-indigo-500/30 rounded-full" />
                                            </div>
                                            <CheckCircle2 className="w-5 h-5 text-indigo-400 self-end" />
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
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fagligt verificeret</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">|</div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dansk Lov-Sync</span>
                        </div>
                    </div>
                </motion.div>

                {/* Subtle Floating Elements to add depth */}
                <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-12 -right-8 w-16 h-16 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl flex items-center justify-center border border-white/50 z-30"
                >
                    <Zap className="w-8 h-8 text-amber-500 fill-amber-500 animate-pulse" />
                </motion.div>

                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute -bottom-8 -left-8 w-20 h-20 bg-white/80 backdrop-blur-md rounded-3xl shadow-xl flex items-center justify-center border border-white/50 z-30"
                >
                    <div className="relative">
                        <Scale className="w-10 h-10 text-indigo-500" />
                        <motion.div 
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full"
                        />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default HeroIllustration;
