'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BookOpen, 
  ChevronRight, 
  ArrowLeft, 
  Search, 
  Clock, 
  Trash2, 
  Sparkles,
  Loader2,
  Filter,
  Layers,
  GraduationCap
} from 'lucide-react';
import { useApp } from '@/app/provider';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import AuthLoadingScreen from '@/components/AuthLoadingScreen';

export default function MineKurserPage() {
  const { user, isUserLoading } = useApp();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');

  const coursesQuery = user && firestore 
    ? query(collection(firestore, 'users', user.uid, 'courseDesigns'), orderBy('createdAt', 'desc'))
    : null;

  const { data: courses, isLoading } = useCollection<any>(coursesQuery);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Er du sikker på, at du vil slette dette kursus?')) return;
    if (!firestore || !user) return;

    try {
      await deleteDoc(doc(firestore, 'users', user.uid, 'courseDesigns', id));
      toast({ title: "Slettet", description: "Kurset er blevet fjernet." });
    } catch (err) {
      toast({ variant: 'destructive', title: "Fejl", description: "Kunne ikke slette kurset." });
    }
  };

  const filteredCourses = courses?.filter(c => 
    c.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.targetAudience.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isUserLoading) return <AuthLoadingScreen />;

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-slate-900 pb-40">
      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-md border-b border-amber-50 sticky top-0 z-40 px-8 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.push('/portal')}
              className="p-3 bg-white border border-amber-100 rounded-2xl hover:bg-amber-50 transition-all active:scale-95 shadow-sm"
            >
              <ArrowLeft className="w-6 h-6 text-amber-950" />
            </button>
            <div>
                 <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="w-4 h-4 text-amber-600" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-600">Dit Arkiv</p>
                 </div>
              <h1 className="text-4xl font-black text-amber-950 serif tracking-tighter">Mine Kurser</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="relative group w-full md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
                <input 
                  type="text"
                  placeholder="Søg i dine kurser..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 bg-white border border-amber-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-amber-50 outline-none transition-all"
                />
             </div>
             <Button 
                onClick={() => router.push('/kursus-designer')}
                className="h-14 px-8 rounded-2xl bg-amber-950 text-amber-400 font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all shrink-0"
             >
                Nyt Kursus
             </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-16">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="w-12 h-12 text-amber-950 animate-spin" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Henter dine kurser...</p>
          </div>
        ) : filteredCourses?.length === 0 ? (
          <div className="text-center py-40 space-y-8">
            <div className="w-24 h-24 bg-white border border-amber-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mx-auto shadow-sm">
                <Layers className="w-12 h-12" />
            </div>
            <div className="space-y-4">
                <h3 className="text-2xl font-black text-amber-950 serif">Ingen kurser endnu</h3>
                <p className="text-slate-500 max-w-sm mx-auto">Du har ikke designet nogle kurser endnu. Brug Arkitekten til at bygge dit første digitale forløb.</p>
            </div>
            <Button 
              onClick={() => router.push('/kursus-designer')}
              className="px-10 h-16 rounded-[2rem] bg-amber-950 text-amber-400 font-black uppercase tracking-widest"
            >
                Design dit første kursus
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <AnimatePresence>
              {filteredCourses?.map((course, idx) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => router.push(`/kursus/${course.id}`)}
                  className="group bg-white rounded-[3rem] border border-amber-50 p-8 shadow-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.04)] hover:-translate-y-2 transition-all duration-500 cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                    <GraduationCap className="w-32 h-32 text-amber-950 -rotate-12" />
                  </div>

                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-8">
                      <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm border border-amber-100 group-hover:scale-110 transition-transform">
                          <BookOpen className="w-7 h-7" />
                      </div>
                      <button 
                        onClick={(e) => handleDelete(e, course.id)}
                        className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                      >
                          <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">{course.targetAudience}</p>
                        <h2 className="text-2xl font-black text-amber-950 serif leading-tight line-clamp-2">{course.courseTitle}</h2>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                           <Layers className="w-4 h-4 text-slate-400" />
                           <span className="text-xs font-bold text-slate-500">{course.modules?.length} Moduler</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <Clock className="w-4 h-4 text-slate-400" />
                           <span className="text-xs font-bold text-slate-500">
                             {course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0)} Lektioner
                           </span>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-amber-50">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-3">Læringsmål</p>
                          <ul className="space-y-2">
                            {course.overallLearningOutcomes?.slice(0, 2).map((goal: string, gIdx: number) => (
                                <li key={gIdx} className="text-xs font-medium text-slate-500 flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
                                    <span className="line-clamp-1">{goal}</span>
                                </li>
                            ))}
                          </ul>
                      </div>
                    </div>

                    <div className="mt-10 flex items-center justify-between">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {course.createdAt?.toDate().toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}
                         </span>
                         <div className="flex items-center gap-2 text-amber-950 font-black text-[10px] uppercase tracking-widest group-hover:gap-4 transition-all">
                            Fortsæt <ChevronRight className="w-4 h-4" />
                         </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
