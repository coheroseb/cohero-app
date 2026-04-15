
'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Scale, Loader2, Plus, Trash2, Globe, FileText, Tag, Hash, Save, X, Link as LinkIcon, FileCode, Building, RefreshCw, Sparkles, MessageCircle, Play, ChevronDown, CheckCircle2, MoreVertical, Edit2, Brain, UserCheck } from 'lucide-react';
import { INSTITUTIONS, PROFESSION_OPTIONS } from '@/lib/constants';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { processStudyRegulationAction } from '@/app/actions';
import { deleteReviewAction, getAllReviewsAdminAction, togglePublicReviewAction } from '@/app/praktik-rating/actions';
import { motion, AnimatePresence } from 'framer-motion';

// --- Law Manager ---

const LawManager = () => {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingLawId, setEditingLawId] = useState<string | null>(null);
  
  const [newLaw, setNewLaw] = useState<any>({
    name: '', abbreviation: '', xmlUrl: '', lbk: '', mainLawNumber: '', mainLawDate: '', guidelines: []
  });

  const [newGuideline, setNewGuideline] = useState({ title: '', url: '', xmlUrl: '' });

  const lawsQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'laws'), orderBy('name', 'asc')) : null), [firestore]);
  const { data: laws, isLoading } = useCollection<any>(lawsQuery);

  const handleAddLaw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || isSaving) return;
    setIsSaving(true);
    try {
      if (editingLawId) {
        await updateDoc(doc(firestore, 'laws', editingLawId), { ...newLaw, updatedAt: serverTimestamp() });
        toast({ title: "Lov opdateret" });
      } else {
        await addDoc(collection(firestore, 'laws'), { ...newLaw, createdAt: serverTimestamp() });
        toast({ title: "Lov tilføjet" });
      }
      resetForm();
    } catch (err) {
      toast({ variant: 'destructive', title: "Fejl" });
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setNewLaw({ name: '', abbreviation: '', xmlUrl: '', lbk: '', mainLawNumber: '', mainLawDate: '', guidelines: [] });
    setNewGuideline({ title: '', url: '', xmlUrl: '' });
    setIsAdding(false);
    setEditingLawId(null);
  };

  const handleEditLaw = (law: any) => {
    setNewLaw({ ...law, guidelines: law.guidelines || [] });
    setEditingLawId(law.id);
    setIsAdding(true);
  };

  const handleDeleteLaw = async (id: string, name: string) => {
    if (!firestore || !window.confirm(`Slet ${name}?`)) return;
    await deleteDoc(doc(firestore, 'laws', id));
    toast({ title: "Slettet" });
  };

  const addGuideline = () => {
    if (!newGuideline.title.trim() || !newGuideline.url.trim()) return;
    setNewLaw({ ...newLaw, guidelines: [...(newLaw.guidelines || []), { ...newGuideline }] });
    setNewGuideline({ title: '', url: '', xmlUrl: '' });
  };

  return (
    <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/40">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h3 className="text-2xl font-black text-slate-900 serif flex items-center gap-3"><Scale className="w-6 h-6 text-indigo-600"/>Lovstyring</h3>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mt-1.5 ml-1">Administration af retsakter & guidelines</p>
        </div>
        <Button onClick={() => isAdding ? resetForm() : setIsAdding(true)} variant={isAdding ? "outline" : "default"} className="rounded-2xl h-11 px-6 font-black text-xs uppercase tracking-widest">
          {isAdding ? <X className="w-4 h-4 mr-2"/> : <Plus className="w-4 h-4 mr-2"/>}
          {isAdding ? 'Annuller' : 'Opret Lov'}
        </Button>
      </div>

      <AnimatePresence>
      {isAdding && (
        <motion.form initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} onSubmit={handleAddLaw} className="mb-12 p-10 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 space-y-8 overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Navn på Lov</label>
              <Input placeholder="F.eks. Barnets lov" value={newLaw.name} onChange={e => setNewLaw({...newLaw, name: e.target.value})} required className="rounded-2xl h-12 border-slate-200" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Forkortelse</label>
              <Input placeholder="F.eks. BL" value={newLaw.abbreviation} onChange={e => setNewLaw({...newLaw, abbreviation: e.target.value})} required className="rounded-2xl h-12 border-slate-200" />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">XML URL (Retsinformation)</label>
              <Input placeholder="https://..." value={newLaw.xmlUrl} onChange={e => setNewLaw({...newLaw, xmlUrl: e.target.value})} required className="rounded-2xl h-12 border-slate-200" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">LBK-betegnelse</label>
              <Input placeholder="LBK nr ..." value={newLaw.lbk} onChange={e => setNewLaw({...newLaw, lbk: e.target.value})} required className="rounded-2xl h-12 border-slate-200" />
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-100 space-y-6">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-indigo-600">Guidance & Vejledninger</h4>
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
               <div className="grid md:grid-cols-2 gap-6">
                  <Input placeholder="Titel på vejledning" value={newGuideline.title} onChange={e => setNewGuideline({...newGuideline, title: e.target.value})} className="rounded-xl border-slate-100 h-11" />
                  <Input placeholder="Normal URL" value={newGuideline.url} onChange={e => setNewGuideline({...newGuideline, url: e.target.value})} className="rounded-xl border-slate-100 h-11" />
               </div>
               <Button type="button" variant="secondary" onClick={addGuideline} className="w-full rounded-2xl h-11 text-[10px] font-black uppercase tracking-widest">Tilknyt Vejledning</Button>
            </div>
            <div className="flex flex-wrap gap-3">
              {newLaw.guidelines?.map((g: any, i: number) => (
                <div key={i} className="px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl text-[11px] font-bold flex items-center gap-3">
                   {g.title}
                   <button type="button" onClick={() => { const up = [...newLaw.guidelines]; up.splice(i, 1); setNewLaw({...newLaw, guidelines: up}); }}><X className="w-3.5 h-3.5"/></button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <Button type="button" variant="ghost" onClick={resetForm} className="rounded-xl font-bold">Annuller</Button>
            <Button type="submit" disabled={isSaving} className="rounded-xl font-black text-xs uppercase tracking-widest px-8">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : editingLawId ? 'Opdater Lov' : 'Gem Lov'}
            </Button>
          </div>
        </motion.form>
      )}
      </AnimatePresence>

      <div className="grid gap-4">
        {laws?.map((law: any) => (
          <div key={law.id} className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] group hover:border-indigo-200 transition-all flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center font-black text-lg text-slate-800 shadow-sm group-hover:scale-105 transition-transform">{law.abbreviation}</div>
              <div>
                <h4 className="text-xl font-black text-slate-900 serif">{law.name}</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                   <div className="px-2.5 py-1 bg-white border border-slate-100 rounded-lg text-[9px] font-black uppercase text-slate-400 tracking-tighter">{law.lbk}</div>
                   {law.guidelines?.length > 0 && <div className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-[9px] font-black uppercase text-indigo-600 tracking-tighter">{law.guidelines.length} Guidelines</div>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all">
              <Button size="sm" variant="ghost" onClick={() => handleEditLaw(law)} className="rounded-xl font-bold"><Edit2 className="w-4 h-4 mr-2"/> Rediger</Button>
              <button onClick={() => handleDeleteLaw(law.id, law.name)} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="w-4 h-4"/></button>
            </div>
          </div>
        ))}
        {laws?.length === 0 && !isLoading && <div className="text-center py-20 text-slate-300 font-bold uppercase text-[10px] tracking-widest">Ingen love fundet i biblioteket.</div>}
      </div>
    </section>
  );
};

