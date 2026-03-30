'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/app/provider';
import { useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Activity,
  Zap,
  CreditCard,
  TrendingUp,
  BarChart3,
  Cpu,
  Brain,
  Layers,
  Sparkles,
  MousePointer2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';

const CostCard = ({ title, value, description, icon: Icon, color = "indigo", suffix = "" }: any) => {
  const colors: any = {
    indigo: "from-indigo-500/10 to-indigo-500/5 text-indigo-600 border-indigo-200/50",
    emerald: "from-emerald-500/10 to-emerald-500/5 text-emerald-600 border-emerald-200/50",
    amber: "from-amber-500/10 to-amber-500/5 text-amber-600 border-amber-200/50",
    violet: "from-violet-500/10 to-violet-500/5 text-violet-600 border-violet-200/50",
    rose: "from-rose-500/10 to-rose-500/5 text-rose-600 border-rose-200/50",
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className={`bg-white p-8 rounded-[2.5rem] border ${colors[color].split(' ')[4]} shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden`}
    >
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={`p-4 rounded-2xl bg-gradient-to-br ${colors[color].split(' ').slice(0, 2).join(' ')} ${colors[color].split(' ')[2]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      <div className="relative z-10">
        <h3 className="text-[11px] font-black font-sans uppercase tracking-[0.2em] text-slate-400 mb-2 group-hover:text-slate-600 transition-colors">{title}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black text-slate-900 serif">
            {value}
          </span>
          {suffix && <span className="text-lg font-bold text-slate-400 ml-1">{suffix}</span>}
        </div>
        <p className="text-xs text-slate-400 mt-4 font-medium leading-relaxed italic">
          {description}
        </p>
      </div>

      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-slate-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
    </motion.div>
  );
};

const FlowUsageRow = ({ name, input, output, cost }: any) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white border border-slate-100 rounded-3xl hover:border-indigo-200 hover:shadow-md transition-all duration-300 group">
    <div className="flex items-center gap-4 mb-4 sm:mb-0">
      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
        <Cpu className="w-6 h-6" />
      </div>
      <div>
        <h4 className="font-bold text-slate-900 group-hover:text-indigo-900 transition-colors">{name}</h4>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI Flow</p>
      </div>
    </div>
    
    <div className="flex items-center gap-8 text-right">
      <div className="hidden md:block">
        <p className="text-[9px] font-black mb-1 uppercase tracking-tighter text-slate-300">Tokens (In/Out)</p>
        <p className="text-xs font-mono font-bold text-slate-500">
          {(input/1000).toFixed(1)}k / {(output/1000).toFixed(1)}k
        </p>
      </div>
      <div>
        <p className="text-[9px] font-black mb-1 uppercase tracking-tighter text-slate-300">EST. OMK.</p>
        <p className="text-lg font-black text-slate-900">{cost} kr.</p>
      </div>
    </div>
  </div>
);

const AdminCostsPage = () => {
    const { user, isUserLoading, userProfile } = useApp();
    const router = useRouter();
    const firestore = useFirestore();

    const aiUsageRef = useMemoFirebase(
        () => (firestore ? doc(firestore, 'stats', 'ai_usage') : null),
        [firestore]
    );
    const { data: aiUsage, isLoading: isUsageLoading } = useDoc(aiUsageRef);

    const stats = useMemo(() => {
        if (!aiUsage) return null;

        const costPerMillionInput = 0.30 * 6.95; 
        const costPerMillionOutput = 2.50 * 6.95; 
        
        const totalInputTokens = aiUsage.totalInputTokens || 0;
        const totalOutputTokens = aiUsage.totalOutputTokens || 0;
        
        const totalCost = (
            (totalInputTokens / 1000000 * costPerMillionInput) + 
            (totalOutputTokens / 1000000 * costPerMillionOutput)
        );

        const flows = Object.entries(aiUsage.flows || {}).map(([key, data]: [string, any]) => {
            const flowInput = data.inputTokens || 0;
            const flowOutput = data.outputTokens || 0;
            const flowCost = (
                (flowInput / 1000000 * costPerMillionInput) + 
                (flowOutput / 1000000 * costPerMillionOutput)
            );
            return {
                name: key.replace('Flow', '').replace(/([A-Z])/g, ' $1').trim(),
                input: flowInput,
                output: flowOutput,
                cost: flowCost.toFixed(2)
            };
        }).sort((a, b) => parseFloat(b.cost) - parseFloat(a.cost));

        return {
            totalInputTokens,
            totalOutputTokens,
            totalCost: totalCost.toFixed(2),
            flows,
            inputCost: (totalInputTokens / 1000000 * costPerMillionInput).toFixed(2),
            outputCost: (totalOutputTokens / 1000000 * costPerMillionOutput).toFixed(2),
        };
    }, [aiUsage]);

    if (isUserLoading || !userProfile || userProfile.role !== 'admin') {
        if (!isUserLoading) router.replace('/portal');
        return <AuthLoadingScreen />;
    }

    return (
        <div className="mesh-bg min-h-screen pb-20">
             <header className="glass-nav">
                <div className="max-w-7xl mx-auto py-6 px-4 md:px-8 h-24 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-5">
                      <Link href="/admin" className="p-3 bg-white shadow-sm border border-slate-100 text-slate-600 rounded-2xl hover:text-indigo-600 hover:border-indigo-200 transition-all group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                      </Link>
                      <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                              AI Finans
                            </h1>
                            <div className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded uppercase tracking-tighter shadow-sm whitespace-nowrap">Hardware Budget</div>
                          </div>
                        <p className="text-sm font-medium text-slate-400">
                          Realtidsmonitorering af API-omkostninger og forbrug.
                        </p>
                      </div>
                    </div>

                    <div className="hidden lg:flex items-center gap-6 text-right">
                       <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valuta</span>
                          <span className="text-sm font-bold text-slate-700">DKK (Gemini 2.5 Flash)</span>
                       </div>
                       <div className="h-10 w-px bg-slate-200" />
                       <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
                          <span className="flex items-center justify-end gap-1.5 text-sm font-bold text-emerald-600">
                             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Tracking
                          </span>
                       </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-12">
                {isUsageLoading ? (
                    <div className="flex flex-col justify-center items-center h-[40vh] gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                        <p className="text-slate-400 font-medium">Henter budget-data...</p>
                    </div>
                ) : !stats ? (
                  <div className="p-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                      <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500 font-medium italic">Ingen forbrugsdata registreret endnu.<br/><span className="text-xs font-normal opacity-70">Data opsamles automatisk når AI-funktionerne benyttes.</span></p>
                  </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <CostCard 
                                title="Samlet Omkostning" 
                                value={stats.totalCost} 
                                suffix="kr" 
                                description="Samlet hardware-forbrug siden logning startede."
                                icon={CreditCard}
                                color="indigo"
                            />
                            <CostCard 
                                title="Input Investering" 
                                value={stats.inputCost} 
                                suffix="kr" 
                                description="Omkostning for prompt-behandling og kildelæsning."
                                icon={MousePointer2}
                                color="emerald"
                            />
                            <CostCard 
                                title="Output Investering" 
                                value={stats.outputCost} 
                                suffix="kr" 
                                description="Omkostning for AI svar og indholds-generering."
                                icon={Sparkles}
                                color="violet"
                            />
                        </div>

                        <section className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 serif">Forbrug per funktion</h2>
                                    <p className="text-sm font-medium text-slate-500">Hvor i maskinrummet bliver pengene brugt?</p>
                                </div>
                                <div className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400">
                                    <BarChart3 className="w-5 h-5" />
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                {stats.flows.map((flow, i) => (
                                    <motion.div
                                        key={flow.name}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <FlowUsageRow {...flow} />
                                    </motion.div>
                                ))}
                            </div>
                        </section>

                        <div className="p-12 bg-slate-900 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl">
                           <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                              <div>
                                 <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                                    <Brain className="w-6 h-6 text-indigo-400" />
                                 </div>
                                 <h2 className="text-3xl font-black serif mb-4">Budgetindsigt & Optimering</h2>
                                 <p className="text-slate-400 leading-relaxed mb-8">
                                    Data ovenfor reflekterer de reelle omkostninger fra Google Cloud. 
                                    Semestersystemet nulstiller brugernes individuelle tokens hver måned, 
                                    men denne side viser det samlede akkumulerede forbrug for hele platformen.
                                 </p>
                                 <div className="flex flex-wrap gap-4">
                                    <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                                        <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Model</span>
                                        <span className="font-bold">Gemini 2.5 Flash</span>
                                    </div>
                                    <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                                        <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Status</span>
                                        <span className="font-bold flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full"/> Online</span>
                                    </div>
                                 </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                 {[
                                   { label: "Total Input", value: `${(stats.totalInputTokens / 1000000).toFixed(2)}M`, sub: "Tokens" },
                                   { label: "Total Output", value: `${(stats.totalOutputTokens / 1000000).toFixed(2)}M`, sub: "Tokens" },
                                   { label: "Tokens/Kr", value: "~2.8M", sub: "Input" },
                                   { label: "Eksamensperiode", value: "Normal", sub: "Belastning" }
                                 ].map((it, i) => (
                                    <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-3xl text-center">
                                       <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">{it.label}</span>
                                       <span className="block text-xl font-bold">{it.value}</span>
                                       <span className="block text-[10px] text-slate-500">{it.sub}</span>
                                    </div>
                                 ))}
                              </div>
                           </div>
                           
                           {/* Background Decoration */}
                           <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] -mr-48 -mt-48" />
                           <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] -ml-48 -mb-48" />
                        </div>
                    </>
                )}
            </main>

            <footer className="max-w-7xl mx-auto px-8 py-12 text-center opacity-30 text-slate-500 text-xs font-medium">
               © 2026 Cohero Finance Intelligence. Alle data er estimat baseret på Google API pricing.
            </footer>
        </div>
    );
};

export default AdminCostsPage;
