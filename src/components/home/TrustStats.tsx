'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, GraduationCap, ShieldCheck } from 'lucide-react';

const stats = [
  {
    label: 'Uddannelsessteder',
    value: '8',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    label: 'Sider lovstof',
    value: '50.000+',
    icon: BookOpen,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  {
    label: 'Integrerede love',
    value: '7',
    icon: GraduationCap,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  {
    label: 'Etableret',
    value: '2026',
    icon: ShieldCheck,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
];

const Reveal = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
  >
    {children}
  </motion.div>
);

export default function TrustStats() {
  return (
    <section className="py-24 sm:py-32 bg-white relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="text-center mb-16 sm:mb-20">
          <Reveal>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Tillid & Resultater</h2>
            <p className="text-3xl sm:text-4xl md:text-5xl font-[900] text-slate-900 tracking-tight italic">
              Tallene taler for <span className="text-amber-500">sig selv.</span>
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <Reveal key={stat.label} delay={index * 0.1}>
              <div className="group relative flex flex-col items-center text-center p-8 rounded-[2.5rem] transition-all hover:bg-slate-50 border border-transparent hover:border-slate-100">
                <div className={`w-16 h-16 ${stat.bgColor} ${stat.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm`}>
                  <stat.icon className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter">
                    {stat.value}
                  </div>
                  <div className="text-sm sm:text-base font-bold text-slate-500 uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
                
                {/* Subtle hover decoration */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-1 bg-amber-400 rounded-full group-hover:w-12 transition-all duration-500" />
              </div>
            </Reveal>
          ))}
        </div>
        
      </div>
    </section>
  );
}