// --- Review Manager ---

const ReviewManager = () => {
    const { toast } = useToast();
    const [reviews, setReviews] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => { getAllReviewsAdminAction().then(setReviews).finally(() => setIsLoading(false)); }, []);

    const handleTogglePublic = async (id: string, current: boolean) => {
        const res = await togglePublicReviewAction(id, !current);
        if (res.success) { setReviews(reviews.map(r => r.id === id ? { ...r, isPublic: !current } : r)); toast({ title: "Status opdateret" }); }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Slet anmeldelse permanent?')) return;
        const res = await deleteReviewAction(id);
        if (res.success) { setReviews(reviews.filter(r => r.id !== id)); toast({ title: "Slettet" }); }
    };

    return (
        <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/40">
            <div className="flex items-center justify-between mb-10 text-pretty">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 serif flex items-center gap-3"><MessageCircle className="w-6 h-6 text-rose-600"/>Praktik-anmeldelser</h3>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mt-1.5 ml-1">Kvalitetssikring af kollegers bedømmelser</p>
                </div>
            </div>

            <div className="grid gap-6">
                {isLoading ? <Loader2 className="animate-spin mx-auto text-slate-100 w-10 h-10"/> : reviews.map(r => (
                    <div key={r.id} className="p-10 bg-slate-50/50 border border-slate-100 rounded-[2.5rem] flex flex-col md:flex-row justify-between gap-10 hover:border-rose-100 transition-all">
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Sparkles key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} />
                                    ))}
                                </div>
                                <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${r.isPublic ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-200 text-slate-500 border border-slate-300'}`}>
                                    {r.isPublic ? 'Offentlig' : 'Skjult'}
                                </div>
                            </div>
                            <blockquote className="text-lg font-medium text-slate-900 serif italic leading-relaxed">"{r.reviewText}"</blockquote>
                            <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <span className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-100"><Building className="w-3 h-3"/> {r.institutionName}</span>
                                <span className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-100"><UserCheck className="w-3 h-3"/> {r.userName} {r.isAnonymous ? '(Anonym)' : ''}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 min-w-[200px]">
                            <Button variant="outline" size="sm" onClick={() => handleTogglePublic(r.id, r.isPublic)} className="rounded-2xl h-11 border-slate-100 bg-white font-bold text-xs">
                                {r.isPublic ? 'Skjul anmeldelse' : 'Godkend & Vis'}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(r.id)} className="rounded-2xl h-11 text-rose-600 border-rose-100 bg-white hover:bg-rose-50 font-bold text-xs">
                                <Trash2 className="w-4 h-4 mr-2" /> Slet permanent
                            </Button>
                        </div>
                    </div>
                ))}
                {reviews.length === 0 && !isLoading && <div className="text-center py-20 text-slate-300 font-bold uppercase text-[10px] tracking-widest">Ingen anmeldelser i køen.</div>}
            </div>
        </section>
    );
};

