'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { useFirestore } from '@/firebase';
import { doc, getDoc, collection, query, where, getDocs, DocumentData } from 'firebase/firestore';
import { 
  ArrowLeft, 
  Presentation, 
  Tags, 
  Scale, 
  Wrench, 
  BrainCircuit, 
  CheckCircle,
  Calendar,
  X,
  BookOpen,
  ArrowRight,
  ArrowRight as ArrowRightIcon,
  Sparkles,
  Lock,
  Crown,
  ChevronRight,
  FolderOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Simple types shared with the main page
interface SavedSeminar extends DocumentData {
  id: string;
  overallTitle: string;
  category?: string;
  isShared?: boolean;
  slides: any[];
  createdAt: any;
}

// ---------------------------------------------------------------------------
// Shared Components
// ---------------------------------------------------------------------------

const sharedSeminarCardStyles = "flex flex-col h-full bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-2xl transition-all p-1 group relative overflow-hidden";

const SharedSeminarCard: React.FC<{ seminar: SavedSeminar; onOpen: () => void }> = ({ seminar, onOpen }) => {
  const totalConcepts = seminar.slides?.reduce((a, s) => a + (s.keyConcepts?.length || 0), 0) || 0;
  const date = seminar.createdAt?.toDate();

  return (
    <div className={sharedSeminarCardStyles} onClick={onOpen}>
      <div className="p-7 flex-1">
        <div className="flex items-start justify-between gap-3 mb-6">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-indigo-400 shadow-xl group-hover:rotate-6 transition-transform">
            <Presentation className="w-7 h-7" />
          </div>
        </div>
        <h3 className="text-xl font-black text-slate-900 serif leading-tight mb-2 truncate group-hover:text-indigo-800 transition-colors">{seminar.overallTitle}</h3>
        <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400 mt-auto">
          <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{date?.toLocaleDateString('da-DK')}</div>
          <div className="flex items-center gap-1.5 tracking-widest uppercase text-[10px]">{seminar.slides?.length || 0} Slides</div>
        </div>
      </div>
      <div className="px-7 py-5 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
         <div className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-indigo-400" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{totalConcepts} Begreber</span></div>
         <div className="flex items-center gap-2 text-indigo-600 font-black text-[11px] group-hover:translate-x-1 transition-transform">SE SLIDES <ChevronRight className="w-3.5 h-3.5" /></div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Shared Category Page
// ---------------------------------------------------------------------------

export default function SharedCategoryPage({ params }: { params: { name: string } }) {
  const { user, userProfile, isUserLoading } = useApp();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const [seminars, setSeminars] = useState<SavedSeminar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ownerId = searchParams?.get('o');
  const categoryName = decodeURIComponent(params.name);

  const isPremium = useMemo(() => {
    if (!userProfile) return false;
    if (userProfile.isQualified) return true;
    return ['Kollega+', 'Semesterpakken', 'Kollega++'].includes(userProfile.membership || '');
  }, [userProfile]);

  useEffect(() => {
    const fetchSharedCategory = async () => {
      if (!categoryName || !ownerId || !firestore) {
         setLoading(false);
         setError('Ugyldigt delingslink.');
         return;
      }

      try {
        // 1. Verify that the owner has shared this category
        const ownerProfileRef = doc(firestore, 'users', ownerId);
        const ownerSnap = await getDoc(ownerProfileRef);
        
        if (!ownerSnap.exists()) {
          setError('Brugeren blev ikke fundet.');
          setLoading(false);
          return;
        }

        const ownerData = ownerSnap.data();
        const isPubliclyShared = (ownerData.sharedCategories || []).includes(categoryName);
        const permissions = ownerData.sharedCategoriesPermissions?.[categoryName] || [];
        const isSpecificallyShared = permissions.includes(user?.uid);
        
        if (!isPubliclyShared && !isSpecificallyShared) {
          setError('Denne kategori er enten ikke længere delt, eller du har ikke adgang til den.');
          setLoading(false);
          return;
        }

        // 2. Fetch all seminars in this category
        const seminarsRef = collection(firestore, 'users', ownerId, 'seminars');
        const q = query(seminarsRef, where('category', '==', categoryName));
        const seminarSnap = await getDocs(q);
        
        const list = seminarSnap.docs.map(d => ({ id: d.id, ...d.data() } as SavedSeminar));
        // Sort by date newest first
        list.sort((a,b) => (b.createdAt?.toDate()?.getTime() || 0) - (a.createdAt?.toDate()?.getTime() || 0));
        
        setSeminars(list);
      } catch (err) {
        console.error(err);
        setError('Kunne ikke hente kategorien.');
      } finally {
        setLoading(false);
      }
    };

    if (!isUserLoading) {
      if (!user) {
        setLoading(false);
        return;
      }
      fetchSharedCategory();
    }
  }, [categoryName, ownerId, firestore, isUserLoading, user]);

  if (isUserLoading || loading) return <AuthLoadingScreen />;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-8 bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100">
          <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-white shadow-2xl">
              <Lock className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 leading-tight">Log ind for at se delte kategorier</h1>
          <p className="text-slate-500 font-medium">Du skal være medlem af Cohéro for at se fælles vidensbaser.</p>
          <Link href="/auth?mode=login" className="block w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all">Log ind nu</Link>
        </div>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-6 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-100/30 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="max-w-lg relative z-10 bg-white/80 backdrop-blur-2xl p-12 md:p-16 rounded-[4rem] border border-white shadow-2xl space-y-10">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-amber-50 text-amber-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner ring-4 ring-white">
              <Crown className="w-12 h-12" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-slate-900 leading-[1.1] tracking-tight">Kollega+ Adgang Påkrævet</h1>
            <p className="text-lg text-slate-500 font-medium leading-relaxed">Deling og adgang til kategorier er en eksklusiv funktion for Kollega+ medlemmer.</p>
          </div>
          <div className="pt-4 space-y-4">
            <Link href="/upgrade" className="flex items-center justify-center gap-3 w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-2xl shadow-slate-900/20">
              Opgrader nu <ArrowRightIcon className="w-4 h-4" />
            </Link>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Få fuld adgang til alle fælles ressourcer</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <X className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">{error}</h1>
          <p className="text-slate-400 font-medium">Linket er måske forældet, eller kategorien er ikke længere delt.</p>
          <Link href="/portal" className="inline-block px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px]">Tilbage til portalen</Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FDFCF8] flex flex-col pt-0">
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 md:py-20 lg:py-24">
        
        {/* Header */}
        <header className="mb-16 space-y-8">
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-6 flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-amber-200/40">
                    <FolderOpen className="w-3 h-3" /> Delt Kategori
                </div>
                <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight serif italic">{categoryName}</h1>
                <p className="text-slate-500 font-medium text-lg max-w-2xl">Her kan du se alle delte slides og analyser under kategorien <span className="text-slate-900 font-black">"{categoryName}"</span>.</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                 <div className="px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-sm font-black text-slate-900 uppercase tracking-widest">
                    {seminars.length} Seminarer
                 </div>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sidst opdateret {new Date().toLocaleDateString('da-DK')}</p>
              </div>
           </div>
        </header>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {seminars.map((s, i) => (
                <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                >
                    <Link href={`/shared/seminar/${s.id}?o=${ownerId}`}>
                        <SharedSeminarCard seminar={s} onOpen={() => {}} />
                    </Link>
                </motion.div>
            ))}
        </div>

        {seminars.length === 0 && (
            <div className="py-32 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-200">
                    <Presentation className="w-8 h-8" />
                </div>
                <p className="text-slate-400 font-medium italic">Der er ingen seminarer i denne kategori endnu.</p>
            </div>
        )}

        {/* Footer */}
        <footer className="mt-20 pt-16 border-t border-slate-100 text-center space-y-10">
            <div className="max-w-2xl mx-auto p-12 bg-slate-900 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                <h3 className="text-2xl font-black mb-4 tracking-tight leading-tight italic serif">Byg din egen vidensbase</h3>
                <p className="text-slate-400 font-medium leading-relaxed mb-10">Som Kollega+ medlem kan du uploade dine egne slides, få dem analyseret med AI, og organisere dem i professionelle kategorier som denne.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/upgrade" className="px-10 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-100 transition-all shadow-xl">
                        Opgrader til Kollega+
                    </Link>
                    <Link href="/portal" className="px-10 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-700 transition-all">
                        Gå til portalen
                    </Link>
                </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-200">Cohéro Vidensdeling &bull; Professional Edition</p>
        </footer>
      </div>
    </main>
  );
}
