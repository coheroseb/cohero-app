
'use client';

import React, { useState, useEffect } from 'react';
import { 
    Globe, 
    Save, 
    Type, 
    Tag, 
    Sparkles, 
    Loader2,
    Eye
} from 'lucide-react';
import { useFirestore, useDoc } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { optimizeSeoAction } from '@/app/actions';

export default function SEOAdminPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const seoRef = firestore ? doc(firestore, 'systemSettings', 'seo') : null;
    const { data: seoData, isLoading } = useDoc(seoRef);

    const [formData, setFormData] = useState({
        siteTitle: '',
        siteDescription: '',
        keywords: '',
        ogImage: '/team_cohero.png',
        indexing: true,
        twitterHandle: '@cohero_is',
        canonicalUrl: 'https://cohero.dk'
    });

    const [isSaving, setIsSaving] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);

    useEffect(() => {
        if (seoData) {
            setFormData({
                siteTitle: seoData.siteTitle || 'Cohéro - Din Digitale Kollega',
                siteDescription: seoData.siteDescription || '',
                keywords: seoData.keywords || '',
                ogImage: seoData.ogImage || '/team_cohero.png',
                indexing: seoData.indexing !== undefined ? seoData.indexing : true,
                twitterHandle: seoData.twitterHandle || '@cohero_is',
                canonicalUrl: seoData.canonicalUrl || 'https://cohero.dk'
            });
        }
    }, [seoData]);

    const handleOptimize = async () => {
        setIsOptimizing(true);
        try {
            const result = await optimizeSeoAction({
                currentTitle: formData.siteTitle,
                currentDescription: formData.siteDescription,
                currentKeywords: formData.keywords
            });
            
            if (result.data) {
                setFormData(prev => ({
                    ...prev,
                    siteTitle: result.data.optimizedTitle,
                    siteDescription: result.data.optimizedDescription,
                    keywords: result.data.optimizedKeywords
                }));
                toast({
                    title: "AI Optimering Gennemført",
                    description: "Dine meta-tags er nu blevet optimeret af Cohéro AI.",
                });
            }
        } catch (e) {
            toast({
                title: "Optimering fejlede",
                description: (e as Error).message,
                variant: "destructive"
            });
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleSave = async () => {
        if (!firestore) return;
        setIsSaving(true);
        try {
            await setDoc(doc(firestore, 'systemSettings', 'seo'), {
                ...formData,
                lastUpdated: serverTimestamp()
            }, { merge: true });
            
            toast({
                title: "SEO Opdateret",
                description: "Dine indstillinger er nu gemt og vil træde i kraft ved næste build.",
            });
        } catch (e) {
            toast({
                title: "Fejl",
                description: "Kunne ikke gemme SEO indstillinger: " + (e as Error).message,
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                        <Globe className="w-4 h-4" />
                        Search Engine Optimization
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 serif tracking-tight">SEO & Meta-Data</h1>
                    <p className="text-lg text-slate-500 font-medium max-w-2xl leading-relaxed italic">
                        Administrer hvordan Cohéro fremstår på Google, Facebook og andre platforme.
                    </p>
                </div>

                <div className="flex gap-4">
                    <button 
                        onClick={handleOptimize}
                        disabled={isOptimizing || isSaving}
                        className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-indigo-100 text-indigo-600 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-50 hover:-translate-y-1 active:scale-95 transition-all shadow-xl shadow-indigo-100/50 disabled:opacity-50 group"
                    >
                        {isOptimizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 group-hover:animate-pulse" />}
                        Optimer med AI
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving || isOptimizing}
                        className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-slate-800 hover:-translate-y-1 active:scale-95 transition-all shadow-2xl shadow-slate-900/20 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Gem Indstillinger
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-1 space-y-8">
                {/* Google Search Preview */}
                <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 overflow-hidden group">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-slate-900 serif flex items-center gap-4">
                            <Eye className="w-6 h-6 text-indigo-600" /> Google Search Preview
                        </h3>
                        <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-full">Simuleret</div>
                    </div>

                    <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 relative group-hover:bg-white transition-colors duration-500">
                         <div className="max-w-xl space-y-1">
                            <p className="text-xs text-slate-400 font-medium mb-1">https://cohero.dk</p>
                            <h4 className="text-xl text-[#1a0dab] font-medium hover:underline cursor-pointer block">{formData.siteTitle || 'Hjem | Cohéro'}</h4>
                            <p className="text-sm text-[#4d5156] leading-relaxed line-clamp-2">
                                {formData.siteDescription || 'Indtast en beskrivelse for at se hvordan den vil se ud i søgeresultaterne på Google...'}
                            </p>
                         </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                        <div className="flex items-center gap-4 mb-2">
                           <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                              <Type className="w-5 h-5" />
                           </div>
                           <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-widest">Primære Meta-Tags</h4>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Meta Title</label>
                                <input 
                                    type="text" 
                                    value={formData.siteTitle}
                                    onChange={(e) => setFormData({...formData, siteTitle: e.target.value})}
                                    placeholder="Cohéro - Din Digitale Kollega"
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 focus:ring-indigo-600/5 outline-none transition-all"
                                />
                                <p className="text-[9px] text-slate-300 font-black uppercase px-1">Længde: {formData.siteTitle.length} tegn</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Meta Description</label>
                                <textarea 
                                    rows={4}
                                    value={formData.siteDescription}
                                    onChange={(e) => setFormData({...formData, siteDescription: e.target.value})}
                                    placeholder="Kort pitch af platformen..."
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 focus:ring-indigo-600/5 outline-none transition-all resize-none"
                                />
                                <p className="text-[9px] text-slate-300 font-black uppercase px-1">Længde: {formData.siteDescription.length} tegn</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                         <div className="flex items-center gap-4 mb-2">
                           <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shadow-sm">
                              <Tag className="w-5 h-5" />
                           </div>
                           <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-widest">Metadata Detaljer</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Keywords (Kommasepareret)</label>
                                <textarea 
                                    rows={3}
                                    value={formData.keywords}
                                    onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                                    placeholder="cohero, socialt arbejde, AI..."
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 focus:ring-indigo-600/5 outline-none transition-all resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <div>
                                    <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Søgemaskine Indeksering</h5>
                                    <p className="text-[9px] font-bold text-slate-400 mt-1">Gør sitet synligt for Google</p>
                                </div>
                                <button 
                                    onClick={() => setFormData({...formData, indexing: !formData.indexing})}
                                    className={`w-14 h-8 rounded-full transition-all flex items-center px-1 ${formData.indexing ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                >
                                    <div className={`w-6 h-6 bg-white rounded-full transition-all ${formData.indexing ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 shadow-sm">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 serif mb-1">Social & Avanceret</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">OpenGraph & Twitter Cards</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">OG Image URL</label>
                            <input 
                                type="text" 
                                value={formData.ogImage}
                                onChange={(e) => setFormData({...formData, ogImage: e.target.value})}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Twitter @Handle</label>
                            <input 
                                type="text" 
                                value={formData.twitterHandle}
                                onChange={(e) => setFormData({...formData, twitterHandle: e.target.value})}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Canonical URL</label>
                            <input 
                                type="text" 
                                value={formData.canonicalUrl}
                                onChange={(e) => setFormData({...formData, canonicalUrl: e.target.value})}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white transition-all outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    <TipCard title="H1 Strategi" desc="Brug kun én H1-overskrift per side for optimal Google-læsning." />
                    <TipCard title="Load-Hastighed" desc="Hold dine billeder under 200KB for at undgå SEO straf." />
                    <TipCard title="Alt-tekster" desc="Husk alt-tekster på alle ikoner og illustrationer i portalen." />
                </div>
            </div>
        </div>
    );
}

function TipCard({ title, desc }: { title: string, desc: string }) {
    return (
        <div className="p-6 bg-slate-900 text-white rounded-[2rem] space-y-2 border border-white/5 relative overflow-hidden group">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{title}</h5>
            <p className="text-[11px] font-medium leading-relaxed opacity-80">{desc}</p>
        </div>
    );
}
