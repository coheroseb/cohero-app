'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, CalendarDays, BookOpen, Target, AlertTriangle, Sparkles,
  Activity, Clock, ChevronDown, GraduationCap, Layers, Loader2, Plus,
  RefreshCw, ArrowRight, Flag, Navigation, CheckCircle, Brain, FileText,
  Zap, Trophy, BarChart3, ListOrdered, CheckCircle2, Hash, Award,
  BookMarked, Puzzle, Scale, ChevronRight, Book, Lightbulb, Check
} from 'lucide-react';
import { semesterPrepData, type SemesterPrepData } from '@/lib/semester-data';
import { useApp } from '@/app/provider';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection, query, orderBy, where, limit, onSnapshot, doc, updateDoc,
} from 'firebase/firestore';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from 'use-debounce';
import { calculateStudyStarted, calculateGraduationDate } from '@/lib/education';
import type { SemesterPlan, ModuleExamPrepData } from '@/ai/flows/types';
import { generateModuleExamPrepAction } from '@/app/actions';

// ── Types ────────────────────────────────────────────────────────────────────
interface SavedPlan extends SemesterPlan {
  id: string;
  createdAt: { toDate: () => Date };
  icalUrl: string;
  semesterInfo: string;
}

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
  modules: CurriculumModule[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getSemNum(semester: string): number {
  return parseInt(semester?.match(/\d+/)?.[0] ?? '1');
}

// ── Small shared components ──────────────────────────────────────────────────
function IntensityBar({ value }: { value: number }) {
  const v = value ?? 0;
  const color = v > 7 ? 'bg-rose-500' : v > 4 ? 'bg-amber-400' : 'bg-emerald-400';
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${v * 10}%` }} />
      </div>
      <span className="text-[10px] font-black text-slate-400 shrink-0">{v}/10</span>
    </div>
  );
}

function Tag({ children, color = 'slate' }: { children: React.ReactNode; color?: string }) {
  const map: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return (
    <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${map[color] ?? map.slate}`}>
      {children}
    </span>
  );
}

