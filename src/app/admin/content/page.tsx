
'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Gavel, Scale, Loader2, Plus, Trash2, Globe, FileText, Tag, Hash, Save, X, Link as LinkIcon, FileCode, Building, Calendar, RefreshCw, Sparkles, FolderSync } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { listInternalDocsAction, processInternalDocAction } from '@/app/actions';

interface LawConfig {
  id: string;
  name: string;
  abbreviation: string;
  xmlUrl: string;
  lbk: string;
  mainLawNumber?: string;
  mainLawDate?: string;
  guidelines?: { title: string; url: string; xmlUrl?: string }[];
  createdAt?: any;
}

const LawManager = () => {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingLawId, setEditingLawId] = useState<string | null>(null);
  
  const [newLaw, setNewLaw] = useState<Omit<LawConfig, 'id'>>({
    name: '',
    abbreviation: '',
    xmlUrl: '',
    lbk: '',
    mainLawNumber: '',
    mainLawDate: '',
    guidelines: []
  });

  const [newGuideline, setNewGuideline] = useState({ title: '', url: '', xmlUrl: '' });

  const lawsQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'laws'), orderBy('name', 'asc')) : null), [firestore]);
  const { data: laws, isLoading } = useCollection<LawConfig>(lawsQuery);

  const handleAddLaw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || isSaving) return;
    
    setIsSaving(true);
    try {
      if (editingLawId) {
        await updateDoc(doc(firestore, 'laws', editingLawId), {
          ...newLaw,
          updatedAt: serverTimestamp()
        });
        toast({ title: "Lov opdateret", description: `${newLaw.name} er blevet opdateret.` });
      } else {
        await addDoc(collection(firestore, 'laws'), {
          ...newLaw,
          createdAt: serverTimestamp()
        });
        toast({ title: "Lov tilføjet", description: `${newLaw.name} er nu tilgængelig i Lovportalen.` });
      }
      resetForm();
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: "Fejl", description: "Kunne ikke gemme loven." });
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

  const handleEditLaw = (law: LawConfig) => {
    setNewLaw({
      name: law.name,
      abbreviation: law.abbreviation,
      xmlUrl: law.xmlUrl,
      lbk: law.lbk,
      mainLawNumber: law.mainLawNumber || '',
      mainLawDate: law.mainLawDate || '',
      guidelines: law.guidelines || []
    });
    setEditingLawId(law.id);
    setIsAdding(true);
  };

  const handleDeleteLaw = async (id: string, name: string) => {
    if (!firestore || !window.confirm(`Er du sikker på du vil slette ${name}?`)) return;
    try {
      await deleteDoc(doc(firestore, 'laws', id));
      toast({ title: "Slettet", description: "Loven er fjernet fra platformen." });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: "Fejl", description: "Kunne ikke slette loven." });
    }
  };

  const addGuideline = () => {
    if (!newGuideline.title.trim() || !newGuideline.url.trim()) return;
    setNewLaw({
      ...newLaw,
      guidelines: [...(newLaw.guidelines || []), { ...newGuideline }]
    });
    setNewGuideline({ title: '', url: '', xmlUrl: '' });
  };

  const removeGuideline = (index: number) => {
    const updated = [...(newLaw.guidelines || [])];
    updated.splice(index, 1);
    setNewLaw({ ...newLaw, guidelines: updated });
  };

  return (
    <section className="bg-white p-10 rounded-[3.5rem] border border-amber-100 shadow-sm">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h3 className="text-xl font-bold text-amber-950 serif flex items-center gap-3"><Scale className="w-5 h-5"/>Lovstyring</h3>
          <p className="text-xs text-slate-400 mt-1">Tilføj og administrér lovgivninger og tilhørende vejledninger.</p>
        </div>
        <Button onClick={() => isAdding ? resetForm() : setIsAdding(true)} variant={isAdding ? "ghost" : "default"}>
          {isAdding ? <X className="w-4 h-4 mr-2"/> : <Plus className="w-4 h-4 mr-2"/>}
          {isAdding ? 'Annuller' : 'Tilføj Lov'}
        </Button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddLaw} className="mb-12 p-8 bg-amber-50/50 rounded-3xl border border-amber-100 animate-ink space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-amber-900 tracking-widest flex items-center gap-2 px-1"><Tag className="w-3 h-3"/> Navn</label>
              <Input placeholder="F.eks. Barnets lov" value={newLaw.name} onChange={e => setNewLaw({...newLaw, name: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-amber-900 tracking-widest flex items-center gap-2 px-1"><Hash className="w-3 h-3"/> Forkortelse</label>
              <Input placeholder="F.eks. BL" value={newLaw.abbreviation} onChange={e => setNewLaw({...newLaw, abbreviation: e.target.value})} required />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-amber-900 tracking-widest flex items-center gap-2 px-1"><Globe className="w-3 h-3"/> XML URL (Retsinformation)</label>
              <Input placeholder="https://www.retsinformation.dk/eli/lta/2025/282/xml" value={newLaw.xmlUrl} onChange={e => setNewLaw({...newLaw, xmlUrl: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-amber-900 tracking-widest flex items-center gap-2 px-1"><FileText className="w-3 h-3"/> LBK-betegnelse</label>
              <Input placeholder="LBK nr 282 af 17/03/2025" value={newLaw.lbk} onChange={e => setNewLaw({...newLaw, lbk: e.target.value})} required />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-amber-900 tracking-widest flex items-center gap-2 px-1"><Building className="w-3 h-3"/> Hovedlov (L-nummer)</label>
              <Input placeholder="F.eks. L 123" value={newLaw.mainLawNumber} onChange={e => setNewLaw({...newLaw, mainLawNumber: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-amber-900 tracking-widest flex items-center gap-2 px-1"><Calendar className="w-3 h-3"/> Dato for Hovedlov</label>
              <Input type="date" value={newLaw.mainLawDate} onChange={e => setNewLaw({...newLaw, mainLawDate: e.target.value})} />
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-amber-100">
            <h4 className="text-sm font-bold text-amber-950">Tilknyttede Vejledninger</h4>
            <div className="grid md:grid-cols-1 gap-4 items-end bg-white p-6 rounded-2xl border border-amber-100 shadow-inner">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Titel</label>
                  <Input placeholder="F.eks. Vejledning til Barnets Lov" value={newGuideline.title} onChange={e => setNewGuideline({...newGuideline, title: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Normal URL (FT.dk/Retsinfo)</label>
                  <Input placeholder="https://..." value={newGuideline.url} onChange={e => setNewGuideline({...newGuideline, url: e.target.value})} />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><FileCode className="w-3 h-3"/> XML URL (Valgfri)</label>
                  <Input placeholder="https://.../xml" value={newGuideline.xmlUrl} onChange={e => setNewGuideline({...newGuideline, xmlUrl: e.target.value})} />
                </div>
                <div className="flex items-end">
                  <Button type="button" variant="secondary" onClick={addGuideline} className="w-full">Tilføj Vejledning til Lov</Button>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              {newLaw.guidelines?.map((g, idx) => (
                <div key={idx} className="flex items-center gap-3 px-4 py-2 bg-white border border-amber-100 rounded-xl text-xs shadow-sm">
                  <div className="flex flex-col">
                    <span className="font-bold text-amber-950">{g.title}</span>
                    {g.xmlUrl && <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-tighter mt-0.5">XML-Visning aktiv</span>}
                  </div>
                  <button type="button" onClick={() => removeGuideline(idx)} className="p-1 text-slate-300 hover:text-rose-600 transition-colors"><X className="w-4 h-4"/></button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 gap-3">
            <Button type="button" variant="ghost" onClick={resetForm}>Annuller</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Save className="w-4 h-4 mr-2"/>}
              {editingLawId ? 'Opdater Lov' : 'Gem Lov'}
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-200" /></div>
      ) : (
        <div className="grid gap-4">
          {laws?.map(law => (
            <div key={law.id} className="flex items-center justify-between p-6 bg-white border border-amber-50 rounded-2xl hover:border-amber-950 transition-colors group">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-900 font-black text-xs uppercase">
                  {law.abbreviation}
                </div>
                <div>
                  <h4 className="font-bold text-amber-950">{law.name}</h4>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">{law.xmlUrl}</p>
                  <div className="flex gap-2 mt-2">
                    {law.mainLawNumber && (
                      <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 flex items-center gap-1">
                        <Building className="w-2.5 h-2.5" /> {law.mainLawNumber} {law.mainLawDate && `(${new Date(law.mainLawDate).toLocaleDateString('da-DK')})`}
                      </span>
                    )}
                    {law.guidelines && law.guidelines.length > 0 && (
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 flex items-center gap-1">
                        <LinkIcon className="w-2.5 h-2.5" /> {law.guidelines.length} Vejledninger
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <Button variant="ghost" size="sm" onClick={() => handleEditLaw(law)}>Rediger</Button>
                <button onClick={() => handleDeleteLaw(law.id, law.name)} className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {laws?.length === 0 && <p className="text-center py-10 text-slate-400 italic">Ingen love tilføjet endnu.</p>}
        </div>
      )}
    </section>
  );
};

const KnowledgeSyncManager = () => {
    const { toast } = useToast();
    const [docs, setDocs] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [syncingFile, setSyncingId] = useState<string | null>(null);

    useEffect(() => {
        listInternalDocsAction().then(setDocs).finally(() => setIsLoading(false));
    }, []);

    const handleSync = async (fileName: string) => {
        setSyncingId(fileName);
        try {
            await processInternalDocAction(fileName);
            toast({
                title: "Viden synkroniseret",
                description: `${fileName} er blevet indlæst og processeret med Gemini Embedding 2.`,
            });
        } catch (e: any) {
            toast({
                variant: 'destructive',
                title: "Fejl",
                description: e.message || "Kunne ikke synkronisere dokumentet.",
            });
        } finally {
            setSyncingId(null);
        }
    };

    return (
        <section className="bg-white p-10 rounded-[3.5rem] border border-amber-100 shadow-sm">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h3 className="text-xl font-bold text-amber-950 serif flex items-center gap-3">
                        <FolderSync className="w-5 h-5 text-indigo-600" />
                        Arkiv-Synkronisering
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Processér dokumenter i arkivet med Gemini Embedding 2 for dyb forståelse.</p>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-200" /></div>
            ) : (
                <div className="grid gap-4">
                    {docs.map(docName => (
                        <div key={docName} className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-indigo-200 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-bold text-slate-700">{docName}</span>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleSync(docName)}
                                disabled={!!syncingFile}
                                className="group-hover:bg-amber-950 group-hover:text-white"
                            >
                                {syncingFile === docName ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Sparkles className="w-4 h-4 mr-2" />}
                                {syncingFile === docName ? 'Indlæser...' : 'Indlæs viden'}
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

const AdminContentPage = () => {
  return (
    <div className="space-y-8 animate-ink">
       <LawManager />
       <KnowledgeSyncManager />

       <section className="bg-white p-10 rounded-[3.5rem] border border-amber-100 shadow-sm">
           <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-xl font-bold text-amber-950 serif flex items-center gap-3"><Gavel className="w-5 h-5"/>Ugens Dilemmaer</h3>
                <p className="text-xs text-slate-400 mt-1">Konfigurér og frigiv AI-genererede dilemmaer.</p>
              </div>
           </div>
           <div className="text-center py-10 text-slate-400 italic">
               <Loader2 className="w-6 h-6 animate-spin mx-auto mb-4" />
               Indlæser dilemma-styring...
           </div>
       </section>
    </div>
  );
};

export default AdminContentPage;
