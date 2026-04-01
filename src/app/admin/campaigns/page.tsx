'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { 
    Tag, 
    Plus, 
    Trash2, 
    CheckCircle2, 
    AlertCircle, 
    Loader2, 
    Megaphone, 
    Calendar, 
    Percent, 
    ExternalLink, 
    Settings2,
    Eye,
    EyeOff,
    Sparkles,
    Gift,
    Zap
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
            alert('Fejl ved oprettelse af kampagne.');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleCampaignStatus = async (id: string, currentStatus: boolean) => {
        if (!firestore) return;
        try {
            await updateDoc(doc(firestore, 'campaigns', id), {
                isActive: !currentStatus
            });
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const toggleBannerStatus = async (id: string, currentStatus: boolean) => {
        if (!firestore) return;
        try {
            await updateDoc(doc(firestore, 'campaigns', id), {
                showBanner: !currentStatus
            });
        } catch (error) {
            console.error("Error updating banner:", error);
        }
    };

    const deleteCampaign = async (id: string) => {
        if (!firestore || !confirm('Er du sikker?')) return;
        try {
            await deleteDoc(doc(firestore, 'campaigns', id));
        } catch (error) {
            console.error("Error deleting campaign:", error);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] p-6 lg:p-12 font-sans selection:bg-amber-200">
            <div className="max-w-6xl mx-auto space-y-12">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-2xl bg-amber-950 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-950/10">
                                <Megaphone className="w-5 h-5" />
                            </div>
                            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight serif">Kampagner & Tilbud</h1>
                        </div>
                        <p className="text-slate-500 font-medium ml-1">Administrer rabatter, tilbudskoder og kampagnebannere.</p>
                    </div>
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-[20px] font-black uppercase text-[12px] tracking-widest shadow-2xl shadow-slate-900/20 active:scale-95 transition-all hover:bg-slate-800"
                    >
                        <Plus className="w-4 h-4" /> Opret Ny Kampagne
                    </button>
                </div>

                {/* Create Modal Overlay */}
                <AnimatePresence>
                    {isCreating && (
                        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden border border-slate-100"
                            >
                                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3"><Plus className="text-amber-600"/> Ny Kampagne</h2>
                                    <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"><Trash2 className="w-5 h-5"/></button>
                                </div>
                                <form onSubmit={handleCreateCampaign} className="p-8 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Titel</label>
                                            <input 
                                                required
                                                type="text" 
                                                value={newCampaign.title}
                                                onChange={e => setNewCampaign({...newCampaign, title: e.target.value})}
                                                placeholder="F.eks. Påske-rabat 🐣"
                                                className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-0 focus:border-amber-500 transition-all font-medium"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Rabatkode (Vises i Banner)</label>
                                            <input 
                                                type="text" 
                                                value={newCampaign.discountCode}
                                                onChange={e => setNewCampaign({...newCampaign, discountCode: e.target.value})}
                                                placeholder="EASTER20"
                                                className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-0 focus:border-amber-500 transition-all font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Stripe Coupon ID</label>
                                        <input 
                                            required
                                            type="text" 
                                            value={newCampaign.stripeCouponId}
                                            onChange={e => setNewCampaign({...newCampaign, stripeCouponId: e.target.value})}
                                            placeholder="cp_1P..."
                                            className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-0 focus:border-amber-500 transition-all font-medium"
                                        />
                                        <p className="text-[10px] text-slate-400 italic px-1 italic">Vigtigt: Skal matche dit Coupon ID i Stripe Dashboard.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Banner Tekst</label>
                                        <textarea 
                                            value={newCampaign.bannerText}
                                            onChange={e => setNewCampaign({...newCampaign, bannerText: e.target.value})}
                                            placeholder="Få 20% rabat på din første måned som Kollega+! Brug koden..."
                                            className="w-full p-6 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-0 focus:border-amber-500 transition-all font-medium h-24 resize-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            type="button"
                                            onClick={() => setNewCampaign({...newCampaign, showBanner: !newCampaign.showBanner})}
                                            className={`h-14 flex items-center justify-center gap-2 rounded-2xl font-bold text-sm transition-all border-2 ${newCampaign.showBanner ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                                        >
                                            {newCampaign.showBanner ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            Vis Banner
                                        </button>
                                        <select 
                                            value={newCampaign.theme}
                                            onChange={e => setNewCampaign({...newCampaign, theme: e.target.value})}
                                            className="h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-0 focus:border-amber-500 transition-all font-bold text-sm"
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
                                            className="flex-1 h-16 bg-slate-900 text-white rounded-[24px] font-black uppercase text-[12px] tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 text-amber-400" />}
                                            Aktivér Kampagne
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setIsCreating(false)}
                                            className="px-8 h-16 bg-slate-100 text-slate-500 rounded-[24px] font-bold text-sm active:scale-95 transition-all"
                                        >
                                            Annuller
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* List Campaigns */}
                <div className="grid grid-cols-1 gap-8">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-amber-950" />
                            <p className="font-black text-xs uppercase tracking-widest text-slate-400">Henter kampagner...</p>
                        </div>
                    ) : campaigns?.length === 0 ? (
                        <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-100">
                             <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Megaphone className="w-8 h-8" />
                             </div>
                             <h3 className="text-xl font-bold text-slate-900">Ingen aktive kampagner</h3>
                             <p className="text-slate-400 mt-2">Opret din første kampagne for at booste konverteringer.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {campaigns?.map((campaign: any) => (
                                <motion.div 
                                    layout
                                    key={campaign.id} 
                                    className={`bg-white rounded-[2.5rem] border transition-all overflow-hidden ${campaign.isActive ? 'border-emerald-100 shadow-xl shadow-emerald-500/5' : 'border-slate-100 opacity-80'}`}
                                >
                                    <div className="p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                        <div className="flex items-start gap-6">
                                            <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center shrink-0 ${
                                                campaign.theme === 'christmas' ? 'bg-rose-50 text-rose-600' :
                                                campaign.theme === 'easter' ? 'bg-yellow-50 text-yellow-600' :
                                                campaign.theme === 'halloween' ? 'bg-purple-50 text-purple-600' :
                                                'bg-slate-50 text-slate-400'
                                            }`}>
                                                {campaign.theme === 'christmas' ? <Gift className="w-8 h-8" /> :
                                                 campaign.theme === 'easter' ? <Sparkles className="w-8 h-8" /> :
                                                 <Tag className="w-8 h-8" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{campaign.title}</h3>
                                                    {campaign.isActive ? (
                                                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-200">Aktiv</span>
                                                    ) : (
                                                        <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200">Inaktiv</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                                                        <span className="text-slate-400 font-medium">Coupon:</span> {campaign.stripeCouponId}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                                        <Percent className="w-3.5 h-3.5 text-blue-500" />
                                                        <span className="text-slate-400 font-medium">Kode:</span> {campaign.discountCode || 'Ingen'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
                                            <button 
                                                onClick={() => toggleCampaignStatus(campaign.id, campaign.isActive)}
                                                className={`px-6 py-3 rounded-2xl font-bold text-xs transition-all ${campaign.isActive ? 'bg-white text-slate-400 hover:text-slate-900' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'}`}
                                            >
                                                {campaign.isActive ? 'Deaktiver' : 'Aktiver'}
                                            </button>
                                            <button 
                                                onClick={() => toggleBannerStatus(campaign.id, campaign.showBanner)}
                                                className={`px-3 py-3 rounded-2xl transition-all border ${campaign.showBanner ? 'bg-amber-100 border-amber-200 text-amber-700' : 'bg-white border-slate-100 text-slate-300'}`}
                                                title={campaign.showBanner ? 'Banner er synligt' : 'Banner er skjult'}
                                            >
                                                {campaign.showBanner ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                            </button>
                                            <div className="w-px h-6 bg-slate-200 mx-1" />
                                            <button 
                                                onClick={() => deleteCampaign(campaign.id)}
                                                className="p-3 bg-rose-50 text-rose-500 rounded-2xl lg:hover:bg-rose-500 lg:hover:text-white transition-all active:scale-95"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {campaign.showBanner && (
                                        <div className={`px-10 py-5 flex items-center justify-between gap-6 ${
                                            campaign.theme === 'christmas' ? 'bg-rose-600 text-white/90' :
                                            campaign.theme === 'easter' ? 'bg-yellow-400 text-yellow-950' :
                                            campaign.theme === 'halloween' ? 'bg-orange-600 text-white' :
                                            'bg-slate-900 text-white/90'
                                        }`}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-2 h-2 rounded-full bg-current animate-pulse shrink-0" />
                                                <p className="text-sm font-bold tracking-wide italic line-clamp-1">"{campaign.bannerText}"</p>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Banner Preview</span>
                                                <Settings2 className="w-4 h-4 opacity-40" />
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
