'use client';

import React from 'react';
import { Sparkles, Users, Target, ShieldCheck, Zap, BookOpen, MessageSquare, Heart } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" }
    }
};

const TeamSection = () => {
    const teamMembers = [
        {
            name: "Sebastian Viste Hansen",
            role: "Socialrådgiver & medstifter",
            bio: "Erfaring fra børne- og ungeområdet. Brænder for at styrke den faglige selvtillid hos studerende.",
            image: "/team/seb.png"
        },
        {
            name: "Nanna Hougaard Ungermand",
            role: "Socialrådgiver & medstifter",
            bio: "Erfaring fra borgerrådgivningen. Fokuserer på retssikkerhed og den gode, etiske praksis.",
            image: "/team/nan.png"
        },
        {
            name: "Julie Lee Hansen",
            role: "Uddannelseskonsulent & medstifter",
            bio: "Uddannelsesvidenskabelig baggrund. Sikrer, at alt vores indhold er pædagogisk funderet og læringsoptimeret.",
            image: "/team/jul.png"
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {teamMembers.map((member, idx) => (
                <motion.div 
                    key={idx}
                    variants={itemVariants}
                    className="bg-white p-8 rounded-[2.5rem] border border-amber-100/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full blur-3xl -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    
                    <div className="relative z-10 text-center">
                        <div className="relative w-32 h-32 mx-auto mb-6">
                            <div className="absolute inset-0 bg-amber-100 rounded-full animate-pulse group-hover:scale-105 transition-transform duration-500 opacity-20"></div>
                            <Image 
                                src={member.image} 
                                alt={member.name} 
                                fill
                                className="rounded-full object-cover border-4 border-white shadow-md relative z-10" 
                            />
                        </div>
                        <h4 className="font-bold text-xl text-amber-950 serif group-hover:text-indigo-900 transition-colors">{member.name}</h4>
                        <p className="text-sm text-indigo-600 font-black uppercase tracking-widest mt-1 mb-4">{member.role}</p>
                        <p className="text-sm text-slate-500 leading-relaxed italic">{member.bio}</p>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default function AboutUsPage() {
    return (
        <div className="bg-[#FDFCF8] min-h-screen selection:bg-indigo-100">
            {/* Hero Section */}
            <header className="relative py-24 md:py-32 overflow-hidden bg-white">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-indigo-50/50 to-transparent rounded-full blur-[120px] -mt-96 opacity-60"></div>
                
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center md:text-left flex flex-col md:flex-row items-center gap-10"
                    >
                        <div className="flex-1 space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm animate-fade-in">
                                <Users className="w-3.5 h-3.5" /> Din digitale kollega
                            </div>
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-amber-950 serif leading-[1.1] tracking-tight">
                                Vi styrker fremtidens <br className="hidden lg:block" /><span className="text-indigo-900 italic">socialrådgivere</span>
                            </h1>
                            <p className="text-lg md:text-xl text-slate-500 max-w-2xl font-medium leading-relaxed italic">
                                Cohéro er skabt af socialrådgivere, for socialrådgivere. Vi er her for at sikre, at ingen føler sig alene på rejsen fra studiebænk til praksis.
                            </p>
                        </div>
                        <div className="hidden lg:block flex-shrink-0 animate-float">
                            <div className="w-64 h-64 bg-white p-6 rounded-[3rem] shadow-2xl border border-amber-50 rotate-3 flex items-center justify-center relative">
                                <div className="absolute -top-4 -right-4 w-16 h-16 bg-amber-400 rounded-2xl shadow-xl flex items-center justify-center text-white -rotate-12">
                                    <Heart className="w-8 h-8 fill-current" />
                                </div>
                                <div className="text-center space-y-4">
                                    <div className="w-20 h-20 bg-indigo-50 rounded-full mx-auto flex items-center justify-center text-indigo-600">
                                        <Sparkles className="w-10 h-10" />
                                    </div>
                                    <p className="text-xs font-black uppercase tracking-widest text-indigo-900/40">Siden 2024</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-20 pb-32 space-y-32">
                {/* Mission & Vision Section */}
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid md:grid-cols-2 gap-12 items-center"
                >
                    <motion.div variants={itemVariants} className="space-y-8">
                        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
                            <Target className="w-8 h-8" />
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-amber-950 serif">Vores Mission</h2>
                        <div className="prose prose-lg prose-slate italic font-medium text-slate-600 leading-relaxed">
                            <p>
                                Cohéros mission er at bygge bro mellem teori og praksis. Vi giver dig AI-drevne værktøjer, praksisnær træning og et fagligt fællesskab, der styrker din selvtillid og faglige dømmekraft.
                            </p>
                            <p>
                                Vi tror på, at kollegial sparring er fundamentet for et stærkt arbejdsliv, og at digital dannelse er nøglen til fremtidens velfærd.
                            </p>
                        </div>
                    </motion.div>
                    
                    <motion.div variants={itemVariants} className="bg-white p-10 rounded-[3rem] border border-amber-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50 rounded-full blur-[80px] -mr-24 -mt-24 pointer-events-none"></div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-900/30 mb-8 px-1">Sådan hjælper vi dig</h3>
                        <ul className="space-y-6 relative z-10">
                            {[
                                { icon: BookOpen, title: "Praksisnær Træning", desc: "Cases udviklet af socialrådgivere med blik for virkelighedens kompleksitet." },
                                { icon: ShieldCheck, title: "Faglig Integritet", desc: "Vi kombinerer AI med menneskelig erfaring og etiske refleksioner." },
                                { icon: Zap, title: "Lynhurtig Indsigt", desc: "Læs og analysér store mængder lovstof på sekunder med vores AI-værktøjer." }
                            ].map((feature, i) => (
                                <li key={i} className="flex gap-4 group">
                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                        <feature.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-amber-950 serif text-lg">{feature.title}</h4>
                                        <p className="text-sm text-slate-500 italic mt-0.5">{feature.desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </motion.div>

                {/* Team Section */}
                <section className="space-y-8">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center space-y-4 max-w-2xl mx-auto"
                    >
                        <h2 className="text-3xl md:text-5xl font-bold text-amber-950 serif">Hvem er vi?</h2>
                        <p className="text-slate-500 font-medium italic">
                            Mød teamet bag Cohéro – en blanding af socialrådgivere og pædagogiske eksperter.
                        </p>
                    </motion.div>
                    <TeamSection />
                </section>

                {/* CTA / Final Section */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="bg-indigo-950 rounded-[4rem] p-12 md:p-20 text-center relative overflow-hidden group shadow-2xl"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-indigo-950"></div>
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-800 rounded-full blur-[100px] -mr-48 -mt-48 opacity-40 group-hover:opacity-60 transition-opacity duration-1000"></div>
                    
                    <div className="relative z-10 space-y-8 max-w-3xl mx-auto">
                        <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mx-auto text-indigo-200 border border-white/10 group-hover:scale-110 transition-transform duration-700">
                            <Sparkles className="w-10 h-10" />
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-white serif tracking-tight leading-tight">
                            Klar til at styrke din <br className="hidden md:block" /> faglige selvtillid?
                        </h2>
                        <p className="text-indigo-200/70 text-lg md:text-xl font-medium italic max-w-xl mx-auto leading-relaxed">
                            Vi er dedikerede til at skabe et trygt og udviklende rum, hvor du kan træne, reflektere og vokse – altid med en digital kollega ved din side.
                        </p>
                        <div className="pt-6">
                            <div className="inline-flex items-center gap-6 px-8 py-4 bg-white text-indigo-950 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-slate-50 transition-all active:scale-95 cursor-pointer">
                                Kom i gang i dag
                            </div>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
