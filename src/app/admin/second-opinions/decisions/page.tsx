'use client';

import React, { useState, useEffect } from 'react';
import { 
    Gavel, Plus, Trash2, Loader2, Search, 
    FileText, CheckCircle2, XCircle, AlertTriangle,
    Sparkles, Filter, ChevronDown, ListChecks,
    ArrowRight, MessageSquare, UploadCloud, X, File as FileIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    getSecondOpinionDecisionsAction, 
    addSecondOpinionDecisionAction, 
    deleteSecondOpinionDecisionAction,
    generateSecondOpinionErrorSummaryAction,
    getSecondOpinionErrorSummaryAction 
} from '@/app/actions';
import { useToast } from "@/hooks/use-toast";

interface Decision {
    id: string;
    title: string;
    content: string;
    outcome: 'justified' | 'unsupported';
    aiAnalysis?: any;
    createdAt?: string;
    tags?: string[];
}

// --- PDF EXTRACTION ---
async function extractTextFromPdf(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist/build/pdf.mjs');
  const pdfjsVersion = '4.10.38'; 
  GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;
  
  const buffer = await file.arrayBuffer();
  const loadingTask = getDocument({data: new Uint8Array(buffer)});
  const pdf = await loadingTask.promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => ('str' in item ? item.str : '')).join(' ');
    text += strings + '\n';
  }
  return text;
}

