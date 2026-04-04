
'use client';

import React, { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { 
    Tag, 
    Plus, 
    Trash2, 
    Loader2, 
    Megaphone, 
    Percent, 
    Settings2,
    Eye,
    EyeOff,
    Sparkles,
    Gift,
    Zap,
    ChevronRight,
    Trophy,
    Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminCampaignsPage() {
    const firestore = useFirestore();
    const [isCreating, setIsCreating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Form State
    const [newCampaign, setNewCampaign] = useState({
        title: '',
        description: '',
        discountCode: '',
        stripeCouponId: '',
        isActive: true,
        showBanner: true,
        bannerText: '',
        theme: 'default',
    });

    const campaignsQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'campaigns'), orderBy('createdAt', 'desc')) : null,
        [firestore]
    );
    const { data: campaigns, isLoading } = useCollection<any>(campaignsQuery);

    const handleCreateCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore) return;
        setIsSaving(true);
        try {
            await addDoc(collection(firestore, 'campaigns'), {
                ...newCampaign,
                createdAt: serverTimestamp(),
            });
            setIsCreating(false);
            setNewCampaign({
                title: '',
                description: '',
                discountCode: '',
                stripeCouponId: '',
                isActive: true,
                showBanner: true,
                bannerText: '',
                theme: 'default',
            });
        } catch (error) {
            console.error("Error creating campaign:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleCampaignStatus = async (id: string, currentStatus: boolean) => {
        if (!firestore) return;
        try {
            await updateDoc(doc(firestore, 'campaigns', id), { isActive: !currentStatus });
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const toggleBannerStatus = async (id: string, currentStatus: boolean) => {
        if (!firestore) return;
        try {
            await updateDoc(doc(firestore, 'campaigns', id), { showBanner: !currentStatus });
        } catch (error) {
            console.error("Error updating banner:", error);
        }
    };

    const deleteCampaign = async (id: string) => {
        if (!firestore || !confirm('Slet denne kampagne permanent?')) return;
        try {
            await deleteDoc(doc(firestore, 'campaigns', id));
        } catch (error) {
            console.error("Error deleting campaign:", error);
        }
    };

    return (
        <div className="space-y-12 animate-ink pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 serif mb-2">Growth & Marketing</h1>
                    <p className="text-slate-500 font-medium">Administrer platformens vækstdrivere, rabatkoder og broadcast bannere.</p>
                </div>
                <button 
                    onClick={() => setIsCreating(true)}
                    className="group relative flex items-center justify-center gap-3 px-8 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-slate-900/20 active:scale-95 transition-all hover:bg-slate-800"
                >
                    <Plus className="w-5 h-5" /> Skab Ny Kampagne
                </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: 'Aktive Kampagner', value: campaigns?.filter((c:any) => c.isActive).length || 0, icon: Target, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100/50' },
                    { label: 'Banner Broadcasts', value: campaigns?.filter((c:any) => c.showBanner).length || 0, icon: Megaphone, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100/50' },
                    { label: 'Totale Coupons', value: campaigns?.length || 0, icon: Tag, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100/50' },
                ].map((stat, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`bg-white p-8 rounded-[2.5rem] border ${stat.bg} shadow-sm group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-700 min-h-[140px] flex flex-col justify-between`}
                    >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color} bg-white shadow-sm group-hover:scale-110 transition-transform`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div className="mt-4">
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-[0.2em]">{stat.label}</p>
                            <p className="text-4xl font-black text-slate-900 serif">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Create Modal Overlay */}
            <AnimatePresence>
                {isCreating && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 30 }}
                            className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-100"
                        >
                            <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 serif flex items-center gap-3">Konfigurér Kampagne</h2>
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Udfyld kampagneparametre for udrulning</p>
                                </div>
                                <button onClick={() => setIsCreating(false)} className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl hover:bg-slate-100 transition-colors text-slate-400"><Trash2 className="w-5 h-5"/></button>
                            </div>
                            <form onSubmit={handleCreateCampaign} className="p-10 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Internt Navn</label>
                                        <input 
                                            required
                                            type="text" 
                                            value={newCampaign.title}
                                            onChange={e => setNewCampaign({...newCampaign, title: e.target.value})}
                                            placeholder="F.eks. Studiestart 2024"
                                            className="w-full h-14 px-6 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/30 transition-all font-bold text-slate-900 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Rabatkode (Vises i Banner)</label>
                                        <input 
                                            type="text" 
                                            value={newCampaign.discountCode}
                                            onChange={e => setNewCampaign({...newCampaign, discountCode: e.target.value})}
                                            placeholder="FRESH20"
                                            className="w-full h-14 px-6 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/30 transition-all font-bold text-indigo-600 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Stripe Coupon ID</label>
                                    <div className="relative">
                                        <input 
                                            required
                                            type="text" 
                                            value={newCampaign.stripeCouponId}
                                            onChange={e => setNewCampaign({...newCampaign, stripeCouponId: e.target.value})}
                                            placeholder="coupon_..."
                                            className="w-full h-14 px-6 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/30 transition-all font-bold text-slate-900 outline-none"
                                        />
                                        <Zap className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400 opacity-40" />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Banner Broadcast Tekst</label>
                                    <textarea 
                                        value={newCampaign.bannerText}
                                        onChange={e => setNewCampaign({...newCampaign, bannerText: e.target.value})}
                                        placeholder="Få 20% livstidsrabat på dine studier..."
                                        className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/30 transition-all font-bold text-slate-900 h-28 resize-none outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        type="button"
                                        onClick={() => setNewCampaign({...newCampaign, showBanner: !newCampaign.showBanner})}
                                        className={`h-14 flex items-center justify-center gap-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2 ${newCampaign.showBanner ? 'bg-indigo-50 border-indigo-600/20 text-indigo-600 shadow-lg shadow-indigo-600/5' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                                    >
                                        {newCampaign.showBanner ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        Broadcast Banner
                                    </button>
                                    <select 
                                        value={newCampaign.theme}
                                        onChange={e => setNewCampaign({...newCampaign, theme: e.target.value})}
                                        className="h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-0 focus:border-slate-900 transition-all font-black text-[10px] uppercase tracking-widest cursor-pointer"
                                    >
                                        <option value="default">Standard Tema</option>
                                        <option value="christmas">Jule Tema</option>
                                        <option value="easter">Påske Tema</option>
                                        <option value="halloween">Halloween Tema</option>
                                    </select>
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button 
                                        disabled={isSaving}
                                        type="submit"
                                        className="flex-1 h-16 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[12px] tracking-widest shadow-2xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />}
                                        Start Global Kampagne
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* List Campaigns */}
            <div className="grid grid-cols-1 gap-10">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6">
                        <Loader2 className="w-12 h-12 animate-spin text-slate-100" />
                        <p className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-300">Synchronizing database...</p>
                    </div>
                ) : campaigns?.length === 0 ? (
                    <div className="bg-white rounded-[4rem] p-32 text-center border-2 border-dashed border-slate-100 flex flex-col items-center justify-center gap-8">
                         <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-[2.5rem] flex items-center justify-center shadow-inner">
                            <Megaphone className="w-10 h-10" />
                         </div>
                         <div className="space-y-2">
                             <h3 className="text-2xl font-black text-slate-800 serif">Ingen aktive kampagner</h3>
                             <p className="text-slate-400 font-medium max-w-sm mx-auto">Der er ingen udrulninger lige nu. Klik på knappen ovenfor for at starte en ny vækst-kampagne.</p>
                         </div>
                         <button onClick={() => setIsCreating(true)} className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest">Opret din første kampagne</button>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {campaigns?.map((campaign: any, idx: number) => (
                            <motion.div 
                                layout
                                key={campaign.id} 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`group bg-white rounded-[3.5rem] border transition-all overflow-hidden relative ${campaign.isActive ? 'border-indigo-100 shadow-xl shadow-indigo-500/5' : 'border-slate-100 opacity-60'}`}
                            >
                                <div className="p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                                    <div className="flex items-start gap-8">
                                        <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shrink-0 shadow-sm border transition-transform group-hover:scale-105 duration-700 ${
                                            campaign.theme === 'christmas' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                                            campaign.theme === 'easter' ? 'bg-yellow-50 border-yellow-100 text-yellow-600' :
                                            campaign.theme === 'halloween' ? 'bg-orange-50 border-orange-100 text-orange-600' :
                                            'bg-slate-50 border-slate-100 text-slate-400'
                                        }`}>
                                            {campaign.theme === 'christmas' ? <Gift className="w-10 h-10" /> :
                                             campaign.theme === 'easter' ? <Sparkles className="w-10 h-10" /> :
                                             campaign.theme === 'halloween' ? <Trophy className="w-10 h-10" /> :
                                             <Tag className="w-10 h-10" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-4 mb-3">
                                                <h3 className="text-2xl font-black text-slate-900 serif tracking-tight">{campaign.title}</h3>
                                                {campaign.isActive ? (
                                                    <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm shadow-emerald-500/10">Active</span>
                                                ) : (
                                                    <span className="px-4 py-1.5 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100">Inactive</span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-5">
                                                <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl group/tag hover:bg-white transition-colors">
                                                    <Zap className="w-4 h-4 text-amber-500 group-hover/tag:animate-bounce" />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Coupon:</span>
                                                    <span className="text-xs font-black text-slate-800">{campaign.stripeCouponId}</span>
                                                </div>
                                                <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50/50 border border-indigo-100 rounded-2xl group/tag hover:bg-white transition-colors">
                                                    <Percent className="w-4 h-4 text-indigo-600 group-hover/tag:scale-110 transition-transform" />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Code:</span>
                                                    <span className="text-xs font-black text-indigo-600">{campaign.discountCode || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-[2.5rem] border border-slate-100">
                                        <button 
                                            onClick={() => toggleCampaignStatus(campaign.id, campaign.isActive)}
                                            className={`px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${campaign.isActive ? 'bg-white text-slate-400 hover:text-slate-900 border border-slate-100' : 'bg-slate-900 text-white shadow-xl shadow-slate-900/10'}`}
                                        >
                                            {campaign.isActive ? 'End Campaign' : 'Deploy Now'}
                                        </button>
                                        <button 
                                            onClick={() => toggleBannerStatus(campaign.id, campaign.showBanner)}
                                            className={`w-14 h-14 flex items-center justify-center rounded-[1.5rem] transition-all border-2 group-hover:scale-105 ${campaign.showBanner ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-100 text-slate-300'}`}
                                        >
                                            {campaign.showBanner ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                        </button>
                                        <div className="w-10 h-px bg-slate-200 lg:w-px lg:h-10 mx-2" />
                                        <button 
                                            onClick={() => deleteCampaign(campaign.id)}
                                            className="w-14 h-14 flex items-center justify-center bg-white border border-slate-100 text-slate-300 rounded-[1.5rem] hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                
                                {campaign.showBanner && (
                                    <div className={`p-8 flex items-center justify-between gap-10 relative overflow-hidden transition-all duration-1000 ${
                                        campaign.theme === 'christmas' ? 'bg-rose-600 text-white' :
                                        campaign.theme === 'easter' ? 'bg-yellow-400 text-yellow-950' :
                                        campaign.theme === 'halloween' ? 'bg-orange-600 text-white' :
                                        'bg-slate-900 text-white'
                                    }`}>
                                        <div className="flex items-center gap-6 relative z-10">
                                            <div className="w-12 h-12 rounded-[1.25rem] bg-white/10 flex items-center justify-center backdrop-blur-sm">
                                                <Megaphone className="w-6 h-6 animate-bounce" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-1">Live Broadcast Content</p>
                                                <p className="text-xl font-bold serif tracking-tight leading-none italic">"{campaign.bannerText}"</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-6 h-6 opacity-20 relative z-10" />
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

