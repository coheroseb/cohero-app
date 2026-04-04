
'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, DocumentData, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { Loader2, CheckCircle, XCircle, ChevronDown, FileText, ThumbsUp, ThumbsDown, AlertTriangle, ListChecks, Trash2, Search, Calendar, User, Scale, ShieldCheck, Zap, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';

interface SecondOpinion extends DocumentData {
  id: string;
  input: {
    grade: string;
    assignmentText: string;
    feedback?: string;
  };
  analysis: {
    isComplaintJustified: boolean;
    strengths: string[];
    weaknesses: string[];
    riskAssessment: string[];
    alignmentWithCriteria: string[];
    suggestedNextSteps: string[];
  };
  createdAt: {
    toDate: () => Date;
  };
  user?: {
      id: string;
      username: string;
  }
}

const DetailView = ({ opinion }: { opinion: SecondOpinion }) => {
    return (
      <motion.div 
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="overflow-hidden"
      >
        <div className="p-12 bg-slate-50/50 space-y-12 border-b border-slate-100">
            <div className="grid lg:grid-cols-2 gap-12">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">
                        <FileText className="w-4 h-4" /> Opgavebesvarelse
                    </div>
                    <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm text-sm text-slate-600 leading-relaxed max-h-[400px] overflow-y-auto custom-scrollbar">
                        {opinion.input.assignmentText}
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">
                        <Scale className="w-4 h-4" /> Bedømmers Feedback
                    </div>
                    <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm text-sm text-slate-600 italic leading-relaxed h-full min-h-[100px]">
                        {opinion.input.feedback ? `"${opinion.input.feedback}"` : "Ingen feedback angivet."}
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <section className="bg-white p-10 rounded-[3rem] border border-emerald-100/50 shadow-sm space-y-6">
                    <h4 className="font-black text-slate-900 serif text-lg flex items-center gap-3"><ThumbsUp className="w-6 h-6 text-emerald-500 fill-emerald-500/10"/>Styrker</h4>
                    <ul className="space-y-4">
                        {opinion.analysis.strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" /> {s}
                            </li>
                        ))}
                    </ul>
                </section>
                <section className="bg-white p-10 rounded-[3rem] border border-rose-100/50 shadow-sm space-y-6">
                    <h4 className="font-black text-slate-900 serif text-lg flex items-center gap-3"><ThumbsDown className="w-6 h-6 text-rose-500 fill-rose-500/10"/>Svagheder</h4>
                    <ul className="space-y-4">
                        {opinion.analysis.weaknesses.map((s, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" /> {s}
                            </li>
                        ))}
                    </ul>
                </section>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <section className="bg-white p-10 rounded-[3rem] border border-amber-100/50 shadow-sm space-y-6">
                    <h4 className="font-black text-slate-900 serif text-lg flex items-center gap-3"><AlertTriangle className="w-6 h-6 text-amber-500 fill-amber-500/10"/>Risikovurdering</h4>
                    <ul className="space-y-4">
                        {opinion.analysis.riskAssessment.map((s, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" /> {s}
                            </li>
                        ))}
                    </ul>
                </section>
                <section className="bg-slate-900 p-10 rounded-[3rem] shadow-xl space-y-6">
                    <h4 className="font-black text-white serif text-lg flex items-center gap-3"><Zap className="w-6 h-6 text-indigo-400 fill-indigo-400/10"/>Anbefalet Strategi</h4>
                    <ul className="space-y-4">
                        {opinion.analysis.suggestedNextSteps.map((s, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-white/70 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" /> {s}
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </div>
      </motion.div>
    );
};

const SecondOpinionsPage = () => {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [opinions, setOpinions] = useState<SecondOpinion[]>([]);
    const [opinionsLoading, setOpinionsLoading] = useState(true);
    const [expandedOpinionId, setExpandedOpinionId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const usersQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'users')) : null), [firestore]);
    const { data: users, isLoading: usersLoading } = useCollection<any>(usersQuery);

    useEffect(() => {
        if (!firestore || !users || users.length === 0) {
            if(!usersLoading) setOpinionsLoading(false);
            return;
        }

        const fetchOpinions = async () => {
            setOpinionsLoading(true);
            const allOpinions: SecondOpinion[] = [];
            const opinionPromises = users.map(async (user) => {
                const opinionsColRef = collection(firestore, 'users', user.id, 'secondOpinions');
                const opinionsSnap = await getDocs(query(opinionsColRef, orderBy('createdAt', 'desc')));
                opinionsSnap.forEach(docSnap => {
                    if (docSnap.id !== 'latest') {
                        allOpinions.push({ id: docSnap.id, user: { id: user.id, username: user.username || 'Ukendt' }, ...docSnap.data() } as SecondOpinion);
                    }
                });
            });
            await Promise.all(opinionPromises);
            allOpinions.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
            setOpinions(allOpinions);
            setOpinionsLoading(false);
        };
        fetchOpinions();
    }, [firestore, users, usersLoading]);

    const handleDeleteOpinion = async (userId: string, opinionId: string) => {
        if (!firestore || !window.confirm('Slet denne analyse permanent?')) return;
        try {
            await deleteDoc(doc(firestore, 'users', userId, 'secondOpinions', opinionId));
            setOpinions(prev => prev.filter(op => op.id !== opinionId));
            toast({ title: "Slettet", description: "Analysen er fjernet fra databasen." });
        } catch (error) {
            toast({ variant: "destructive", title: "Fejl", description: "Kunne ikke slette." });
        }
    };
    
    const filteredOpinions = opinions.filter(op => 
        op.user?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.input.grade.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <TooltipProvider>
            <div className="space-y-12 animate-ink pb-20">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 serif mb-2">Second Opinion Audit</h1>
                        <p className="text-slate-500 font-medium">Overvåg AI-drevet klagevejledning og akademisk kvalitetssikring.</p>
                    </div>
                    <div className="flex items-center gap-4 px-5 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                        <Users className="w-5 h-5 text-slate-400" />
                        <div className="pr-4 border-r border-slate-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Analyses</p>
                            <p className="text-sm font-black text-slate-700 leading-none">{opinions.length}</p>
                        </div>
                        <div className="pl-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-0.5">Justified</p>
                            <p className="text-sm font-black text-emerald-600 leading-none">{opinions.filter(o => o.analysis.isComplaintJustified).length}</p>
                        </div>
                    </div>
                </header>

                {/* Filter Bar */}
                <div className="relative group max-w-2xl px-2">
                    <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Søg i brugere, karakterer eller analyser..."
                        className="w-full pl-14 pr-8 py-5 bg-white border border-slate-100 rounded-[2rem] focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm font-bold text-slate-900 outline-none shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                    {usersLoading || opinionsLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-32 gap-6">
                            <Loader2 className="w-12 h-12 animate-spin text-slate-100" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Synchronizing audit logs...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
                                    <tr>
                                        <th className="px-10 py-6">Studerende</th>
                                        <th className="px-10 py-6">Dato & Metadata</th>
                                        <th className="px-10 py-6">Karakter</th>
                                        <th className="px-10 py-6 text-center">Outcome</th>
                                        <th className="px-10 py-6 text-right">Handling</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredOpinions.map((opinion, idx) => (
                                    <React.Fragment key={opinion.id}>
                                        <motion.tr 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.02 }}
                                            className="hover:bg-slate-50/30 transition-colors group cursor-pointer"
                                            onClick={() => setExpandedOpinionId(expandedOpinionId === opinion.id ? null : opinion.id)}
                                        >
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs uppercase shadow-lg shadow-slate-900/10">
                                                        {opinion.user?.username.charAt(0)}
                                                    </div>
                                                    <p className="font-black text-slate-900 serif text-lg uppercase tracking-tight">{opinion.user?.username}</p>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-slate-500 font-bold text-xs">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {opinion.createdAt?.toDate().toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </div>
                                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">ID: {opinion.id.slice(0, 8)}</p>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center font-black text-xl text-slate-900 serif">
                                                    {opinion.input.grade}
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                {opinion.analysis.isComplaintJustified ? (
                                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 font-black text-[10px] uppercase tracking-widest shadow-sm shadow-emerald-500/5">
                                                        <CheckCircle className="w-4 h-4" /> Justified
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-50 text-rose-500 rounded-full border border-rose-100 font-black text-[10px] uppercase tracking-widest opacity-60">
                                                        <XCircle className="w-4 h-4" /> Unsupported
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <div className="flex items-center justify-end gap-3" onClick={e => e.stopPropagation()}>
                                                    <button 
                                                        onClick={() => setExpandedOpinionId(expandedOpinionId === opinion.id ? null : opinion.id)}
                                                        className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all ${expandedOpinionId === opinion.id ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/10' : 'bg-white text-slate-400 border-slate-100 hover:text-slate-900'}`}
                                                    >
                                                        <ChevronDown className={`w-5 h-5 transition-transform duration-500 ${expandedOpinionId === opinion.id ? 'rotate-180' : ''}`} />
                                                    </button>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button 
                                                                onClick={() => handleDeleteOpinion(opinion.user!.id, opinion.id)}
                                                                className="w-12 h-12 flex items-center justify-center bg-white border border-slate-100 text-slate-300 hover:text-rose-500 hover:border-rose-100 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent><p className="font-bold">Slet permanent</p></TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </td>
                                        </motion.tr>
                                        <AnimatePresence>
                                            {expandedOpinionId === opinion.id && (
                                                <tr>
                                                    <td colSpan={5} className="p-0">
                                                        <DetailView opinion={opinion} />
                                                    </td>
                                                </tr>
                                            )}
                                        </AnimatePresence>
                                    </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </TooltipProvider>
    );
};

export default SecondOpinionsPage;