export default function SecondOpinionDecisionsAdmin() {
    const { toast } = useToast();
    const [decisions, setDecisions] = useState<Decision[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [errorSummary, setErrorSummary] = useState<any>(null);
    const [isRefreshingSummary, setIsRefreshingSummary] = useState(false);

    // Form state
    const [newDecision, setNewDecision] = useState({
        title: '',
        content: '',
        outcome: 'justified' as 'justified' | 'unsupported',
        tags: [] as string[]
    });

    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setIsExtracting(true);
            try {
                const text = await extractTextFromPdf(file);
                setNewDecision(prev => ({ 
                    ...prev, 
                    content: text,
                    title: prev.title || file.name.replace('.pdf', '')
                }));
                toast({ title: 'Tekst ekstraheret', description: 'Vi har udtrukket teksten fra PDF-dokumentet.' });
            } catch (err) {
                console.error("PDF extraction error:", err);
                toast({ variant: 'destructive', title: 'Fejl', description: 'Kunne ikke læse PDF-filen.' });
            } finally {
                setIsExtracting(false);
            }
        }
    };

    const fetchData = async () => {
        setLoading(true);
        const [decisionsRes, summaryRes] = await Promise.all([
            getSecondOpinionDecisionsAction(),
            getSecondOpinionErrorSummaryAction()
        ]);

        if (decisionsRes.success && decisionsRes.data) {
            setDecisions(decisionsRes.data);
        }
        if (summaryRes.success && summaryRes.data) {
            setErrorSummary(summaryRes.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddDecision = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDecision.title || !newDecision.content) return;

        setIsSaving(true);
        const result = await addSecondOpinionDecisionAction(newDecision);
        if (result.success) {
            toast({ title: 'Afgørelse tilføjet!', description: 'AI har analyseret dokumentet og opdateret overblikket.' });
            setIsAdding(false);
            setNewDecision({ title: '', content: '', outcome: 'justified', tags: [] });
            setSelectedFile(null);
            fetchData();
        } else {
            toast({ variant: 'destructive', title: 'Fejl', description: result.message || 'Kunne ikke gemme afgørelsen.' });
        }
        setIsSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Er du sikker på, at du vil slette denne afgørelse?')) return;
        
        const result = await deleteSecondOpinionDecisionAction(id);
        if (result.success) {
            toast({ title: 'Slettet', description: 'Afgørelsen er fjernet.' });
            fetchData();
        }
    };

    const handleRefreshSummary = async () => {
        setIsRefreshingSummary(true);
        const result = await generateSecondOpinionErrorSummaryAction();
        if (result.success) {
            toast({ title: 'Summary opdateret!', description: 'Nyt AI overblik genereret baseret på alle afgørelser.' });
            fetchData();
        }
        setIsRefreshingSummary(false);
    };

    const filteredDecisions = decisions.filter(d => 
        d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 animate-ink pb-20 pt-8 px-4">
            {/* Header */}
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-rose-50 text-rose-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-rose-100 shadow-sm">
                        <Gavel className="w-3.5 h-3.5" /> Second Opinion Intelligence
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 serif tracking-tight">Klage-Afgørelser</h1>
                    <p className="text-xl text-slate-500 font-medium italic">Administrer datagrundlaget for AI-vurderinger og fejl-summaries.</p>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => {
                            setIsAdding(true);
                            setNewDecision({ title: '', content: '', outcome: 'justified', tags: [] });
                            setSelectedFile(null);
                        }}
                        className="h-16 px-10 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-95 transition-all hover:bg-rose-600 flex items-center justify-center gap-3"
                    >
                        <Plus className="w-4 h-4" /> Tilføj Ny Afgørelse
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                {/* AI Summary Sidebar */}
                <div className="xl:col-span-4 space-y-8">
                    <section className="bg-slate-950 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[80px] -mr-32 -mt-32" />
                        <div className="relative z-10 space-y-10">
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-rose-400 border border-white/5">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-2xl font-black serif">AI Fejl-Overblik</h3>
                                </div>
                                <button 
                                    onClick={handleRefreshSummary}
                                    disabled={isRefreshingSummary || decisions.length === 0}
                                    className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all disabled:opacity-20"
                                >
                                    {isRefreshingSummary ? <Loader2 className="w-5 h-5 animate-spin" /> : <ListChecks className="w-5 h-5 text-rose-400" />}
                                </button>
                            </div>

                            {errorSummary ? (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                            <p className="text-[10px] font-black uppercase text-white/30 mb-2">Total Sager</p>
                                            <p className="text-2xl font-black">{errorSummary.decisionCount}</p>
                                        </div>
                                        <div className="p-6 bg-emerald-500/10 rounded-3xl border border-emerald-500/10">
                                            <p className="text-[10px] font-black uppercase text-emerald-500/40 mb-2">Medhold</p>
                                            <p className="text-2xl font-black text-emerald-400">{errorSummary.winCount}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">Hyppige fejl og mønstre</p>
                                        <div className="p-8 bg-white/5 border border-white/5 rounded-3xl text-sm text-white/70 italic leading-relaxed prose prose-invert">
                                            {errorSummary.summary.split('\n').map((line: string, i: number) => (
                                                <p key={i} className="mb-4">{line}</p>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-tighter">
                                        Senest opdateret: {new Date(errorSummary.updatedAt?.toDate?.() || errorSummary.updatedAt).toLocaleString('da-DK')}
                                    </p>
                                </div>
                            ) : (
                                <div className="p-12 text-center space-y-4 opacity-40">
                                    <AlertTriangle className="w-12 h-12 mx-auto" />
                                    <p className="text-xs font-bold italic">Ingen AI opsummering tilgængelig endnu. Tilføj sager for at generere indsigt.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Decisions List */}
                <div className="xl:col-span-8 space-y-8">
                    {/* Filter & Search */}
                    <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-center gap-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Søg i afgørelser..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full h-14 pl-14 pr-6 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500/30 transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
                             <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Filter:</div>
                             <button className="px-4 py-2 bg-white text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">Alle</button>
                        </div>
                    </section>

                    <div className="grid gap-6">
                        {loading ? (
                            <div className="p-32 flex flex-col items-center gap-6">
                                <Loader2 className="w-12 h-12 animate-spin text-slate-100" />
                                <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em]">Henter afgørelser...</p>
                            </div>
                        ) : filteredDecisions.length === 0 ? (
                            <div className="p-32 bg-white rounded-[4rem] border border-dashed border-slate-100 text-center space-y-4">
                                <FileText className="w-12 h-12 text-slate-100 mx-auto" />
                                <p className="text-sm font-bold text-slate-300 italic">Ingen afgørelser fundet.</p>
                            </div>
                        ) : (
                            filteredDecisions.map((decision) => (
                                <motion.div 
                                    layout
                                    key={decision.id}
                                    className="bg-white p-8 rounded-[3rem] border border-slate-100 group hover:border-rose-200 transition-all shadow-sm hover:shadow-xl hover:shadow-rose-500/5"
                                >
                                    <div className="flex items-start justify-between gap-8">
                                        <div className="space-y-4 flex-1">
                                            <div className="flex items-center gap-3">
                                                {decision.outcome === 'justified' ? (
                                                    <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 text-[9px] font-black uppercase tracking-widest">Medhold</div>
                                                ) : (
                                                    <div className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg border border-rose-100 text-[9px] font-black uppercase tracking-widest">Afslag</div>
                                                )}
                                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">ID: {decision.id.slice(0, 8)}</span>
                                            </div>
                                            <h3 className="text-xl font-black text-slate-900 serif leading-tight">{decision.title}</h3>
                                            <div className="text-sm text-slate-500 line-clamp-2 italic leading-relaxed">
                                                {decision.content}
                                            </div>
                                        </div>
                                        
                                        <button 
                                            onClick={() => handleDelete(decision.id)}
                                            className="p-4 bg-slate-50 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {decision.aiAnalysis && (
                                        <div className="mt-8 pt-8 border-t border-slate-50 grid grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">AI Ekstraheret Vægtning</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {(decision.aiAnalysis.weightingFactors || []).map((f: string, i: number) => (
                                                        <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold">{f}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Kritisk Punkt</p>
                                                <p className="text-xs font-medium text-slate-600 italic">"{decision.aiAnalysis.criticalPoint || 'Ikke defineret'}"</p>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Add Modal */}
            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                            onClick={() => !isSaving && setIsAdding(false)}
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            <div className="p-10 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg"><Plus className="w-6 h-6" /></div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 serif">Ny Afgørelse</h2>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Tilføj til Second Opinion vidensbase</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsAdding(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><XCircle className="w-6 h-6" /></button>
                            </div>

                            <div className="p-10 bg-rose-50/30 border-b border-slate-100">
                                <div className="max-w-xl mx-auto">
                                    <label htmlFor="pdf-upload" className="relative block w-full border-2 border-dashed border-rose-200 rounded-[2rem] p-8 text-center cursor-pointer hover:border-rose-400 hover:bg-white transition-all group/upload">
                                        {isExtracting ? (
                                            <div className="space-y-4">
                                                <Loader2 className="w-10 h-10 animate-spin text-rose-500 mx-auto" />
                                                <p className="text-sm font-black text-rose-900 uppercase tracking-widest">Ekstraherer tekst fra PDF...</p>
                                            </div>
                                        ) : selectedFile ? (
                                            <div className="flex items-center justify-center gap-4">
                                                <FileIcon className="w-8 h-8 text-rose-600" />
                                                <div className="text-left">
                                                    <p className="text-sm font-black text-rose-900 truncate max-w-[200px]">{selectedFile.name}</p>
                                                    <p className="text-[10px] font-bold text-rose-400 uppercase">Klik for at skifte fil</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <UploadCloud className="w-10 h-10 text-rose-200 group-hover/upload:text-rose-500 transition-colors mx-auto" />
                                                <div>
                                                    <p className="text-sm font-black text-rose-900 uppercase tracking-widest">Upload selve afgørelsen (PDF)</p>
                                                    <p className="text-[10px] font-bold text-rose-400 mt-1 uppercase tracking-tighter">Vi udtaler automatisk teksten til AI-analysen</p>
                                                </div>
                                            </div>
                                        )}
                                        <input id="pdf-upload" type="file" className="sr-only" accept=".pdf" onChange={handleFileChange} disabled={isExtracting} />
                                    </label>
                                </div>
                            </div>

                            <form onSubmit={handleAddDecision} className="p-10 space-y-8 overflow-y-auto">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Titel på Afgørelse</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={newDecision.title}
                                        onChange={e => setNewDecision(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="F.eks. Klagesag 2024-42 - Modul 4, Socialret"
                                        className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 font-bold text-slate-900 focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500/30 transition-all outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Udfald</label>
                                        <div className="grid grid-cols-2 gap-4 p-2 bg-slate-50 rounded-2xl border border-slate-100">
                                            <button 
                                                type="button"
                                                onClick={() => setNewDecision(prev => ({ ...prev, outcome: 'justified' }))}
                                                className={`h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newDecision.outcome === 'justified' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:bg-white'}`}
                                            >
                                                Medhold
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setNewDecision(prev => ({ ...prev, outcome: 'unsupported' }))}
                                                className={`h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newDecision.outcome === 'unsupported' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400 hover:bg-white'}`}
                                            >
                                                Afslag
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Tags (kommasepareret)</label>
                                        <input 
                                            type="text" 
                                            placeholder="Socialret, Taksonomi, Rød tråd"
                                            className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 font-bold text-slate-900 focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500/30 transition-all outline-none"
                                            onChange={e => setNewDecision(prev => ({ ...prev, tags: e.target.value.split(',').map(t => t.trim()) }))}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Afgørelsestekst / Resume (Auto-udfyldt fra PDF)</label>
                                    <textarea 
                                        required
                                        rows={10}
                                        value={newDecision.content}
                                        onChange={e => setNewDecision(prev => ({ ...prev, content: e.target.value }))}
                                        placeholder="Beskriv sagens indhold, begrundelse og præcis hvorfor udfaldet blev som det blev..."
                                        className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] p-8 font-medium text-slate-700 text-sm focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500/30 transition-all leading-relaxed outline-none"
                                    />
                                </div>

                                <div className="flex justify-end pt-8">
                                    <button 
                                        type="submit"
                                        disabled={isSaving || isExtracting}
                                        className="h-16 px-12 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-95 transition-all hover:bg-rose-600 flex items-center justify-center gap-3"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} {isSaving ? 'Analyserer & Gemmer...' : 'Gem Afgørelse & Opdater AI'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
