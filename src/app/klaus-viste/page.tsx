
'use client';

import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Palette, Sparkles, Heart, ShoppingBag, ArrowLeft, Instagram, Wand2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const COLLECTION = [
  { id: 1, src: '/artist/klaus-viste/tote.png', title: 'Premium Mulepose', desc: 'Kraftig canvas med Badada-print', color: 'from-pink-500 to-rose-500' },
  { id: 2, src: '/artist/klaus-viste/bottle.png', title: 'Signature Drikkedunk', desc: 'Mat sort med silhuet-detaljer', color: 'from-blue-500 to-indigo-500' },
  { id: 3, src: '/artist/klaus-viste/hoodie.png', title: 'Street-wear Hoodie', desc: 'Over-sized med stort rygprint', color: 'from-purple-500 to-rose-500' },
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

      {/* Vibrant Ambient Glows */}
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

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-20 pb-40">
        
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
                    MELLEM <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-purple-600 italic text-[0.8em]">KUNST</span> <br /> 
                    OG FAGLIGHED
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-xl md:text-2xl text-white/60 font-medium italic serif max-w-2xl mx-auto leading-relaxed"
                >
                    Vi forvandler de usynlige manifestationer til fysiske objekter. <br />
                    Her er et indblik i vores kommende eksklusive samarbejde.
                </motion.p>
            </div>
        </section>

        {/* Immersive Product Showcase */}
        <section className="space-y-40">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
                <div className="space-y-4">
                    <h2 className="text-4xl md:text-6xl font-black serif">Socialrådgiver Kollektionen</h2>
                    <p className="text-slate-500 font-medium max-w-lg">Vores fælles vision materialiseret i premium kvalitet. Et sneak peek på de første designs.</p>
                </div>
                <div className="h-px bg-white/10 flex-1 hidden md:block mb-6 mx-12" />
            </div>

            {COLLECTION.map((item, i) => (
                <div key={item.id} className={`flex flex-col ${i % 2 === 1 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-20`}>
                    <motion.div 
                        initial={{ opacity: 0, x: i % 2 === 1 ? -50 : 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="flex-1 w-full"
                    >
                        <div className="relative aspect-square md:aspect-video rounded-[3rem] overflow-hidden group">
                            <div className={`absolute inset-[-40px] bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-30 blur-3xl transition-opacity duration-700`} />
                            
                            <div className="relative h-full w-full rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
                                <Image 
                                    src={item.src} 
                                    alt={item.title} 
                                    fill 
                                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                                />
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
                            <span className="text-4xl font-black text-white/10 serif font-mono">EST. 2026</span>
                            <div className={`h-px flex-1 bg-gradient-to-r ${item.color} opacity-40`} />
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black serif tracking-tight">{item.title}</h2>
                        <p className="text-lg text-white/50 font-medium leading-relaxed italic">{item.desc}</p>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-500">
                             <Sparkles className="w-4 h-4" /> Limited Edition / Forår 2026
                        </div>
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

      </main>
    </div>
  );
}
