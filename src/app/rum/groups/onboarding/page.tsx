'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { BookOpen, School, Sparkles, Send, ChevronDown, User, Loader2, Users, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { updateProfile } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/app/provider';
import { motion, AnimatePresence } from 'framer-motion';

const DANISH_INSTITUTIONS = [
    "Københavns Professionshøjskole",
    "VIA University College",
    "UC SYD",
    "UCL Erhvervsakademi og Professionshøjskole",
    "Professionshøjskolen Absalon",
    "UCN",
    "SOSU Nord",
    "SOSU Østjylland",
    "SOSU H",
    "SOSU Fyn",
    "SOSU Syd",
    "SOSU Esbjerg",
    "SOSU Nykøbing Falster",
    "SOSU Silkeborg",
    "Aalborg Universitet",
    "Aarhus Universitet",
    "Københavns Universitet",
    "Syddansk Universitet",
    "Roskilde Universitet",
    "Andet"
].sort();

const OnboardingContent = () => {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [semester, setSemester] = useState('');
  const [institution, setInstitution] = useState('');
  const [profession, setProfession] = useState('');
  const [isQualified, setIsQualified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user, isUserLoading } = useUser();
  const { refetchUserProfile, userProfile } = useApp();
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl');

  const totalSteps = 3;

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push(`/rum/groups/auth${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`);
    }
  }, [user, isUserLoading, router, callbackUrl]);

  useEffect(() => {
    if (user?.displayName && !username) {
      setUsername(user.displayName);
    }
  }, [user, username]);

  useEffect(() => {
    if (userProfile && (userProfile.isQualified || (userProfile.institution && userProfile.semester))) {
        if (callbackUrl) {
            router.push(callbackUrl);
        } else {
            router.push('/rum/groups');
        }
    }
  }, [userProfile, router, callbackUrl]);

  const capitalize = (s: string) => {
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const handleNextStep = () => {
    setError(null);
    if (step === 1 && !username.trim()) {
      setError('Indtast venligst dit navn for at fortsætte.');
      return;
    }
    if (step === 2 && !profession.trim()) {
      setError('Vælg venligst din profession.');
      return;
    }
    setStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handlePrevStep = () => {
    setError(null);
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!isQualified && !semester.trim()) {
      setError('Vælg venligst dit nuværende semester.');
      return;
    }
    if (!isQualified && !institution.trim()) {
      setError('Vælg venligst din uddannelsesinstitution eller markér dig som færdiguddannet.');
      return;
    }
    if (!user || !firestore) {
      setError('Bruger ikke fundet. Prøv at logge ind igen.');
      return;
    }

    setLoading(true);
    setError(null);
    
    const capitalizedUsername = capitalize(username.trim());

    try {
      const batch = writeBatch(firestore);
      const userRef = doc(firestore, 'users', user.uid);
      
      batch.set(userRef, {
        username: capitalizedUsername,
        semester: isQualified ? '' : semester,
        institution: isQualified ? '' : institution,
        profession: profession,
        isQualified,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      await batch.commit();
      
      if (!user.displayName) {
          await updateProfile(user, { displayName: capitalizedUsername });
      }
      
      await refetchUserProfile();
      
      if (callbackUrl) {
          router.push(callbackUrl);
      } else {
          router.push('/rum/groups');
      }
    } catch (err) {
      console.error(err);
      setError('Der skete en fejl. Prøv venligst igen.');
      setLoading(false);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0
    })
  };

  if (isUserLoading || !user) {
    return (
        <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
            <Loader2 className="animate-spin text-amber-900 w-10 h-10" />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col items-center justify-center p-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col min-h-[550px] border border-amber-100/30"
      >
        <div className="h-1.5 w-full bg-slate-50 flex">
           {[...Array(totalSteps)].map((_, i) => (
              <motion.div 
                key={i} 
                className={`h-full flex-1 ${i === 0 ? 'rounded-tl-full' : ''} ${i === totalSteps - 1 ? 'rounded-tr-full' : ''}`}
                initial={false}
                animate={{ backgroundColor: step >= i + 1 ? '#78350f' : 'transparent' }}
                transition={{ duration: 0.3 }}
              />
           ))}
        </div>

        <div className="p-8 sm:p-12 flex-grow flex flex-col">
            <div className="flex items-center justify-between mb-8">
               <button 
                  onClick={handlePrevStep} 
                  className={`p-2 -ml-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-amber-950 transition-colors ${step === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
               >
                  <ArrowLeft className="w-5 h-5" />
               </button>
               <div className="flex items-center gap-2">
                 <span className="text-[10px] font-black uppercase tracking-widest text-amber-900/40 bg-amber-50 px-2.5 py-1 rounded-full">
                    Trin {step} af {totalSteps}
                 </span>
               </div>
               <div className="w-9" />
            </div>

            <div className="flex-grow flex flex-col justify-center relative">
              <AnimatePresence mode="wait" custom={1}>
                
                {step === 1 && (
                  <motion.div
                    key="step1"
                    custom={1}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="space-y-8 flex flex-col items-center text-center"
                  >
                    <div className="w-20 h-20 bg-amber-50 text-amber-700 rounded-3xl flex items-center justify-center shadow-inner mb-2">
                      <Users className="w-10 h-10" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900 serif mb-3">Velkommen til Project Group!</h2>
                      <p className="text-slate-500 font-medium max-w-sm mx-auto">
                        Før du træder ind i gruppen, vil vi gerne vide til dit fulde navn.
                      </p>
                    </div>
                    <div className="w-full max-w-sm relative group mt-4">
                      <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-amber-950 transition-colors" />
                      <Input
                        type="text"
                        placeholder="Dit fulde navn"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleNextStep()}
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border-transparent rounded-[1.25rem] focus:bg-white focus:ring-4 focus:ring-amber-950/5 focus:border-amber-950 transition-all text-base h-16 font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-400"
                        autoFocus
                      />
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    custom={1}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="space-y-8 flex flex-col items-center text-center w-full"
                  >
                    <div className="w-20 h-20 bg-slate-50 text-slate-600 rounded-3xl flex items-center justify-center shadow-inner border border-slate-100 mb-2">
                      <School className="w-10 h-10" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900 serif mb-3">Din Baggrund</h2>
                      <p className="text-slate-500 font-medium max-w-sm mx-auto">
                        Hvad studerer du, {username.split(' ')[0]}?
                      </p>
                    </div>
                    <div className="w-full max-w-sm grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                       {['Socialrådgiver', 'Pædagog', 'Lærer', 'Sygeplejerske', 'Andet'].map((prof) => (
                           <button
                              key={prof}
                              onClick={() => { setProfession(prof); setTimeout(handleNextStep, 200); }}
                              className={`p-4 rounded-[1.25rem] border-2 font-bold text-sm transition-all text-left flex items-center justify-between
                                ${profession === prof 
                                  ? 'border-amber-950 bg-amber-50 text-amber-950 shadow-sm' 
                                  : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50'
                                }`}
                           >
                              {prof}
                              {profession === prof && <CheckCircle2 className="w-4 h-4 text-amber-950" />}
                           </button>
                       ))}
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    custom={1}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="space-y-6 flex flex-col items-center text-center w-full"
                  >
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center shadow-inner border border-emerald-100/50 mb-2">
                      <BookOpen className="w-10 h-10" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900 serif mb-3">Næsten I Mål</h2>
                      <p className="text-slate-500 font-medium max-w-sm mx-auto">
                        Fortæl os lidt om din studie status til sidst.
                      </p>
                    </div>

                    <div className="w-full max-w-sm space-y-4 text-left mt-2">
                      <div 
                         onClick={() => setIsQualified(!isQualified)}
                         className={`p-4 rounded-[1.25rem] border-2 cursor-pointer transition-all flex items-center gap-4 select-none
                            ${isQualified 
                              ? 'border-emerald-500 bg-emerald-50' 
                              : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'}`}
                      >
                         <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                           ${isQualified ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}
                         >
                            {isQualified && <CheckCircle2 className="w-4 h-4 text-white" />}
                         </div>
                         <div>
                            <p className={`font-bold text-sm ${isQualified ? 'text-emerald-900' : 'text-slate-600'}`}>Jeg er færdiguddannet</p>
                            <p className={`text-xs ${isQualified ? 'text-emerald-700/70' : 'text-slate-400'}`}>Spring studie detaljer over</p>
                         </div>
                      </div>

                      <AnimatePresence>
                        {!isQualified && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4 overflow-hidden"
                          >
                             <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Vælg Semester</p>
                                <div className="grid grid-cols-4 gap-2">
                                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                                        <button
                                            key={num}
                                            onClick={() => setSemester(num.toString())}
                                            className={`h-12 rounded-xl border-2 font-black text-sm transition-all flex items-center justify-center
                                                ${semester === num.toString() 
                                                    ? 'border-amber-950 bg-amber-50 text-amber-950 shadow-sm' 
                                                    : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200 hover:bg-slate-50'
                                                }`}
                                        >
                                            {num}.
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setSemester('Andet')}
                                        className={`h-12 rounded-xl border-2 font-bold text-[10px] uppercase tracking-tighter transition-all flex items-center justify-center
                                            ${semester === 'Andet' 
                                                ? 'border-amber-950 bg-amber-50 text-amber-950 shadow-sm' 
                                                : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        Andre
                                    </button>
                                </div>
                             </div>
                             
                             <div className="relative group bg-slate-50 rounded-[1.25rem] focus-within:bg-white focus-within:ring-4 focus-within:ring-amber-950/5 transition-all">
                                <School className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none group-focus-within:text-amber-950 transition-colors" />
                                <select
                                    value={institution}
                                    onChange={(e) => setInstitution(e.target.value)}
                                    className="w-full appearance-none pl-12 pr-10 py-4 bg-transparent border-transparent rounded-[1.25rem] focus:outline-none text-sm h-14 font-bold text-slate-900 cursor-pointer"
                                >
                                    <option value="" disabled className="text-slate-400">Vælg institution (Valgfrit)</option>
                                    {DANISH_INSTITUTIONS.map(inst => (
                                        <option key={inst} value={inst}>{inst}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                             </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {error && (
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                 <p className="text-xs text-rose-600 font-bold bg-rose-50 px-4 py-3 rounded-xl border border-rose-100 flex items-center justify-center gap-2">
                   {error}
                 </p>
               </motion.div>
            )}

            <div className="mt-10 pt-6 border-t border-slate-100 w-full flex items-center justify-center hover:cursor-pointer z-10">
                {step < totalSteps ? (
                   <button 
                     onClick={handleNextStep}
                     className="w-full max-w-sm flex items-center justify-center h-14 bg-amber-950 text-white rounded-[1.25rem] font-black uppercase tracking-[0.2em] text-[11px] hover:bg-amber-900 transition-colors shadow-xl shadow-amber-950/20 active:scale-[0.98]"
                   >
                     Næste <ArrowRight className="w-4 h-4 ml-3" />
                   </button>
                ) : (
                   <button 
                     onClick={handleSubmit}
                     disabled={loading}
                     className="w-full max-w-sm flex items-center justify-center h-14 bg-emerald-600 text-white rounded-[1.25rem] font-black uppercase tracking-[0.2em] text-[11px] hover:bg-emerald-500 transition-colors shadow-xl shadow-emerald-600/20 active:scale-[0.98] disabled:opacity-70"
                   >
                     {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                     ) : (
                        <>
                           Opret & Fortsæt <Send className="w-4 h-4 ml-3" />
                        </>
                     )}
                   </button>
                )}
            </div>
        </div>
      </motion.div>
    </div>
  );
};

const GroupsOnboardingPage = () => {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center"><Loader2 className="animate-spin text-amber-900" /></div>}>
            <OnboardingContent />
        </Suspense>
    )
}

export default GroupsOnboardingPage;

