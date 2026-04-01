'use client';

import React, { useMemo, useEffect } from 'react';
import { useApp } from '@/app/provider';
import { motion, AnimatePresence } from 'framer-motion';
import { Snowflake, Gift, Bird, Ghost, Egg, Sparkles, Flower2, Moon, Skull } from 'lucide-react';

const ChristmasDecorations = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            {/* Theme Glow */}
            <div className="absolute top-0 left-0 w-[50vw] h-[50vh] bg-rose-500/5 blur-[120px]" />
            <div className="absolute bottom-0 right-0 w-[50vw] h-[50vh] bg-emerald-500/5 blur-[120px]" />

            {/* Snowflakes */}
            {[...Array(30)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ y: -20, x: Math.random() * 100 + 'vw', opacity: 0 }}
                    animate={{ 
                        y: '110vh', 
                        opacity: [0, 1, 1, 0],
                        x: `calc(${Math.random() * 100}vw + ${Math.random() * 40 - 20}px)` 
                    }}
                    transition={{ 
                        duration: Math.random() * 15 + 10, 
                        repeat: Infinity, 
                        delay: Math.random() * 20,
                        ease: "linear"
                    }}
                    className="absolute text-blue-200/40"
                >
                    <Snowflake size={Math.random() * 20 + 8} />
                </motion.div>
            ))}

            {/* Sparkling Stars */}
            {[...Array(10)].map((_, i) => (
                <motion.div
                    key={`star-${i}`}
                    initial={{ opacity: 0, scale: 0, x: Math.random() * 100 + 'vw', y: Math.random() * 100 + 'vh' }}
                    animate={{ opacity: [0, 0.8, 0], scale: [0, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: Math.random() * 5 }}
                    className="absolute text-amber-200"
                >
                    <Sparkles size={12} />
                </motion.div>
            ))}
            
            {/* Hanging Decorations */}
            <div className="absolute top-0 right-10 flex gap-8">
                <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="origin-top">
                    <div className="w-0.5 h-12 bg-slate-300 mx-auto" />
                    <Gift className="text-rose-500 fill-rose-500/20" size={32} />
                </motion.div>
                <motion.div animate={{ rotate: [0, -7, 7, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="origin-top">
                    <div className="w-0.5 h-20 bg-slate-200 mx-auto" />
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 border-2 border-amber-600 shadow-xl flex items-center justify-center">
                        <Sparkles size={16} className="text-white" />
                    </div>
                </motion.div>
            </div>

            {/* Holly in left corner */}
            <div className="absolute top-0 left-0 p-4 opacity-40">
                <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-rose-600 absolute -top-1 -left-1 shadow-lg" />
                    <div className="w-8 h-8 rounded-full bg-rose-500 absolute top-2 left-2 shadow-lg" />
                    <div className="w-8 h-8 rounded-full bg-rose-700 absolute -bottom-1 left-4 shadow-lg" />
                </div>
            </div>
        </div>
    );
};

const EasterDecorations = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
             {/* Theme Glow */}
             <div className="absolute top-0 right-0 w-[60vw] h-[60vh] bg-yellow-400/5 blur-[150px]" />
             <div className="absolute bottom-0 left-0 w-[60vw] h-[60vh] bg-lime-400/5 blur-[150px]" />

             {/* Floating Eggs */}
             {[...Array(12)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ y: '110vh', x: Math.random() * 100 + 'vw', opacity: 0, rotate: 0 }}
                    animate={{ 
                        y: '-10vh', 
                        opacity: [0, 0.6, 0.6, 0],
                        rotate: 720,
                        x: `calc(${Math.random() * 100}vw + ${Math.random() * 80 - 40}px)` 
                    }}
                    transition={{ 
                        duration: Math.random() * 20 + 20, 
                        repeat: Infinity, 
                        delay: Math.random() * 15,
                        ease: "easeInOut"
                    }}
                    className="absolute"
                >
                    <div 
                        className={`w-10 h-14 rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] shadow-xl border-2 ${
                            i % 3 === 0 ? 'bg-rose-100 border-rose-200' : 
                            i % 3 === 1 ? 'bg-yellow-100 border-yellow-200' : 
                            'bg-sky-100 border-sky-200'
                        }`} 
                    />
                </motion.div>
            ))}

             {/* Spring Flowers */}
             {[...Array(10)].map((_, i) => (
                <motion.div
                    key={`flower-${i}`}
                    initial={{ opacity: 0, scale: 0, x: Math.random() * 100 + 'vw', y: '105vh' }}
                    animate={{ opacity: 1, scale: 1, y: '95vh' }}
                    className="absolute text-rose-300/40"
                >
                    <Flower2 size={24 + Math.random() * 20} className="animate-spin-slow" />
                </motion.div>
            ))}
            
            {/* Birds */}
            <motion.div 
                initial={{ x: -100, y: '30vh' }}
                animate={{ x: '110vw', y: ['30vh', '25vh', '35vh', '30vh'] }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="absolute text-sky-400/20"
            >
                <Bird size={48} />
            </motion.div>
        </div>
    );
};

