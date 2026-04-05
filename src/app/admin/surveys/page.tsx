
'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, orderBy } from 'firebase/firestore';
import { Plus, Trash2, Loader2, MessageSquare, Star, Users, Check, X, BarChart, ChevronDown, ChevronUp, PieChart, Pencil, Sparkles, Target, Settings2, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Survey {
  id: string;
  title: string;
  description: string;
  type: 'poll' | 'question' | 'assessment';
  targetGroup: 'all' | 'Kollega' | 'Kollega+' | 'Semesterpakken' | 'Kollega+';
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
  if (isLoading) return <div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-indigo-500 animate-spin" />;
  return (
    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100 shadow-sm">
      <Users className="w-3 h-3" /> {responses?.length || 0} participants
    </div>
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
      responses.forEach(r => { if (counts[r.response] !== undefined) counts[r.response]++; });
      return { counts, total: responses.length };
    }
    if (survey.type === 'assessment') {
      const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let sum = 0;
      responses.forEach(r => {
        const val = Number(r.response);
        if (distribution[val] !== undefined) { distribution[val]++; sum += val; }
      });
      return { distribution, average: (sum / responses.length).toFixed(1), total: responses.length };
    }
    return { total: responses.length };
  }, [responses, survey]);

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-slate-100"/></div>;
  if (!responses || responses.length === 0) return (
    <div className="p-12 text-center text-xs text-slate-400 font-bold uppercase tracking-widest italic border-t border-slate-50 bg-slate-50/20">
      Awaiting first response...
    </div>
  );

  return (
    <motion.div 
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="bg-slate-50/50 border-t border-slate-100 overflow-hidden"
    >
      <div className="p-10 space-y-10">
          {survey.type === 'poll' && stats && (
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                      <PieChart className="w-4 h-4" />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Distribution Analysis</h4>
              </div>
              <div className="grid gap-6">
                  {Object.entries(stats.counts).map(([opt, count], idx) => {
                    const pct = Math.round((count / stats.total) * 100);
                    return (
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ delay: idx * 0.1 }}
                        key={opt} 
                        className="space-y-3"
                      >
                        <div className="flex justify-between items-end px-1">
                          <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{opt}</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{count} units ({pct}%)</span>
                        </div>
                        <div className="w-full h-3 bg-white rounded-full border border-slate-100 overflow-hidden shadow-inner p-0.5">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.5, ease: "circOut" }} className="h-full bg-slate-900 rounded-full shadow-sm" />
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            </div>
          )}

          {survey.type === 'assessment' && stats && (
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <section className="text-center p-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Satisfaction Score</p>
                <div className="text-7xl font-black text-slate-900 serif leading-none">{stats.average}</div>
                <div className="flex justify-center gap-2 mt-6">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} className={`w-6 h-6 ${i <= Math.round(Number(stats.average)) ? 'text-amber-400 fill-amber-400 shadow-amber-400/20' : 'text-slate-100'}`} />)}
                </div>
                <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest mt-6">Based on {stats.total} appraisals</p>
              </section>
              <div className="space-y-4">
                {[5, 4, 3, 2, 1].map(star => {
                  const count = stats.distribution[star];
                  const pct = Math.round((count / stats.total) * 100);
                  return (
                    <div key={star} className="flex items-center gap-4 group">
                      <span className="w-10 text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-900 transition-colors">{star} STR</span>
                      <div className="flex-1 h-3 bg-white rounded-full overflow-hidden border border-slate-100 p-0.5 shadow-inner">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full bg-amber-400 rounded-full" />
                      </div>
                      <span className="w-10 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {survey.type === 'question' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                      <MessageSquare className="w-4 h-4" />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Verbatim Feedback ({responses.length})</h4>
              </div>
              <div className="grid gap-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                {responses.map((r, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={r.id} 
                    className="p-8 bg-white rounded-[2rem] border border-slate-100 text-sm text-slate-600 font-medium leading-relaxed italic relative group"
                  >
                    <div className="absolute top-4 right-6 text-[8px] font-black text-slate-200 uppercase tracking-widest group-hover:text-slate-400 transition-colors">{r.createdAt?.toDate().toLocaleDateString('da-DK')}</div>
                    "{r.response}"
                  </motion.div>
                ))}
              </div>
            </div>
          )}
      </div>
    </motion.div>
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
    title: '', description: '', type: 'poll' as Survey['type'], targetGroup: 'all' as Survey['targetGroup'], options: ['', ''], isActive: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || isSaving) return;
    setIsSaving(true);
    try {
      const surveyData: any = {
        title: newSurvey.title, description: newSurvey.description, type: newSurvey.type, targetGroup: newSurvey.targetGroup, isActive: newSurvey.isActive,
      };
      if (newSurvey.type === 'poll') surveyData.options = newSurvey.options.filter(o => o.trim() !== '');
      else surveyData.options = null;

      if (editingSurveyId) {
        await updateDoc(doc(firestore, 'surveys', editingSurveyId), { ...surveyData, updatedAt: serverTimestamp() });
        toast({ title: "Survey Updated" });
      } else {
        await addDoc(collection(firestore, 'surveys'), { ...surveyData, createdAt: serverTimestamp() });
        toast({ title: "Survey Deployed" });
      }
      setIsAdding(false); setEditingSurveyId(null);
      setNewSurvey({ title: '', description: '', type: 'poll', targetGroup: 'all', options: ['', ''], isActive: true });
    } finally { setIsSaving(false); }
  };

  const toggleStatus = async (survey: Survey) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'surveys', survey.id), { isActive: !survey.isActive });
      toast({ title: survey.isActive ? "Deactivated" : "Activated" });
    } catch (e) {}
  };

  const handleDelete = async (id: string) => {
    if (!firestore || !window.confirm('Delete survey and all responses permanently?')) return;
    try {
      await deleteDoc(doc(firestore, 'surveys', id));
      toast({ title: "Survey Removed" });
    } catch (e) {}
  };

  return (
    <div className="space-y-12 animate-ink pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
           <h1 className="text-3xl font-black text-slate-900 serif mb-2">Insight Engine</h1>
           <p className="text-slate-500 font-medium">Orkestrér brugerundersøgelser, polls og akademiske evalueringer.</p>
        </div>
        <button 
          onClick={() => { setIsAdding(!isAdding); if(!isAdding) setEditingSurveyId(null); }}
          className="group relative flex items-center justify-center gap-3 px-8 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-slate-900/20 active:scale-95 transition-all hover:bg-slate-800"
        >
          {isAdding ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />} {isAdding ? 'Close Editor' : 'Create Insight Module'}
        </button>
      </header>

      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleSubmit} 
            className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl space-y-10 max-w-3xl mx-auto relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                      <Pencil className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 serif">{editingSurveyId ? 'Modify Strategy' : 'Define New Inquiry'}</h3>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Konfigurér din dataindsamling</p>
                  </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Headline / Question</label>
                  <Input value={newSurvey.title} onChange={e => setNewSurvey({...newSurvey, title: e.target.value})} placeholder="F.eks. Hvordan oplever du vores nye lov-portal?" className="h-14 font-bold border-slate-100 bg-slate-50 rounded-2xl" required />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Context / Instruction</label>
                  <Textarea value={newSurvey.description} onChange={e => setNewSurvey({...newSurvey, description: e.target.value})} placeholder="Beskriv hvad vi leder efter..." className="min-h-[100px] font-medium border-slate-100 bg-slate-50 rounded-2xl resize-none" required />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Module Type</label>
                    <select value={newSurvey.type} onChange={e => setNewSurvey({...newSurvey, type: e.target.value as any})} className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 text-[10px] font-black uppercase tracking-widest cursor-pointer outline-none">
                      <option value="poll">Poll (Presets)</option>
                      <option value="question">Open Text (Insight)</option>
                      <option value="assessment">Appraisal (1-5 STR)</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Target Dimension</label>
                    <select value={newSurvey.targetGroup} onChange={e => setNewSurvey({...newSurvey, targetGroup: e.target.value as any})} className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 text-[10px] font-black uppercase tracking-widest cursor-pointer outline-none">
                      <option value="all">Global Base</option>
                      <option value="Kollega">Free Tier Only</option>
                      <option value="Kollega+">Premium Alpha</option>
                      <option value="Semesterpakken">Semesterpakken</option>
                      <option value="Kollega+">Ultimate Access</option>
                    </select>
                  </div>
                </div>

                {newSurvey.type === 'poll' && (
                  <div className="space-y-4 pt-8 border-t border-slate-50">
                    <div className="flex items-center justify-between">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Preset Options</label>
                         <button type="button" onClick={() => setNewSurvey({ ...newSurvey, options: [...newSurvey.options, ''] })} className="flex items-center gap-2 text-indigo-600 font-black text-[9px] uppercase tracking-widest hover:underline">
                            <Plus className="w-3 h-3" /> Add Choice
                         </button>
                    </div>
                    {newSurvey.options.map((option, idx) => (
                      <div key={idx} className="flex gap-4">
                        <Input value={option} onChange={e => { const o = [...newSurvey.options]; o[idx] = e.target.value; setNewSurvey({...newSurvey, options: o}); }} placeholder={`Option ${idx + 1}`} className="h-12 bg-slate-50 rounded-xl" required />
                        {newSurvey.options.length > 2 && (
                          <button type="button" onClick={() => { const o = [...newSurvey.options]; o.splice(idx, 1); setNewSurvey({...newSurvey, options: o}); }} className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors"><X className="w-5 h-5"/></button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-8 gap-4 relative z-10">
              <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-[11px] text-slate-300">Abort</Button>
              <Button type="submit" disabled={isSaving} className="bg-slate-900 text-white rounded-[1.5rem] h-16 px-12 font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-slate-900/20 active:scale-95 transition-all">
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : editingSurveyId ? 'Persist Changes' : 'Launch Module'}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid gap-10">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <Loader2 className="w-12 h-12 animate-spin text-slate-100" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Analyzing demographic feed...</p>
          </div>
        ) : surveys?.map((s, idx) => (
          <motion.div 
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={s.id} 
            className={`group bg-white rounded-[3.5rem] border transition-all overflow-hidden relative ${s.isActive ? 'border-slate-100 shadow-sm' : 'opacity-60 border-slate-200 bg-slate-50/20'}`}
          >
            <div className="p-10">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                <div className="flex items-start gap-8">
                  <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 duration-700 ${
                    s.type === 'poll' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 
                    s.type === 'question' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 
                    'bg-amber-50 border-amber-100 text-amber-600'
                  }`}>
                    {s.type === 'poll' ? <PieChart className="w-10 h-10"/> : s.type === 'question' ? <MessageSquare className="w-10 h-10"/> : <Star className="w-10 h-10"/>}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                        <h3 className="font-black text-slate-900 serif text-2xl tracking-tight">{s.title}</h3>
                        <ResponseCounter surveyId={s.id} />
                    </div>
                    <div className="flex flex-wrap items-center gap-5">
                      <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl group/tag hover:bg-white transition-colors">
                        <Target className="w-4 h-4 text-slate-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Target:</span>
                        <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{s.targetGroup}</span>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50/50 border border-indigo-100 rounded-2xl group/tag hover:bg-white transition-colors">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Deployed:</span>
                        <span className="text-xs font-black text-indigo-600">{s.createdAt?.toDate().toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-[2.5rem] border border-slate-100">
                  <button 
                    onClick={() => setExpandedResultsId(expandedResultsId === s.id ? null : s.id)}
                    className={`px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 ${expandedResultsId === s.id ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10' : 'bg-white text-slate-400 hover:text-slate-900 border border-slate-100'}`}
                  >
                    {expandedResultsId === s.id ? 'Collapse Analysis' : 'Expand Data'} {expandedResultsId === s.id ? <ChevronUp className="w-4 h-4" /> : <BarChart className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => {
                        setNewSurvey({ title: s.title, description: s.description, type: s.type, targetGroup: s.targetGroup, options: s.options || ['', ''], isActive: s.isActive });
                        setEditingSurveyId(s.id); setIsAdding(true); window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-14 h-14 flex items-center justify-center bg-white border border-slate-100 text-slate-300 hover:text-slate-900 rounded-[1.5rem] transition-all shadow-sm"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => toggleStatus(s)}
                    className={`w-14 h-14 flex items-center justify-center rounded-[1.5rem] border-2 transition-all shadow-sm ${s.isActive ? 'bg-emerald-50 border-emerald-600/20 text-emerald-600 shadow-xl shadow-emerald-500/5' : 'bg-white border-slate-100 text-slate-300'}`}
                  >
                    {s.isActive ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                  </button>
                  <div className="w-10 h-px bg-slate-200 lg:w-px lg:h-10 mx-2" />
                  <button 
                    onClick={() => handleDelete(s.id)} 
                    className="w-14 h-14 flex items-center justify-center bg-white border border-slate-100 text-slate-300 hover:text-rose-500 hover:border-rose-100 rounded-[1.5rem] transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <p className="mt-8 text-lg font-medium text-slate-500 leading-relaxed italic border-l-4 border-slate-100 pl-8 max-w-4xl">{s.description}</p>
            </div>
            
            <AnimatePresence>
                {expandedResultsId === s.id && <SurveyResults survey={s} />}
            </AnimatePresence>
          </motion.div>
        ))}
        {!isLoading && surveys?.length === 0 && <p className="text-center py-20 text-slate-400 italic">Ingen målinger oprettet endnu.</p>}
      </div>
    </div>
  );
};

export default AdminSurveysPage;

