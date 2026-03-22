'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  Book, 
  FileText, 
  Users, 
  Scale, 
  MessageSquare,
  Sparkles,
  Smartphone,
  CheckCircle2,
  Hash
} from 'lucide-react';

const HeroIllustration = () => {
    // Animation variants
    const phoneVariants = {
        initial: { y: 100, opacity: 0, rotate: -5 },
        animate: { 
            y: 0, 
            opacity: 1, 
            rotate: 0,
            transition: { 
                type: "spring",
                stiffness: 100,
                damping: 15,
                delay: 0.5
            }
        }
    };

    const elementVariants = (delay: number, x: number, y: number) => ({
        initial: { 
            x: 0, 
            y: 0, 
            scale: 0, 
            opacity: 0,
            rotate: 0 
        },
        animate: { 
            x, 
            y, 
            scale: 1, 
            opacity: 1,
            rotate: Math.random() * 20 - 10,
            transition: { 
                delay: 1.2 + delay,
                duration: 0.8,
                type: "spring",
                stiffness: 80,
                damping: 12
            }
        }
    });

    const organizedVariants = (delay: number) => ({
        initial: { opacity: 0, y: 20 },
        animate: { 
            opacity: 1, 
            y: 0,
            transition: { 
                delay: 3 + delay,
                duration: 0.5
            }
        }
    });

    const elements = [
        { icon: Book, color: "text-amber-500", delay: 0, x: -120, y: -180, label: "Pensum" },
        { icon: Scale, color: "text-blue-500", delay: 0.2, x: 130, y: -200, label: "Jura" },
        { icon: Users, color: "text-emerald-500", delay: 0.4, x: -150, y: -60, label: "Grupper" },
        { icon: FileText, color: "text-rose-500", delay: 0.1, x: 140, y: -40, label: "Journaler" },
        { icon: MessageSquare, color: "text-indigo-500", delay: 0.3, x: -40, y: -240, label: "Sparring" },
        { icon: Hash, color: "text-slate-400", delay: 0.5, x: 60, y: -260, label: "Paragraffer" },
    ];

    return (
        <div className="relative w-full h-full flex items-center justify-center pt-20">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-amber-100/20 to-transparent blur-[120px] rounded-full"></div>
            
            {/* The "Organized Place" (Portal/Box) */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2.5, duration: 1 }}
                className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-40 bg-white/40 backdrop-blur-xl border border-white/60 rounded-[40px] shadow-2xl z-0"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent rounded-[40px]"></div>
                <div className="flex flex-col items-center justify-center h-full space-y-2">
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="w-12 h-12 rounded-full border-2 border-dashed border-amber-200 flex items-center justify-center"
                    >
                        <Sparkles className="w-6 h-6 text-amber-500" />
                    </motion.div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-900/40">Samlingspunktet</span>
                </div>
            </motion.div>

            {/* Floating Elements flying out */}
            {elements.map((el, index) => (
                <motion.div
                    key={index}
                    variants={elementVariants(el.delay, el.x, el.y)}
                    initial="initial"
                    animate="animate"
                    className="absolute z-20"
                    style={{ left: '50%', top: '70%', marginLeft: -24, marginTop: -24 }}
                >
                    <div className={`p-4 bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center gap-2 sm:hover:scale-110 transition-transform cursor-default group`}>
                        <el.icon className={`w-6 h-6 ${el.color}`} />
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-900 transition-colors">{el.label}</span>
                    </div>
                </motion.div>
            ))}

            {/* The Person (indicated by arms/hands holding the phone) */}
            <div className="relative z-30 flex flex-col items-center">
                <motion.div 
                    variants={phoneVariants}
                    initial="initial"
                    animate="animate"
                    className="relative"
                >
                    {/* Phone Shadow */}
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900/10 blur-xl rounded-full"></div>
                    
                    {/* The Smartphone */}
                    <div className="relative w-48 h-[380px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl border-[6px] border-slate-800 overflow-hidden">
                        {/* Speaker/Camera notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-900 rounded-b-2xl z-50"></div>
                        
                        {/* Screen Content */}
                        <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden relative">
                            {/* NEW: App Screenshot from User */}
                            <Image 
                                src="/hero-phone-screen.jpg"
                                alt="Cohéro App Interface"
                                fill
                                className="object-cover"
                                priority
                            />
                            
                            {/* Inner Screen Glow */}
                            <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-white/0 mix-blend-overlay pointer-events-none"></div>
                        </div>
                    </div>

                    {/* Notification popping up */}
                    <motion.div 
                        initial={{ scale: 0, opacity: 0, x: 40 }}
                        animate={{ scale: 1, opacity: 1, x: 60 }}
                        transition={{ delay: 2, type: "spring" }}
                        className="absolute top-20 right-0 bg-white p-3 rounded-2xl shadow-xl border border-amber-100 flex items-center gap-3 w-48"
                    >
                        <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-900">Ny sparring klar</p>
                            <p className="text-[8px] text-slate-400">Tjek juraen på din case</p>
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Labels for "Organized" area */}
            <motion.div 
                variants={organizedVariants(0)}
                initial="initial"
                animate="animate"
                className="absolute top-4 left-1/2 -translate-x-1/2 -mt-12 text-center"
            >
                <div className="px-4 py-1.5 bg-amber-950 text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">
                    Din Dømmekraft
                </div>
            </motion.div>
        </div>
    );
};

export default HeroIllustration;