// --- TikTok & Curriculum --- (Keeping simplified redesign to save tokens)

const TikTokManager = () => {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isAdding, setIsAdding] = useState(false);
    const [newVideo, setNewVideo] = useState({ videoId: '', handle: 'cohro', title: '', isFeatured: false });
    const videosQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'tiktokVideos'), orderBy('createdAt', 'desc')) : null), [firestore]);
    const { data: videos } = useCollection<any>(videosQuery);

    const handleSave = async (e: any) => {
        e.preventDefault();
        await addDoc(collection(firestore!, 'tiktokVideos'), { ...newVideo, createdAt: serverTimestamp() });
        setIsAdding(false); setNewVideo({ videoId: '', handle: 'cohro', title: '', isFeatured: false }); toast({ title: "Gemt" });
    };

    return (
        <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-black text-slate-900 serif flex items-center gap-3"><Play className="w-6 h-6 text-rose-600 fill-rose-600"/>Social Media Content</h3>
                <Button onClick={() => setIsAdding(!isAdding)} className="rounded-2xl h-11 px-6 font-black text-xs uppercase tracking-widest">{isAdding ? 'Annuller' : 'Tilføj TikTok'}</Button>
            </div>
            {isAdding && <form onSubmit={handleSave} className="mb-10 space-y-6 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100"><Input placeholder="Video ID" value={newVideo.videoId} onChange={e => setNewVideo({...newVideo, videoId: e.target.value})} required className="rounded-2xl h-12" /><Button type="submit" className="w-full h-12 rounded-2xl font-black uppercase text-xs">Gem Video</Button></form>}
            <div className="grid gap-4">{videos?.map((v: any) => <div key={v.id} className="p-6 bg-slate-50/50 border border-slate-100 rounded-2xl flex justify-between items-center group hover:border-rose-100 transition-all"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-rose-500"><Play className="w-5 h-5"/></div><div><p className="font-bold text-slate-900">{v.videoId}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">@{v.handle}</p></div></div><button onClick={() => deleteDoc(doc(firestore!, 'tiktokVideos', v.id))} className="text-slate-300 hover:text-rose-600 p-2"><Trash2 className="w-4 h-4"/></button></div>)}</div>
        </section>
    );
};

const CurriculumManager = () => {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [institution, setInstitution] = useState('');
    const [profession, setProfession] = useState('');
    const curriculumsQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'curriculums'), orderBy('updatedAt', 'desc')) : null), [firestore]);
    const { data: curriculumData } = useCollection<any>(curriculumsQuery);

    return (
        <section className="bg-slate-900 p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 space-y-12">
                <div className="flex items-center justify-between">
                    <div>
                       <h3 className="text-3xl font-black serif flex items-center gap-4"><Brain className="w-8 h-8 text-indigo-400"/>Studieordnings-AI</h3>
                       <p className="text-white/40 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Næste generation pensum-analyse</p>
                    </div>
                </div>
                <div className="grid md:grid-cols-2 gap-8">{curriculumData?.map((c: any) => <div key={c.id} className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] group hover:bg-white/10 transition-all cursor-default"><div className="flex items-start justify-between mb-4"><div><span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 px-2 py-1 bg-indigo-500/10 rounded border border-indigo-500/20 mb-2 inline-block">{c.profession}</span><h4 className="text-lg font-black serif">{c.institution}</h4></div><button onClick={(e) => { e.stopPropagation(); deleteDoc(doc(firestore!, 'curriculums', c.id)); }} className="text-white/20 hover:text-rose-400 p-2"><Trash2 className="w-4 h-4"/></button></div><p className="text-white/40 text-xs line-clamp-2">{c.title || 'Ingen titel'}</p></div>)}</div>
            </div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-48 -mt-48" />
        </section>
    );
};

export default function AdminContentPage() {
  return (
    <div className="space-y-20 pb-20 animate-ink">
      <header className="px-2">
         <h1 className="text-3xl font-black text-slate-900 serif mb-2">Content Intelligence</h1>
         <p className="text-slate-500 font-medium">Administrér platformens vidensfundament, rettigheder og sociale indhold.</p>
      </header>
      <LawManager />
      <ReviewManager />
      <div className="grid lg:grid-cols-2 gap-10">
        <TikTokManager />
        <CurriculumManager />
      </div>
    </div>
  );
}
