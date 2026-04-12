'use client';

import React, { useState } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { CheckCircle2, Clock, Trash2, User, Mail, MessageSquare, AlertCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminSupportPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');

    const supportQuery = firestore ? query(collection(firestore, 'supportReports'), orderBy('createdAt', 'desc')) : null;
    const { data: reports, isLoading } = useCollection<any>(supportQuery);

    const updateStatus = async (id: string, newStatus: string) => {
        if (!firestore) return;
        try {
            await updateDoc(doc(firestore, 'supportReports', id), { status: newStatus });
            toast({ title: 'Status opdateret' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Kunne ikke opdatere status' });
        }
    };

    const deleteReport = async (id: string) => {
        if (!firestore || !confirm('Er du sikker på, at du vil slette denne besked?')) return;
        try {
            await deleteDoc(doc(firestore, 'supportReports', id));
            toast({ title: 'Besked slettet' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Kunne ikke slette besked' });
        }
    };

    const filteredReports = reports?.filter(r => 
        r.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 serif leading-none mb-3">Support & Tickets</h1>
                    <p className="text-slate-500 font-medium">Håndter indsendte problemer og forslag fra brugere.</p>
                </div>
                
                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all">
                    <Search className="w-5 h-5 ml-3 text-slate-300" />
                    <input 
                        type="text" 
                        placeholder="Søg i beskeder..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 w-64 px-2"
                    />
                </div>
            </header>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Clock className="w-8 h-8 animate-spin text-slate-300" />
                </div>
            ) : filteredReports?.length === 0 ? (
                <div className="bg-white rounded-[40px] border border-slate-200 p-20 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 serif">Ingen beskeder fundet</h3>
                    <p className="text-slate-400 font-medium mt-2">Alt ser ud til at spille!</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredReports?.map((report) => (
                            <motion.div 
                                key={report.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`bg-white rounded-[32px] border ${report.status === 'open' ? 'border-amber-100 shadow-amber-500/5' : 'border-slate-100'} p-8 shadow-sm group hover:shadow-xl transition-all duration-500`}
                            >
                                <div className="flex flex-col lg:flex-row gap-8">
                                    <div className="flex-1 space-y-6">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                                                report.status === 'open' 
                                                ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                                                : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                            }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${report.status === 'open' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                                                {report.status === 'open' ? 'Afventer' : 'Løst'}
                                            </span>
                                            <span className="text-slate-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                {report.createdAt?.toDate ? report.createdAt.toDate().toLocaleString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Ukendt tid'}
                                            </span>
                                        </div>

                                        <p className="text-slate-700 font-medium text-lg leading-relaxed bg-slate-50/50 p-6 rounded-3xl border border-slate-100/50">
                                            \"{report.message}\"
                                        </p>

                                        <div className="flex flex-wrap items-center gap-6 pt-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Bruger</p>
                                                    <p className="text-xs font-bold text-slate-900">{report.userName}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                                    <Mail className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Email</p>
                                                    <p className="text-xs font-bold text-slate-900">{report.userEmail}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:w-48 flex flex-col gap-2 shrink-0">
                                        {report.status === 'open' ? (
                                            <Button 
                                                onClick={() => updateStatus(report.id, 'closed')}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold py-4 h-auto shadow-lg shadow-emerald-500/10"
                                            >
                                                <CheckCircle2 className="w-4 h-4 mr-2" /> Markér som løst
                                            </Button>
                                        ) : (
                                            <Button 
                                                onClick={() => updateStatus(report.id, 'open')}
                                                variant="outline"
                                                className="border-slate-200 text-slate-600 rounded-2xl font-bold py-4 h-auto"
                                            >
                                                <Clock className="w-4 h-4 mr-2" /> Genåbn
                                            </Button>
                                        )}
                                        <Button 
                                            onClick={() => deleteReport(report.id)}
                                            variant="ghost"
                                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl py-4 h-auto transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" /> Slet ticket
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
