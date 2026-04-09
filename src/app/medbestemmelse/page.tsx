'use client';

import React, { useState, useEffect } from 'react';
import { 
    Sparkles, 
    Lightbulb, 
    ArrowUpCircle, 
    Plus, 
    MessageSquare, 
    CheckCircle2, 
    Clock, 
    Rocket,
    Send,
    X,
    ThumbsUp,
    ChevronRight,
    Loader2,
    Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFeatureRequestsAction, submitFeatureRequestAction, voteForFeatureAction } from '@/app/actions';
import { useToast } from "@/hooks/use-toast";
import { useApp } from '@/app/provider';

interface FeatureRequest {
    id: string;
    title: string;
    description: string;
    votes: number;
    status: 'suggested' | 'planned' | 'in-progress' | 'completed';
    authorName: string;
    createdAt: string;
}

const statusColors = {
    suggested: 'bg-slate-100 text-slate-600 border-slate-200',
    planned: 'bg-amber-100 text-amber-900 border-amber-200',
    'in-progress': 'bg-blue-100 text-blue-900 border-blue-200',
    completed: 'bg-emerald-100 text-emerald-900 border-emerald-200'
};

const statusLabels = {
    suggested: 'Idébank',
    planned: 'Planlagt',
    'in-progress': 'Under udvikling',
    completed: 'Lanceret'
};

const statusIcons = {
    suggested: Lightbulb,
    planned: Clock,
    'in-progress': Rocket,
    completed: CheckCircle2
};

