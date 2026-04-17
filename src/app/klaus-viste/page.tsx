
'use client';

import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Palette, Sparkles, Heart, ShoppingBag, ArrowLeft, Instagram, Wand2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const ARTWORK = [
  { id: 1, src: '/artist/klaus-viste/art1.jpg', title: 'Vibrante Strømninger', desc: 'Akryl på lærred', color: 'from-blue-500 to-pink-500' },
  { id: 2, src: '/artist/klaus-viste/art2.jpg', title: 'Struktureret Kaos', desc: 'Mixed media', color: 'from-purple-500 to-rose-500' },
  { id: 3, src: '/artist/klaus-viste/art3.jpg', title: 'Nattens Blomstring', desc: 'Olie på plade', color: 'from-emerald-500 to-blue-500' },
  { id: 4, src: '/artist/klaus-viste/art4.jpg', title: 'Gallu Badada', desc: 'Signatur værk', color: 'from-rose-500 to-amber-500' },
];

export default function KlausVistePage() {
  const { scrollYProgress } = useScroll();
  const silhouetteY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const silhouetteScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.2]);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-rose-500 selection:text-white overflow-x-hidden font-sans">
      
      {/* Noise Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[100] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* Persistent Silhouette Background Element */}
      <motion.div 
        style={{ y: silhouetteY, scale: silhouetteScale }}
        className="fixed top-0 right-[-10%] w-[80%] h-full opacity-[0.08] pointer-events-none z-0"
      >
        <Image 
            src="/artist/klaus-viste/portrait.jpg" 
            alt="Silhouette Background" 
            fill 
            className="object-contain grayscale contrast-200"
        />
      </motion.div>

      {/* Vibrant Ambient Glows - Inspired by ARTWORK[1] */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-[-10%] w-[60%] h-[60%] bg-pink-600/20 rounded-full blur-[160px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[160px] animate-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[200px]" />
      </div>

      <nav className="relative z-[60] p-10 flex items-center justify-between">
         <Link href="/" className="group flex items-center gap-3 text-white/40 hover:text-white transition-all">
            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Retur</span>
         </Link>
         <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
                <span className="font-black tracking-tighter text-xl">Cohéro <span className="text-rose-500">x</span> <span className="italic serif">K. Viste</span></span>
            </div>
         </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        
        {/* Artistic Hero Section */}
        <section className="min-h-[80vh] flex flex-col justify-center items-center text-center space-y-12 mb-40">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
            >
                <div className="absolute -inset-4 bg-gradient-to-r from-rose-500 via-purple-500 to-blue-500 blur-2xl opacity-20 animate-spin-slow" />
                <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-2 border-white/20 shadow-2xl">
                    <Image 
                        src="/artist/klaus-viste/portrait.jpg" 
                        alt="Klaus Viste Silhouette" 
                        fill 
                        className="object-cover grayscale contrast-125 hover:scale-110 transition-transform duration-700"
                    />
                </div>
                {/* Hand-drawn style badge */}
                <div className="absolute -bottom-4 -right-4 bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-full shadow-2xl rotate-12 border-2 border-black">
                    Badada Forever
                </div>
            </motion.div>

            <div className="space-y-6 max-w-4xl">
                <motion.h1 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-7xl md:text-9xl font-black serif-premium leading-[0.85] tracking-tighter"
                >
                    DET <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-purple-600 italic">USYNLIGE</span> <br /> 
                    MANIFEST
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-xl md:text-2xl text-white/60 font-medium italic serif max-w-2xl mx-auto leading-relaxed"
                >
                    "Mine værker er en dialog mellem det rå kaos og den fine orden. Et ekko af den verden vi føler, men ikke altid kan sætte ord på."
                </motion.p>
            </div>

            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-10"
            >
                <div className="h-px w-20 bg-white/20" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-rose-500">Klaus Viste</span>
                <div className="h-px w-20 bg-white/20" />
            </motion.div>
        </section>

        {/* Immersive Gallery */}
        <section className="space-y-32 mb-60">
            {ARTWORK.map((art, i) => (
                <div key={art.id} className={`flex flex-col ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-20`}>
                    <motion.div 
                        initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="flex-1 w-full"
                    >
                        <div className="relative aspect-[4/3] md:aspect-video rounded-[3rem] overflow-hidden group">
                            {/* Colorful Glow behind each image */}
                            <div className={`absolute inset-[-40px] bg-gradient-to-br ${art.color} opacity-0 group-hover:opacity-30 blur-3xl transition-opacity duration-700`} />
                            
                            <div className="relative h-full w-full rounded-[3rem] overflow-hidden border border-white/10">
                                <Image 
                                    src={art.src} 
                                    alt={art.title} 
                                    fill 
                                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-700" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex-1 space-y-6 lg:px-12"
                    >
                        <div className="flex items-center gap-4">
                            <span className="text-4xl font-black text-white/10 serif font-mono">0{i + 1}</span>
                            <div className={`h-px flex-1 bg-gradient-to-r ${art.color} opacity-40`} />
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black serif tracking-tight">{art.title}</h2>
                        <p className="text-lg text-white/50 font-medium leading-relaxed italic">{art.desc}</p>
                        <button className="flex items-center gap-2 group text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                            Læs Manifestet <Wand2 className="w-3 h-3 group-hover:rotate-12 transition-transform" />
                        </button>
                    </motion.div>
                </div>
            ))}
        </section>

        {/* The Collaboration Container - Badada Style */}
        <section className="relative mb-40">
             <div className="bg-gradient-to-br from-slate-900 to-black border-2 border-white/5 rounded-[4rem] p-12 md:p-24 overflow-hidden relative group shadow-2xl">
                {/* Silhouette Mask as background of this section */}
                <div className="absolute inset-0 opacity-[0.03] z-0 overflow-hidden pointer-events-none">
                     <Image 
                        src="/artist/klaus-viste/portrait.jpg" 
                        alt="Silhouette background" 
                        fill 
                        className="object-contain scale-150 rotate-12"
                     />
                </div>

                <div className="relative z-10 grid lg:grid-cols-2 gap-20 items-center">
                    <div className="space-y-10">
                        <div className="w-20 h-20 bg-gradient-to-br from-pink-600 to-rose-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-rose-600/30 rotate-6 group-hover:rotate-0 transition-transform">
                            <ShoppingBag className="w-10 h-10" />
                        </div>
                        <div className="space-y-6">
                            <h2 className="text-5xl md:text-7xl font-black serif-premium leading-[0.9]">SOCIAL <br /> <span className="text-rose-500 italic">KOLLEKTION</span></h2>
                            <p className="text-xl text-white/60 font-medium italic leading-relaxed">
                                Vi forener Klaus Vistes rå, eksperimenterende streg med socialrådgiverens komplicerede hverdag. 
                                En kollektion skabt til dem, der tør bære faget på en ny måde.
                            </p>
                        </div>
                        <div className="inline-flex items-center gap-4 px-8 py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all">
                            Kommer Forår 2026
                        </div>
                    </div>

                    <div className="relative aspect-square rounded-[3rem] overflow-hidden border border-white/10 rotate-3 group-hover:rotate-0 transition-transform duration-700">
                        <Image 
                            src="/artist/klaus-viste/art2.jpg" 
                            alt="The Chaos of Care" 
                            fill 
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-12">
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-white/40">SNEAK PEEK: DESIGN #01</p>
                        </div>
                    </div>
                </div>
             </div>
        </section>

        {/* Final Outro */}
        <section className="text-center space-y-20 py-20 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-rose-600/20 rounded-full blur-[100px] pointer-events-none" />
            
            <motion.div 
                whileInView={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="relative w-32 h-32 mx-auto rounded-full overflow-hidden border border-white/10 opacity-40 grayscale"
            >
                <Image src="/artist/klaus-viste/portrait.jpg" alt="Portrait" fill className="object-cover" />
            </motion.div>

            <div className="space-y-6 relative z-10">
                <h3 className="text-[10px] font-black uppercase tracking-[0.8em] text-white/30">Badada Lifestyle</h3>
                <div className="flex items-center justify-center gap-12">
                   <Instagram className="w-6 h-6 text-white/20 hover:text-white transition-colors cursor-pointer" />
                   <div className="w-12 h-px bg-white/10" />
                   <Sparkles className="w-6 h-6 text-white/20 hover:text-white transition-colors cursor-pointer" />
                </div>
            </div>
            
            <p className="text-[9px] font-black uppercase tracking-widest text-white/10">© 2026 Cohéro x Klaus Viste — All Rights Reserved</p>
        </section>

      </main>
    </div>
  );
}
