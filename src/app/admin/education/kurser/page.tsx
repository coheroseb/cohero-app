'use client';

import React, { useState, useEffect } from 'react';
import { 
    Plus, 
    Search, 
    Filter, 
    MoreVertical, 
    Edit, 
    Trash2, 
    Eye, 
    GraduationCap, 
    Clock, 
    Layers, 
    CheckCircle2, 
    AlertCircle, 
    ChevronRight,
    ArrowLeft,
    Image as ImageIcon,
    Video,
    List,
    Save,
    X,
    GripVertical,
    Activity,
    Target,
    Loader2 as LoaderIcon,
    Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { generateCourseAction, generateLearningObjectivesAction } from '@/app/actions';
import * as pdfjs from 'pdfjs-dist';
import PizZip from 'pizzip';
import Link from 'next/link';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
}

// --- TYPES ---
interface Lesson {
    id: string;
    title: string;
    type: 'standard' | 'quiz' | 'reading';
    content?: string;
    videoUrl?: string;
    duration?: string;
    questions?: {
        id: string;
        question: string;
        options: string[];
        correctAnswer: number;
        explanation?: string;
    }[];
}

interface Course {
    id: string;
    title: string;
    description: string;
    level: 'Socialrådgiver-niveau' | 'Jurist-niveau' | 'Avanceret';
    imageUrl: string;
    duration: string;
    status: 'draft' | 'published' | 'coming-soon';
    isPremium?: boolean;
    learningObjectives?: string[];
    lessons: Lesson[];
    createdAt: any;
    updatedAt: any;
}

