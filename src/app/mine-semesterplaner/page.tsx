
'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  BookCopy, 
  ChevronDown, 
  Trash2, 
  Loader2, 
  BookOpen, 
  Lightbulb, 
  Clock, 
  Plus, 
  RotateCcw, 
  BrainCircuit, 
  Save, 
  X, 
  Download, 
  Calendar, 
  Wand2, 
  CheckCircle, 
  ListOrdered, 
  RefreshCw,
  Sparkles,
  History,
  Trophy,
  Layout,
  ArrowUpRight,
  FileText
} from 'lucide-react';
import { useApp } from '@/app/provider';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  doc, 
  writeBatch, 
  getDoc, 
  serverTimestamp, 
  setDoc, 
  where, 
  getDocs, 
  increment, 
  limit,
  onSnapshot,
  updateDoc
} from 'firebase/firestore';
import { useDebounce } from 'use-debounce';
import { generateSemesterPlanAction, suggestConceptsForEventAction, generateStudyScheduleAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import type { SemesterPlan, StudySchedule } from '@/ai/flows/types';

// --- TYPES ---

interface SavedSemesterPlan extends SemesterPlan {
    id: string;
    createdAt: { toDate: () => Date };
    icalUrl: string;
    semesterInfo: string;
}

interface SavedStudySchedule extends StudySchedule {
    id: string;
    createdAt: { toDate: () => Date };
    semesterPlanId?: string;
}

// --- HELPER ---

const convertTimestamps = (obj: any): any => {
    if (obj && typeof obj.toDate === 'function') {
        return obj.toDate().toISOString();
    }
    if (Array.isArray(obj)) {
        return obj.map(convertTimestamps);
    }
    if (obj && typeof obj === 'object' && Object.prototype.toString.call(obj) === '[object Object]') {
        const newObj: { [key: string]: any } = {};
        for (const key in obj) {
            newObj[key] = convertTimestamps(obj[key]);
        }
        return newObj;
    }
    return obj;
};

// --- COMPONENTS ---

const StudyScheduleModal: React.FC<{
    plan: SavedSemesterPlan | null;
    savedSchedule?: SavedStudySchedule | null;
    onClose: () => void;
}> = ({ plan, savedSchedule = null, onClose }) => {
    const { user, userProfile, refetchUserProfile } = useApp();
    const { toast } = useToast();

    const [schedule, setSchedule] = useState<StudySchedule | null>(savedSchedule);
    const [isLoading, setIsLoading] = useState(false);
    const [studyHours, setStudyHours] = useState(41);
    const [isSaving, setIsSaving] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDownloadingIcs, setIsDownloadingIcs] = useState(false);
    const firestore = useFirestore();

    const handleGenerate = async () => {
        if (!plan || !user || !userProfile) return;
        setIsLoading(true);
        setSchedule(null);
        try {
            const result = await generateStudyScheduleAction({ 
                plan: convertTimestamps(plan), 
                totalWeeklyStudyHours: studyHours 
            });
            
            if (result && result.data) {
                setSchedule(result.data);
                 if (user && firestore && result.usage) {
                    const totalTokens = result.usage.inputTokens + result.usage.outputTokens;
                    const pointsToAdd = Math.round(totalTokens * 0.05);

                    const batch = writeBatch(firestore);
                    const userRef = doc(firestore, 'users', user.uid);
                    const tokenUsageRef = doc(collection(firestore, 'users', user.uid, 'tokenUsage'));

                    batch.set(tokenUsageRef, { flowName: 'generateStudySchedule', ...result.usage, totalTokens, createdAt: serverTimestamp(), userId: user.uid, userName: userProfile.username || user.displayName || 'Anonym' });
                    if(pointsToAdd > 0) {
                        batch.update(userRef, { cohéroPoints: increment(pointsToAdd) });
                    }
                    await batch.commit();
                    await refetchUserProfile();
                }
            }
        } catch (e) {
            console.error(e);
            toast({
                variant: 'destructive',
                title: "Fejl",
                description: "Kunne ikke generere studieplan. Prøv venligst igen."
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSaveStudyPlan = async (scheduleToSave: StudySchedule) => {
        if (!user || !plan || !firestore) return;
        setIsSaving(true);
        try {
            const studySchedulesCol = collection(firestore, 'users', user.uid, 'studySchedules');
            
            let docRef;
            if (savedSchedule) {
                docRef = doc(studySchedulesCol, savedSchedule.id);
            } else {
                const q = query(studySchedulesCol, where("semesterPlanId", "==", plan.id), limit(1));
                const existingSnap = await getDocs(q);
                if (!existingSnap.empty) {
                    docRef = existingSnap.docs[0].ref;
                } else {
                    docRef = doc(studySchedulesCol);
                }
            }

            await setDoc(docRef, { 
                ...scheduleToSave, 
                semesterPlanId: plan.id,
                createdAt: serverTimestamp() 
            }, { merge: true });

            toast({
                title: "Studieplan Gemt!",
                description: "Din studieplan er blevet gemt/opdateret."
            });
        } catch (error) {
            console.error("Error saving study schedule:", error);
            toast({
                variant: "destructive",
                title: "Fejl",
                description: "Kunne ikke gemme studieplanen."
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDownloadStudyPlan = async (schedule: StudySchedule) => {
        setIsDownloading(true);
        try {
            const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx');
            const { saveAs } = await import('file-saver');

            const docChildren: (Paragraph | undefined)[] = [
                new Paragraph({ text: schedule.title, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER })
            ];

            schedule.schedule.forEach(week => {
                docChildren.push(new Paragraph({ text: `Uge ${week.weekNumber}`, heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }));
                
                week.recommendedBlocks.forEach(block => {
                     docChildren.push(new Paragraph({
                        children: [
                            new TextRun({ text: `${block.day} (${block.startTime}-${block.endTime}): `, bold: true }),
                            new TextRun(block.activity)
                        ],
                        spacing: { after: 100 }
                    }));
                     docChildren.push(new Paragraph({
                        text: block.description,
                    }));
                });
            });

            const docToDownload = new Document({
                creator: "Cohéro",
                title: schedule.title,
                sections: [{
                    properties: {},
                    children: docChildren.filter((p): p is Paragraph => !!p),
                }],
            });

            const blob = await Packer.toBlob(docToDownload);
            saveAs(blob, `${schedule.title.replace(/ /g, '_')}.docx`);

        } catch (error) {
             console.error("Error downloading docx:", error);
             toast({
                 variant: "destructive",
                 title: "Download Fejl",
                 description: "Kunne ikke oprette .docx-filen."
             });
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDownloadIcs = (schedule: StudySchedule, plan: SavedSemesterPlan) => {
        if (!plan) return;
        setIsDownloadingIcs(true);
        
        const getBlockDate = (weekNumber: number, dayName: string): Date | null => {
            const weekData = plan.weeklyBreakdown.find(w => w.weekNumber === weekNumber);
            if (!weekData || weekData.events.length === 0) return null;
    
            const firstEventDate = new Date(weekData.events[0].startDate);
            const dayOfWeek = firstEventDate.getUTCDay(); 
            const diffToMonday = firstEventDate.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            const monday = new Date(Date.UTC(firstEventDate.getUTCFullYear(), firstEventDate.getUTCMonth(), diffToMonday));
    
            const dayMapping: { [key: string]: number } = {
                'Mandag': 0, 'Tirsdag': 1, 'Onsdag': 2, 'Torsdag': 3, 'Fredag': 4, 'Lørdag': 5, 'Søndag': 6
            };
            const dayOffset = dayMapping[dayName];
            if (dayOffset === undefined) return null;
            
            const targetDate = new Date(monday);
            targetDate.setUTCDate(monday.getUTCDate() + dayOffset);
            return targetDate;
        };
        
        const toIcsDate = (date: Date, time: string): string => {
            const [hours, minutes] = time.split(':').map(Number);
            const d = new Date(date.getTime()); 
            d.setUTCHours(hours, minutes, 0, 0);
            return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        let icsString = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Cohéro//Studieplan//DA\n';
    
        schedule.schedule.forEach(week => {
            week.recommendedBlocks.forEach(block => {
                const blockDate = getBlockDate(week.weekNumber, block.day);
                if (!blockDate) return;
    
                const uid = `${plan.id}-${week.weekNumber}-${block.day}-${block.startTime}@cohero.dk`;
                const dtstart = toIcsDate(blockDate, block.startTime);
                const dtstartEnd = toIcsDate(blockDate, block.endTime);
                const summary = block.activity;
                const description = block.description.replace(/\n/g, '\\n');
    
                icsString += 'BEGIN:VEVENT\n';
                icsString += `DTSTART:${dtstart}\n`;
                icsString += `DTEND:${dtstartEnd}\n`;
                icsString += `UID:${uid}\n`;
                icsString += `SUMMARY:${summary}\n`;
                icsString += `DESCRIPTION:${description}\n`;
                icsString += 'END:VEVENT\n';
            });
        });
    
        icsString += 'END:VCALENDAR';
        
        import('file-saver').then(({ saveAs }) => {
            const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
            saveAs(blob, `${schedule.title.replace(/ /g, '_')}.ics`);
            setIsDownloadingIcs(false);
        }).catch(err => {
            console.error("Error importing file-saver:", err);
            setIsDownloadingIcs(false);
        });
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-amber-950/70 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative bg-[#FDFCF8] w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-fade-in-up">
                 <div className="p-6 border-b border-amber-100 bg-white flex items-center justify-between">
                    <h2 className="text-xl font-bold text-amber-950 serif">{isLoading ? "Genererer din studieplan..." : (schedule?.title || 'Generer Studieplan')}</h2>
                    <div className='flex items-center gap-2'>
                       {schedule && plan && (
                        <>
                           <Button onClick={() => handleSaveStudyPlan(schedule)} variant="outline" size="sm" disabled={isSaving}>
                             {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
                             Gem
                           </Button>
                           <Button onClick={() => handleDownloadStudyPlan(schedule)} variant="outline" size="sm" disabled={isDownloading}>
                             {isDownloading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4 mr-2"/>}
                             .docx
                           </Button>
                           <Button onClick={() => handleDownloadIcs(schedule, plan)} variant="outline" size="sm" disabled={isDownloadingIcs}>
                             {isDownloadingIcs ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Calendar className="w-4 h-4 mr-2"/>}
                             .ics
                           </Button>
                        </>
                       )}
                       <button onClick={onClose} className="p-2 text-slate-400 hover:text-amber-900"><X className="w-5 h-5"/></button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-8">
                {!schedule && !isLoading && (
                     <div className="text-center max-w-md mx-auto py-10">
                        <h2 className="text-2xl font-bold text-amber-950 serif mb-4">Generér din personlige studieplan</h2>
                        <p className="text-slate-600 mb-8">Angiv dit mål for antallet af ugentlige studietimer (inklusive undervisning), og lad AI'en skabe en struktureret plan for dit selvstudie.</p>
                        <div className="max-w-xs mx-auto space-y-4">
                            <div>
                                <label htmlFor="study-hours" className="text-sm font-bold text-slate-700">Ugentlige studietimer i alt</label>
                                <Input
                                    id="study-hours"
                                    type="number"
                                    value={studyHours}
                                    onChange={(e: any) => setStudyHours(Number(e.target.value))}
                                    className="text-center text-lg mt-2 h-12"
                                    min="20"
                                    max="60"
                                />
                            </div>
                            <Button onClick={handleGenerate} size="lg" className="w-full">
                               <Wand2 className="w-4 h-4 mr-2" />
                               Generér plan
                            </Button>
                        </div>
                    </div>
                )}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
                        <p className="mt-4 font-semibold text-amber-950">AI'en analyserer din kalender og planlægger dine studieuger...</p>
                        <p className="text-sm text-slate-500">Dette kan tage et øjeblik.</p>
                    </div>
                ) : schedule && (
                    <div className="space-y-12">
                        <div className="text-center">
                            <Button variant="outline" size="sm" onClick={() => setSchedule(null)}>
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Generér ny version
                            </Button>
                        </div>
                        {schedule.schedule.map(week => (
                            <div key={week.weekNumber}>
                                <h3 className="text-2xl font-bold text-amber-950 serif mb-6">Uge {week.weekNumber}</h3>
                                <div className="grid md:grid-cols-3 gap-4 mb-8 text-center">
                                    <div className="bg-white p-4 rounded-xl border"><p className="text-xs font-bold text-slate-400 uppercase">Fokusområder</p><p className="font-semibold text-amber-900">{week.focusAreas.join(', ')}</p></div>
                                    <div className="bg-white p-4 rounded-xl border"><p className="text-xs font-bold text-slate-400 uppercase">Planlagte Timer</p><p className="font-semibold text-amber-900">{week.totalScheduledHours.toFixed(1)}</p></div>
                                    <div className="bg-white p-4 rounded-xl border"><p className="text-xs font-bold text-slate-400 uppercase">Selvstudie Timer</p><p className="font-semibold text-amber-900">{week.selfStudyHours.toFixed(1)}</p></div>
                                </div>
                                <div className="space-y-4">
                                {week.recommendedBlocks.map((block, i) => (
                                     <div key={i} className="grid grid-cols-[auto,1fr] gap-4 items-start">
                                        <div className="w-24 text-right">
                                            <p className="font-mono text-sm font-semibold text-amber-900">{block.startTime} - {block.endTime}</p>
                                            <p className="text-xs text-slate-400">{block.day}</p>
                                        </div>
                                        <div className="pl-4 border-l-2 border-amber-100">
                                            <p className="font-bold text-sm text-slate-800">{block.activity}</p>
                                            <p className="text-xs text-slate-500">{block.description}</p>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                </div>
            </div>
        </div>
    );
};

const PlanDetailView: React.FC<{
  plan: SavedSemesterPlan;
  user: any;
  onOpenModal: (plan: SavedSemesterPlan, schedule?: SavedStudySchedule | null) => void;
  savedSchedule?: SavedStudySchedule | null;
}> = ({ plan, user, onOpenModal, savedSchedule }) => {
  const [concepts, setConcepts] = useState<string[]>([]);
  const [isLoadingConcepts, setIsLoadingConcepts] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});
  const [debouncedNotes] = useDebounce(localNotes, 1500);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const firestore = useFirestore();
  const isInitialMount = useRef(true);

  // Initialize notes from the plan data
  useEffect(() => {
    const notes: Record<string, string> = {};
    plan.weeklyBreakdown.forEach(week => {
        week.events.forEach((event: any) => {
            if (event.notes) {
                const key = `${event.summary}-${event.startDate}`;
                notes[key] = event.notes;
            }
        });
    });
    setLocalNotes(notes);
  }, [plan]);

  const handleAutoSaveNotes = useCallback(async () => {
    if (!user || !plan.id || !firestore) return;

    // Compare local notes with the plan's current state to see if anything changed
    let hasChanges = false;
    const updatedWeeklyBreakdown = plan.weeklyBreakdown.map(week => ({
        ...week,
        events: week.events.map((event: any) => {
            const key = `${event.summary}-${event.startDate}`;
            const currentNote = debouncedNotes[key] || '';
            if (event.notes !== currentNote) {
                hasChanges = true;
            }
            return { ...event, notes: currentNote };
        })
    }));

    if (!hasChanges) {
        if (saveStatus !== 'idle' && saveStatus !== 'saved') setSaveStatus('saved');
        return;
    }

    setSaveStatus('saving');
    try {
        const planRef = doc(firestore, 'users', user.uid, 'semesterPlans', plan.id);
        await updateDoc(planRef, { weeklyBreakdown: updatedWeeklyBreakdown });
        setSaveStatus('saved');
    } catch (e) {
        console.error("Failed to save notes:", e);
        setSaveStatus('idle');
    }
  }, [user, plan, firestore, debouncedNotes, saveStatus]);

  useEffect(() => {
    if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
    }
    handleAutoSaveNotes();
  }, [debouncedNotes, handleAutoSaveNotes]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if(saveStatus === 'saved') {
        timer = setTimeout(() => setSaveStatus('idle'), 2000);
    }
    return () => clearTimeout(timer);
  }, [saveStatus]);

  const nextEvent = useMemo(() => {
     if (!plan.weeklyBreakdown) return null;
     const now = new Date();
     const allEvents = plan.weeklyBreakdown
        .flatMap(week => week.events)
        .sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
     return allEvents.find(event => new Date(event.startDate) > now);
  }, [plan]);

  const handleSuggestConcepts = async () => {
    if (!nextEvent) return;
    setIsLoadingConcepts(true);
    setConcepts([]);
    try {
      const result = await suggestConceptsForEventAction({
        summary: nextEvent.summary,
        description: nextEvent.description
      });
      setConcepts(result.data.concepts);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingConcepts(false);
    }
  }

  const handleNoteChange = (key: string, value: string) => {
    setLocalNotes(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
        <div className="bg-slate-50/50 p-6 grid md:grid-cols-2 gap-6">
            <div className='p-4 bg-white rounded-xl border space-y-4'>
                <h4 className='font-bold text-sm text-amber-900 flex items-center gap-2'><BookOpen className="w-4 h-4"/>Hovedfag</h4>
                <div className="flex flex-wrap gap-2">
                    {plan.mainSubjects.map(s => <span key={s} className="bg-blue-50 text-blue-800 text-xs font-bold px-2 py-1 rounded">{s}</span>)}
                </div>
            </div>
            <div className='p-4 bg-white rounded-xl border space-y-4'>
                <h4 className='font-bold text-sm text-amber-900 flex items-center gap-2'><Lightbulb className="w-4 h-4"/>Studietips</h4>
                <p className='text-sm text-slate-700 italic'>{plan.studyTips}</p>
            </div>
            <div className='p-4 bg-white rounded-xl border space-y-4'>
                <h4 className='font-bold text-sm text-amber-900 flex items-center gap-2'><Clock className="w-4 h-4"/>Næste Aktivitet</h4>
                {nextEvent ? (
                    <div className="space-y-3">
                        <p className="font-semibold">{nextEvent.summary}</p>
                        <p className="text-xs">{new Date(nextEvent.startDate).toLocaleString('da-DK')}</p>
                        <div className="pt-3 border-t border-dashed">
                        <Button size="sm" variant="ghost" onClick={handleSuggestConcepts} disabled={isLoadingConcepts} className="text-xs">
                            {isLoadingConcepts ? <Loader2 className="w-3 h-3 mr-2 animate-spin"/> : <Sparkles className="w-3 h-3 mr-2"/>}
                            Foreslå forberedelse
                        </Button>
                        {concepts.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                                {concepts.map(c => <span key={c} className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">{c}</span>)}
                            </div>
                        )}
                        </div>
                    </div>
                ) : <p className="text-sm text-slate-500">Ingen kommende aktiviteter.</p>}
            </div>
            <div className='p-4 bg-white rounded-xl border space-y-4'>
                <h4 className='font-bold text-sm text-amber-900 flex items-center gap-2'><ListOrdered className="w-4 h-4"/>Personlig Studieplan</h4>
                <p className="text-xs text-slate-500">Brug din semesterplan til at generere en detaljeret uge-for-uge studieplan, der hjælper dig med at prioritere din tid.</p>
                <Button size="sm" onClick={() => onOpenModal(plan, savedSchedule)}>
                    {savedSchedule ? 'Se / Rediger Studieplan' : 'Lav Studieplan'}
                </Button>
            </div>
        </div>

        {/* Full activities view */}
        <div className="px-6 pb-8">
            <button 
                onClick={() => setShowAllEvents(!showAllEvents)}
                className="w-full flex items-center justify-between p-4 bg-white border border-amber-100 rounded-2xl hover:bg-amber-50 transition-all group"
            >
                <div className="flex items-center gap-3">
                    <Layout className="w-5 h-5 text-amber-700" />
                    <span className="font-bold text-amber-950">Se alle aktiviteter i semesteret</span>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showAllEvents ? 'rotate-180' : ''}`} />
            </button>
            
            {showAllEvents && (
                <div className="mt-6 space-y-8 animate-fade-in-up">
                    {plan.weeklyBreakdown.map((week) => (
                        <div key={week.weekNumber} className="space-y-4">
                            <div className="flex items-center gap-4">
                                <h4 className="text-sm font-black uppercase tracking-widest text-amber-900/40 px-2 whitespace-nowrap">Uge {week.weekNumber}</h4>
                                <div className="h-px w-full bg-amber-100/50"></div>
                            </div>
                            <div className="grid gap-3">
                                {week.events.map((event: any, i: number) => {
                                    const noteKey = `${event.summary}-${event.startDate}`;
                                    return (
                                        <div key={i} className="bg-white p-6 rounded-2xl border border-amber-50 shadow-sm flex flex-col gap-4 hover:border-amber-200 transition-colors">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 text-center flex-shrink-0">
                                                    <p className="text-[10px] font-black text-amber-700 uppercase">{new Date(event.startDate).toLocaleDateString('da-DK', { weekday: 'short' })}</p>
                                                    <p className="text-sm font-bold text-amber-950">{new Date(event.startDate).getDate()}.</p>
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <p className="text-sm font-bold text-amber-950 leading-tight truncate">{event.summary}</p>
                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                                                        <p className="text-[10px] text-slate-400 uppercase font-medium tracking-tight whitespace-nowrap">
                                                            {event.startTime && event.endTime ? `${event.startTime} - ${event.endTime}` : 'Heldags'}
                                                        </p>
                                                        {event.location && (
                                                            <>
                                                                <span className="text-[10px] text-slate-300">•</span>
                                                                <p className="text-[10px] text-slate-400 uppercase font-medium tracking-tight truncate">
                                                                    {event.location}
                                                                </p>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Notes Field */}
                                            <div className="relative group/note">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FileText className="w-3 h-3 text-slate-300" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Mine noter</span>
                                                </div>
                                                <Textarea 
                                                    placeholder="Tilføj forberedelse eller noter til denne aktivitet..."
                                                    value={localNotes[noteKey] || ''}
                                                    onChange={(e) => handleNoteChange(noteKey, e.target.value)}
                                                    className="bg-amber-50/30 border-amber-100 min-h-[80px] text-xs leading-relaxed focus:bg-white"
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                                {week.events.length === 0 && (
                                    <p className="text-xs text-slate-400 italic px-2">Ingen planlagte aktiviteter denne uge.</p>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    <div className="flex justify-end p-4 min-h-[40px] sticky bottom-0 bg-[#FDFCF8]/80 backdrop-blur-sm rounded-b-[2rem] border-t border-amber-50">
                        {saveStatus === 'saving' && <div className="flex items-center gap-2 text-xs text-slate-500"><Loader2 className="w-4 h-4 animate-spin"/> Gemmer noter...</div>}
                        {saveStatus === 'saved' && <div className="flex items-center gap-2 text-xs text-emerald-600"><CheckCircle className="w-4 h-4"/> Gemt!</div>}
                    </div>
                </div>
            )}
        </div>
    </div>
  )
}

function MineSemesterplanerPage() {
    const { user, userProfile } = useApp();
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();

    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [refreshingId, setRefreshingId] = useState<string | null>(null);
    const [initialExpansionDone, setInitialExpansionDone] = useState(false);
    
    const [showStudyScheduleModal, setShowStudyScheduleModal] = useState(false);
    const [currentPlanForModal, setCurrentPlanForModal] = useState<SavedSemesterPlan | null>(null);
    const [currentScheduleForModal, setCurrentScheduleForModal] = useState<SavedStudySchedule | null>(null);
    const [groupTitles, setGroupTitles] = useState<Record<string, string>>({});
    const [plans, setPlans] = useState<SavedSemesterPlan[]>([]);
    const [schedules, setSchedules] = useState<SavedStudySchedule[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user || !firestore) return;
        const q = query(collection(firestore, 'users', user.uid, 'semesterPlans'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snapshot) => {
            setPlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedSemesterPlan)));
            setIsLoading(false);
        });
        return () => unsub();
    }, [user, firestore]);

    useEffect(() => {
        if (!user || !firestore) return;
        const q = query(collection(firestore, 'users', user.uid, 'studySchedules'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snapshot) => {
            setSchedules(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedStudySchedule)));
        });
        return () => unsub();
    }, [user, firestore]);
    
    useEffect(() => {
        if (isLoading || initialExpansionDone) return; 

        if (plans && plans.length > 0) {
            const hash = typeof window !== 'undefined' ? window.location.hash : '';
            if (hash) {
                const id = hash.substring(1);
                const planExists = plans.some(p => p.id === id);
                if (planExists) {
                    setExpandedId(id);
                    setInitialExpansionDone(true);
                    return; 
                }
            }
            
            const now = new Date();
            let activePlanId: string | null = null;
            
            for (const plan of plans) {
                if (!plan.weeklyBreakdown || plan.id === 'latest') continue;
    
                let minDate: Date | null = null;
                let maxDate: Date | null = null;
    
                plan.weeklyBreakdown.forEach(week => {
                    week.events.forEach(event => {
                        const startDate = new Date(event.startDate);
                        let endDate = new Date(event.endDate);
                        
                        if (event.isMultiDay || !event.endTime) {
                            endDate.setUTCHours(23, 59, 59, 999);
                        }
    
                        if (!minDate || startDate < minDate) {
                            minDate = startDate;
                        }
                        if (!maxDate || endDate > maxDate) {
                            maxDate = endDate;
                        }
                    });
                });
    
                if (minDate && maxDate) {
                    minDate.setHours(0, 0, 0, 0);
                    maxDate.setHours(23, 59, 59, 999);
                    if (now >= minDate && now <= maxDate) {
                        activePlanId = plan.id;
                        break; 
                    }
                }
            }
    
            if (activePlanId) {
                setExpandedId(activePlanId);
            }
        }
    
        setInitialExpansionDone(true); 
    }, [plans, isLoading, initialExpansionDone]);
    
    const handleDelete = async (id: string) => {
        if (!user || !firestore || !window.confirm('Er du sikker på, du vil slette denne semesterplan og en eventuel tilknyttet studieplan? Denne handling kan ikke fortrydes.')) return;
        
        const planDocRef = doc(firestore, 'users', user.uid, 'semesterPlans', id);
        
        try {
            const batch = writeBatch(firestore);
            
            const studySchedulesColRef = collection(firestore, 'users', user.uid, 'studySchedules');
            const q = query(studySchedulesColRef, where("semesterPlanId", "==", id), limit(1));
            const associatedScheduleSnap = await getDocs(q);

            if (!associatedScheduleSnap.empty) {
                const scheduleDocRef = associatedScheduleSnap.docs[0].ref;
                batch.delete(scheduleDocRef);
            }

            batch.delete(planDocRef);
            await batch.commit();

            toast({
                title: "Semesterplan slettet",
                description: "Din semesterplan og en eventuel tilknyttet studieplan er blevet fjernet.",
            });
        } catch (error) {
            console.error("Error deleting plan: ", error);
            toast({
                variant: "destructive",
                title: "Fejl",
                description: "Kunne ikke slette semesterplanen.",
            });
        }
    };

    const handleRefreshPlan = async (oldPlan: SavedSemesterPlan) => {
        if (!user || !oldPlan.icalUrl || !firestore) return;

        setRefreshingId(oldPlan.id);
        try {
            const result = await generateSemesterPlanAction({ icalUrl: oldPlan.icalUrl });
            
            // Map notes from old events to the new events based on summary + date key
            const oldNotes: Record<string, string> = {};
            oldPlan.weeklyBreakdown.forEach(week => {
                week.events.forEach((event: any) => {
                    if (event.notes) {
                        const key = `${event.summary}-${event.startDate}`;
                        oldNotes[key] = event.notes;
                    }
                });
            });

            const newWeeklyBreakdown = result.data.weeklyBreakdown.map(week => ({
                ...week,
                events: week.events.map((event: any) => ({
                    ...event,
                    notes: oldNotes[`${event.summary}-${event.startDate}`] || ''
                }))
            }));

            const planRef = doc(firestore, 'users', user.uid, 'semesterPlans', oldPlan.id);
            const latestPlanRef = doc(firestore, 'users', user.uid, 'semesterPlans', 'latest');
            const latestPlanSnap = await getDoc(latestPlanRef);

            const batch = writeBatch(firestore);
            
            const dataToSave = {
                ...result.data,
                weeklyBreakdown: newWeeklyBreakdown,
                icalUrl: oldPlan.icalUrl,
                createdAt: serverTimestamp() 
            };

            batch.update(planRef, dataToSave);
            
            if (latestPlanSnap.exists() && latestPlanSnap.data()?.icalUrl === oldPlan.icalUrl) {
                batch.set(latestPlanRef, dataToSave, { merge: true });
            }
            
            await batch.commit();

            toast({
                title: "Plan Opdateret!",
                description: "Din semesterplan er blevet synkroniseret med din kalender, og dine noter er bevaret.",
            });

        } catch (err: any) {
            console.error("Error refreshing plan:", err);
            toast({
                variant: "destructive",
                title: "Fejl",
                description: "Kunne ikke opdatere planen. " + err.message,
            });
        } finally {
            setRefreshingId(null);
        }
    };
    
    const handleOpenStudyScheduleModal = (plan: SavedSemesterPlan, schedule?: SavedStudySchedule | null) => {
        setCurrentPlanForModal(plan);
        setCurrentScheduleForModal(schedule || null);
        setShowStudyScheduleModal(true);
    };

    const filteredPlans = useMemo(() => {
        return plans?.filter(p => p.id !== 'latest') ?? [];
    }, [plans]);
    
    const groupedPlans = useMemo(() => {
        if (!filteredPlans) return {};
        return filteredPlans.reduce((acc, plan) => {
            const date = plan.createdAt?.toDate();
            if (!date) return acc;
    
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; 
    
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(plan);
            return acc;
        }, {} as Record<string, SavedSemesterPlan[]>);
    }, [filteredPlans]);

    const sortedGroupKeys = useMemo(() => Object.keys(groupedPlans).sort((a, b) => b.localeCompare(a)), [groupedPlans]);

    useEffect(() => {
        const titles: Record<string, string> = {};
        sortedGroupKeys.forEach(groupKey => {
            const [year, month] = groupKey.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1);
            const newTitle = date.toLocaleString('da-DK', { month: 'long', year: 'numeric' });
            titles[groupKey] = newTitle.charAt(0).toUpperCase() + newTitle.slice(1);
        });
        setGroupTitles(titles);
    }, [sortedGroupKeys]);
    
    if (isLoading) {
        return <AuthLoadingScreen />;
    }

    return (
    <div className="bg-[#FDFCF8] min-h-screen selection:bg-amber-100">
      <header className="bg-white border-b border-amber-100 pt-20 pb-16 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-50 rounded-full blur-[100px] -mr-32 -mt-32 opacity-50"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="flex items-center gap-8">
                    <Link href="/portal" className="w-14 h-14 bg-white border border-amber-100 rounded-2xl flex items-center justify-center hover:bg-amber-50 transition-all shadow-sm group">
                        <ArrowLeft className="w-6 h-6 text-amber-950 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-1.5 bg-amber-50 rounded-lg">
                          <History className="w-4 h-4 text-amber-700" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-900/40">Studie-Arkivet</span>
                      </div>
                      <h1 className="text-5xl md:text-6xl font-bold text-amber-950 serif tracking-tighter">
                        Mine <span className="text-amber-700 italic">Semesterplaner</span>
                      </h1>
                    </div>
                </div>
                
                <Link href="/semester-planlaegger">
                    <button className="h-14 px-8 bg-amber-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-amber-900 transition-all shadow-xl shadow-amber-950/20 active:scale-95">
                        <Plus className="w-4 h-4"/> Ny Semesterplan
                    </button>
                </Link>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-20">
        {filteredPlans.length === 0 ? (
             <div className="py-32 text-center bg-white rounded-[4rem] border border-dashed border-amber-200 shadow-inner">
                <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-8">
                  <BookCopy className="w-10 h-10 text-amber-200" />
                </div>
                <h3 className="text-2xl font-bold text-amber-950 serif mb-2">Ingen planer endnu</h3>
                <p className="text-slate-400 max-w-xs mx-auto mb-10 leading-relaxed">Du har ikke oprettet nogen semesterplaner endnu. Start med at synkronisere din kalender.</p>
                <Link href="/semester-planlaegger">
                    <Button size="lg">Opret din første plan</Button>
                </Link>
             </div>
        ) : (
            <div className="space-y-20">
                {sortedGroupKeys.map((groupKey, groupIdx) => {
                    const plansInGroup = groupedPlans[groupKey];
                    if (plansInGroup.length === 0) return null;

                    return (
                        <section key={groupKey}>
                            <div className="flex items-center gap-4 mb-10">
                              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-amber-900/30">
                                  {groupTitles[groupKey]}
                              </h2>
                              <div className="h-px flex-1 bg-amber-100 opacity-50"></div>
                            </div>

                            <div className="grid gap-6">
                                {plansInGroup.map((plan) => {
                                    const savedSchedule = schedules?.find(s => s.semesterPlanId === plan.id);
                                    return (
                                        <div 
                                          key={plan.id} 
                                          id={plan.id}
                                          className={`bg-white rounded-[2.5rem] border transition-all duration-500 overflow-hidden scroll-mt-32 ${expandedId === plan.id ? 'border-amber-950 shadow-2xl ring-4 ring-amber-950/5' : 'border-amber-100 hover:border-amber-400 shadow-sm hover:shadow-xl'}`}
                                        >
                                            <div 
                                              className="p-8 md:p-10 flex flex-col md:flex-row justify-between items-center gap-8 cursor-pointer group" 
                                              onClick={() => setExpandedId(prev => prev === plan.id ? null : plan.id)}
                                            >
                                                <div className="flex items-center gap-8 flex-1">
                                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner ${expandedId === plan.id ? 'bg-amber-950 text-amber-100 rotate-6' : 'bg-amber-50 text-amber-700 group-hover:scale-110'}`}>
                                                      <Calendar className="w-8 h-8" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-2xl font-bold text-amber-950 serif leading-tight group-hover:text-amber-700 transition-colors">
                                                          {plan.title}
                                                        </h3>
                                                        <div className="flex items-center gap-4 mt-2">
                                                          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                            <Clock className="w-3 h-3" />
                                                            {plan.createdAt?.toDate().toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                          </div>
                                                          {savedSchedule && (
                                                            <>
                                                              <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                                                              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                                                                <CheckCircle className="w-3 h-3" />
                                                                Studieplan aktiv
                                                              </div>
                                                            </>
                                                          )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <button 
                                                      onClick={(e) => { e.stopPropagation(); handleRefreshPlan(plan); }}
                                                      disabled={refreshingId === plan.id}
                                                      className="p-4 bg-amber-50 text-amber-900 rounded-2xl opacity-0 group-hover:opacity-100 hover:bg-amber-100 transition-all active:scale-90 disabled:opacity-50"
                                                    >
                                                        {refreshingId === plan.id ? <RefreshCw className="w-5 h-5 animate-spin"/> : <RotateCcw className="w-5 h-5"/>}
                                                    </button>
                                                    <button 
                                                      onClick={(e) => { e.stopPropagation(); handleDelete(plan.id); }}
                                                      className="p-4 bg-rose-50 text-rose-600 rounded-2xl opacity-0 group-hover:opacity-100 hover:bg-rose-100 transition-all active:scale-90"
                                                    >
                                                        <Trash2 className="w-5 h-5"/>
                                                    </button>
                                                    <div className={`w-12 h-12 rounded-full border border-amber-100 flex items-center justify-center transition-all duration-500 ${expandedId === plan.id ? 'bg-amber-950 border-amber-950 text-white rotate-180' : 'bg-white text-slate-300 group-hover:border-amber-400 group-hover:text-amber-950'}`}>
                                                      <ChevronDown className="w-6 h-6" />
                                                    </div>
                                                </div>
                                            </div>
                                            {expandedId === plan.id && (
                                                <div className="animate-ink">
                                                  <PlanDetailView 
                                                    plan={plan} 
                                                    user={user} 
                                                    onOpenModal={handleOpenStudyScheduleModal} 
                                                    savedSchedule={savedSchedule} 
                                                  />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )
                })}
            </div>
        )}
      </main>

      {showStudyScheduleModal && (
          <StudyScheduleModal 
              plan={currentPlanForModal}
              savedSchedule={currentScheduleForModal}
              onClose={() => {
                  setShowStudyScheduleModal(false);
                  setCurrentPlanForModal(null);
                  setCurrentScheduleForModal(null);
              }}
          />
      )}
    </div>
    );
}

export default function MySemesterPlansPage() {
    const pathname = usePathname();
    return (
        <Suspense fallback={<AuthLoadingScreen />}>
            <MineSemesterplanerPage />
        </Suspense>
    );
}
