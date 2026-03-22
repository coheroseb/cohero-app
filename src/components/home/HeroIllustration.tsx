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

import { Variants } from 'framer-motion';

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

    // Continuous floating animation for elements after they land
    const elementVariants = (delay: number, x: number, y: number): Variants => ({
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
                duration: 1.2,
                type: "spring",
                stiffness: 60,
                damping: 15
            }
        },
        orbit: {
            x: [x, x + 5, x - 5, x],
            y: [y, y - 10, y + 5, y],
            rotate: [0, Math.random() * 10 - 5, Math.random() * 10 - 5, 0],
            transition: {
                duration: 8 + Math.random() * 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2.5 + delay
            }
        }
    });

    const organizedVariants: Variants = {
        initial: { opacity: 0, y: 20, scale: 0.9 },
        animate: { 
            opacity: 1, 
            y: 0,
            scale: 1,
            transition: { 
                delay: 2.5, 
                duration: 1 
            }
        },
        pulse: {
            boxShadow: [
                "0 20px 50px -15px rgba(251, 191, 36, 0.1)",
                "0 25px 60px -10px rgba(251, 191, 36, 0.2)",
                "0 20px 50px -15px rgba(251, 191, 36, 0.1)"
            ],
            transition: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    const elements = [
        { icon: Book, color: "text-amber-500", delay: 0, x: -140, y: -200, label: "Pensum" },
        { icon: Scale, color: "text-blue-500", delay: 0.2, x: 150, y: -220, label: "Jura" },
        { icon: Users, color: "text-emerald-500", delay: 0.4, x: -170, y: -80, label: "Grupper" },
        { icon: FileText, color: "text-rose-500", delay: 0.1, x: 160, y: -60, label: "Journaler" },
        { icon: MessageSquare, color: "text-indigo-500", delay: 0.3, x: -40, y: -280, label: "Sparring" },
        { icon: Hash, color: "text-slate-400", delay: 0.5, x: 80, y: -300, label: "Paragraffer" },
    ];

    return (
        <div className="relative w-full h-full flex items-center justify-center pt-20">
            {/* Background Glows with pulsing animation */}
            <motion.div 
                animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-t from-amber-100/30 to-transparent blur-[120px] rounded-full -z-10"
            ></motion.div>
            
            {/* The "Organized Place" (Portal/Box) */}
            <motion.div 
                variants={organizedVariants}
                initial="initial"
                animate={["animate", "pulse"]}
                className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-44 bg-white/40 backdrop-blur-3xl border border-white/80 rounded-[48px] shadow-2xl z-0"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent rounded-[48px]"></div>
                <div className="flex flex-col items-center justify-center h-full space-y-3">
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 rounded-full border-2 border-dashed border-amber-200/50 flex items-center justify-center relative"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="absolute inset-0 bg-amber-500/10 rounded-full blur-xl"
                        ></motion.div>
                        <Sparkles className="w-8 h-8 text-amber-500 relative z-10" />
                    </motion.div>
                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-900/40">Samlingspunktet</span>
                </div>
            </motion.div>

            {/* Floating Elements flying out and then orbiting */}
            {elements.map((el, index) => (
                <motion.div
                    key={index}
                    variants={elementVariants(el.delay, el.x, el.y)}
                    initial="initial"
                    animate={["animate", "orbit"]}
                    className="absolute z-20"
                    style={{ left: '50%', top: '70%', marginLeft: -24, marginTop: -24 }}
                >
                    <motion.div 
                        whileHover={{ scale: 1.15, rotate: 0 }}
                        className={`p-5 bg-white/95 backdrop-blur-sm rounded-3xl shadow-[0_15px_35px_-10px_rgba(0,0,0,0.1)] border border-slate-100/50 flex flex-col items-center gap-2 group cursor-pointer transition-shadow hover:shadow-2xl`}
                    >
                        <el.icon className={`w-7 h-7 ${el.color} transition-transform group-hover:scale-110`} />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-amber-900/60 transition-colors whitespace-nowrap">{el.label}</span>
                    </motion.div>
                </motion.div>
            ))}

            {/* The Person (indicated by arms/hands holding the phone) */}
            <div className="relative z-30 flex flex-col items-center">
                <motion.div 
                    animate={{ 
                        y: [0, -12, 0],
                        rotate: [0, 0.5, -0.5, 0]
                    }}
                    transition={{ 
                        duration: 8, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                    }}
                    className="relative"
                >
                    {/* Phone Shadow with matching bobbing animation */}
                    <motion.div 
                        animate={{ 
                            scale: [1, 0.9, 1],
                            opacity: [0.1, 0.15, 0.1]
                        }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-40 h-8 bg-slate-900/20 blur-2xl rounded-full"
                    ></motion.div>
                    
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
                variants={organizedVariants}
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
