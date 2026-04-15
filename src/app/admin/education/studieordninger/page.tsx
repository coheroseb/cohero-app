
'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  ChevronRight, 
  Layers, 
  GraduationCap, 
  BookOpen,
  School,
  CalendarDays,
  MoreVertical,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { saveCurriculumAction, deleteCurriculumAction, processStudyRegulationAction } from '@/app/actions';

interface CurriculumModule {
  id: string;
  name: string;
  about?: string;
  description?: string;
  ects?: number;
  learningGoals?: string[];
  examForm?: string;
}

interface Curriculum {
  id: string;
  institution: string;
  profession: string;
  title: string;
  validFrom: string;
  validTo?: string | null;
  type?: 'standard' | 'electives';
  modules: CurriculumModule[];
}

export default function AdminStudieordningerPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const curriculumsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'curriculums'), orderBy('updatedAt', 'desc')) : null),
    [firestore]
  );
  const { data: curriculums, isLoading } = useCollection<Curriculum>(curriculumsQuery);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [activeCurriculum, setActiveCurriculum] = useState<Partial<Curriculum> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isParsingPdf, setIsParsingPdf] = useState(false);

  const handleEdit = (c: Curriculum) => {
    setActiveCurriculum({ ...c });
    setIsEditing(true);
  };

  const handleCreate = () => {
    setActiveCurriculum({
      institution: '',
      profession: 'Socialrådgiver',
      title: '',
      validFrom: new Date().getFullYear().toString(),
      type: 'standard',
      modules: []
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!activeCurriculum?.institution || !activeCurriculum?.title) {
        toast({ title: "Mangler data", description: "Institution og Titel er påkrævet.", variant: 'destructive' });
        return;
    }
    setIsSaving(true);
    try {
        const res = await saveCurriculumAction(activeCurriculum);
        if (res.success) {
            toast({ title: "Gemt", description: "Studieordningen er blevet opdateret." });
            setIsEditing(false);
            setActiveCurriculum(null);
        } else {
            throw new Error(res.message);
        }
    } catch (err: any) {
        toast({ title: "Fejl", description: err.message || "Kunne ikke gemme.", variant: 'destructive' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Er du sikker på at du vil slette studieordningen for ${name}?`)) return;
    try {
        const res = await deleteCurriculumAction(id);
        if (res.success) {
            toast({ title: "Slettet", description: "Studieordningen er fjernet." });
        }
    } catch (err) {
        toast({ title: "Fejl", description: "Kunne ikke slette.", variant: 'destructive' });
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
        toast({ title: "Ugyldig fil", description: "Vælg venligst en PDF-fil.", variant: 'destructive' });
        return;
    }

    setIsParsingPdf(true);
    try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64 = (reader.result as string).split(',')[1];
            const res = await processStudyRegulationAction({
                pdfBase64: base64,
                institution: activeCurriculum?.institution,
                profession: activeCurriculum?.profession
            });
            
            if (res.success && res.data) {
                const aiData = res.data;
                setActiveCurriculum({
                    ...activeCurriculum,
                    title: aiData.title || activeCurriculum?.title,
                    institution: aiData.institution || activeCurriculum?.institution,
                    validFrom: aiData.validFrom || aiData.year || activeCurriculum?.validFrom,
                    modules: aiData.modules || []
                });
                toast({ title: "PDF Analyseret", description: "Studieordningens struktur er blevet indlæst automatisk." });
            } else {
                throw new Error("AI kunne ikke læse filen.");
            }
        };
    } catch (err: any) {
        toast({ title: "Fejl ved PDF", description: err.message || "Kunne ikke behandle PDF.", variant: 'destructive' });
    } finally {
        setIsParsingPdf(false);
    }
  };

  const addModule = () => {
    const modules = [...(activeCurriculum?.modules || [])];
    modules.push({ id: `M${modules.length + 1}`, name: '', ects: 10, learningGoals: [] });
    setActiveCurriculum({ ...activeCurriculum!, modules });
  };

  const removeModule = (idx: number) => {
    const modules = [...(activeCurriculum?.modules || [])];
    modules.splice(idx, 1);
    setActiveCurriculum({ ...activeCurriculum!, modules });
  };

  const updateModule = (idx: number, updates: Partial<CurriculumModule>) => {
    const modules = [...(activeCurriculum?.modules || [])];
    modules[idx] = { ...modules[idx], ...updates };
    setActiveCurriculum({ ...activeCurriculum!, modules });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Henter studieordninger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20 animate-ink">
      <header className="flex items-end justify-between px-2">
        <div>
          <h1 className="text-3xl font-black text-slate-900 serif mb-2">Studieordninger</h1>
          <p className="text-slate-500 font-medium">Administrér de faglige fundamenter for alle uddannelser og institutter.</p>
        </div>
        <Button onClick={handleCreate} className="bg-slate-900 hover:bg-black text-white rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-xl shadow-slate-900/10">
          <Plus className="w-4 h-4" /> Ny Studieordning
        </Button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        {/* List of Curriculums */}
        <div className="xl:col-span-12">
          {!isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {curriculums?.map((c) => (
                <motion.div 
                  layout
                  key={c.id}
                  className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 group relative overflow-hidden"
                >
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform">
                        <Layers className="w-6 h-6" />
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(c)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(c.id, c.institution)} className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-2 block">{c.profession}</span>
                      <h3 className="text-xl font-black text-slate-900 serif mb-2 line-clamp-1">{c.institution}</h3>
                      <p className="text-xs font-medium text-slate-400 line-clamp-2 mb-6">{c.title}</p>
                      
                      <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-3.5 h-3.5 text-slate-300" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.validFrom}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-slate-300" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.modules?.length || 0} Moduler</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 opacity-0 group-hover:opacity-[0.03] rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-1000" />
                </motion.div>
              ))}
              {curriculums?.length === 0 && (
                <div className="col-span-full py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300">
                    <BookOpen className="w-12 h-12 mb-4 opacity-20" />
                    <p className="font-black uppercase tracking-[0.2em] text-[10px]">Ingen studieordninger fundet</p>
                </div>
              )}
            </div>
          ) : (
            /* Editing Area */
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden"
            >
                <div className="p-10 md:p-16 space-y-16">
                    <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <button onClick={() => setIsEditing(false)} className="w-12 h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 serif">Redigér Studieordning</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Konfigurér uddannelsesforløbet</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <input 
                                    type="file" 
                                    accept=".pdf" 
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                                    onChange={handlePdfUpload}
                                    disabled={isParsingPdf}
                                />
                                <Button variant="outline" disabled={isParsingPdf} className="rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-[10px] bg-indigo-50 border-indigo-100 text-indigo-600 shadow-sm hover:bg-indigo-100 transition-all flex items-center gap-2">
                                    {isParsingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                                    Indlæs fra PDF (AI)
                                </Button>
                            </div>
                            <Button variant="ghost" onClick={() => setIsEditing(false)} className="rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-[10px] text-slate-400">Afbryd</Button>
                            <Button onClick={handleSave} disabled={isSaving || isParsingPdf} className="bg-slate-900 hover:bg-black text-white rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Gem Ændringer
                            </Button>
                        </div>
                    </header>

                    {/* Form Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-8">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-3 ml-1">Institution / Skole</label>
                                <input 
                                    type="text" 
                                    placeholder="F.eks. KP, VIA, UCL..." 
                                    value={activeCurriculum?.institution} 
                                    onChange={(e) => setActiveCurriculum({...activeCurriculum!, institution: e.target.value})}
                                    className="w-full h-16 bg-slate-50 border border-slate-100 rounded-3xl px-8 font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-3 ml-1">Uddannelsestitel (Kort)</label>
                                <input 
                                    type="text" 
                                    placeholder="F.eks. Studieordning 2023" 
                                    value={activeCurriculum?.title} 
                                    onChange={(e) => setActiveCurriculum({...activeCurriculum!, title: e.target.value})}
                                    className="w-full h-16 bg-slate-50 border border-slate-100 rounded-3xl px-8 font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none"
                                />
                            </div>
                        </div>
                        <div className="space-y-8">
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-3 ml-1">Profession</label>
                                    <input 
                                        type="text" 
                                        value={activeCurriculum?.profession} 
                                        onChange={(e) => setActiveCurriculum({...activeCurriculum!, profession: e.target.value})}
                                        className="w-full h-16 bg-slate-50 border border-slate-100 rounded-3xl px-8 font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-3 ml-1">Gælder fra (År)</label>
                                    <input 
                                        type="text" 
                                        placeholder="2024"
                                        value={activeCurriculum?.validFrom} 
                                        onChange={(e) => setActiveCurriculum({...activeCurriculum!, validFrom: e.target.value})}
                                        className="w-full h-16 bg-slate-50 border border-slate-100 rounded-3xl px-8 font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-3 ml-1">Type</label>
                                <select 
                                    value={activeCurriculum?.type} 
                                    onChange={(e) => setActiveCurriculum({...activeCurriculum!, type: e.target.value as any})}
                                    className="w-full h-16 bg-slate-50 border border-slate-100 rounded-3xl px-8 font-black uppercase tracking-widest text-[10px] text-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none appearance-none"
                                >
                                    <option value="standard">Standard (Semester-baseret)</option>
                                    <option value="electives">Valgfag / Specialisering</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Modules Editor */}
                    <div className="space-y-8 pt-8 border-t border-slate-50">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-black text-slate-900 serif flex items-center gap-3">
                                <BookOpen className="w-6 h-6 text-indigo-500" /> Moduler
                            </h3>
                            <Button onClick={addModule} variant="outline" className="rounded-xl h-10 px-4 font-black uppercase tracking-widest text-[10px] border-slate-100">
                                <Plus className="w-3 h-3 mr-2" /> Tilføj Modul
                            </Button>
                        </div>

                        <div className="space-y-6">
                            {activeCurriculum?.modules?.map((m, idx) => (
                                <motion.div 
                                    layout
                                    key={idx}
                                    className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6 relative group"
                                >
                                    <div className="absolute -left-3 top-8 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shadow-lg">
                                        {idx + 1}
                                    </div>
                                    <button onClick={() => removeModule(idx)} className="absolute right-6 top-6 p-2 text-slate-200 hover:text-rose-500 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>

                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-2 ml-1">ID</label>
                                            <input 
                                                type="text" 
                                                placeholder="M1"
                                                value={m.id} 
                                                onChange={(e) => updateModule(idx, { id: e.target.value })}
                                                className="w-full h-12 bg-white border border-slate-100 rounded-xl px-4 font-bold text-slate-900"
                                            />
                                        </div>
                                        <div className="md:col-span-7">
                                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-2 ml-1">Navn</label>
                                            <input 
                                                type="text" 
                                                placeholder="F.eks. Modul 1: Det sociale arbejdes fundament" 
                                                value={m.name} 
                                                onChange={(e) => updateModule(idx, { name: e.target.value })}
                                                className="w-full h-12 bg-white border border-slate-100 rounded-xl px-4 font-bold text-slate-900"
                                            />
                                        </div>
                                        <div className="md:col-span-3">
                                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-2 ml-1">ECTS</label>
                                            <input 
                                                type="number" 
                                                value={m.ects} 
                                                onChange={(e) => updateModule(idx, { ects: parseInt(e.target.value) })}
                                                className="w-full h-12 bg-white border border-slate-100 rounded-xl px-4 font-bold text-slate-900"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-2 ml-1">Om modulet (Intro)</label>
                                            <Textarea 
                                                placeholder="En kort intro til hvad modulet handler om..."
                                                value={m.about}
                                                onChange={(e) => updateModule(idx, { about: e.target.value })}
                                                className="min-h-[100px] bg-white border border-slate-100 rounded-2xl p-4 text-xs font-medium"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-2 ml-1">Prøveform</label>
                                            <Textarea 
                                                placeholder="F.eks. Skriftlig semesteropgave, 20-30 s. kombineret med mundtlig prøve..."
                                                value={m.examForm}
                                                onChange={(e) => updateModule(idx, { examForm: e.target.value })}
                                                className="min-h-[100px] bg-white border border-slate-100 rounded-2xl p-4 text-xs font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-2 ml-1">Læringsmål (Ét pr. linje)</label>
                                        <Textarea 
                                            placeholder="Den studerende har viden om...
Den studerende kan anvende...
Den studerende kan vurdere..."
                                            value={m.learningGoals?.join('\n')}
                                            onChange={(e) => updateModule(idx, { learningGoals: e.target.value.split('\n').filter(l => l.trim() !== '') })}
                                            className="min-h-[120px] bg-white border border-slate-100 rounded-2xl p-4 text-xs font-medium"
                                        />
                                    </div>
                                </motion.div>
                            ))}
                            {activeCurriculum?.modules?.length === 0 && (
                                <div className="py-12 bg-white rounded-[2.5rem] border border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-200">Ingen moduler tilføjet endnu</p>
                                    <Button onClick={addModule} variant="ghost" className="mt-4 text-indigo-500 font-black uppercase tracking-widest text-[9px] hover:bg-indigo-50">Klik her for at starte</Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