// ── Upcoming events ──────────────────────────────────────────────────────────
function UpcomingEvents({ plan }: { plan: SavedPlan }) {
  const events = useMemo(() => {
    const now = new Date();
    const flat: any[] = [];
    plan.weeklyBreakdown.forEach(w => w.events.forEach((e: any) => flat.push({ ...e, weekNumber: w.weekNumber })));
    return flat
      .filter(e => new Date(e.startDate) >= now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 7);
  }, [plan]);

  if (!events.length) return (
    <div className="text-center py-10 text-slate-300 font-bold text-sm italic">Ingen kommende begivenheder</div>
  );

  return (
    <div className="space-y-2.5">
      {events.map((e, i) => {
        const d = new Date(e.startDate);
        const isToday = d.toDateString() === new Date().toDateString();
        return (
          <div key={i} className={`flex items-center gap-4 p-3.5 rounded-2xl border transition-all ${isToday ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50/50 border-slate-100 hover:bg-white hover:border-slate-200'}`}>
            <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 border shadow-sm ${isToday ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white text-slate-700 border-slate-100'}`}>
              <span className="text-[7px] font-black uppercase opacity-70">{d.toLocaleDateString('da-DK', { month: 'short' })}</span>
              <span className="text-sm font-black leading-none">{d.getDate()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 truncate">{e.summary}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-slate-400 font-medium">
                  {d.toLocaleDateString('da-DK', { weekday: 'long' })}{e.startTime ? ` · ${e.startTime}` : ''}
                </span>
                {isToday && <span className="px-1.5 py-0.5 bg-indigo-600 text-white text-[8px] font-black rounded-full">I dag</span>}
              </div>
              {e.location && <div className="flex items-center gap-1 mt-0.5"><Navigation className="w-2.5 h-2.5 text-slate-300" /><span className="text-[9px] text-slate-400 truncate">{e.location}</span></div>}
            </div>
            <span className="text-[9px] font-bold text-slate-300 shrink-0">U{e.weekNumber}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Weekly calendar with notes ───────────────────────────────────────────────
function WeeklyCalendar({ plan, activeModule, user, firestore }: { plan: SavedPlan; activeModule: CurriculumModule | null; user: any; firestore: any }) {
  const currentWeekNumber = useMemo(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    return Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  }, []);

  const [expandedWeek, setExpandedWeek] = useState<number | null>(currentWeekNumber);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [debouncedNotes] = useDebounce(notes, 1500);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    const initial: Record<string, string> = {};
    plan.weeklyBreakdown.forEach(w => w.events.forEach((e: any) => { if (e.notes) initial[`${e.summary}-${e.startDate}`] = e.notes; }));
    setNotes(initial);
  }, [plan]);

  useEffect(() => {
    if (!user || !firestore || Object.keys(debouncedNotes).length === 0) return;
    setSaveStatus('saving');
    const updated = plan.weeklyBreakdown.map(w => ({
      ...w,
      events: w.events.map((e: any) => ({ ...e, notes: debouncedNotes[`${e.summary}-${e.startDate}`] || '' })),
    }));
    updateDoc(doc(firestore, 'users', user.uid, 'semesterPlans', plan.id), { weeklyBreakdown: updated })
      .then(() => { setSaveStatus('saved'); setTimeout(() => setSaveStatus('idle'), 2000); })
      .catch(() => setSaveStatus('idle'));
  }, [debouncedNotes]);

  // Learning goals as prompts for note-taking, pulled from studieordning
  const learningGoalTips = activeModule?.learningGoals?.slice(0, 2) ?? [];

  return (
    <div className="space-y-6">
      {/* Studieordning-tips for calender context */}
      {learningGoalTips.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 flex gap-4 items-start">
          <BookOpen className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1.5">Fokuspunkter fra studieordningen</p>
            <div className="space-y-1">
              {learningGoalTips.map((g, i) => (
                <p key={i} className="text-xs font-medium text-blue-800 leading-snug">• {g}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {plan.weeklyBreakdown.map(week => {
        const isCurrent = week.weekNumber === currentWeekNumber;
        const isPast = week.weekNumber < currentWeekNumber;
        const isOpen = expandedWeek === week.weekNumber;
        const intensity = week.intensity ?? 0;

        return (
          <div key={week.weekNumber} className={`rounded-3xl border overflow-hidden transition-all duration-300 ${isCurrent ? 'border-indigo-200 shadow-md shadow-indigo-100/50 bg-indigo-50/20' : isPast ? 'border-slate-100 bg-slate-50/40 opacity-60' : 'border-slate-100 bg-white'}`}>
            <button onClick={() => setExpandedWeek(isOpen ? null : week.weekNumber)} className="w-full flex items-center gap-5 p-5 text-left group">
              <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 font-black transition-all ${isCurrent ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>
                <span className="text-[9px] uppercase opacity-70">Uge</span>
                <span className="text-lg leading-none">{week.weekNumber}</span>
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2">
                  {isCurrent && <span className="px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-black rounded-full">Aktuel</span>}
                  <span className="text-sm font-bold text-slate-700">{week.events.length} {week.events.length === 1 ? 'begivenhed' : 'begivenheder'}</span>
                </div>
                <IntensityBar value={intensity} />
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-300 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="px-5 pb-5 space-y-3 border-t border-slate-100 pt-4">
                    {week.events.length === 0 ? (
                      <div className="text-center py-8 text-slate-300 text-sm italic">Ingen aktiviteter</div>
                    ) : (
                      week.events.map((event: any, i: number) => {
                        const noteKey = `${event.summary}-${event.startDate}`;
                        return (
                          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-start gap-4 mb-3">
                              <div className="w-10 h-10 bg-slate-50 rounded-xl flex flex-col items-center justify-center border border-slate-100 shrink-0">
                                <span className="text-[7px] font-black uppercase opacity-40">{new Date(event.startDate).toLocaleDateString('da-DK', { weekday: 'short' })}</span>
                                <span className="text-sm font-black leading-none">{new Date(event.startDate).getDate()}.</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 leading-snug">{event.summary}</p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1"><Clock className="w-3 h-3" />{event.startTime || 'Heldags'}</span>
                                  {event.location && <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 truncate"><Navigation className="w-3 h-3 shrink-0" />{event.location}</span>}
                                </div>
                              </div>
                            </div>
                            <Textarea
                              placeholder="Egne noter til denne begivenhed (gemt automatisk)…"
                              value={notes[noteKey] || ''}
                              onChange={e => setNotes(prev => ({ ...prev, [noteKey]: e.target.value }))}
                              className="bg-slate-50/50 border-slate-100 text-xs min-h-[40px] focus-visible:ring-indigo-200 resize-none placeholder:italic placeholder:text-slate-200"
                            />
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      <AnimatePresence>
        {saveStatus !== 'idle' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
            <div className={`px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold ${saveStatus === 'saving' ? 'bg-white border border-slate-200 text-slate-600' : 'bg-emerald-500 text-white'}`}>
              {saveStatus === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {saveStatus === 'saving' ? 'Gemmer noter…' : 'Gemt!'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Curriculum deep-dive tab ─────────────────────────────────────────────────
function StudieordningTab({ curriculum, userProfile }: { curriculum: Curriculum | null; userProfile: any }) {
  const [selectedModuleIdx, setSelectedModuleIdx] = useState<number | null>(null);
  const semNum = getSemNum(userProfile?.semester ?? '1');

  if (!curriculum) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
        <Layers className="w-10 h-10 text-slate-200 mx-auto mb-4" />
        <h3 className="text-base font-black text-slate-400">Ingen studieordning fundet</h3>
        <p className="text-sm text-slate-300 mt-2 max-w-xs mx-auto">Administratoren skal uploade studieordningen for din institution og uddannelse.</p>
      </div>
    );
  }

  const activeModule = curriculum.modules?.find(m =>
    m.id?.includes(String(semNum)) || m.name?.toLowerCase().includes(String(semNum))
  ) ?? null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10"><Layers className="w-32 h-32" /></div>
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest">{curriculum.profession}</span>
            <span className="px-3 py-1 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest">{curriculum.institution}</span>
            <span className="px-3 py-1 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest">Gælder fra {curriculum.validFrom}</span>
          </div>
          <h2 className="text-2xl font-black leading-tight">{curriculum.title}</h2>
          <p className="text-blue-200 text-sm font-medium">{curriculum.modules?.length ?? 0} moduler · Din uddannelse for alle 7 semestre</p>
        </div>
      </div>

      {/* Current semester highlight */}
      {activeModule && (
        <div className="bg-white rounded-3xl border-2 border-indigo-200 shadow-md shadow-indigo-100/50 p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Dit nuværende modul</p>
              <h3 className="text-lg font-black text-slate-900">{activeModule.name}</h3>
            </div>
            {activeModule.ects && (
              <span className="ml-auto px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl text-xs font-black">{activeModule.ects} ECTS</span>
            )}
          </div>

          {activeModule.about || activeModule.description ? (
            <p className="text-sm text-slate-600 font-medium leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100">
              {activeModule.about || activeModule.description}
            </p>
          ) : null}

          <div className="grid sm:grid-cols-2 gap-6 pt-2">
            {(activeModule.learningGoals?.length ?? 0) > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Læringsmål
                </p>
                <div className="space-y-2">
                  {activeModule.learningGoals!.map((g, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">{i + 1}</div>
                      <p className="text-xs font-medium text-emerald-900 leading-snug">{g}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeModule.examForm && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" /> Prøveform
                </p>
                <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
                  <p className="text-sm text-amber-900 font-medium italic leading-relaxed">"{activeModule.examForm}"</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* All modules grid */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Alle moduler i din uddannelse</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {curriculum.modules?.map((m, idx) => {
            const isActive = m.id === activeModule?.id;
            const isSelected = selectedModuleIdx === idx;
            const mSemNum = parseInt(m.id?.match(/\d+/)?.[0] ?? '0');
            const isPast = mSemNum > 0 && mSemNum < semNum;
            const isFuture = mSemNum > semNum;

            return (
              <button
                key={idx}
                onClick={() => setSelectedModuleIdx(isSelected ? null : idx)}
                className={`text-left p-6 rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] ${
                  isActive
                    ? 'bg-indigo-50 border-indigo-200 shadow-md ring-1 ring-indigo-200'
                    : isSelected
                    ? 'bg-white border-slate-300 shadow-lg'
                    : isPast
                    ? 'bg-slate-50/60 border-slate-100 opacity-60'
                    : 'bg-white border-slate-100'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {m.id || (idx + 1)}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {m.ects && <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">{m.ects} ECTS</span>}
                    {isActive && <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Aktuel</span>}
                    {isPast && <span className="text-[8px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Gennemført</span>}
                  </div>
                </div>
                <h4 className="text-sm font-black text-slate-900 leading-tight mb-1">{m.name}</h4>
                {isSelected && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                    {m.about || m.description ? (
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">{m.about || m.description}</p>
                    ) : null}
                    {(m.learningGoals?.length ?? 0) > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Læringsmål</p>
                        {m.learningGoals!.slice(0, 3).map((g, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-slate-600 leading-snug">{g}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {m.examForm && (
                      <p className="text-[10px] italic text-slate-500 bg-amber-50 p-2.5 rounded-xl border border-amber-100">"{m.examForm}"</p>
                    )}
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── AI-Analyse tab (curriculum-enriched) ────────────────────────────────────
function AnalyseTab({ plan, activeModule }: { plan: SavedPlan; activeModule: CurriculumModule | null }) {
  return (
    <div className="space-y-6">
      {/* Studieordning + AI tips combined */}
      {activeModule && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-100">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Studieordning: {activeModule.name}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Dit faglige fundament dette semester</p>
            </div>
          </div>

          {activeModule.learningGoals && activeModule.learningGoals.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-4">
              {activeModule.learningGoals.map((goal, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center text-white text-[9px] font-black shrink-0">{i + 1}</div>
                  <p className="text-xs font-medium text-blue-900 leading-snug">{goal}</p>
                </div>
              ))}
            </div>
          )}

          {activeModule.examForm && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-start gap-4">
              <Trophy className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Prøveform</p>
                <p className="text-sm text-amber-900 font-medium italic">"{activeModule.examForm}"</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI study tips */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-100">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">AI-analyse af dit semester</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Baseret på din kalender</p>
          </div>
        </div>
        <blockquote className="bg-amber-50 rounded-2xl border border-amber-100 p-6 italic text-sm text-slate-700 font-medium leading-relaxed">
          "{plan.studyTips}"
        </blockquote>

        {/* How studieordning connects to calendar */}
        {activeModule && plan.mainSubjects && (
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kernekurser fundet i din kalender</p>
            <div className="flex flex-wrap gap-2">
              {plan.mainSubjects.map((s: string, i: number) => (
                <span key={i} className="px-4 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl border border-blue-100">{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Deadline clusters */}
      {(plan.deadlineClusters?.length ?? 0) > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 border border-rose-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-slate-900">Kritiske perioder i semesteret</h3>
          </div>
          <div className="space-y-3">
            {plan.deadlineClusters?.map((cluster: any, i: number) => (
              <div key={i} className="bg-rose-50 border border-rose-100 rounded-2xl p-5 flex items-start gap-4">
                <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-rose-500 shrink-0 shadow-sm border border-rose-100">
                  <Flag className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-black text-rose-900">{cluster.title}</p>
                    <span className="text-[9px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-black">
                      Uge {Array.isArray(cluster.weeks) ? cluster.weeks.join(', ') : cluster.weeks}
                    </span>
                  </div>
                  <p className="text-xs text-rose-800/70 font-medium leading-snug">{cluster.description}</p>

                  {/* Link to relevant learning goal if possible */}
                  {activeModule?.examForm && (
                    <p className="text-[10px] text-rose-600 mt-2 font-bold">Prøveform: {activeModule.examForm}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exam periods */}
      {(plan.keyDates?.examPeriods?.length ?? 0) > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-100">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-slate-900">Eksamensperioder</h3>
          </div>
          <div className="space-y-2">
            {plan.keyDates!.examPeriods.map((ep: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Flag className="w-4 h-4 text-emerald-400 shrink-0" />
                  <p className="text-sm font-bold text-slate-800">{ep.description || ep.title || 'Eksamen'}</p>
                </div>
                <p className="text-xs font-black text-emerald-600 shrink-0 ml-3">
                  {ep.startDate ? new Date(ep.startDate).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' }) : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Eksamen Tab ───────────────────────────────────────────────────────────────
function EksamenTab({ currentSemester, curriculum }: { currentSemester: string; curriculum: Curriculum | null }) {
  const [selectedModuleIdx, setSelectedModuleIdx] = useState<number>(() => {
    if (!curriculum?.modules) return getSemNum(currentSemester) - 1;
    const semNum = getSemNum(currentSemester);
    const idx = curriculum.modules.findIndex(m => {
        const id = m.id?.toLowerCase() || '';
        const name = m.name?.toLowerCase() || '';
        return id.includes(String(semNum)) || name.includes(String(semNum));
    });
    return idx !== -1 ? idx : 0;
  });

  const modules = curriculum?.modules || [];
  const activeModule = modules[selectedModuleIdx] || null;
  
  // Try to find supplementary prep data based on semester number in module ID/name
  const matchedSemNum = activeModule ? (parseInt(activeModule.id?.match(/\d+/)?.[0] || activeModule.name?.match(/\d+/)?.[0] || '0')) : (selectedModuleIdx + 1);
  const prepData = semesterPrepData[matchedSemNum];

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [aiData, setAiData] = useState<ModuleExamPrepData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Reset AI data when selector changes
  useEffect(() => {
    setAiData(null);
  }, [selectedModuleIdx]);

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const res = await generateModuleExamPrepAction({
        moduleName: activeModule?.name || prepData?.title || `Modul ${selectedModuleIdx + 1}`,
        learningGoals: activeModule?.learningGoals || prepData?.learningGoals || [],
        examForm: activeModule?.examForm,
      });
      setAiData(res.data);
      toast({
        title: "AI-Motor Aktiveret",
        description: "Vi har fundet nye begreber, modeller og lovgivning til dig.",
      });
    } catch (e) {
      toast({
        title: "Fejl",
        description: "Kunne ikke generere AI-indsigt lige nu. Prøv igen.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ── Control Center ─────────────────────────────────────────────────── */}
      <div className="relative z-[100] bg-white/40 backdrop-blur-md border border-white/20 p-5 rounded-[2.5rem] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl shadow-slate-200/50">
        <div className="space-y-1 ml-2">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Eksamens-Forberedelse</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em]">Studieordning & AI Indsigt</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {/* Dropdown */}
          <div className="relative z-[101] w-full sm:w-[400px] lg:w-[480px]">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-6 flex items-center justify-between shadow-sm hover:border-indigo-200 hover:shadow-md transition-all active:scale-[0.98] group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                   <Layers className="w-4 h-4" />
                </div>
                <span className="text-sm font-black text-slate-900 truncate pr-2">
                  {activeModule 
                    ? `${activeModule.id || selectedModuleIdx + 1}. ${activeModule.name?.split(':')[0]}` 
                    : `${selectedModuleIdx + 1}. Semester`
                  }
                </span>
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-300 transition-transform duration-300 shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    onClick={() => setIsDropdownOpen(false)}
                    className="fixed inset-0 z-[102]"
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-white/20 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[103] overflow-hidden max-h-[350px] overflow-y-auto no-scrollbar scroll-smooth"
                  >
                    <div className="p-2">
                      {(modules.length > 0 ? modules : [1, 2, 3, 4, 5, 6, 7]).map((m, idx) => {
                        const isSelected = selectedModuleIdx === idx;
                        const name = typeof m === 'number' ? `${m}. Semester` : `${m.id || idx + 1}. ${m.name}`;
                        
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              setSelectedModuleIdx(idx);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-5 py-4 rounded-xl text-left transition-all mb-1 ${
                              isSelected 
                                ? 'bg-slate-900 text-white shadow-lg' 
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span className={`text-[11px] font-black uppercase tracking-tight truncate pr-4 ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                              {name}
                            </span>
                            {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* AI Trigger */}
          {!aiData && (
            <button
              onClick={handleGenerateAI}
              disabled={isGenerating || isDropdownOpen}
              className="h-14 px-8 bg-indigo-600 text-white rounded-2xl flex items-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 disabled:opacity-50 group relative overflow-hidden active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              )}
              <span className="text-[11px] font-black uppercase tracking-widest relative z-10 whitespace-nowrap">
                {isGenerating ? 'Tænker...' : 'Få AI Indsigt'}
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="relative z-0 grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Focus & Learning Goals */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-[3rem] p-8 sm:p-12 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.04] transition-opacity">
              <BookOpen className="w-64 h-64" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 rotate-3 group-hover:rotate-0 transition-transform">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight max-w-lg">
                    {activeModule?.name || prepData?.title || 'Modul Oversigt'}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest">Studieordning</span>
                    {aiData && <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" /> AI Udvidet</span>}
                  </div>
                </div>
              </div>

              {(activeModule?.about || activeModule?.description || prepData?.focus) && (
                <div className="bg-slate-900/5 backdrop-blur-sm border border-slate-900/5 p-8 rounded-[2.5rem] mb-10">
                  <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
                    "{activeModule?.about || activeModule?.description || prepData?.focus}"
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 mb-4">Centrale Læringsmål</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  {(activeModule?.learningGoals || prepData?.learningGoals || []).map((goal, i) => (
                    <div key={i} className="flex gap-4 p-6 bg-white/40 border border-white hover:bg-white hover:shadow-lg transition-all rounded-[2rem] group/goal">
                      <div className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 group-hover/goal:bg-indigo-600 group-hover/goal:text-white transition-all">
                        {i + 1}
                      </div>
                      <p className="text-xs font-bold text-slate-600 leading-snug pt-1">{goal}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Suggestions Section (Concepts & Models) */}
          {(prepData?.concepts || prepData?.models || aiData) && (
            <div className="grid sm:grid-cols-2 gap-8">
              {/* Concepts & Theory */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Teori & Begreber</h4>
                  <div className="h-[1px] flex-1 bg-slate-100 mx-4"></div>
                </div>
                
                <div className="space-y-4">
                  {prepData?.concepts?.map((c, i) => (
                    <div key={`static-c-${i}`} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                      <div className="absolute top-0 left-0 w-2 h-full bg-indigo-50 group-hover:w-3 transition-all"></div>
                      <h5 className="text-sm font-black text-slate-900 mb-2 truncate pl-2">{c.name}</h5>
                      <p className="text-[11px] font-medium text-slate-500 leading-relaxed pl-2">{c.description}</p>
                    </div>
                  ))}
                  
                  {aiData?.concepts?.map((c, i) => (
                    <motion.div 
                      key={`ai-c-${i}`}
                      initial={{ opacity: 0, scale: 0.95 }} 
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-indigo-600 p-8 rounded-[2rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden group hover:-translate-y-1 transition-all"
                    >
                      <div className="absolute top-0 right-0 p-6 opacity-20 rotate-12 group-hover:rotate-0 transition-transform">
                         <Sparkles className="w-12 h-12" />
                      </div>
                      <h5 className="text-sm font-black mb-3 relative z-10 flex items-center gap-2">
                         {c.name}
                      </h5>
                      <p className="text-[11px] font-bold text-indigo-100/90 leading-relaxed relative z-10 mb-4">{c.explanation}</p>
                      <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl relative z-10 border border-white/10">
                         <p className="text-[9px] font-black uppercase text-indigo-200 mb-1">Eksamens relevans</p>
                         <p className="text-[10px] font-bold text-white leading-snug">{c.relevance}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Tools & Models */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Modeller & Værktøjer</h4>
                  <div className="h-[1px] flex-1 bg-slate-100 mx-4"></div>
                </div>

                <div className="space-y-4">
                  {prepData?.models?.map((m, i) => (
                    <div key={`static-m-${i}`} className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-2xl shadow-slate-200 relative overflow-hidden group active:scale-95 transition-all">
                      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:scale-125 transition-transform"></div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                           <Puzzle className="w-4 h-4 text-indigo-400" />
                        </div>
                        <h5 className="text-sm font-black tracking-tight">{m.name}</h5>
                      </div>
                      <p className="text-[11px] font-bold text-slate-400 leading-relaxed">{m.description}</p>
                    </div>
                  ))}

                  {aiData?.models?.map((m, i) => (
                    <motion.div 
                      key={`ai-m-${i}`}
                      initial={{ opacity: 0, x: 10 }} 
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white p-8 rounded-[2rem] border-2 border-indigo-100/50 shadow-lg relative group hover:border-indigo-600 transition-all"
                    >
                      <h5 className="text-sm font-black text-indigo-900 mb-3 flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>
                         {m.name}
                      </h5>
                      <p className="text-[11px] font-medium text-slate-500 leading-relaxed mb-6">{m.explanation}</p>
                      <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl w-fit">
                         <Sparkles className="w-3 h-3 text-indigo-400" />
                         <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{m.usage?.split(' ')[0]} Fokus</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* AI Legislation Section */}
          {aiData && (
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="space-y-6 pt-4"
            >
              <div className="flex items-center justify-between px-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Lovgivnings-kontekst</h4>
                <div className="h-[1px] flex-1 bg-slate-100 mx-4"></div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                {aiData.legislation.map((law, i) => (
                  <div key={i} className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all duration-500 group">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-slate-50 text-slate-900 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all">
                         <Scale className="w-6 h-6" />
                      </div>
                      <div>
                        <h5 className="text-sm font-black text-slate-900 max-w-[200px] truncate">{law.title}</h5>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Lov-fundament</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {law.paragraphs.map((p, pi) => (
                        <div key={pi} className="px-4 py-2 bg-indigo-50/50 text-indigo-600 rounded-xl text-[10px] font-black border border-indigo-100/50">
                          {p}
                        </div>
                      ))}
                    </div>
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100/50 relative overflow-hidden">
                      <div className="absolute bottom-0 right-0 p-4 opacity-5">
                         <FileText className="w-12 h-12" />
                      </div>
                      <p className="text-[11px] font-bold text-slate-600 leading-relaxed relative z-10">
                        {law.relevance}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column: Exam Tips & Preparation */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-amber-500 rounded-[3rem] p-10 text-white shadow-2xl shadow-amber-100 relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-black tracking-tight leading-tight uppercase">Eksamens-Guide</h3>
              </div>

              {activeModule?.examForm && (
                  <div className="mb-10 p-6 bg-white/15 backdrop-blur-md rounded-[2rem] border border-white/20">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">Officiel Prøveform</p>
                      <p className="text-sm font-black text-white leading-snug">{activeModule.examForm}</p>
                  </div>
              )}
              
              <ul className="space-y-8">
                {(prepData?.examTips || ["Forbered din case grundigt.", "Læs op på de juridiske rammer.", "Øv dig i tværfaglig formidling."]).map((tip, i) => (
                  <li key={i} className="flex gap-4 group/tip">
                    <div className="w-6 h-6 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5 group-hover/tip:bg-white group-hover/tip:scale-110 transition-all">
                      <Check className="w-3 h-3 text-white group-hover/tip:text-amber-500" />
                    </div>
                    <p className="text-xs font-black text-white/90 leading-relaxed pt-0.5">{tip}</p>
                  </li>
                ))}
              </ul>

              <div className="mt-12 p-6 bg-slate-900/40 backdrop-blur-xl rounded-[2rem] border border-white/5">
                 <p className="text-[9px] font-black uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-2">
                   <Lightbulb className="w-4 h-4" /> Pro-tip til studiet
                 </p>
                 <p className="text-[11px] text-white/70 font-bold leading-relaxed italic">
                   "Husk at din eksamen altid handler om at demonstrere din evne til at omsætte teori til praksis. Brug din case aktivt!"
                 </p>
              </div>
            </div>
          </div>

          <Link href="/exam-architect">
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white group cursor-pointer hover:bg-black transition-all shadow-2xl shadow-slate-300 overflow-hidden relative">
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-600/30 rounded-full blur-3xl group-hover:scale-150 transition-all duration-1000"></div>
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md group-hover:scale-110 transition-transform">
                  <Zap className="w-8 h-8 text-indigo-400" />
                </div>
                <h4 className="text-lg font-black uppercase tracking-widest mb-3">Eksamens-Arkitekten</h4>
                <p className="text-xs text-slate-400 font-bold leading-relaxed mb-8 max-w-[200px]">
                  Tag dine AI-noter videre og byg din komplette opgave-struktur her.
                </p>
                <div className="w-full py-4 bg-indigo-600 text-white text-xs font-black rounded-2xl uppercase tracking-widest flex items-center justify-center gap-3 group-hover:bg-indigo-500 transition-all">
                  Åbn Arkitekten <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="text-lg font-black text-slate-900 leading-tight truncate">{value}</p>
        {sub && <p className="text-[10px] text-slate-400 font-medium">{sub}</p>}
      </div>
    </div>
  );
}

// ── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overblik', label: 'Overblik', icon: BarChart3 },
  { id: 'kalender', label: 'Kalender', icon: CalendarDays },
  { id: 'eksamen', label: 'Eksamen', icon: GraduationCap },
  { id: 'studieordning', label: 'Studieordning', icon: Layers },
  { id: 'analyse', label: 'AI-Analyse', icon: Brain },
] as const;
type TabId = typeof TABS[number]['id'];

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MitSemesterPage() {
  const { user, isUserLoading, userProfile } = useApp();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<TabId>('overblik');
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  useEffect(() => {
    if (!isUserLoading && !user) router.replace('/');
  }, [user, isUserLoading, router]);

  // Latest semester plan
  useEffect(() => {
    if (!user || !firestore) return;
    const q = query(collection(firestore, 'users', user.uid, 'semesterPlans'), orderBy('createdAt', 'desc'), limit(1));
    const unsub = onSnapshot(q, snap => {
      setPlans(snap.docs.map(d => ({ id: d.id, ...d.data() } as SavedPlan)));
      setPlansLoading(false);
    }, () => setPlansLoading(false));
    return unsub;
  }, [user, firestore]);

  // Curriculum data from Firestore — query only on profession so institution naming differences don't block results
  const curriculumsQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile?.profession) return null;
    return query(
      collection(firestore, 'curriculums'),
      where('profession', '==', userProfile.profession)
    );
  }, [firestore, userProfile?.profession]);

  const { data: curriculumsRaw } = useCollection<any>(curriculumsQuery);

  // Find the best matching curriculum for THIS specific institution
  const curriculum = useMemo((): Curriculum | null => {
    if (!curriculumsRaw || curriculumsRaw.length === 0) return null;

    const userProfileInstitution = userProfile?.institution || '';
    const userInst = userProfileInstitution.toLowerCase().trim();
    const studyStarted = userProfile?.studyStarted;

    // Helper to normalize institution names for better matching
    // Ignores prefixes like 'professionshøjskolen' and 'university college'
    const normalize = (s: string) => s.toLowerCase()
      .replace(/professionshøjskolen\s+/g, '')
      .replace(/university college\s+/g, '')
      .trim();

    const normalizedUserInst = normalize(userInst);

    // 1. Filter to ONLY curriculums from this institution (using robust matching)
    const instMatches = curriculumsRaw.filter((c: any) => {
      const cInstRaw = c.institution || '';
      const cInst = cInstRaw.toLowerCase().trim();
      const nInst = normalize(cInst);
      
      // Try exact, normalized, or substring matches
      return (
        cInst === userInst || 
        nInst === normalizedUserInst || 
        (normalizedUserInst.length > 3 && (cInst.includes(normalizedUserInst) || nInst.includes(normalizedUserInst))) ||
        (nInst.length > 3 && normalizedUserInst.includes(nInst))
      );
    });

    if (instMatches.length === 0) return null;

    // 2. Among institution matches, find the one that fits the study start date
    if (studyStarted) {
      const dateMatch = instMatches.find((c: any) => {
        const afterFrom = !c.validFrom || studyStarted >= c.validFrom;
        const beforeTo = !c.validTo || studyStarted < c.validTo;
        return afterFrom && beforeTo;
      });
      if (dateMatch) return dateMatch;
    }

    // 3. Fallback to the first one from specifically this institution
    return instMatches[0];
  }, [curriculumsRaw, userProfile?.studyStarted, userProfile?.institution]);

  // Active module for current semester
  const activeModule = useMemo((): CurriculumModule | null => {
    if (!curriculum || !userProfile?.semester) return null;
    const semNum = getSemNum(userProfile.semester);
    const semStr = String(semNum);
    // Try various matching patterns: id contains the number, name contains it, etc.
    return curriculum.modules?.find(m => {
      const id = m.id?.toLowerCase() ?? '';
      const name = m.name?.toLowerCase() ?? '';
      return (
        id.includes(semStr) ||
        name.includes(semStr) ||
        id.includes(`s${semStr}`) ||
        name.includes(`semester ${semStr}`) ||
        name.includes(`modul ${semStr}`)
      );
    }) ?? curriculum.modules?.[semNum - 1] ?? null; // final fallback: index-based
  }, [curriculum, userProfile?.semester]);

  if (isUserLoading || !user || userProfile === undefined) return <AuthLoadingScreen />;

  const latestPlan = plans[0] ?? null;
  const semNum = getSemNum(userProfile?.semester ?? '1');
  const studyStarted = userProfile?.studyStarted || calculateStudyStarted(userProfile?.semester || '1');
  const gradDate = calculateGraduationDate(studyStarted);

  const stats = latestPlan ? {
    weeks: latestPlan.weeklyBreakdown.length,
    exams: latestPlan.keyDates?.examPeriods?.length ?? 0,
    deadlines: latestPlan.keyDates?.projectDeadlines?.length ?? 0,
    maxIntensity: Math.max(...latestPlan.weeklyBreakdown.map(w => w.intensity ?? 0)),
    totalEvents: latestPlan.weeklyBreakdown.reduce((acc, w) => acc + w.events.length, 0),
  } : null;

  const milestones = [1,2,3,4,5,6,7];

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-2xl border-b border-slate-200/60">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 h-20 flex items-center gap-6">
          <Link href="/portal" className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-none tracking-tight">Mit Semester</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              {userProfile?.semester ?? '…'} · {userProfile?.profession ?? ''}
              {curriculum && <span className="text-emerald-500 ml-2">· Studieordning indlæst</span>}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {latestPlan ? (
              <Link href="/semester-planlaegger">
                <Button size="sm" variant="outline" className="h-9 rounded-xl border-slate-200 text-xs font-bold hidden sm:flex">
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Opdater plan
                </Button>
              </Link>
            ) : (
              <Link href="/semester-planlaegger">
                <Button size="sm" className="h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black">
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Importér Kalender
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 sm:px-8 mt-10 space-y-8">

        {/* ── Profile hero ── */}
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Study progress */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5"><GraduationCap className="w-40 h-40" /></div>
            <div className="relative z-10 space-y-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Studieforløb</p>
                <h2 className="text-3xl font-black">{userProfile?.semester || '?. semester'}</h2>
                <p className="text-slate-400 font-medium mt-1 text-sm">{userProfile?.profession} · {userProfile?.institution}</p>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <span>Semesterforløb</span>
                  <span className="text-indigo-400">{semNum}/7 semestre</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-indigo-500 rounded-full" initial={{ width: 0 }} animate={{ width: `${(semNum / 7) * 100}%` }} transition={{ duration: 1.2, ease: 'easeOut' }} />
                </div>
                <div className="flex items-center justify-between">
                  {milestones.map(m => (
                    <div key={m} className="flex flex-col items-center gap-1">
                      <div className={`w-2 h-2 rounded-full transition-colors ${m <= semNum ? 'bg-indigo-400' : 'bg-slate-700'}`} />
                      {(m === 1 || m === 4 || m === 7) && <span className="text-[7px] font-bold text-slate-600 uppercase">{m === 1 ? 'Start' : m === 4 ? 'Praktik' : 'Afgang'}</span>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/5">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Studiestart</p>
                  <p className="text-sm font-bold text-slate-300">{new Date(studyStarted).toLocaleDateString('da-DK', { month: 'long', year: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Forventet afgang</p>
                  <p className="text-sm font-bold text-slate-300">{new Date(gradDate).toLocaleDateString('da-DK', { month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Current module from studieordning */}
          {activeModule ? (
            <div className="bg-blue-600 rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10"><Layers className="w-32 h-32" /></div>
              <div className="relative z-10 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-1 bg-white/20 rounded-lg text-[9px] font-black uppercase tracking-widest">Studieordning</span>
                    {activeModule.ects && <span className="px-2.5 py-1 bg-white/15 rounded-lg text-[9px] font-black">{activeModule.ects} ECTS</span>}
                  </div>
                  <h3 className="text-xl font-black leading-tight">{activeModule.name}</h3>
                </div>
                {(activeModule.learningGoals?.length ?? 0) > 0 && (
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-blue-200">Kerne-læringsmål</p>
                    {activeModule.learningGoals!.slice(0, 3).map((g, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-300 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-100 font-medium leading-snug">{g}</p>
                      </div>
                    ))}
                  </div>
                )}
                {activeModule.examForm && (
                  <div className="pt-3 border-t border-blue-500">
                    <p className="text-[9px] font-black uppercase tracking-widest text-blue-200 mb-1.5">Prøveform</p>
                    <p className="text-xs text-blue-100 italic">"{activeModule.examForm}"</p>
                  </div>
                )}
                <button onClick={() => setActiveTab('studieordning')} className="flex items-center gap-1.5 text-[10px] font-black text-blue-200 hover:text-white transition-colors mt-2">
                  Se alle moduler <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-100 rounded-3xl p-8 flex items-center justify-center text-center">
              <div>
                <Layers className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-400">Ingen studieordning tilknyttet</p>
                <p className="text-[10px] text-slate-300 mt-1">Kontakt din administrator</p>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard icon={CalendarDays} label="Undervisningsuger" value={stats.weeks} color="bg-indigo-50 text-indigo-600" />
            <StatCard icon={FileText} label="Begivenheder" value={stats.totalEvents} color="bg-slate-100 text-slate-600" />
            <StatCard icon={Flag} label="Eksaminer" value={stats.exams} sub={`+ ${stats.deadlines} afleveringer`} color="bg-amber-50 text-amber-600" />
            <StatCard icon={Activity} label="Max Intensitet" value={`${stats.maxIntensity}/10`} color="bg-rose-50 text-rose-600" />
          </div>
        )}

        {/* No plan CTA */}
        {!plansLoading && !latestPlan && (
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-14 text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <CalendarDays className="w-8 h-8 text-indigo-400" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2">Importér din kalender for fuld indsigt</h2>
            <p className="text-sm text-slate-400 font-medium max-w-sm mx-auto mb-7">
              Hent dit iCal-link fra TimeEdit — AI'en kombinerer det med din studieordning og laver en komplet analyse.
            </p>
            <Link href="/semester-planlaegger">
              <Button className="h-12 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs shadow-lg">
                <Zap className="w-4 h-4 mr-2" /> Opret Semesterplan
              </Button>
            </Link>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-slate-100 p-1.5 flex gap-1 w-fit mx-auto shadow-sm flex-wrap justify-center">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isActive ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'}`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:block">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>

            {/* ── OVERBLIK ─── */}
            {activeTab === 'overblik' && (
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Upcoming */}
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900">Kommende begivenheder</h2>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Næste 7 aktiviteter</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                    {latestPlan ? <UpcomingEvents plan={latestPlan} /> : (
                      <div className="text-center py-10 text-slate-300 text-sm">Ingen kalender importeret</div>
                    )}
                  </div>
                </div>

                {/* Intensity + studieordning sidebar */}
                <div className="space-y-6">
                  {latestPlan && (
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 border border-amber-100">
                          <Activity className="w-5 h-5" />
                        </div>
                        <h3 className="text-base font-black text-slate-900">Intensitetsprofil</h3>
                      </div>
                      <div className="flex items-end gap-1 h-20 pt-2">
                        {latestPlan.weeklyBreakdown.map((week, i) => {
                          const v = week.intensity ?? 0;
                          const h = Math.max(10, (v / 10) * 100);
                          const c = v > 7 ? 'bg-rose-400' : v > 4 ? 'bg-amber-400' : 'bg-emerald-400';
                          return (
                            <div key={i} className={`flex-1 rounded-t-md relative group cursor-pointer ${c} hover:opacity-80 transition-all`}
                              style={{ height: `${h}%` }} title={`Uge ${week.weekNumber}: ${v}/10`}>
                              <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap z-10 transition-opacity">
                                U{week.weekNumber}: {v}/10
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-[9px] font-bold text-slate-300 uppercase tracking-wider">
                        <span>Uge {latestPlan.weeklyBreakdown[0]?.weekNumber}</span>
                        <span>Slut</span>
                      </div>
                    </div>
                  )}

                  {/* Active module quick-view */}
                  {activeModule && (
                    <button onClick={() => setActiveTab('studieordning')} className="w-full text-left bg-blue-50 border border-blue-100 rounded-3xl p-6 hover:bg-blue-100/50 transition-all group space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Dit semestermodul</p>
                        <ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <h4 className="font-black text-slate-900">{activeModule.name}</h4>
                      {activeModule.ects && <Tag color="amber">{activeModule.ects} ECTS</Tag>}
                      {(activeModule.learningGoals?.length ?? 0) > 0 && (
                        <div className="space-y-1.5">
                          {activeModule.learningGoals!.slice(0, 2).map((g, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                              <p className="text-xs text-blue-900 font-medium line-clamp-1">{g}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── KALENDER ─── */}
            {activeTab === 'kalender' && latestPlan && (
              <WeeklyCalendar plan={latestPlan} activeModule={activeModule} user={user} firestore={firestore} />
            )}
            {activeTab === 'kalender' && !latestPlan && (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
                <CalendarDays className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-base font-black text-slate-400">Ingen kalender</p>
                <Link href="/semester-planlaegger" className="inline-block mt-4">
                  <Button variant="outline">Importér nu</Button>
                </Link>
              </div>
            )}

            {/* ── STUDIEORDNING ─── */}
            {activeTab === 'studieordning' && (
              <StudieordningTab curriculum={curriculum} userProfile={userProfile} />
            )}

            {/* ── ANALYSE ─── */}
            {activeTab === 'analyse' && latestPlan && (
              <AnalyseTab plan={latestPlan} activeModule={activeModule} />
            )}
            {activeTab === 'analyse' && !latestPlan && (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
                <Brain className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-base font-black text-slate-400">Importér din kalender for AI-analyse</p>
                <Link href="/semester-planlaegger" className="inline-block mt-4">
                  <Button>Importér nu</Button>
                </Link>
              </div>
            )}

            {/* ── EKSAMEN ─── */}
            {activeTab === 'eksamen' && (
              <EksamenTab currentSemester={userProfile?.semester || '1. semester'} curriculum={curriculum} />
            )}

          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
