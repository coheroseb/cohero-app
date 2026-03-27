import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  Sparkles,
  ShieldCheck,
  ShoppingBag,
  Star
} from 'lucide-react';

const HeroIllustration = () => {
    return (
        <div className="relative w-full h-full flex items-center justify-center pt-12">
            {/* Background Glows with pulsing animation */}
            <motion.div 
                animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-t from-amber-100/30 to-transparent blur-[120px] rounded-full -z-10"
            ></motion.div>
            
            <motion.div 
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                className="relative z-20 w-full max-w-2xl"
            >
                <div className="relative group">
                    {/* Main Platform Illustration */}
                    <motion.div
                        animate={{ 
                            y: [0, -15, 0],
                        }}
                        transition={{ 
                            duration: 6, 
                            repeat: Infinity, 
                            ease: "easeInOut" 
                        }}
                        className="relative z-10 w-full aspect-square relative rounded-[40px] overflow-hidden shadow-2xl border border-white/50"
                    >
                        <Image 
                            src="/hero-illustration.png"
                            alt="Cohéro Platform Illustration"
                            fill
                            className="object-cover"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent pointer-events-none" />
                    </motion.div>

                    {/* Floating Badges for Context */}
                    <motion.div 
                        initial={{ scale: 0, opacity: 0, x: -20 }}
                        animate={{ scale: 1, opacity: 1, x: -40 }}
                        transition={{ delay: 1, type: "spring", stiffness: 100, damping: 15 }}
                        className="absolute -top-6 -left-4 bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl border border-amber-100 flex items-center gap-3 z-30"
                    >
                        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                            <Star className="w-5 h-5 fill-white" />
                        </div>
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-900">Praktik-Indblik</p>
                            <p className="text-[10px] text-slate-500 font-medium">Ægte studerende erfaringer</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ scale: 0, opacity: 0, x: 20 }}
                        animate={{ scale: 1, opacity: 1, x: 40 }}
                        transition={{ delay: 1.4, type: "spring", stiffness: 100, damping: 15 }}
                        className="absolute bottom-12 -right-8 bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl border border-cyan-100 flex items-center gap-3 z-30"
                    >
                        <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-900">Markedspladsen</p>
                            <p className="text-[10px] text-slate-500 font-medium">Køb & sælg studiemateriale</p>
                        </div>
                    </motion.div>

                    {/* Subtle Sparkle Emitter */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-20 -right-20 w-40 h-40 border-2 border-dashed border-amber-200/20 rounded-full flex items-center justify-center pointer-events-none"
                    >
                        <Sparkles className="w-8 h-8 text-amber-500/10" />
                    </motion.div>
                </div>
            </motion.div>

            {/* Platform Branding Label */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2, duration: 1 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center z-10"
            >
                <div className="px-5 py-2 bg-slate-900/5 backdrop-blur-md border border-slate-900/10 text-slate-900/40 rounded-full text-[9px] font-black uppercase tracking-[0.4em]">
                    Cohéro Ecosystem v4.0
                </div>
            </motion.div>
        </div>
    );
};

export default HeroIllustration;
