
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Palette, Sparkles, Heart, ShoppingBag, ArrowLeft, Instagram } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const ARTWORK = [
  { id: 1, src: '/artist/klaus-viste/art1.jpg', title: 'Vibrante Strømninger', desc: 'Akryl på lærred' },
  { id: 2, src: '/artist/klaus-viste/art2.jpg', title: 'Struktureret Kaos', desc: 'Mixed media' },
  { id: 3, src: '/artist/klaus-viste/art3.jpg', title: 'Nattens Blomstring', desc: 'Olie på plade' },
  { id: 4, src: '/artist/klaus-viste/art4.jpg', title: 'Gallu Badada', desc: 'Signatur værk' },
];

export default function KlausVistePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-rose-500 selection:text-white overflow-hidden">
      
      {/* Abstract Background Accents */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-rose-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <nav className="relative z-50 p-8 flex items-center justify-between">
         <Link href="/" className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest">Tilbage</span>
         </Link>
         <div className="flex items-center gap-2">
            <Palette className="w-6 h-6 text-rose-500" />
            <span className="font-black tracking-tighter text-xl">Cohéro<span className="text-rose-600">Artist</span></span>
         </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        
        {/* Hero Section */}
        <section className="grid lg:grid-cols-2 gap-16 items-center mb-40">
            <motion.div 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
            >
                <div className="inline-flex items-center gap-2 px-4 py-1 bg-white/5 border border-white/10 rounded-full text-rose-400 text-[10px] font-black uppercase tracking-[0.3em]">
                    <Sparkles className="w-3 h-3" />
                    Artist Spotlight
                </div>
                <h1 className="text-6xl md:text-8xl font-black serif-premium leading-[0.9] tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/20">
                    Klaus <br /> <span className="text-rose-600">Viste</span>
                </h1>
                <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-xl italic">
                    "Kunst er ikke det, du ser, men det, du får andre til at se." 
                    En udforskning af farver, former og de usynlige bånd, der binder os sammen.
                </p>
                <div className="flex items-center gap-6 pt-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Status</span>
                        <span className="flex items-center gap-2 text-emerald-400 font-bold">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                            Aktivt Samarbejde
                        </span>
                    </div>
                </div>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative aspect-[3/4] rounded-[3rem] overflow-hidden group shadow-2xl shadow-rose-900/20"
            >
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 opacity-60" />
                <Image 
                    src="/artist/klaus-viste/portrait.jpg" 
                    alt="Klaus Viste portrait" 
                    fill 
                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute bottom-10 left-10 z-20">
                    <p className="text-4xl font-black serif italic text-white/90">The Visionary</p>
                </div>
            </motion.div>
        </section>

        {/* Art Gallery */}
        <section className="space-y-16 mb-40">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-4">
                    <h2 className="text-4xl md:text-6xl font-black serif">Udvalgte Værker</h2>
                    <p className="text-slate-500 font-medium max-w-lg">En rejse gennem Klaus Vistes karakteristiske abstrakte univers, hvor kontraster skaber harmoni.</p>
                </div>
                <div className="h-px bg-white/10 flex-1 hidden md:block mb-6 mx-12" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {ARTWORK.map((art, i) => (
                    <motion.div 
                        key={art.id}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="group"
                    >
                        <div className="relative aspect-video rounded-[2.5rem] overflow-hidden bg-slate-900 border border-white/5 transition-all duration-700 group-hover:shadow-2xl group-hover:shadow-rose-950/30 group-hover:-translate-y-2">
                             <Image 
                                src={art.src} 
                                alt={art.title} 
                                fill 
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                             />
                             <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="px-6 py-2 bg-white text-slate-950 rounded-full font-black uppercase text-[10px] tracking-widest scale-90 group-hover:scale-100 transition-transform">
                                    Se Detaljer
                                </span>
                             </div>
                        </div>
                        <div className="mt-8 space-y-2 px-4">
                            <h3 className="text-2xl font-black serif text-white/90">{art.title}</h3>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{art.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>

        {/* The Collaboration */}
        <section className="relative">
             <div className="absolute inset-0 bg-rose-600/5 rounded-[4rem] blur-3xl -z-10" />
             <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-[4rem] p-12 md:p-24 overflow-hidden relative group">
                {/* Decorative Swirl */}
                <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 transition-transform duration-1000 group-hover:rotate-45">
                    <Palette className="w-64 h-64 text-rose-500" />
                </div>

                <div className="relative z-10 max-w-3xl space-y-10">
                    <div className="space-y-6">
                        <div className="w-16 h-16 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-rose-600/40">
                            <ShoppingBag className="w-8 h-8" />
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black serif leading-tight">Socialrådgiver <br /> <span className="text-rose-500">Kollektionen</span></h2>
                        <p className="text-xl text-slate-400 font-medium leading-relaxed italic">
                            Vi er i gang med at skabe noget helt unikt. Klaus Viste designer en specifik kollektion af muleposer og beklædning, 
                            skræddersyet til socialrådgiverstuderendes stolthed og faglighed.
                        </p>
                    </div>

                    <div className="p-8 bg-rose-600/10 border border-rose-500/20 rounded-3xl flex flex-col md:flex-row items-center gap-8">
                         <div className="flex-1 space-y-2">
                            <p className="text-sm font-black uppercase tracking-widest text-rose-400">Sneak Peek</p>
                            <p className="font-bold text-white italic">"Det handler om at bære faget med stil og dybde."</p>
                         </div>
                         <div className="px-8 py-3 bg-white text-slate-950 rounded-2xl font-black uppercase text-[10px] tracking-widest whitespace-nowrap">
                            Kommer Snart
                         </div>
                    </div>
                </div>
             </div>
        </section>

        {/* Final CTA / Social */}
        <section className="mt-40 text-center space-y-12">
            <h3 className="text-2xl font-black serif italic text-slate-500 uppercase tracking-[0.4em]">Stay In The Loop</h3>
            <div className="flex items-center justify-center gap-8">
                <button className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                    <Instagram className="w-8 h-8" />
                </button>
                <div className="h-px w-20 bg-white/10" />
                <button className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                    <Heart className="w-8 h-8" />
                </button>
            </div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">© 2026 Cohéro Artist x Klaus Viste</p>
        </section>

      </main>
    </div>
  );
}
