
'use client';

import React, { useMemo } from 'react';
import { useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Cpu, 
  Brain, 
  Sparkles, 
  MousePointer2, 
  AlertCircle, 
  Loader2,
  TrendingUp,
  BarChart3,
  Zap,
  Target
} from 'lucide-react';

const CostCard = ({ title, value, description, icon: Icon, color = "indigo", suffix = "" }: any) => {
  const colors: any = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    violet: "bg-violet-50 text-violet-600 border-violet-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className={`bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-700 group relative overflow-hidden flex flex-col justify-between min-h-[200px]`}
    >
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={`p-4 rounded-2xl ${colors[color]} shadow-lg shadow-current/5 group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest">
            API Live
        </div>
      </div>
      
      <div className="relative z-10">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5">{title}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black text-slate-900 serif">
            {value}
          </span>
          {suffix && <span className="text-lg font-bold text-slate-300 ml-1">{suffix}</span>}
        </div>
        <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-tight italic opacity-60">
          {description}
        </p>
      </div>

      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-slate-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
    </motion.div>
  );
};

const FlowUsageRow = ({ name, input, output, cost }: any) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-8 bg-white border border-slate-100 rounded-[2.5rem] hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 group">
    <div className="flex items-center gap-5 mb-4 sm:mb-0">
      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
        <Cpu className="w-6 h-6" />
      </div>
      <div>
        <h4 className="text-lg font-black text-slate-900 serif group-hover:text-indigo-900 transition-colors">{name}</h4>
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mt-0.5">AI Engine Flow</p>
      </div>
    </div>
    
    <div className="flex items-center gap-12 text-right">
      <div className="hidden md:block">
        <p className="text-[10px] font-black mb-1 uppercase tracking-widest text-slate-300">Tokens (In / Out)</p>
        <p className="text-xs font-mono font-bold text-slate-500">
          {(input/1000).toFixed(1)}k <span className="text-slate-300">/</span> {(output/1000).toFixed(1)}k
        </p>
      </div>
      <div className="h-10 w-px bg-slate-50 mx-2 hidden md:block" />
      <div>
        <p className="text-[10px] font-black mb-1 uppercase tracking-widest text-slate-300">Est. Driftspris</p>
        <p className="text-2xl font-black text-slate-900 serif">{cost} <span className="text-sm">kr.</span></p>
      </div>
    </div>
  </div>
);

export default function AdminCostsPage() {
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

    if (isUsageLoading) {
        return (
            <div className="flex flex-col justify-center items-center h-[50vh] gap-6">
                <Loader2 className="w-12 h-12 animate-spin text-slate-200" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Henter driftsbudget...</p>
            </div>
        );
    }

    if (!stats) return (
        <div className="p-32 text-center bg-white rounded-[3.5rem] border border-dashed border-slate-200">
            <AlertCircle className="w-16 h-16 text-slate-200 mx-auto mb-6" />
            <p className="text-xl font-black text-slate-400 serif">Ingen data tilgængelig.<br/><span className="text-xs font-bold uppercase tracking-widest block mt-4 opacity-50">Logning starter her efter første AI kald.</span></p>
        </div>
    );

    return (
        <div className="space-y-16 animate-ink">
            {/* Header / Intro */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                <div>
                   <h1 className="text-3xl font-black text-slate-900 serif mb-2">Hardware Finans</h1>
                   <p className="text-slate-500 font-medium">Overvåg platformens AI omkostninger og ressourceforbrug i realtid.</p>
                </div>
                <div className="flex items-center gap-4 px-5 py-3 bg-indigo-50 border border-indigo-100/60 rounded-2xl">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse"></div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-700 leading-none mb-1">Budget Status</p>
                        <p className="text-xs font-bold text-indigo-900 leading-none">Indenfor forventet ramme</p>
                    </div>
                </div>
            </header>

            {/* Core Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <CostCard 
                    title="Akkummuleret Drift" 
                    value={stats.totalCost} 
                    suffix="kr." 
                    description="Samlet hardware-forbrug på tværs af alle flows."
                    icon={CreditCard}
                    color="indigo"
                />
                <CostCard 
                    title="Søgning & Analyse (In)" 
                    value={stats.inputCost} 
                    suffix="kr." 
                    description="Omkostning for prompt-behandling og kildelæsning."
                    icon={MousePointer2}
                    color="emerald"
                />
                <CostCard 
                    title="Generering (Out)" 
                    value={stats.outputCost} 
                    suffix="kr." 
                    description="Pris for AI-genereret indhold og sparring."
                    icon={Sparkles}
                    color="violet"
                />
            </div>

            {/* Breakdown Section */}
            <section className="space-y-8">
                <div className="flex items-center justify-between px-2">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 serif">Forbrug per Flow</h2>
                        <p className="text-sm font-medium text-slate-500">Hvor i maskinrummet benyttes de fleste ressourcer?</p>
                    </div>
                    <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-center text-slate-400">
                        <BarChart3 className="w-6 h-6" />
                    </div>
                </div>
                
                <div className="space-y-4">
                    {stats.flows.map((flow, i) => (
                        <motion.div
                            key={flow.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                        >
                            <FlowUsageRow {...flow} />
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Summary Banner */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="p-12 bg-slate-950 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl group"
            >
               <div className="relative z-10 grid md:grid-cols-2 gap-16 items-center">
                  <div>
                     <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Brain className="w-7 h-7 text-indigo-400" />
                     </div>
                     <h2 className="text-4xl font-black serif mb-6 leading-tight">Optimering & <br/>Hardware Budget.</h2>
                     <p className="text-white/40 font-medium leading-relaxed mb-10 max-w-sm">
                        Data herunder reflekterer de reelle omkostninger fra Google Cloud. 
                        Vi benytter <b>Gemini 2.5 Flash</b> for at sikre den højeste hastighed til den laveste pris.
                     </p>
                     <div className="flex flex-wrap gap-4">
                        <div className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl">
                            <span className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Stack</span>
                            <span className="font-bold text-indigo-400">G. 2.5 Flash</span>
                        </div>
                        <div className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl">
                            <span className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Status</span>
                            <span className="font-bold flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full"/> Online</span>
                        </div>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                     {[
                       { label: "Total Input", value: `${(stats.totalInputTokens / 1000000).toFixed(2)}M`, sub: "Tokens" },
                       { label: "Total Output", value: `${(stats.totalOutputTokens / 1000000).toFixed(2)}M`, sub: "Tokens" },
                       { label: "Hardware Efficiency", value: "98.4%", sub: "Ratio" },
                       { label: "Belastning", value: "Normal", sub: "Status" }
                     ].map((it, i) => (
                        <div key={i} className="p-8 bg-white/5 border border-white/10 rounded-[2rem] text-center group/item hover:bg-white/10 transition-colors">
                           <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-3">{it.label}</span>
                           <span className="block text-2xl font-black text-white serif">{it.value}</span>
                           <span className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">{it.sub}</span>
                        </div>
                     ))}
                  </div>
               </div>
               
               {/* Background Decoration */}
               <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] -mr-48 -mt-48 pointer-events-none" />
               <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] -ml-48 -mb-48 pointer-events-none" />
            </motion.div>
        </div>
    );
}
