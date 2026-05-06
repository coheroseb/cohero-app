'use client';

import React, { useMemo } from 'react';
import { 
  GraduationCap, 
  Flame, 
  Target, 
  CalendarDays,
  Building,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '@/app/provider';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

function getSemNum(semester: string): number {
  return parseInt(semester?.match(/\d+/)?.[0] ?? '1');
}

export default function NativePortal() {
  const { userProfile } = useApp();
  const firestore = useFirestore();

  // --- Curriculum / Module Identification ---
  const curriculumsQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile?.profession) return null;
    return query(
      collection(firestore, 'curriculums'),
      where('profession', '==', userProfile.profession)
    );
  }, [firestore, userProfile?.profession]);

  const { data: curriculumsRaw } = useCollection<any>(curriculumsQuery);

  const curriculum = useMemo(() => {
    if (userProfile?.customCurriculum) {
      return userProfile.customCurriculum;
    }
    if (!curriculumsRaw || curriculumsRaw.length === 0) return null;

    const currentSemId = userProfile?.semester;
    
    if (currentSemId && (currentSemId.length > 2 || isNaN(parseInt(currentSemId)))) {
       const containingCurriculum = curriculumsRaw.find((c: any) => 
         c.modules?.some((m: any) => String(m.id) === String(currentSemId))
       );
       if (containingCurriculum) return containingCurriculum;
    }

    const userInst = (userProfile?.institution || '').toLowerCase().trim();
    const studyStarted = userProfile?.studyStarted;

    const normalize = (s: string) => {
      let res = s.toLowerCase()
        .replace(/professionshøjskolen\s+/gs, '')
        .replace(/university college\s+/gs, '')
        .replace(/erhvervsakademi og professionshøjskole\s+/gs, '')
        .replace(/professionshøjskole\s+/gs, '')
        .replace(/\bsjælland\b/g, 'absalon')
        .trim();
      const mapping: Record<string, string> = {
        'københavns professionshøjskole': 'kp', 'københavn': 'kp', 'københavns': 'kp',
        'professionshøjskolen absalon': 'absalon', 'lillebælt': 'ucl',
        'erhvervsakademi lillebælt': 'ucl', 'ucl erhvervsakademi og professionshøjskole': 'ucl'
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
    const instMatches = curriculumsRaw.filter((c: any) => {
      const nInst = normalize(c.institution || '');
      return nInst === normalizedUserInst || nInst.includes(normalizedUserInst) || normalizedUserInst.includes(nInst);
    });

    if (instMatches.length === 0) return null;
    if (studyStarted) {
      const dateMatch = instMatches.find((c: any) => (!c.validFrom || studyStarted >= c.validFrom) && (!c.validTo || studyStarted < c.validTo));
      if (dateMatch) return dateMatch;
    }
    return instMatches[0];
  }, [curriculumsRaw, userProfile?.studyStarted, userProfile?.institution, userProfile?.customCurriculum]);

  const activeModule = useMemo(() => {
    if (!curriculum) return null;
    const currentSem = userProfile?.semester || '1';
    const semNum = getSemNum(currentSem);
    const isSimpleNumber = /^\d+$/.test(currentSem.trim());
    
    let found = curriculum.modules.find((m: any) => String(m.id) === String(currentSem));
    
    if (!found) {
      found = curriculum.modules.find((m: any) => String(m.name).toLowerCase() === currentSem.toLowerCase());
    }
    
    if (!found) {
      found = curriculum.modules.find((m: any) => String(m.name).toLowerCase().includes(currentSem.toLowerCase()));
    }
    
    if (!found && isSimpleNumber) {
      found = curriculum.modules.find((m: any) => m.semester === semNum);
    }
    
    return found || curriculum.modules[0];
  }, [curriculum, userProfile?.semester]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* iOS Header */}
      <div className="bg-white border-b border-slate-200/60 pt-6 pb-6 px-4">
         <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-[1rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                     <GraduationCap className="w-5 h-5" />
                 </div>
                 <div>
                     <h1 className="text-xl font-black text-slate-900 tracking-tight">Mit Studie</h1>
                     <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{userProfile?.profession || 'Studerende'}</p>
                 </div>
             </div>
             
             <div className="flex flex-col items-end">
                <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                   <Flame className={`w-3.5 h-3.5 ${(userProfile?.dailyChallengeStreak || 0) > 0 ? 'text-amber-500 fill-amber-500 animate-pulse' : 'text-slate-300'}`} />
                   <span className="text-xs font-black text-amber-700">{userProfile?.dailyChallengeStreak || 0}</span>
                </div>
                <span className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Streak</span>
             </div>
         </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Uddannelse & Semester Info */}
        <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm p-5 space-y-4">
           <div className="flex items-center gap-3 text-slate-600">
               <Building className="w-4 h-4 text-slate-400" />
               <span className="text-sm font-bold">{curriculum?.institution || userProfile?.institution || 'Vælg institution'}</span>
           </div>
           <div className="flex items-center gap-3 text-slate-600">
               <CalendarDays className="w-4 h-4 text-slate-400" />
               <span className="text-sm font-bold">Semester: {userProfile?.semester || '1'}</span>
           </div>
        </div>

        {/* Nuværende Modul */}
        <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm p-5 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5">
              <Target className="w-24 h-24" />
           </div>
           <div className="relative z-10">
               <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md mb-3">
                   <Target className="w-3 h-3" />
                   <span className="text-[9px] font-black uppercase tracking-widest">Nuværende Modul</span>
               </div>
               <h2 className="text-lg font-black text-slate-900 leading-tight mb-2">
                   {activeModule?.name || 'Ukendt modul'}
               </h2>
               <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-3">
                   {activeModule?.about && activeModule.about !== 'Ukendt semester' 
                      ? activeModule.about 
                      : 'Opsæt dit semester i web-versionen for at se detaljer her.'}
               </p>
           </div>
        </div>

        {/* Læringsmål */}
        <div className="space-y-3 pt-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Modulets Læringsmål</h3>
            {activeModule?.learningGoals?.length > 0 ? (
                <div className="space-y-2">
                    {activeModule.learningGoals.map((goal: string, idx: number) => (
                        <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-3">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <p className="text-xs font-semibold text-slate-700 leading-relaxed">{goal}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl text-center">
                    <p className="text-xs font-medium text-slate-500">Ingen læringsmål fundet for dette modul.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
