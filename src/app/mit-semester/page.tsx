'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, CalendarDays, BookOpen, Target, AlertTriangle, Sparkles,
  Activity, Clock, ChevronDown, GraduationCap, Layers, Loader2, Plus,
  RefreshCw, ArrowRight, Flag, Navigation, CheckCircle, Brain, FileText,
  Zap, Trophy, BarChart3, ListOrdered, CheckCircle2, Hash, Award,
  BookMarked, Puzzle, Scale, ChevronRight, Book, Lightbulb, Check, Info, Star
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

interface ElectiveChoice {
  name: string;
  description: string;
}

interface CurriculumModule {
  id: string;
  name: string;
  about?: string;
  description?: string;
  ects?: number;
  learningGoals?: string[];
  examForm?: string;
  electives?: ElectiveChoice[];
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
function EksamenTab({ 
  currentSemester, 
  curriculum, 
  electiveCurriculums,
  selectedModuleIdx,
  setSelectedModuleIdx,
  selectedSemesterNum,
  setSelectedSemesterNum
}: { 
  currentSemester: string; 
  curriculum: Curriculum | null; 
  electiveCurriculums: Curriculum[];
  selectedModuleIdx: number;
  setSelectedModuleIdx: (idx: number) => void;
  selectedSemesterNum: number;
  setSelectedSemesterNum: (num: number) => void;
}) {
  const { user, userProfile, refetchUserProfile } = useApp();
  const firestore = useFirestore();

  const modules = curriculum?.modules || [];
  const activeModule = modules[selectedModuleIdx] || null;
  
  const [aiData, setAiData] = useState<ModuleExamPrepData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Use the semester number directly for supplementary prep data lookup
  const matchedSemNum = selectedSemesterNum;
  const prepData = semesterPrepData[matchedSemNum];

  // Reset AI data when selector changes (module or semester)
  useEffect(() => {
    setAiData(null);
  }, [selectedModuleIdx, selectedSemesterNum]);
  const { toast } = useToast();
  const resultsRef = useRef<HTMLDivElement>(null);

  const currentElective = (activeModule && userProfile?.selectedElectives?.[activeModule.id]) || '';

  // Combine electives from the activeModule and ANY modules from elective-only curricula
  const allElectiveChoices = useMemo(() => {
    // Standard electives defined WITHIN the main module
    const choices: any[] = (activeModule?.electives || []).map(e => ({
        id: '', 
        learningGoals: [], 
        examForm: '',
        ...e
    }));
    
    // Also include ALL modules from special 'electives' curricula
    electiveCurriculums.forEach(c => {
        c.modules.forEach(m => {
           if (!choices.find(ch => ch.name.toLowerCase() === m.name.toLowerCase())) {
               choices.push({ ...m });
           }
        });
    });
    
    return choices;
  }, [activeModule, electiveCurriculums]);

  // Check if the current semester module is actually meant to have electives
  const isElectiveSemester = useMemo(() => {
    if (!activeModule) return false;
    const name = activeModule.name.toLowerCase();
    const id = (activeModule.id || '').toLowerCase();
    
    // Check if the semester module itself indicates it's an elective slot
    const isValg = name.includes('valg') || id.includes('valg') || name.includes('elective') || name.includes('valgmodul') || name.includes('valgfag');
    // OR if it already has electives defined within it
    const hasInternalElectives = (activeModule.electives && activeModule.electives.length > 0);
    
    return isValg || hasInternalElectives;
  }, [activeModule]);

  // The actual module content to show. If an elective is selected, use its data.
  const effectiveModule = useMemo(() => {
    if (!currentElective || !activeModule) return activeModule;
    const selected = allElectiveChoices.find(e => e.name === currentElective);
    if (!selected) return activeModule;

    // Merge! Keep activeModule's basic ID/name for context but prioritze elective's description/goals
    return {
        ...activeModule,
        ...selected,
        // Override name if it was just 'Valgmodul' originally
        name: selected.name || activeModule.name,
    };
  }, [activeModule, currentElective, allElectiveChoices]);

  const handleSelectElective = async (electiveName: string) => {
    if (!user || !firestore || !activeModule) return;
    try {
        const userRef = doc(firestore, 'users', user.uid);
        await updateDoc(userRef, {
            [`selectedElectives.${activeModule.id}`]: electiveName
        });
        await refetchUserProfile();
        toast({ title: "Valgmodul opdateret", description: `Du har valgt: ${electiveName}` });
    } catch (e) {
        toast({ title: "Fejl", description: "Kunne ikke gemme dit valg.", variant: "destructive" });
    }
  };

  // Reset AI data when selector changes
  useEffect(() => {
    setAiData(null);
  }, [selectedModuleIdx]);

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    // Scroll to results area immediately so user sees the loading state
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    try {
      const res = await generateModuleExamPrepAction({
        moduleName: effectiveModule?.name || prepData?.title || `Modul ${selectedModuleIdx + 1}`,
        description: effectiveModule?.about || effectiveModule?.description || prepData?.focus || '',
        learningGoals: effectiveModule?.learningGoals || prepData?.learningGoals || [],
        examForm: effectiveModule?.examForm,
      });
      setAiData(res.data);
      toast({
        title: "AI-Motor Aktiveret",
        description: "Vi har fundet nye begreber, modeller og lovgivning til dig.",
      });
      // Final scroll once data is rendered
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
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
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      {/* Unified Academic Selector - THE ONE DROP-DOWN */}
      <div className={`bg-white/60 backdrop-blur-xl border border-indigo-50 p-8 rounded-[2.5rem] shadow-sm space-y-6 relative transition-all duration-300 ${isDropdownOpen ? 'z-50 ring-2 ring-indigo-500/10' : 'z-20 shadow-none'}`}>
        <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-950 serif tracking-tight">Akademisk Vælger</h3>
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full border border-indigo-100">
               <Sparkles className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500" />
               <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Vælg Modul eller Semester</span>
            </div>
        </div>

        <div className="relative">
           <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full h-auto min-h-[4.5rem] py-5 pl-8 pr-16 bg-slate-50/50 rounded-3xl border-2 border-slate-100/50 text-left transition-all hover:bg-white hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col justify-center gap-1 group/btn"
           >
              <div className="flex items-center gap-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500">
                  {activeModule?.id || `Modul ${selectedModuleIdx + 1}`}
                  {activeModule?.ects && ` — ${activeModule.ects} ECTS`}
                </p>
                {(activeModule as any)?.semester && (
                  <span className="text-[9px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                    {(activeModule as any).semester}. Semester
                  </span>
                )}
              </div>
              <p className="text-sm font-black text-slate-900 leading-tight group-hover/btn:text-indigo-600 transition-colors">
                {activeModule?.name || 'Vælg fra studieordning'}
              </p>
              <ChevronDown className={`absolute right-8 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-indigo-600' : ''}`} />
           </button>

           <AnimatePresence>
             {isDropdownOpen && (
               <>
                 <div className="fixed inset-0 z-[100]" onClick={() => setIsDropdownOpen(false)} />
                 <motion.div 
                   initial={{ opacity: 0, y: 15, scale: 0.98 }}
                   animate={{ opacity: 1, y: 10, scale: 1 }}
                   exit={{ opacity: 0, y: 15, scale: 0.98 }}
                   className="absolute top-full left-0 right-0 z-[101] mt-2 p-3 bg-white rounded-[2.5rem] shadow-2xl border border-indigo-50 overflow-hidden ring-4 ring-indigo-500/5"
                 >
                   <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-1 space-y-1">
                     {modules.map((m, idx) => {
                       const isSelected = selectedModuleIdx === idx;
                       return (
                         <button
                           key={idx}
                           onClick={() => {
                             setSelectedModuleIdx(idx);
                             const semNum = (m as any).semester || m.id?.match(/\d+/)?.[0];
                             if (semNum) setSelectedSemesterNum(parseInt(semNum));
                             setIsDropdownOpen(false);
                           }}
                           className={`w-full text-left p-6 rounded-[1.75rem] transition-all flex flex-col gap-2 ${isSelected ? 'bg-indigo-600 text-white shadow-xl translate-x-1' : 'hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 hover:translate-x-1'}`}
                         >
                           <div className="flex items-center justify-between">
                             <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                               {m.id || `Modul ${idx + 1}`} {m.ects && `• ${m.ects} ECTS`}
                             </span>
                             {(m as any).semester && (
                               <span className={`text-[9px] font-black px-2 py-1 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                 {(m as any).semester}. Semester
                               </span>
                             )}
                           </div>
                           <span className="text-xs font-black leading-snug">{m.name}</span>
                         </button>
                       );
                     })}
                     {(!curriculum || modules.length === 0) && (
                       <p className="p-10 text-center text-xs text-slate-400 italic">Ingen moduler fundet i din studieordning</p>
                     )}
                   </div>
                 </motion.div>
               </>
             )}
            </AnimatePresence>
        </div>

        {/* INTEGRATED ELECTIVE SELECTOR - Only if relevant for this module */}
        {isElectiveSemester && allElectiveChoices.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="pt-8 border-t border-indigo-50 space-y-6"
          >
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 border border-amber-100">
                  <Star className="w-4 h-4 fill-amber-500" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">Tilpas Valgmodul</h4>
                  <p className="text-[9px] font-bold text-amber-600/60 mt-1">Vælg din specifikke studieretning</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[8px] font-black uppercase tracking-widest rounded-full border border-amber-100">AI Præcision</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               {allElectiveChoices.map((choice) => {
                 const isPicked = (currentElective === choice.name);
                 return (
                   <button
                     key={choice.name}
                     onClick={() => handleSelectElective(choice.name)}
                     className={`p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between group relative overflow-hidden ${isPicked ? 'bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-500/10 text-white' : 'bg-white border-slate-100 hover:border-amber-400 text-slate-600 hover:bg-slate-50'}`}
                   >
                     <div className="relative z-10">
                        <span className="text-xs font-black leading-tight line-clamp-1">{choice.name}</span>
                        {isPicked && <p className="text-[8px] font-bold text-white/60 mt-0.5">Valgt Specialisering</p>}
                     </div>
                     {isPicked ? (
                       <CheckCircle2 className="w-5 h-5 shrink-0 text-white relative z-10" />
                     ) : (
                       <Plus className="w-4 h-4 shrink-0 text-slate-300 group-hover:text-amber-400 transition-colors" />
                     )}
                     {isPicked && <div className="absolute top-0 right-0 w-8 h-full bg-white/5 skew-x-12 -mr-4" />}
                   </button>
                 );
               })}
            </div>

            {currentElective && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-5 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl">
                <div className="flex gap-3">
                  <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-indigo-900/60 leading-relaxed italic">
                    "{allElectiveChoices.find(e => e.name === currentElective)?.description}"
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      {/* ── Dashboard Status Bar ──────────────────────────────────────────────── */}
      <div className="bg-slate-950 text-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-10 overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] -mr-48 -mt-48 group-hover:scale-125 transition-transform duration-1000" />
        
        <div className="flex items-center gap-6 relative z-10">
           <div className="w-16 h-16 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
              <GraduationCap className="w-8 h-8 text-indigo-400" />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-1">Eksamens-Status</p>
              <h2 className="text-xl font-black serif tracking-tight">Klar til forberedelse</h2>
           </div>
        </div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="h-12 w-[1px] bg-white/10 hidden md:block mx-4" />
          
          <div className="text-right hidden sm:block">
             <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Aktuelt Modul</p>
             <p className="text-xs font-black text-slate-300">{effectiveModule?.name?.split(':')[0] || 'Ikke valgt'}</p>
          </div>

          <Button 
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="h-16 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-[10px] tracking-[0.25em] shadow-2xl shadow-indigo-500/20 group transition-all shrink-0 active:scale-95"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-3 animate-spin" />
                Aktiverer AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-3 text-indigo-200 group-hover:scale-125 transition-transform" />
                AI Eksamens Analyse
              </>
            )}
          </Button>
        </div>
      </div>
      <div className="grid lg:grid-cols-12 gap-12">
        {/* Main Dashboard Content (Column 8) */}
        <div className="lg:col-span-8 space-y-12">
          {/* Module Hero Card */}
          <div className="bg-white rounded-[3rem] border border-indigo-50 p-10 md:p-14 shadow-2xl shadow-indigo-100/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-50/50 rounded-full blur-[100px] -mr-40 -mt-40" />
            
            <div className="relative z-10 space-y-12">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                   <span className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl">Modul {effectiveModule?.id || (selectedModuleIdx + 1)}</span>
                   {effectiveModule?.ects && <span className="px-5 py-2 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black tracking-widest">{effectiveModule.ects} ECTS</span>}
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-slate-950 serif tracking-tighter leading-[0.9]">
                   {effectiveModule?.name || prepData?.title || 'Modul Oversigt'}
                </h1>
                <p className="text-base font-medium text-slate-400 max-w-2xl leading-relaxed">
                   Her finder du alt dit teoretiske fundament, lovgivning og AI-indsigter tilpasset din eksamen.
                </p>
              </div>


              {(effectiveModule?.about || effectiveModule?.description || prepData?.focus) && (
                <div className="p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 relative group/about">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mb-6 flex items-center gap-3">
                      <div className="w-8 h-1 bg-slate-200 rounded-full" />
                      Beskrivelse & Fokusområde
                   </h4>
                   <p className="text-base font-bold text-slate-900 leading-relaxed italic pr-20">
                     "{effectiveModule?.about || effectiveModule?.description || prepData?.focus}"
                   </p>
                   <Info className="absolute bottom-10 right-10 w-12 h-12 text-slate-950/5 group-hover:text-indigo-600/10 transition-colors" />
                </div>
              )}
            </div>
          </div>

            <div className="space-y-8">
              <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600/40 ml-2">Centrale Læringsmål</h4>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-indigo-100 to-transparent mx-6"></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                {(effectiveModule?.learningGoals || prepData?.learningGoals || []).map((goal, i) => (
                  <div key={i} className="flex gap-6 p-8 bg-white/60 border border-white hover:bg-white hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] group/goal relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-full bg-slate-50 group-hover:bg-indigo-600 transition-all duration-700" />
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-[11px] font-black shrink-0 group-hover/goal:bg-indigo-600 group-hover/goal:text-white group-hover/goal:rotate-6 transition-all duration-500 shadow-inner">
                      {i + 1}
                    </div>
                    <p className="text-[11px] font-bold text-slate-600 leading-relaxed pt-2 group-hover:text-slate-900 transition-colors uppercase tracking-tight">{goal}</p>
                  </div>
                ))}
              </div>
            </div>

          {/* AI Results Anchor */}
          <div ref={resultsRef} className="scroll-mt-24" />

          {/* AI Suggestions Section (Concepts & Models) */}
          {(isGenerating || prepData?.concepts || prepData?.models || aiData) && (
            <div className="grid sm:grid-cols-2 gap-8">
              {/* Concepts & Theory */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Teori & Begreber</h4>
                  <div className="h-[1px] flex-1 bg-slate-100 mx-4"></div>
                </div>
                
                <div className="space-y-4">
                  {isGenerating && !aiData && (
                    <div className="space-y-6">
                      <div className="flex flex-col items-center justify-center p-12 bg-indigo-50 border border-indigo-100/50 rounded-[2.5rem] animate-in fade-in zoom-in duration-500">
                         <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                         <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600/60">Analyserer begreber...</p>
                      </div>
                      <div className="h-40 bg-slate-100 rounded-[2rem] animate-pulse opacity-50" />
                    </div>
                  )}
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
                  {isGenerating && !aiData && (
                    <div className="space-y-4">
                      <div className="h-40 bg-slate-100 rounded-[2rem] animate-pulse flex items-center justify-center">
                         <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
                            <p className="text-[9px] font-black uppercase text-slate-300">Finder modeller</p>
                         </div>
                      </div>
                    </div>
                  )}
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
          {(isGenerating || aiData) && (
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
                {isGenerating && !aiData && (
                  <>
                    <div className="h-64 bg-slate-50 border border-slate-100 rounded-[2.5rem] animate-pulse flex items-center justify-center">
                       <div className="flex flex-col items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm">
                             <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Lovgivnings-check...</p>
                       </div>
                    </div>
                    <div className="h-64 bg-slate-50 border border-slate-100 rounded-[2.5rem] animate-pulse opacity-50" />
                  </>
                )}
                {(aiData?.legislation || []).map((law, i) => (
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
                      {(law.paragraphs || []).map((p, pi) => (
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

          {/* Right Column: Exam Assistant & Tools (Column 4) */}
          <div className="lg:col-span-4 space-y-8">
          <div className="sticky top-12 space-y-8">
             <div className="bg-slate-950 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px] group-hover:scale-150 transition-transform duration-1000" />
                
                <div className="relative z-10">
                   <div className="flex items-center gap-4 mb-10">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                         <Trophy className="w-6 h-6 text-indigo-400" />
                      </div>
                      <h3 className="text-lg font-black serif tracking-tight">Eksamens-Assistent</h3>
                   </div>

                   {effectiveModule?.examForm && (
                      <div className="p-6 bg-white/5 border border-white/5 rounded-2xl mb-8">
                         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-2">Prøveform</p>
                         <p className="text-sm font-bold text-slate-300 leading-snug">{effectiveModule.examForm}</p>
                      </div>
                   )}

                   <div className="space-y-6">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Dine Strategier</p>
                      <ul className="space-y-5">
                         {(prepData?.examTips || ["Forbered din case grundigt.", "Øv dig i tværfaglig formidling.", "Fokusér på metode-valg."]).map((tip, i) => (
                           <li key={i} className="flex gap-4 group/tip">
                              <div className="w-6 h-6 rounded-lg bg-indigo-600/20 flex items-center justify-center shrink-0 mt-0.5 group-hover/tip:bg-indigo-600 transition-colors">
                                 <Check className="w-3 h-3 text-indigo-400 group-hover/tip:text-white" />
                              </div>
                              <p className="text-[11px] font-bold text-slate-400 group-hover/tip:text-slate-100 leading-relaxed transition-colors">{tip}</p>
                           </li>
                         ))}
                      </ul>
                   </div>

                   <div className="mt-10 pt-8 border-t border-white/5">
                      <div className="flex items-center gap-3 p-4 bg-indigo-600/10 rounded-xl border border-indigo-600/20">
                         <Lightbulb className="w-5 h-5 text-indigo-400" />
                         <p className="text-[10px] text-indigo-200 font-bold leading-snug italic">
                            "Husk at AI kan analysere dine specifikke cases hvis du indsætter dem i Arkitekten."
                         </p>
                      </div>
                   </div>
                </div>
             </div>

             {/* Action Tool: Exam Architect */}
             <Link href="/exam-architect">
                <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl group cursor-pointer hover:border-indigo-600 hover:-translate-y-2 transition-all duration-500 overflow-hidden relative">
                   <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                   
                   <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                      <div className="w-16 h-16 bg-slate-950 text-white rounded-2xl flex items-center justify-center shadow-2xl group-hover:bg-indigo-600 transition-colors duration-500">
                         <Zap className="w-8 h-8" />
                      </div>
                      <div>
                         <h4 className="text-lg font-black text-slate-900 tracking-tight">Eksamens-Arkitekten</h4>
                         <p className="text-xs font-medium text-slate-400 mt-2 px-4">Byg din komplette opgavestruktur med AI-støtte.</p>
                      </div>
                      <div className="w-full py-4 bg-slate-50 text-slate-900 text-[10px] font-black rounded-xl uppercase tracking-widest flex items-center justify-center gap-3 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                         Åbn Værktøj <ChevronRight className="w-4 h-4" />
                      </div>
                   </div>
                </div>
             </Link>
          </div>
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
  const [activeTab, setActiveTab] = useState<TabId>('overblik');
  const [selectedSemesterNum, setSelectedSemesterNum] = useState<number>(getSemNum(userProfile?.semester || '1'));
  const [selectedModuleIdx, setSelectedModuleIdx] = useState<number>(0);
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);


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
    const normalize = (s: string) => {
      let res = s.toLowerCase()
        .replace(/professionshøjskolen\s+/gs, '')
        .replace(/university college\s+/gs, '')
        .replace(/erhvervsakademi og professionshøjskole\s+/gs, '')
        .replace(/professionshøjskole\s+/gs, '')
        .replace(/\bsjælland\b/g, 'absalon') // Absalon is Sjælland
        .trim();
      
      // Common abbreviations mapping
      const mapping: Record<string, string> = {
        'københavns professionshøjskole': 'kp',
        'københavn': 'kp',
        'københavns': 'kp',
        'professionshøjskolen absalon': 'absalon',
        'lillebælt': 'ucl',
        'erhvervsakademi lillebælt': 'ucl',
        'ucl erhvervsakademi og professionshøjskole': 'ucl'
      };
      
      let mapped = mapping[res];
      if (!mapped) {
        if (res.includes('lillebælt')) mapped = 'ucl';
        else if (res.includes('københavn')) mapped = 'kp';
        else if (res.includes('sjælland')) mapped = 'absalon';
        else if (res.includes('midtjylland')) mapped = 'via';
        else if (res.includes('nordjylland')) mapped = 'ucn';
      }
      
      return mapped || res;
    };

    const normalizedUserInst = normalize(userInst);

    // 1. Filter to ONLY curriculums from this institution (using robust matching)
    const instMatches = curriculumsRaw.filter((c: any) => {
      const cInstRaw = c.institution || '';
      const cInst = cInstRaw.toLowerCase().trim();
      const nInst = normalize(cInst);
      
      // Try exact, normalized, abbreviation or substring matches
      return (
        cInst === userInst || 
        nInst === normalizedUserInst || 
        (normalizedUserInst.length > 1 && (nInst.includes(normalizedUserInst) || normalizedUserInst.includes(nInst))) ||
        (nInst.length > 1 && (normalizedUserInst.includes(nInst) || normalizedUserInst === nInst))
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

  const availableSemesters = useMemo(() => {
    const semsMap = new Map<number, { num: number, title: string }>();
    
    // Initial standard list
    [1, 2, 3, 4, 5, 6, 7].forEach(n => {
        semsMap.set(n, { num: n, title: semesterPrepData[n]?.title || `${n}. Semester` });
    });

    if (curriculum?.modules) {
        curriculum.modules.forEach((m) => {
            const semNum = (m as any).semester || (m.id?.match(/[sS]em\s*(\d+)/) || m.name?.match(/[sS]em\s*(\d+)/) || 
                          m.id?.match(/(\d+)[\.\s]*sem/) || 
                          m.id?.match(/[sS](\d+)/))?.[1];
            
            if (semNum) {
                const n = parseInt(semNum);
                // In UCL and other ph's, the modules ARE the semester focus
                // If it's a "big" module (like the ones in the screenshot), use its name as the semester title
                const hasFocusKeywords = ['socialt arbejde', 'praksis', 'videnskab'].some(k => m.name?.toLowerCase().includes(k));
                const isLongName = m.name?.length > 25;
                const isSemTitleModule = hasFocusKeywords || isLongName || m.id?.endsWith('-s' + n);
                
                // If we find a good title, override the generic one
                if (isSemTitleModule) {
                    const currentTitle = semsMap.get(n)?.title;
                    // Only override if the current title is either generic or shorter
                    if (!currentTitle || currentTitle.includes('Semester') || m.name.length > (currentTitle?.length || 0)) {
                        semsMap.set(n, { num: n, title: m.name });
                    }
                } else if (!semsMap.has(n)) {
                    semsMap.set(n, { num: n, title: `${n}. Semester` });
                }
            }
        });
    }

    const userSem = getSemNum(userProfile?.semester || '1');
    if (!semsMap.has(userSem)) semsMap.set(userSem, { num: userSem, title: `${userSem}. Semester` });
    
    return Array.from(semsMap.values()).sort((a, b) => a.num - b.num);
  }, [curriculum, userProfile?.semester]);

  // Filter modules for the sidebar list based on selected semester
  const semesterModules = useMemo(() => {
    if (!curriculum) return [];
    const semStr = String(selectedSemesterNum);
    return curriculum.modules.map((m, idx) => ({ ...m, originalIdx: idx })).filter(m => {
        // 1. Check direct semester prop
        if ((m as any).semester === selectedSemesterNum) return true;
        
        // 2. Check metadata strings
        const id = m.id?.toLowerCase() ?? '';
        const name = m.name?.toLowerCase() ?? '';
        return id.includes(semStr) || name.includes(semStr) || id.includes(`s${semStr}`) || 
               id.includes(`sem${semStr}`) ||
               (m.originalIdx >= (selectedSemesterNum - 1) * 2 && m.originalIdx < selectedSemesterNum * 2); // fallback
    });
  }, [curriculum, selectedSemesterNum]);

  // Sync selectedModuleIdx when semester changes
  useEffect(() => {
    if (semesterModules.length > 0) {
      const containsActive = semesterModules.find(m => m.originalIdx === selectedModuleIdx);
      if (!containsActive) {
        setSelectedModuleIdx(semesterModules[0].originalIdx);
      }
    }
  }, [selectedSemesterNum, semesterModules, selectedModuleIdx]);

  // Find specifically elective-only curricula for this institution/profession
  const electiveCurriculums = useMemo((): Curriculum[] => {
    if (!curriculumsRaw) return [];
    
    const inst = (userProfile?.institution || '').toLowerCase().trim();
    return curriculumsRaw.filter((c: any) => {
        const cInst = (c.institution || '').toLowerCase().trim();
        const instMatch = cInst.includes(inst) || inst.includes(cInst);
        return c.type === 'electives' && instMatch;
    });
  }, [curriculumsRaw, userProfile?.institution]);

  // Active module — now based on selectedModuleIdx instead of just current semester
  const activeModule = useMemo(() => {
    if (!curriculum) return null;
    return curriculum.modules[selectedModuleIdx] || null;
  }, [curriculum, selectedModuleIdx]);

  if (isUserLoading || !user || userProfile === undefined) return <AuthLoadingScreen />;

  const latestPlan = plans[0] ?? null;
  const currentSemNum = getSemNum(userProfile?.semester ?? '1');
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
    <div className="flex h-screen bg-[#FDFCF8] overflow-hidden selection:bg-indigo-100">
      {/* ── Fixed Sidebar Navigation ────────────────────────────────────────── */}
      <aside className="w-80 bg-white/60 backdrop-blur-3xl border-r border-indigo-100 hidden lg:flex flex-col sticky top-0 h-full z-30 transition-all duration-700 overflow-y-auto custom-scrollbar">
        <div className="p-8 pb-4">
          <Link href="/portal" className="flex items-center gap-3 group mb-8">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-600 transition-colors">Portal</span>
          </Link>

          <div className="space-y-1 mb-8">
             <h1 className="text-xl font-black text-indigo-950 serif tracking-tight">Mit Semester</h1>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Akademisk Kontrolpanel</p>
          </div>

          <div className="space-y-8">
            {/* Nav Group: Tools - ALWAYS VISIBLE AT TOP */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-2">Værktøjer</h3>
              <div className="grid gap-1">
                {TABS.map(tab => {
                   const isActive = activeTab === tab.id;
                   return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-4 p-4 rounded-2xl text-left transition-all ${isActive ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-white/10' : 'bg-slate-50'}`}>
                        <tab.icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest">{tab.label}</span>
                    </button>
                   );
                })}
              </div>
            </div>

            {/* ONLY VISIBLE UNDER EXAM TAB */}
            {activeTab === 'eksamen' && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                className="space-y-6 pt-4 border-t border-indigo-50/50"
              >
                <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-50">
                  <p className="text-[10px] font-black text-indigo-400 italic leading-tight">
                    Foretage dine valg øverst i analysen.
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Sidebar Footer: Institution info */}
        <div className="mt-auto p-8 border-t border-indigo-50">
           <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100">
              <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-1">Institution</p>
              <p className="text-[11px] font-black text-indigo-950 truncate">{userProfile?.institution || 'Portal Medlem'}</p>
           </div>
        </div>
      </aside>

      {/* ── Main Content Area ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto scroll-smooth relative custom-scrollbar">
        <div className="max-w-6xl mx-auto p-12 space-y-12">
          {/* Welcome/Stats Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-4">
             <div>
                <h2 className="text-2xl font-black text-slate-950 serif tracking-tight">Velkommen tilbage</h2>
                <p className="text-[11px] font-medium text-slate-400 mt-1">Dine studier for {userProfile?.profession || 'uddannelsen'} — Semester {userProfile?.semester || '?'}</p>
             </div>
             
             {!latestPlan && (
               <Link href="/semester-planlaegger">
                 <Button className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-100">
                   <Zap className="w-5 h-5 mr-3" /> Generer ugeplan
                 </Button>
               </Link>
             )}
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
              <EksamenTab 
                currentSemester={userProfile?.semester || '1. semester'} 
                curriculum={curriculum} 
                electiveCurriculums={electiveCurriculums}
                selectedModuleIdx={selectedModuleIdx}
                setSelectedModuleIdx={setSelectedModuleIdx}
                selectedSemesterNum={selectedSemesterNum}
                setSelectedSemesterNum={setSelectedSemesterNum}
              />
            )}

          </motion.div>
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
