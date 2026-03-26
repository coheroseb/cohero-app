
'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, orderBy } from 'firebase/firestore';
import { Plus, Trash2, Loader2, MessageSquare, Star, Users, Check, X, BarChart, ChevronDown, ChevronUp, PieChart, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Survey {
  id: string;
  title: string;
  description: string;
  type: 'poll' | 'question' | 'assessment';
  targetGroup: 'all' | 'Kollega' | 'Kollega+' | 'Semesterpakken' | 'Kollega++';
  options?: string[];
  isActive: boolean;
  createdAt: { toDate: () => Date };
}

interface Response {
  id: string;
  userId: string;
  response: any;
  createdAt: { toDate: () => Date };
}

const ResponseCounter = ({ surveyId }: { surveyId: string }) => {
  const firestore = useFirestore();
  const responsesQuery = useMemoFirebase(() => (
    firestore ? query(collection(firestore, 'surveys', surveyId, 'responses')) : null
  ), [firestore, surveyId]);
  
  const { data: responses, isLoading } = useCollection<Response>(responsesQuery);

  if (isLoading) return <Loader2 className="w-3 h-3 animate-spin text-slate-300" />;
  
  return (
    <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
      {responses?.length || 0} besvarelser
    </span>
  );
};

const SurveyResults = ({ survey }: { survey: Survey }) => {
  const firestore = useFirestore();
  const responsesQuery = useMemoFirebase(() => (
    firestore ? query(collection(firestore, 'surveys', survey.id, 'responses')) : null
  ), [firestore, survey.id]);
  
  const { data: responses, isLoading } = useCollection<Response>(responsesQuery);

  const stats = useMemo(() => {
    if (!responses || responses.length === 0) return null;

    if (survey.type === 'poll') {
      const counts: Record<string, number> = {};
      survey.options?.forEach(opt => counts[opt] = 0);
      responses.forEach(r => {
        if (counts[r.response] !== undefined) counts[r.response]++;
      });
      return { counts, total: responses.length };
    }

    if (survey.type === 'assessment') {
      const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let sum = 0;
      responses.forEach(r => {
        const val = Number(r.response);
        if (distribution[val] !== undefined) {
          distribution[val]++;
          sum += val;
        }
      });
      return { distribution, average: (sum / responses.length).toFixed(1), total: responses.length };
    }

    return { total: responses.length };
  }, [responses, survey]);

  if (isLoading) return <div className="flex justify-center p-6"><Loader2 className="w-5 h-5 animate-spin text-amber-200"/></div>;
  if (!responses || responses.length === 0) return <div className="p-6 text-center text-xs text-slate-400 italic">Ingen svar modtaget endnu.</div>;

  return (
    <div className="p-8 bg-slate-50/50 border-t border-amber-50 animate-ink">
      {survey.type === 'poll' && stats && (
        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Stemmerfordeling</h4>
          {Object.entries(stats.counts).map(([opt, count]) => {
            const pct = Math.round((count / stats.total) * 100);
            return (
              <div key={opt} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-amber-950">
                  <span>{opt}</span>
                  <span>{count} ({pct}%)</span>
                </div>
                <div className="w-full h-2 bg-white rounded-full border border-amber-100 overflow-hidden shadow-inner">
                  <div className="h-full bg-amber-900 transition-all duration-1000" style={{ width: `${pct}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {survey.type === 'assessment' && stats && (
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="text-center p-6 bg-white rounded-3xl border border-amber-100 shadow-sm">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Gennemsnit</p>
            <div className="text-5xl font-black text-amber-950 serif">{stats.average}</div>
            <div className="flex justify-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map(i => <Star key={i} className={`w-4 h-4 ${i <= Math.round(Number(stats.average)) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />)}
            </div>
          </div>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(star => {
              const count = stats.distribution[star];
              const pct = Math.round((count / stats.total) * 100);
              return (
                <div key={star} className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
                  <span className="w-4 text-right">{star}★</span>
                  <div className="flex-1 h-1.5 bg-white rounded-full overflow-hidden border border-amber-50">
                    <div className="h-full bg-amber-400" style={{ width: `${pct}%` }}></div>
                  </div>
                  <span className="w-8">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {survey.type === 'question' && (
        <div className="space-y-3">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Indsendte svar ({responses.length})</h4>
          <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar space-y-2">
            {responses.map(r => (
              <div key={r.id} className="p-4 bg-white rounded-xl border border-amber-50 text-xs text-slate-600 leading-relaxed shadow-sm italic">
                "{r.response}"
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const AdminSurveysPage = () => {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const surveysQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'surveys'), orderBy('createdAt', 'desc')) : null), [firestore]);
  const { data: surveys, isLoading } = useCollection<Survey>(surveysQuery);

  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedResultsId, setExpandedResultsId] = useState<string | null>(null);
  const [editingSurveyId, setEditingSurveyId] = useState<string | null>(null);
  
  const [newSurvey, setNewSurvey] = useState({
    title: '',
    description: '',
    type: 'poll' as Survey['type'],
    targetGroup: 'all' as Survey['targetGroup'],
    options: ['', ''],
    isActive: true
  });

  const handleAddOption = () => {
    setNewSurvey({ ...newSurvey, options: [...newSurvey.options, ''] });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...newSurvey.options];
    newOptions[index] = value;
    setNewSurvey({ ...newSurvey, options: newOptions });
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = [...newSurvey.options];
    newOptions.splice(index, 1);
    setNewSurvey({ ...newSurvey, options: newOptions });
  };

  const handleEdit = (survey: Survey) => {
    setNewSurvey({
      title: survey.title,
      description: survey.description,
      type: survey.type,
      targetGroup: survey.targetGroup,
      options: survey.options || ['', ''],
      isActive: survey.isActive
    });
    setEditingSurveyId(survey.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingSurveyId(null);
    setNewSurvey({ title: '', description: '', type: 'poll', targetGroup: 'all', options: ['', ''], isActive: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || isSaving) return;

    setIsSaving(true);
    try {
      const surveyData: any = {
        title: newSurvey.title,
        description: newSurvey.description,
        type: newSurvey.type,
        targetGroup: newSurvey.targetGroup,
        isActive: newSurvey.isActive,
      };

      if (newSurvey.type === 'poll') {
        surveyData.options = newSurvey.options.filter(o => o.trim() !== '');
      } else {
        surveyData.options = null;
      }

      if (editingSurveyId) {
        await updateDoc(doc(firestore, 'surveys', editingSurveyId), {
          ...surveyData,
          updatedAt: serverTimestamp()
        });
        toast({ title: "Måling opdateret", description: "Dine ændringer er gemt." });
      } else {
        await addDoc(collection(firestore, 'surveys'), {
          ...surveyData,
          createdAt: serverTimestamp()
        });
        toast({ title: "Måling oprettet", description: "Målingen er nu live for den valgte gruppe." });
      }
      
      handleCancel();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: "Fejl", description: "Kunne ikke gemme målingen." });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async (survey: Survey) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'surveys', survey.id), { isActive: !survey.isActive });
      toast({ title: survey.isActive ? "Deaktiveret" : "Aktiveret" });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!firestore || !window.confirm('Vil du slette denne måling permanent? Alle tilhørende svar vil også blive utilgængelige.')) return;
    try {
      await deleteDoc(doc(firestore, 'surveys', id));
      toast({ title: "Måling slettet" });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: "Fejl", description: "Kunne ikke slette målingen." });
    }
  };

  return (
    <div className="space-y-8 animate-ink">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-amber-950 serif">Bruger-Indsigt</h2>
          <p className="text-slate-500">Opret og analysér målinger til dine brugere.</p>
        </div>
        <Button onClick={isAdding ? handleCancel : () => setIsAdding(true)}>
          {isAdding ? <X className="w-4 h-4 mr-2"/> : <Plus className="w-4 h-4 mr-2"/>}
          {isAdding ? 'Annuller' : 'Ny Måling'}
        </Button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] border border-amber-100 shadow-xl space-y-6 max-w-2xl mx-auto animate-fade-in-up">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-amber-950 serif">{editingSurveyId ? 'Rediger Måling' : 'Opret Ny Måling'}</h3>
            <div>
              <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">Titel</label>
              <Input value={newSurvey.title} onChange={e => setNewSurvey({...newSurvey, title: e.target.value})} placeholder="F.eks. Hvad synes du om den nye Lovportal?" required />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">Beskrivelse</label>
              <Textarea value={newSurvey.description} onChange={e => setNewSurvey({...newSurvey, description: e.target.value})} placeholder="Beskriv formålet med målingen..." required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">Type</label>
                <select value={newSurvey.type} onChange={e => setNewSurvey({...newSurvey, type: e.target.value as any})} className="w-full h-10 border rounded-md px-3 text-sm">
                  <option value="poll">Poll (Valgmuligheder)</option>
                  <option value="question">Åbent Spørgsmål (Tekst)</option>
                  <option value="assessment">Vurdering (1-5 stjerner)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">Målgruppe</label>
                <select value={newSurvey.targetGroup} onChange={e => setNewSurvey({...newSurvey, targetGroup: e.target.value as any})} className="w-full h-10 border rounded-md px-3 text-sm">
                  <option value="all">Alle</option>
                  <option value="Kollega">Kollega (Gratis)</option>
                  <option value="Kollega+">Kollega+</option>
                  <option value="Semesterpakken">Semesterpakken</option>
                  <option value="Kollega++">Kollega++</option>
                </select>
              </div>
            </div>

            {newSurvey.type === 'poll' && (
              <div className="space-y-3 pt-4 border-t">
                <label className="text-xs font-bold uppercase text-slate-400 block">Svarsmuligheder</label>
                {newSurvey.options.map((option, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input value={option} onChange={e => handleOptionChange(idx, e.target.value)} placeholder={`Mulighed ${idx + 1}`} required />
                    {newSurvey.options.length > 2 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveOption(idx)} className="text-slate-300 hover:text-red-500"><X className="w-4 h-4"/></Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={handleAddOption} size="sm" className="w-full">
                  <Plus className="w-4 h-4 mr-2"/> Tilføj mulighed
                </Button>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 gap-3">
            <Button type="button" variant="ghost" onClick={handleCancel}>Annuller</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null}
              {editingSurveyId ? 'Gem ændringer' : 'Publicér Måling'}
            </Button>
          </div>
        </form>
      )}

      <div className="grid gap-6">
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-amber-200"/></div>
        ) : surveys?.map(s => (
          <div key={s.id} className={`bg-white rounded-[2.5rem] border transition-all overflow-hidden ${s.isActive ? 'border-amber-100 shadow-sm' : 'opacity-60 border-slate-200'}`}>
            <div className="p-8">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-700 shadow-inner">
                    {s.type === 'poll' ? <PieChart className="w-6 h-6"/> : s.type === 'question' ? <MessageSquare className="w-6 h-6"/> : <Star className="w-6 h-6"/>}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-amber-950 text-lg">{s.title}</h3>
                        <ResponseCounter surveyId={s.id} />
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded border">{s.targetGroup === 'all' ? 'Alle' : s.targetGroup}</span>
                      <span className="text-[10px] font-black uppercase text-slate-400">{s.createdAt?.toDate().toLocaleDateString('da-DK')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setExpandedResultsId(expandedResultsId === s.id ? null : s.id)} className="h-9 rounded-xl">
                    {expandedResultsId === s.id ? <ChevronUp className="w-4 h-4 mr-2"/> : <BarChart className="w-4 h-4 mr-2"/>}
                    {expandedResultsId === s.id ? 'Skjul svar' : 'Se resultater'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(s)} className="h-9 rounded-xl">
                    <Pencil className="w-4 h-4 mr-2"/> Rediger
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleStatus(s)}>
                    {s.isActive ? <Check className="w-4 h-4 mr-2 text-emerald-500"/> : <X className="w-4 h-4 mr-2 text-slate-400"/>}
                    {s.isActive ? 'Aktiv' : 'Inaktiv'}
                  </Button>
                  <button 
                    onClick={() => handleDelete(s.id)} 
                    className="p-3 text-slate-300 hover:text-rose-600 transition-colors"
                    title="Slet måling permanent"
                  >
                    <Trash2 className="w-5 h-5"/>
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed italic border-l-2 border-amber-100 pl-4">{s.description}</p>
            </div>
            
            {expandedResultsId === s.id && <SurveyResults survey={s} />}
          </div>
        ))}
        {!isLoading && surveys?.length === 0 && <p className="text-center py-20 text-slate-400 italic">Ingen målinger oprettet endnu.</p>}
      </div>
    </div>
  );
};

export default AdminSurveysPage;