// --- MAIN COMPONENT ---
export default function CoursesAdminPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isMagicImporting, setIsMagicImporting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // Fetch Courses
    const coursesQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'courses'), orderBy('createdAt', 'desc')) : null), [firestore]);
    const { data: courses, isLoading: isCoursesLoading } = useCollection<Course>(coursesQuery);

    const filteredCourses = (courses || []).filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateNew = () => {
        setSelectedCourse({
            id: '',
            title: '',
            description: '',
            level: 'Socialrådgiver-niveau',
            imageUrl: '',
            duration: '',
            status: 'draft',
            isPremium: false,
            learningObjectives: [],
            lessons: [],
            createdAt: null,
            updatedAt: null
        });
        setIsEditing(true);
    };

    const handleEdit = (course: Course) => {
        setSelectedCourse({ ...course });
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Er du sikker på, at du vil slette dette kursus?')) return;
        try {
            await deleteDoc(doc(firestore!, 'courses', id));
            toast({ title: "Slettet", description: "Kurset er blevet slettet." });
        } catch (err) {
            toast({ variant: "destructive", title: "Fejl", description: "Kunne ikke slette kurset." });
        }
    };

    const handleSave = async () => {
        if (!selectedCourse?.title) return toast({ variant: "destructive", title: "Fejl", description: "Titel er påkrævet." });
        
        setIsLoading(true);
        try {
            const data = {
                ...selectedCourse,
                updatedAt: serverTimestamp(),
                createdAt: selectedCourse.id ? selectedCourse.createdAt : serverTimestamp()
            };

            if (selectedCourse.id) {
                await updateDoc(doc(firestore!, 'courses', selectedCourse.id), data);
                toast({ title: "Opdateret", description: "Ændringerne er gemt." });
            } else {
                const docRef = await addDoc(collection(firestore!, 'courses'), data);
                setSelectedCourse(prev => prev ? { ...prev, id: docRef.id } : null);
                toast({ title: "Oprettet", description: "Kurset er blevet oprettet." });
            }
            setIsEditing(false);
        } catch (err) {
            toast({ variant: "destructive", title: "Fejl", description: "Kunne ikke gemme kurset." });
        } finally {
            setIsLoading(false);
        }
    };

    const addLesson = () => {
        if (!selectedCourse) return;
        const newLesson: Lesson = {
            id: Math.random().toString(36).substr(2, 9),
            title: 'Ny Lektion',
            type: 'standard',
            content: '',
            duration: '15 min',
            questions: []
        };
        setSelectedCourse({ ...selectedCourse, lessons: [...selectedCourse.lessons, newLesson] });
    };

    const handleMagicImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsMagicImporting(true);
        const toastId = toast({ title: "Magisk Import", description: "Læser fil og designer kursus... Vent venligst.", duration: 30000 });

        try {
            let extractedText = "";
            
            if (file.type === "application/pdf") {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map((item: any) => item.str).join(' ');
                    extractedText += pageText + '\n';
                }
            } else if (file.name.endsWith(".pptx") || file.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation") {
                const arrayBuffer = await file.arrayBuffer();
                const zip = new PizZip(arrayBuffer);
                const slides = zip.file(/ppt\/slides\/slide[0-9]+\.xml/);
                
                for (const slide of slides) {
                    const xmlText = slide.asText();
                    const matches = xmlText.match(/<a:t>([^<]+)<\/a:t>/g);
                    if (matches) {
                        const slideText = matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
                        extractedText += slideText + '\n';
                    }
                }
            } else {
                throw new Error("Kun PDF og PowerPoint (.pptx) understøttes.");
            }

            // For OCR support: Send the file data if it's a PDF
            let mediaFiles: any[] = [];
            if (file.type === "application/pdf") {
                const reader = new FileReader();
                const fileBase64 = await new Promise<string>((resolve) => {
                    reader.onload = () => {
                        const res = reader.result as string;
                        resolve(res.split(',')[1]); // Remove data:application/pdf;base64,
                    };
                    reader.readAsDataURL(file);
                });
                mediaFiles.push({ data: fileBase64, mimeType: file.type });
            }

            const result = await generateCourseAction({
                slideText: extractedText,
                selectedLaws: [],
                semester: "Socialrådgiveruddannelsen",
                profession: "Socialrådgiver",
                media: mediaFiles.length > 0 ? mediaFiles : undefined
            });

            if (result.data) {
                const design = result.data;
                const newLessons: Lesson[] = [];

                // Flatten modules into lessons
                design.modules.forEach(module => {
                    module.lessons.forEach(l => {
                        // 1. Text/Main Lesson
                        const mainContent = (l.sections || []).map(s => `<h3>${s.title}</h3><p>${s.content}</p>`).join('');
                        newLessons.push({
                            id: Math.random().toString(36).substr(2, 9),
                            title: l.title,
                            type: 'standard',
                            content: mainContent || l.contentSummary,
                            duration: l.duration || '15 min',
                            questions: []
                        });

                        // 2. Quiz Lesson (if AI generated quiz for this lesson)
                        if (l.interactiveElements?.quiz && l.interactiveElements.quiz.length > 0) {
                            newLessons.push({
                                id: Math.random().toString(36).substr(2, 9),
                                title: `Quiz: ${l.title}`,
                                type: 'quiz',
                                duration: '5 min',
                                questions: l.interactiveElements.quiz.map(q => ({
                                    id: Math.random().toString(36).substr(2, 9),
                                    question: q.question,
                                    options: q.options,
                                    correctAnswer: q.correctOptionIndex,
                                    explanation: q.explanation
                                }))
                            });
                        }
                    });
                });

                setSelectedCourse({
                    id: '',
                    title: design.courseTitle,
                    description: design.overallLearningOutcomes.join('. '),
                    level: 'Socialrådgiver-niveau',
                    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2670&auto=format&fit=crop',
                    duration: '2 timer',
                    status: 'draft',
                    isPremium: false,
                    learningObjectives: design.overallLearningOutcomes,
                    lessons: newLessons,
                    createdAt: null,
                    updatedAt: null
                });
                setIsEditing(true);
                toast({ title: "Success!", description: "Kursus designet færdigt med AI." });
            }
        } catch (err: any) {
            console.error(err);
            toast({ variant: "destructive", title: "Fejl ved import", description: err.message || "Kunne ikke generere kursus." });
        } finally {
            setIsMagicImporting(false);
        }
    };

    const addQuestion = (lessonIdx: number) => {
        if (!selectedCourse) return;
        const newLessons = [...selectedCourse.lessons];
        const newQuestion = {
            id: Math.random().toString(36).substr(2, 9),
            question: '',
            options: ['', '', '', ''],
            correctAnswer: 0
        };
        newLessons[lessonIdx].questions = [...(newLessons[lessonIdx].questions || []), newQuestion];
        setSelectedCourse({ ...selectedCourse, lessons: newLessons });
    };

    if (isEditing && selectedCourse) {
        return (
            <div className="max-w-5xl mx-auto space-y-12 animate-ink pb-20">
                <header className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => setIsEditing(false)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 serif tracking-tight">
                                {selectedCourse.id ? 'Rediger Kursus' : 'Nyt Kursus'}
                            </h1>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Design og strukturér dit kursusindhold</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => setIsEditing(false)}>Annuller</Button>
                        <Button onClick={handleSave} disabled={isLoading} className="rounded-2xl h-12 px-8 bg-indigo-600 text-white shadow-xl shadow-indigo-600/20">
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Gem Kursus
                        </Button>
                    </div>
                </header>

                <div className="grid lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-7 space-y-12">
                        {/* Basis Info */}
                        <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
                            <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                                <Plus className="w-5 h-5 text-indigo-600" />
                                <h3 className="text-lg font-black text-slate-900 serif uppercase tracking-tight">Grundlæggende Information</h3>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Kursus Titel</label>
                                    <Input 
                                        placeholder="F.eks. Introduktion til Barnets Lov" 
                                        value={selectedCourse.title}
                                        onChange={(e) => setSelectedCourse({ ...selectedCourse, title: e.target.value })}
                                        className="h-14 rounded-2xl border-slate-100 font-bold text-lg"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Beskrivelse</label>
                                    <textarea 
                                        placeholder="Kort beskrivelse af kurset..." 
                                        value={selectedCourse.description}
                                        onChange={(e) => setSelectedCourse({ ...selectedCourse, description: e.target.value })}
                                        className="w-full min-h-[120px] p-4 rounded-2xl border border-slate-100 font-medium text-sm outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Sværhedsgrad</label>
                                        <select 
                                            value={selectedCourse.level}
                                            onChange={(e) => setSelectedCourse({ ...selectedCourse, level: e.target.value as any })}
                                            className="w-full h-14 px-4 rounded-2xl border border-slate-100 font-bold text-sm bg-white outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all"
                                        >
                                            <option value="Socialrådgiver-niveau">Socialrådgiver-niveau</option>
                                            <option value="Jurist-niveau">Jurist-niveau</option>
                                            <option value="Avanceret">Avanceret (Ekspert)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Varighed (tekst)</label>
                                        <Input 
                                            placeholder="F.eks. 2 timer" 
                                            value={selectedCourse.duration}
                                            onChange={(e) => setSelectedCourse({ ...selectedCourse, duration: e.target.value })}
                                            className="h-14 rounded-2xl border-slate-100 font-bold"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
                            <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                                <div className="flex items-center gap-3">
                                    <Target className="w-5 h-5 text-amber-600" />
                                    <h3 className="text-lg font-black text-slate-900 serif uppercase tracking-tight">Det lærer du</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        className="text-amber-600 font-black uppercase text-[10px] gap-2 hover:bg-amber-50"
                                        disabled={isGenerating || !selectedCourse.lessons || selectedCourse.lessons.length === 0}
                                        onClick={async () => {
                                            if (isGenerating || !selectedCourse.lessons || selectedCourse.lessons.length === 0) return;
                                            setIsGenerating(true);
                                            try {
                                                const res = await generateLearningObjectivesAction({
                                                    courseTitle: selectedCourse.title,
                                                    courseDescription: selectedCourse.description,
                                                    lessons: selectedCourse.lessons.map(l => ({
                                                        title: l.title,
                                                        type: l.type,
                                                        summary: l.content?.slice(0, 500)
                                                    }))
                                                });
                                                if (res.data?.objectives) {
                                                    setSelectedCourse({ ...selectedCourse, learningObjectives: res.data.objectives });
                                                    toast({ title: "Tryllekraft gennemført!", description: "Læringsmål er genereret ud fra dine lektioner." });
                                                }
                                            } catch (err) {
                                                console.error("AI Generation failed:", err);
                                                toast({ title: "Fejl", description: "Kunne ikke generere læringsmål.", variant: "destructive" });
                                            } finally {
                                                setIsGenerating(false);
                                            }
                                        }}
                                    >
                                        {isGenerating ? <LoaderIcon className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                        {isGenerating ? "Tryller..." : "Tryllekraft"}
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        className="text-amber-600 font-black uppercase text-[10px]"
                                        onClick={() => {
                                            const objectives = [...(selectedCourse.learningObjectives || [])];
                                            objectives.push("");
                                            setSelectedCourse({ ...selectedCourse, learningObjectives: objectives });
                                        }}
                                    >
                                        Tilføj Mål
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {(selectedCourse.learningObjectives || []).map((obj, idx) => (
                                    <div key={idx} className="flex gap-4 items-start">
                                        <div className="mt-4 w-2 h-2 rounded-full bg-amber-200 shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <textarea 
                                                value={obj}
                                                onChange={(e) => {
                                                    const objectives = [...(selectedCourse.learningObjectives || [])];
                                                    objectives[idx] = e.target.value;
                                                    setSelectedCourse({ ...selectedCourse, learningObjectives: objectives });
                                                    console.log("Updated objectives:", objectives);
                                                }}
                                                placeholder="Skriv hvad man lærer..."
                                                className="w-full p-4 rounded-2xl border border-slate-100 font-medium text-sm min-h-[80px] outline-none focus:ring-4 focus:ring-amber-600/5 transition-all"
                                            />
                                        </div>
                                        <button 
                                            onClick={() => {
                                                const objectives = selectedCourse.learningObjectives?.filter((_, i) => i !== idx);
                                                setSelectedCourse({ ...selectedCourse, learningObjectives: objectives });
                                            }}
                                            className="mt-4 p-2 text-slate-200 hover:text-rose-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {(!selectedCourse.learningObjectives || selectedCourse.learningObjectives.length === 0) && (
                                    <div className="text-center py-12 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                                        <p className="text-slate-400 font-medium text-sm">Tilføj punkter for at vise hvad man lærer i kurset.</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Lessons / Curriculum */}
                        <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
                            <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                                <div className="flex items-center gap-3">
                                    <List className="w-5 h-5 text-indigo-600" />
                                    <h3 className="text-lg font-black text-slate-900 serif uppercase tracking-tight">Lektioner / Curriculum</h3>
                                </div>
                                <Button onClick={addLesson} variant="outline" className="rounded-xl border-indigo-100 text-indigo-600 hover:bg-indigo-50">
                                    <Plus className="w-4 h-4 mr-2" /> Tilføj Lektion
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {selectedCourse.lessons.length === 0 ? (
                                    <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-[2rem] space-y-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto"><List className="w-6 h-6" /></div>
                                        <p className="text-sm text-slate-400 font-medium italic">Ingen lektioner tilføjet endnu.</p>
                                    </div>
                                ) : (
                                    selectedCourse.lessons.map((lesson, idx) => (
                                        <div key={lesson.id} className="group p-6 bg-slate-50 border border-slate-100 rounded-[2rem] space-y-6 relative hover:bg-white hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-900/5 transition-all">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400">{idx + 1}</div>
                                                    <Input 
                                                        placeholder="Lektionens titel" 
                                                        value={lesson.title}
                                                        onChange={(e) => {
                                                            const newLessons = [...selectedCourse.lessons];
                                                            newLessons[idx].title = e.target.value;
                                                            setSelectedCourse({ ...selectedCourse, lessons: newLessons });
                                                        }}
                                                        className="h-10 bg-transparent border-none shadow-none font-bold text-slate-900 focus:ring-0 text-base p-0"
                                                    />
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        const newLessons = selectedCourse.lessons.filter((_, i) => i !== idx);
                                                        setSelectedCourse({ ...selectedCourse, lessons: newLessons });
                                                    }}
                                                    className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            
                                            <div className="space-y-6">
                                                <div className="flex gap-4">
                                                    <div className="flex-1 space-y-2">
                                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Lektion Type</label>
                                                        <select 
                                                            value={lesson.type}
                                                            onChange={(e) => {
                                                                const newLessons = [...selectedCourse.lessons];
                                                                newLessons[idx].type = e.target.value as any;
                                                                setSelectedCourse({ ...selectedCourse, lessons: newLessons });
                                                            }}
                                                            className="w-full h-10 px-3 rounded-xl border border-slate-100 font-bold text-xs bg-white outline-none"
                                                        >
                                                            <option value="standard">Standard (Video + Tekst)</option>
                                                            <option value="quiz">Quiz / Test</option>
                                                            <option value="reading">Læsning / Teori</option>
                                                        </select>
                                                    </div>
                                                    <div className="w-32 space-y-2">
                                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Varighed</label>
                                                        <Input 
                                                            value={lesson.duration || ''}
                                                            onChange={(e) => {
                                                                const newLessons = [...selectedCourse.lessons];
                                                                newLessons[idx].duration = e.target.value;
                                                                setSelectedCourse({ ...selectedCourse, lessons: newLessons });
                                                            }}
                                                            className="h-10 rounded-xl"
                                                        />
                                                    </div>
                                                </div>

                                                {lesson.type === 'quiz' ? (
                                                    <div className="space-y-6 pt-4">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Spørgsmål</h4>
                                                            <Button onClick={() => addQuestion(idx)} variant="ghost" className="text-indigo-600 text-[10px] uppercase font-black">Tilføj Spørgsmål</Button>
                                                        </div>
                                                        <div className="space-y-8">
                                                            {(lesson.questions || []).map((q, qIdx) => (
                                                                <div key={q.id} className="p-6 bg-white border border-slate-100 rounded-2xl space-y-4 shadow-sm relative group/q">
                                                                    <button 
                                                                        onClick={() => {
                                                                            const newLessons = [...selectedCourse.lessons];
                                                                            newLessons[idx].questions = newLessons[idx].questions?.filter(question => question.id !== q.id);
                                                                            setSelectedCourse({ ...selectedCourse, lessons: newLessons });
                                                                        }}
                                                                        className="absolute top-4 right-4 p-2 text-slate-200 hover:text-rose-500 opacity-0 group-hover/q:opacity-100 transition-opacity"
                                                                    >
                                                                        <X className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <div className="space-y-2">
                                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Spørgsmål {qIdx + 1}</label>
                                                                        <Input 
                                                                            value={q.question}
                                                                            onChange={(e) => {
                                                                                const newLessons = [...selectedCourse.lessons];
                                                                                const newQuestions = [...(newLessons[idx].questions || [])];
                                                                                newQuestions[qIdx].question = e.target.value;
                                                                                newLessons[idx].questions = newQuestions;
                                                                                setSelectedCourse({ ...selectedCourse, lessons: newLessons });
                                                                            }}
                                                                            className="h-10 border-slate-100 font-bold"
                                                                        />
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        {q.options.map((opt, optIdx) => (
                                                                            <div key={optIdx} className="flex items-center gap-2">
                                                                                <input 
                                                                                    type="radio" 
                                                                                    checked={q.correctAnswer === optIdx}
                                                                                    onChange={() => {
                                                                                        const newLessons = [...selectedCourse.lessons];
                                                                                        const newQuestions = [...(newLessons[idx].questions || [])];
                                                                                        newQuestions[qIdx].correctAnswer = optIdx;
                                                                                        newLessons[idx].questions = newQuestions;
                                                                                        setSelectedCourse({ ...selectedCourse, lessons: newLessons });
                                                                                    }}
                                                                                    className="accent-indigo-600"
                                                                                />
                                                                                <Input 
                                                                                    value={opt}
                                                                                    onChange={(e) => {
                                                                                        const newLessons = [...selectedCourse.lessons];
                                                                                        const newQuestions = [...(newLessons[idx].questions || [])];
                                                                                        newQuestions[qIdx].options[optIdx] = e.target.value;
                                                                                        newLessons[idx].questions = newQuestions;
                                                                                        setSelectedCourse({ ...selectedCourse, lessons: newLessons });
                                                                                    }}
                                                                                    className="h-9 text-xs border-indigo-50"
                                                                                    placeholder={`Svarmulighed ${optIdx + 1}`}
                                                                                />
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-6">
                                                        <textarea 
                                                            placeholder={lesson.type === 'reading' ? "Indsæt den teoretiske tekst her..." : "Kort beskrivelse til videoen..."} 
                                                            value={lesson.content}
                                                            onChange={(e) => {
                                                                const newLessons = [...selectedCourse.lessons];
                                                                newLessons[idx].content = e.target.value;
                                                                setSelectedCourse({ ...selectedCourse, lessons: newLessons });
                                                            }}
                                                            className="w-full min-h-[120px] p-4 bg-white border border-slate-100 rounded-xl text-xs font-medium outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all"
                                                        />
                                                        {lesson.type === 'standard' && (
                                                            <div className="relative">
                                                                <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                                <Input 
                                                                    placeholder="Video URL (Vimeo/Youtube)" 
                                                                    value={lesson.videoUrl || ''}
                                                                    onChange={(e) => {
                                                                        const newLessons = [...selectedCourse.lessons];
                                                                        newLessons[idx].videoUrl = e.target.value;
                                                                        setSelectedCourse({ ...selectedCourse, lessons: newLessons });
                                                                    }}
                                                                    className="pl-10 h-10 rounded-xl bg-white border-slate-100 text-[11px]"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>

                    <div className="lg:col-span-5 space-y-12">
                        {/* Publish & Status */}
                        <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
                            <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                                <Activity className="w-5 h-5 text-indigo-600" />
                                <h3 className="text-lg font-black text-slate-900 serif uppercase tracking-tight">Status & Synlighed</h3>
                            </div>
                            
                            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-900">Udgivelsesstatus</p>
                                    <p className="text-[10px] text-slate-400 font-medium">Hvem kan se dette kursus?</p>
                                </div>
                                <select 
                                    value={selectedCourse.status}
                                    onChange={(e) => setSelectedCourse({ ...selectedCourse, status: e.target.value as any })}
                                    className="px-4 py-2 rounded-xl border border-slate-200 font-black uppercase text-[10px] tracking-widest bg-white outline-none"
                                >
                                    <option value="draft">Kladde</option>
                                    <option value="published">Offentlig</option>
                                    <option value="coming-soon">Kommer snart</option>
                                </select>
                            </div>

                            <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-amber-950">Kollega+ Eksklusivt</p>
                                    <p className="text-[10px] text-amber-600 font-medium">Kræver betalt medlemskab</p>
                                </div>
                                <button 
                                    onClick={() => setSelectedCourse({ ...selectedCourse, isPremium: !selectedCourse.isPremium })}
                                    className={`w-12 h-6 rounded-full transition-all relative ${selectedCourse.isPremium ? 'bg-amber-600' : 'bg-slate-200'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${selectedCourse.isPremium ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <ImageIcon className="w-3.5 h-3.5" /> Cover Billede URL
                                </div>
                                <Input 
                                    placeholder="https://images.unsplash.com/..." 
                                    value={selectedCourse.imageUrl}
                                    onChange={(e) => setSelectedCourse({ ...selectedCourse, imageUrl: e.target.value })}
                                    className="h-12 rounded-xl border-slate-100"
                                />
                                {selectedCourse.imageUrl && (
                                    <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-100 shadow-inner">
                                        <img src={selectedCourse.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="bg-indigo-950 p-10 rounded-[3rem] text-white space-y-6 shadow-2xl relative overflow-hidden group">
                            <Sparkles className="absolute top-0 right-0 w-32 h-32 text-white/5 -translate-y-4 translate-x-4" />
                            <div className="relative z-10 space-y-4">
                                <h4 className="text-xl font-bold serif">Tips til struktur</h4>
                                <ul className="space-y-3">
                                    {[
                                        'Hold lektioner under 15 min.',
                                        'Brug fængende titler.',
                                        'Inkludér både video og tekst.',
                                        'Slut af med en quiz.'
                                    ].map((tip, i) => (
                                        <li key={i} className="flex items-center gap-3 text-xs font-medium text-indigo-200">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                            {tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 animate-ink pb-20">
            <header className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-900/20">
                        <GraduationCap className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 serif tracking-tight">Kursus Management</h1>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Design og administrer Cohero Akademiet</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Søg i kurser..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all w-64 shadow-sm" 
                        />
                    </div>
                    <div className="relative">
                        <input 
                            type="file" 
                            id="magic-import" 
                            className="hidden" 
                            accept=".pdf,.pptx"
                            onChange={handleMagicImport}
                            disabled={isMagicImporting}
                        />
                        <Button 
                            asChild
                            disabled={isMagicImporting}
                            className="rounded-2xl h-12 px-6 bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100 shadow-none transition-all cursor-pointer"
                        >
                            <label htmlFor="magic-import" className="flex items-center cursor-pointer">
                                {isMagicImporting ? <LoaderIcon className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                Magisk Import (PDF/PPT)
                            </label>
                        </Button>
                    </div>
                    <Button onClick={handleCreateNew} className="rounded-2xl h-12 px-8 bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 hover:scale-[1.02] transition-transform">
                        <Plus className="w-4 h-4 mr-2" /> Opret Kursus
                    </Button>
                </div>
            </header>

            {isCoursesLoading ? (
                <div className="h-96 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
                </div>
            ) : filteredCourses.length === 0 ? (
                <div className="h-96 flex flex-col items-center justify-center space-y-6 bg-white border border-slate-100 rounded-[4rem] text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-300 shadow-inner"><GraduationCap className="w-10 h-10" /></div>
                    <div>
                        <p className="text-xl font-bold text-slate-900 serif">Ingen kurser fundet</p>
                        <p className="text-sm text-slate-400 font-medium mt-1">Opret dit første kursus for at komme i gang.</p>
                    </div>
                    <Button onClick={handleCreateNew} variant="outline" className="rounded-2xl border-indigo-100 text-indigo-600">Start her</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredCourses.map((course) => (
                        <div key={course.id} className="group bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-2xl hover:shadow-indigo-900/5 transition-all duration-500 flex flex-col">
                            <div className="h-48 relative overflow-hidden">
                                <img src={course.imageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2670&auto=format&fit=crop'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={course.title} />
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md border ${
                                        course.status === 'published' ? 'bg-emerald-500/20 text-emerald-100 border-emerald-500/20' : 
                                        course.status === 'coming-soon' ? 'bg-amber-500/20 text-amber-100 border-amber-500/20' : 
                                        'bg-slate-900/20 text-white border-white/20'
                                    }`}>
                                        {course.status === 'published' ? 'Live' : course.status === 'coming-soon' ? 'Kommer' : 'Kladde'}
                                    </div>
                                </div>
                                <div className="absolute bottom-4 left-4">
                                    <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[9px] font-black uppercase text-white border border-white/10">{course.level}</span>
                                </div>
                            </div>
                            <div className="p-8 space-y-6 flex-1 flex flex-col">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 serif group-hover:text-indigo-600 transition-colors line-clamp-1">{course.title}</h3>
                                    <p className="text-sm text-slate-400 font-medium line-clamp-2 mt-2 leading-relaxed">{course.description}</p>
                                </div>
                                
                                <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400"><Clock className="w-3.5 h-3.5" /> {course.duration}</div>
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400"><List className="w-3.5 h-3.5" /> {course.lessons?.length || 0} Lektioner</div>
                                </div>

                                <div className="flex items-center gap-3 pt-6 mt-auto">
                                    <Button onClick={() => handleEdit(course)} className="flex-1 rounded-xl h-12 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border-none shadow-none transition-all">
                                        Rediger
                                    </Button>
                                    <Button onClick={() => handleDelete(course.id)} variant="ghost" className="w-12 h-12 p-0 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all">
                                        <Trash2 className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// --- LOADING SPINNER ---
function Loader2({ className }: { className?: string }) {
    return <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className={className}><Activity className="w-full h-full" /></motion.div>;
}