export default function MedbestemmelsePage() {
    const [requests, setRequests] = useState<FeatureRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [votedIds, setVotedIds] = useState<string[]>([]);
    
    const { toast } = useToast();
    const { user, userProfile } = useApp();

    const [newSuggestion, setNewSuggestion] = useState({
        title: '',
        description: ''
    });

    useEffect(() => {
        fetchRequests();
        const storedVotes = localStorage.getItem('cohero_votes');
        if (storedVotes) {
            setVotedIds(JSON.parse(storedVotes));
        }
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        const res = await getFeatureRequestsAction();
        if (res.success && res.data) {
            setRequests(res.data as FeatureRequest[]);
        }
        setLoading(false);
    };

    const handleVote = async (id: string) => {
        if (votedIds.includes(id)) {
            toast({
                title: "Allerede stemt",
                description: "Du har allerede stemt på dette forslag.",
            });
            return;
        }

        const res = await voteForFeatureAction(id);
        if (res.success) {
            const newVoted = [...votedIds, id];
            setVotedIds(newVoted);
            localStorage.setItem('cohero_votes', JSON.stringify(newVoted));
            
            setRequests(prev => prev.map(req => 
                req.id === id ? { ...req, votes: req.votes + 1 } : req
            ));
            
            toast({
                title: "Tak for din stemme!",
                description: "Din stemme er blevet registreret.",
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSuggestion.title || !newSuggestion.description) return;
        
        setSubmitting(true);
        const res = await submitFeatureRequestAction({
            ...newSuggestion,
            authorName: userProfile?.username || user?.displayName || 'Anonym Kollega',
            userId: user?.uid
        });

        if (res.success) {
            toast({
                title: "Forslag sendt!",
                description: "Vi har modtaget dit forslag og tilføjet det til idébanken.",
            });
            setNewSuggestion({ title: '', description: '' });
            setIsSuggestModalOpen(false);
            fetchRequests();
        } else {
            toast({
                variant: "destructive",
                title: "Fejl",
                description: "Der skete en fejl under indsendelse. Prøv igen senere.",
            });
        }
        setSubmitting(false);
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] selection:bg-amber-200 selection:text-amber-900 pb-20">
            {/* Hero Section */}
            <section className="relative pt-32 pb-24 overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-amber-50 to-transparent z-0" />
                <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-amber-200/20 rounded-full blur-[120px] -mr-64 z-0 animation-pulse" />
                
                <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-950/5 border border-amber-950/10 rounded-full mb-8">
                            <Users className="w-4 h-4 text-amber-900" />
                            <span className="text-[10px] uppercase font-black tracking-widest text-amber-900">Medbestemmelse</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-slate-900 serif leading-tight mb-8">
                            Form Fremtidens <span className="text-amber-900 italic">Cohéro</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed mb-12 max-w-2xl mx-auto">
                            Vi bygger ikke kun en platform – vi bygger et fællesskab. 
                            Vores rejse formes af dine behov som studerende og fagperson. 
                            Del dine idéer, stem på forslag, og vær med til at prioritere fremtiden.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button 
                                onClick={() => setIsSuggestModalOpen(true)}
                                className="group h-16 px-10 bg-amber-950 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-rose-950 transition-all flex items-center gap-3 active:scale-95"
                            >
                                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                                Foreslå ny funktion
                            </button>
                            <a 
                                href="#roadmap"
                                className="h-16 px-10 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black uppercase text-xs tracking-widest hover:border-amber-900 transition-all flex items-center gap-2 active:scale-95"
                            >
                                Se Roadmap <ChevronRight className="w-4 h-4" />
                            </a>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Content Section */}
            <section id="roadmap" className="container mx-auto px-6 py-12 max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    
                    {/* Roadmap Columns */}
                    {(['suggested', 'planned', 'in-progress', 'completed'] as const).map((statusGroup) => (
                        <div key={statusGroup} className="space-y-6">
                            <div className="flex items-center justify-between border-b border-amber-100/50 pb-4">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-900/40 flex items-center gap-2">
                                    {React.createElement(statusIcons[statusGroup], { className: "w-3.5 h-3.5" })}
                                    {statusLabels[statusGroup]}
                                </h3>
                                <span className="text-[10px] font-black bg-amber-50 text-amber-900/60 px-2 py-0.5 rounded-lg border border-amber-100/30">
                                    {requests.filter(r => r.status === statusGroup).length}
                                </span>
                            </div>
                            
                            <div className="space-y-5">
                                {loading ? (
                                    <div className="py-12 flex flex-col items-center justify-center text-slate-300 space-y-4">
                                        <Loader2 className="w-6 h-6 animate-spin text-amber-200" />
                                        <span className="text-[9px] uppercase font-black tracking-widest text-amber-900/20">Henter...</span>
                                    </div>
                                ) : requests.filter(r => r.status === statusGroup).length === 0 ? (
                                    <div className="py-12 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-white/50">
                                        <p className="text-[10px] font-black uppercase tracking-widest px-4">Ingen forslag endnu</p>
                                    </div>
                                ) : (
                                    requests
                                        .filter(r => r.status === statusGroup)
                                        .map((request, idx) => (
                                            <motion.div
                                                key={request.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-amber-950/5 hover:-translate-y-1 transition-all relative overflow-hidden"
                                            >
                                                <h4 className="text-lg font-black text-slate-900 serif mb-3 leading-tight group-hover:text-amber-950 transition-colors">
                                                    {request.title}
                                                </h4>
                                                <p className="text-xs text-slate-500 leading-relaxed mb-6 line-clamp-4 font-medium">
                                                    {request.description}
                                                </p>
                                                
                                                <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                                        <div className="w-5 h-5 rounded-lg bg-indigo-50 text-indigo-400 flex items-center justify-center flex-shrink-0">
                                                            <Users className="w-2.5 h-2.5" />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-400 truncate">{request.authorName}</span>
                                                    </div>
                                                    
                                                    <button 
                                                        onClick={() => handleVote(request.id)}
                                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-90
                                                            ${votedIds.includes(request.id) 
                                                                ? 'bg-amber-950 text-white' 
                                                                : 'bg-slate-50 text-slate-600 hover:bg-amber-50 hover:text-amber-900 border border-slate-100'}`}
                                                    >
                                                        <ThumbsUp className={`w-3 h-3 ${votedIds.includes(request.id) ? 'fill-current' : ''}`} />
                                                        <span className="text-[11px] font-black">{request.votes}</span>
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>


            {/* Suggestion Modal */}
            <AnimatePresence>
                {isSuggestModalOpen && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
                            onClick={() => !submitting && setIsSuggestModalOpen(false)}
                        />
                        
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-amber-950 p-10 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-900/40 rounded-full blur-3xl -mr-32 -mt-32" />
                                <button 
                                    onClick={() => setIsSuggestModalOpen(false)}
                                    className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-20"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                
                                <div className="relative z-10 space-y-2">
                                    <div className="w-12 h-12 bg-white/10 border border-white/10 rounded-xl flex items-center justify-center mb-6">
                                        <Lightbulb className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <h2 className="text-3xl font-black serif">Nyt Forslag</h2>
                                    <p className="text-amber-100/70 text-sm font-medium italic leading-relaxed">
                                        Har du fået en god idé? Beskriv den kort herunder – så kan andre stemme på den.
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="p-10 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Overskrift</label>
                                    <input 
                                        type="text"
                                        placeholder="F.eks. 'Integration med Slack'..."
                                        required
                                        value={newSuggestion.title}
                                        onChange={(e) => setNewSuggestion({...newSuggestion, title: e.target.value})}
                                        className="w-full h-14 px-6 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-amber-950/5 focus:border-amber-950 transition-all text-sm font-bold text-slate-900"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Beskrivelse</label>
                                    <textarea 
                                        placeholder="Forklar kort hvorfor denne funktion vil gøre en forskel..."
                                        required
                                        rows={4}
                                        value={newSuggestion.description}
                                        onChange={(e) => setNewSuggestion({...newSuggestion, description: e.target.value})}
                                        className="w-full p-6 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-amber-950/5 focus:border-amber-950 transition-all text-sm font-medium text-slate-900 resize-none leading-relaxed"
                                    />
                                </div>

                                <button 
                                    type="submit"
                                    disabled={submitting || !newSuggestion.title || !newSuggestion.description}
                                    className="w-full h-16 bg-amber-950 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-[0.98] transition-all hover:bg-rose-950 flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            Send Forslag <Send className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                                
                                <p className="text-center text-[10px] text-slate-400 font-medium leading-relaxed">
                                    Ved at indsende forslaget accepterer du, at din idé deles offentligt <br/> på roadmap-boards.
                                </p>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* FAB for mobile submission */}
            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsSuggestModalOpen(true)}
                className="fixed bottom-10 right-10 w-16 h-16 bg-amber-950 text-white rounded-2xl shadow-2xl flex items-center justify-center z-50 md:hidden border-4 border-white"
            >
                <Plus className="w-8 h-8 rotate-0" />
            </motion.button>
        </div>
    );
}
