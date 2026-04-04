
'use client';

import React, { useState, useEffect } from 'react';
import { 
    Trophy, Sparkles, Plus, Calendar, Target, Gift, 
    Trash2, Loader2, ChevronRight, Award, 
    Users, Activity, Timer, Zap, History,
    CheckCircle2, AlertCircle, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    createGamificationEventAction, 
    getGamificationEventsAction, 
    deleteGamificationEventAction, 
    getEventLeaderboardAction 
} from '@/app/actions';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';

interface GamificationEvent {
    id: string;
    title: string;
    description: string;
    type: 'quiz_count' | 'streak_days';
    startDate: string;
    endDate: string;
    reward: string;
    isActive: boolean;
}

export default function GamificationAdminPage() {
    const { toast } = useToast();
    const [events, setEvents] = useState<GamificationEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

    // Form stuff
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newType, setNewType] = useState<'quiz_count' | 'streak_days'>('quiz_count');
    const [newStartDate, setNewStartDate] = useState('');
    const [newEndDate, setNewEndDate] = useState('');
    const [newReward, setNewReward] = useState('');

    const fetchEvents = async () => {
        const result = await getGamificationEventsAction();
        if (result.success && result.data) {
            setEvents(result.data as GamificationEvent[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleCreateEvent = async () => {
        setIsCreating(true);
        const result = await createGamificationEventAction({
            title: newTitle,
            description: newDesc,
            type: newType,
            startDate: newStartDate,
            endDate: newEndDate,
            reward: newReward
        });

        if (result.success) {
            toast({ title: 'Challenge Oprettet!', description: 'Nyt ritual er nu live.' });
            setShowCreateModal(false);
            fetchEvents();
            // Reset form
            setNewTitle(''); setNewDesc(''); setNewReward('');
        }
        setIsCreating(false);
    };

    const handleDeleteEvent = async (id: string) => {
        if (!confirm('Er du sikker på du vil slette denne challenge?')) return;
        const result = await deleteGamificationEventAction(id);
        if (result.success) {
            toast({ title: 'Challenge Slettet' });
            fetchEvents();
        }
    };

    const fetchLeaderboard = async (id: string) => {
        setLoadingLeaderboard(true);
        setSelectedEventId(id);
        const result = await getEventLeaderboardAction(id);
        if (result.success && result.data) {
            setLeaderboard(result.data);
        }
        setLoadingLeaderboard(false);
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 animate-ink pb-20 pt-8 px-4">
            {/* Header */}
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-amber-50 text-amber-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-amber-100 shadow-sm shadow-amber-500/5">
                        <Trophy className="w-3.5 h-3.5" /> Platform Gamification
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 serif tracking-tight">Challenges & Ritualer</h1>
                    <p className="text-xl text-slate-500 font-medium italic">Skab eksklusive begivenheder, der booster studie-aktiviteten gennem konkurrence og belønning.</p>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setShowCreateModal(true)}
                        className="group flex items-center gap-4 px-10 py-5 bg-slate-950 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-2xl active:scale-95 transition-all hover:bg-indigo-600"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> Opret Ny Challenge
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                {/* Active Challenges List */}
                <div className="xl:col-span-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {loading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-[400px] bg-slate-50 border border-slate-100 animate-pulse rounded-[3rem]" />
                            ))
                        ) : events.length === 0 ? (
                            <div className="col-span-full p-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] text-center space-y-4">
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto text-slate-300 shadow-sm">
                                    <Zap className="w-10 h-10" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-slate-400">Ingen aktive challenges</h4>
                                    <p className="text-sm text-slate-300">Bliv den første til at skabe en bølge af aktivitet!</p>
                                </div>
                            </div>
                        ) : (
                            events.map(event => (
                                <EventCard 
                                    key={event.id} 
                                    event={event} 
                                    onDelete={() => handleDeleteEvent(event.id)}
                                    onViewLeaderboard={() => fetchLeaderboard(event.id)}
                                    isSelected={selectedEventId === event.id}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Leaderboard Section */}
                <AnimatePresence>
                    {selectedEventId && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="xl:col-span-12"
                        >
                            <section className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden">
                                <div className="p-12 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-amber-950 rounded-2xl flex items-center justify-center text-amber-400 shadow-xl shadow-amber-900/20 rotate-3">
                                            <TrendingUp className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-slate-900 serif">Live Leaderboard</h3>
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Real-tids overvågning af deltagere</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedEventId(null)} className="text-[11px] font-black uppercase tracking-widest text-slate-300 hover:text-slate-900 transition-colors">Skjul oversigt</button>
                                </div>

                                <div className="p-12">
                                    {loadingLeaderboard ? (
                                        <div className="py-20 flex flex-col items-center gap-6">
                                            <Loader2 className="w-12 h-12 animate-spin text-indigo-400" />
                                            <p className="text-[10px] font-black uppercase text-indigo-300 tracking-[0.2em]">Henter rangliste...</p>
                                        </div>
                                    ) : leaderboard.length === 0 ? (
                                        <div className="py-20 text-center space-y-4">
                                            <Activity className="w-12 h-12 text-slate-200 mx-auto" />
                                            <p className="text-sm text-slate-400 font-medium italic">Ingen brugere har gennemført udfordringen endnu.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                            {leaderboard.map((entry, idx) => (
                                                <div key={idx} className="flex items-center gap-6 p-6 bg-slate-50 border border-slate-100 rounded-3xl relative group hover:bg-white hover:shadow-xl transition-all">
                                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl bg-white border border-slate-100 text-slate-900">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-black text-slate-900 truncate serif">{entry.userName}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-black uppercase">
                                                                {entry.score} {events.find(e => e.id === selectedEventId)?.type === 'quiz_count' ? 'Quizzes' : 'Dage'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Award className={`w-6 h-6 ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : 'text-amber-700'}`} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </section>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setShowCreateModal(false)} />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-10 border-b border-slate-100 flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-slate-900 serif tracking-tight">Opret Ny Challenge</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Definér mål og belønning</p>
                                </div>
                                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white"><Sparkles className="w-6 h-6" /></div>
                            </div>

                            <div className="p-10 overflow-y-auto space-y-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest flex items-center gap-2">
                                        <Award className="w-3.5 h-3.5 text-indigo-500" /> Navn på Challenge
                                    </label>
                                    <input 
                                        type="text" 
                                        value={newTitle} 
                                        onChange={e => setNewTitle(e.target.value)}
                                        placeholder="F.eks. April Quiz Battle 2024"
                                        className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-sm"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest flex items-center gap-2">
                                        <Activity className="w-3.5 h-3.5 text-indigo-500" /> Type af aktivitet
                                    </label>
                                    <select 
                                        value={newType} 
                                        onChange={e => setNewType(e.target.value as any)}
                                        className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-900 appearance-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-sm"
                                    >
                                        <option value="quiz_count">Antal Gennemførte Quizzes</option>
                                        <option value="streak_days">Daglige Logins i Træk</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Start Dato
                                        </label>
                                        <input type="date" value={newStartDate} onChange={e => setNewStartDate(e.target.value)} className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-900 text-sm" />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Slut Dato
                                        </label>
                                        <input type="date" value={newEndDate} onChange={e => setNewEndDate(e.target.value)} className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-900 text-sm" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest flex items-center gap-2">
                                        <Gift className="w-3.5 h-3.5 text-rose-500" /> Belønning / Præmie
                                    </label>
                                    <input 
                                        type="text" 
                                        value={newReward} 
                                        onChange={e => setNewReward(e.target.value)}
                                        placeholder="F.eks. Cohéro Master Badge + 1 md. gratis"
                                        className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-sm"
                                    />
                                </div>

                                <div className="flex gap-4 pt-4 sticky bottom-0 bg-white pb-6">
                                    <button onClick={() => setShowCreateModal(false)} className="flex-1 h-16 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all">Annullér</button>
                                    <button 
                                        onClick={handleCreateEvent} 
                                        disabled={isCreating}
                                        className="flex-1 h-16 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-95 transition-all hover:bg-indigo-600 flex items-center justify-center gap-3"
                                    >
                                        {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} {isCreating ? 'Propagating...' : 'Aktivér Challenge'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

const EventCard = ({ event, onDelete, onViewLeaderboard, isSelected }: { event: GamificationEvent, onDelete: () => void, onViewLeaderboard: () => void, isSelected: boolean }) => (
    <motion.div 
        layout
        className={`bg-white rounded-[3rem] border p-10 flex flex-col h-full relative group transition-all duration-500 overflow-hidden ${isSelected ? 'border-amber-950/40 ring-4 ring-amber-950/5 shadow-2xl' : 'border-slate-100 shadow-sm hover:shadow-xl hover:bg-slate-50'}`}
    >
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
            {event.type === 'quiz_count' ? <Zap className="w-32 h-32 text-amber-500 -rotate-12" /> : <Timer className="w-32 h-32 text-blue-500 -rotate-12" />}
        </div>

        <div className="flex-1 relative z-10 space-y-8">
            <div className="flex items-center justify-between">
                <div className="p-3 bg-slate-900 rounded-2xl text-amber-400 shadow-lg shadow-slate-900/10">
                    {event.type === 'quiz_count' ? <Award className="w-5 h-5" /> : <History className="w-5 h-5" />}
                </div>
                <div className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${event.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                    {event.isActive ? 'Active Ritual' : 'Archived'}
                </div>
            </div>

            <div className="space-y-2">
                <h4 className="text-2xl font-black text-slate-900 serif tracking-tight">{event.title}</h4>
                <p className="text-xs text-slate-400 font-medium leading-relaxed italic">"{event.reward}"</p>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-500">
                    <Calendar className="w-4 h-4 text-slate-300" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{new Date(event.startDate).toLocaleDateString('da-DK')} — {new Date(event.endDate).toLocaleDateString('da-DK')}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                    <Target className="w-4 h-4 text-slate-300" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{event.type === 'quiz_count' ? 'Challenge: Quizzes færdiggjort' : 'Challenge: Daglige Streaks'}</span>
                </div>
            </div>
        </div>

        <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-between relative z-10">
            <button 
                onClick={onViewLeaderboard}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all ${isSelected ? 'bg-amber-950 text-amber-400 shadow-xl' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-950'}`}
            >
                Rangliste <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button onClick={onDelete} className="p-3 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"><Trash2 className="w-4 h-4" /></button>
        </div>
    </motion.div>
);