const HalloweenDecorations = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
             {/* Spooky Vignette */}
             <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(88,28,135,0.1)]" />
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />

             {/* Spooky Ghosts */}
             {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, x: Math.random() * 100 + 'vw', y: Math.random() * 100 + 'vh' }}
                    animate={{ 
                        opacity: [0, 0.2, 0.2, 0],
                        y: [null, '-=100px', '+=100px'],
                        transition: { duration: 8, repeat: Infinity }
                    }}
                    className="absolute text-slate-200"
                >
                    <Ghost size={64} className="blur-[1px]" />
                </motion.div>
            ))}

            {/* Skulls and Moons */}
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={`spooky-${i}`}
                    initial={{ opacity: 0, x: Math.random() * 100 + 'vw', y: Math.random() * 100 + 'vh' }}
                    animate={{ opacity: [0, 0.15, 0] }}
                    transition={{ duration: 10, repeat: Infinity, delay: Math.random() * 10 }}
                    className="absolute text-orange-950/20"
                >
                    {i % 2 === 0 ? <Skull size={32} /> : <Moon size={40} />}
                </motion.div>
            ))}

            {/* Bats flying periodically */}
            <motion.div
                initial={{ x: '110vw', y: '15vh', scale: 0.5 }}
                animate={{ x: '-15vw', y: '45vh', rotate: [-10, 10, -10] }}
                transition={{ duration: 10, repeat: Infinity, delay: 2, ease: "easeInOut" }}
                className="absolute text-slate-900/30 flex items-center gap-1"
            >
                <div className="w-12 h-6 bg-slate-900/60 rounded-[100%_0%_100%_0%_/_100%_0%_100%_0%]" />
                <div className="w-4 h-4 bg-slate-900/60 rounded-full" />
                <div className="w-12 h-6 bg-slate-900/60 rounded-[0%_100%_0%_100%_/_0%_100%_0%_100%]" />
            </motion.div>

            {/* Spider Web (Static-ish) */}
            <div className="absolute top-0 right-0 p-8 opacity-20 text-slate-400">
                <svg width="200" height="200" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M0 0 L200 200 M200 0 L0 200 M100 0 L100 200 M0 100 L200 100" />
                    <circle cx="100" cy="100" r="20" strokeDasharray="4 4" />
                    <circle cx="100" cy="100" r="40" strokeDasharray="6 6" />
                    <circle cx="100" cy="100" r="60" strokeDasharray="8 8" />
                    <circle cx="100" cy="100" r="80" strokeDasharray="10 10" />
                </svg>
            </div>
        </div>
    );
};

export const ThemeDecorations = () => {
    const { activeTheme } = useApp();

    useEffect(() => {
        // Inject Theme Colors as CSS Variables
        const root = document.documentElement;
        if (activeTheme === 'christmas') {
            root.style.setProperty('--theme-accent', 'rgba(225, 29, 72, 0.1)');
            root.style.setProperty('--theme-border', 'rgba(225, 29, 72, 0.2)');
        } else if (activeTheme === 'easter') {
            root.style.setProperty('--theme-accent', 'rgba(250, 204, 21, 0.1)');
            root.style.setProperty('--theme-border', 'rgba(250, 204, 21, 0.2)');
        } else if (activeTheme === 'halloween') {
            root.style.setProperty('--theme-accent', 'rgba(249, 115, 22, 0.1)');
            root.style.setProperty('--theme-border', 'rgba(249, 115, 22, 0.2)');
        } else {
            root.style.removeProperty('--theme-accent');
            root.style.removeProperty('--theme-border');
        }
    }, [activeTheme]);

    return (
        <AnimatePresence mode="wait">
            {activeTheme === 'christmas' && (
                <motion.div key="christmas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ChristmasDecorations />
                </motion.div>
            )}
            {activeTheme === 'easter' && (
                <motion.div key="easter" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <EasterDecorations />
                </motion.div>
            )}
            {activeTheme === 'halloween' && (
                <motion.div key="halloween" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <HalloweenDecorations />
                </motion.div>
            )}
        </AnimatePresence>
    );
};
