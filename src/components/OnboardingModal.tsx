'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, School, Sparkles, Send, ChevronDown, User, Loader2, Users, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { doc, writeBatch, serverTimestamp, query, where, getDocs, collection } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { updateProfile } from 'firebase/auth';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { INSTITUTIONS, PROFESSION_OPTIONS, SEMESTER_OPTIONS } from '@/lib/constants';
import { calculateStudyStarted } from '@/lib/education';

interface OnboardingModalProps {
  onComplete: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [semester, setSemester] = useState('');
  const [institution, setInstitution] = useState('');
  const [profession, setProfession] = useState('');
  const [isQualified, setIsQualified] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [fetchingCurriculum, setFetchingCurriculum] = useState(false);
  const [availableModules, setAvailableModules] = useState<{id: string, name: string}[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();

  const isGroupsSource = pathname?.startsWith('/rum/groups');
  const totalSteps = 3;

  useEffect(() => {
    if (user?.displayName) {
      setUsername(user.displayName);
    }
  }, [user]);

  useEffect(() => {
    const fetchCurriculum = async () => {
      if (!institution || !profession || !firestore) {
        setAvailableModules([]);
        return;
      }

      setFetchingCurriculum(true);
      try {
        const curriculumsRef = collection(firestore, 'curriculums');
        const q = query(
          curriculumsRef,
          where('institution', '==', institution),
          where('profession', '==', profession)
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const curriculum = querySnapshot.docs[0].data();
          if (curriculum.modules && Array.isArray(curriculum.modules)) {
            const mods = curriculum.modules.map((m: any) => ({
              id: m.id || m.semester?.toString() || '',
              name: m.name || `${m.semester}. semester`
            }));
            setAvailableModules(mods);
          } else {
            setAvailableModules([]);
          }
        } else {
          setAvailableModules([]);
        }
      } catch (err) {
        console.error("Error fetching curriculum for onboarding:", err);
        setAvailableModules([]);
      } finally {
        setFetchingCurriculum(false);
      }
    };

    fetchCurriculum();
  }, [institution, profession, firestore]);

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
    if (!isQualified && !institution.trim()) {
      setError('Vælg venligst din uddannelsesinstitution eller markér dig som færdiguddannet.');
      return;
    }
    if (!isQualified && !semester.trim()) {
        setError('Indtast venligst hvilket semester du er på.');
        return;
    }
    if (!user || !firestore) {
      setError('Bruger ikke fundet. Prøv at logge ind igen.');
      return;
    }

    setLoading(true);
    setError(null);
    
    const capitalizedUsername = capitalize(username.trim());
    const studyStarted = isQualified ? null : calculateStudyStarted(semester);

    try {
      const batch = writeBatch(firestore);
      const userRef = doc(firestore, 'users', user.uid);
      
      batch.set(userRef, {
        username: capitalizedUsername,
        semester: isQualified ? '' : semester,
        institution: isQualified ? '' : institution,
        profession: profession,
        studyStarted,
        isQualified,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      await batch.commit();
      
      if (!user.displayName) {
          await updateProfile(user, { displayName: capitalizedUsername });
      }
      
      onComplete();
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

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-xl"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative bg-white/95 backdrop-blur-2xl w-full max-w-lg rounded-[2.5rem] shadow-[0_32px_100px_-20px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden flex flex-col min-h-[480px]"
      >
        {/* Progress Bar Header */}
        <div className="h-1.5 w-full bg-slate-100 flex">
           {[...Array(totalSteps)].map((_, i) => (
              <motion.div 
                key={i} 
                className={`h-full flex-1 ${i === 0 ? 'rounded-tl-full' : ''} ${i === totalSteps - 1 ? 'rounded-tr-full' : ''}`}
                initial={false}
                animate={{ backgroundColor: step >= i + 1 ? '#4f46e5' : 'transparent' }} // indigo-600
                transition={{ duration: 0.3 }}
              />
           ))}
        </div>

        <div className="p-8 sm:p-10 flex-grow flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6">
               <button 
                  onClick={handlePrevStep} 
                  className={`p-2 -ml-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all active:scale-95 ${step === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
               >
                  <ArrowLeft className="w-5 h-5" />
               </button>
               <div className="flex items-center gap-2">
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100/60">
                    Trin {step} af {totalSteps}
                 </span>
               </div>
               <div className="w-9" />
            </div>

            <div className="flex-grow flex flex-col justify-center relative my-auto">
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
                    className="space-y-6 flex flex-col items-center text-center"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
                      {isGroupsSource ? <Users className="w-8 h-8" /> : <Sparkles className="w-8 h-8" />}
                    </div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-[900] text-slate-900 tracking-tight mb-2">
                        {isGroupsSource ? 'Velkommen til Opret Gruppe!' : 'Velkommen til Cohéro!'}
                      </h2>
                      <p className="text-slate-500 text-sm font-medium max-w-xs mx-auto leading-relaxed">
                        Før vi starter, vil vi gerne vide, hvad vi skal kalde dig.
                      </p>
                    </div>
                    <div className="w-full max-w-sm relative group mt-2">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none z-10" />
                      <input
                        type="text"
                        placeholder="Dit fulde navn"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleNextStep()}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all text-base h-14 font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-400 shadow-sm"
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
                    className="space-y-6 flex flex-col items-center text-center"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-300/30">
                      <School className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-[900] text-slate-900 tracking-tight mb-2">Din Baggrund</h2>
                      <p className="text-slate-500 text-sm font-medium max-w-xs mx-auto leading-relaxed">
                        Hej <span className="font-bold text-slate-900">{username.split(' ')[0]}</span>, hvad studerer eller arbejder du med?
                      </p>
                    </div>
                    <div className="w-full max-w-sm grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
                       {PROFESSION_OPTIONS.map((prof) => (
                           <button
                               key={prof}
                               onClick={() => { 
                                 setProfession(prof); 
                                 setError(null);
                                 setTimeout(() => setStep(3), 150); 
                               }}
                               className={`p-3.5 rounded-2xl border font-bold text-sm transition-all text-left flex items-center justify-between shadow-sm active:scale-[0.98]
                                 ${profession === prof 
                                   ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-2 ring-indigo-500/20' 
                                   : 'border-slate-200/80 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/80'
                                 }`}
                           >
                               <span>{prof}</span>
                               {profession === prof && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
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
                    className="space-y-5 flex flex-col items-center text-center"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-400/30">
                      <BookOpen className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-[900] text-slate-900 tracking-tight mb-2">Næsten I Mål</h2>
                      <p className="text-slate-500 text-sm font-medium max-w-xs mx-auto leading-relaxed">
                        Fortæl os lidt om din studie status.
                      </p>
                    </div>

                    <div className="w-full max-w-sm space-y-3 text-left mt-1">
                      <div 
                         onClick={() => setIsQualified(!isQualified)}
                         className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3.5 select-none shadow-sm active:scale-[0.99]
                            ${isQualified 
                              ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20' 
                              : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
                      >
                         <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                           ${isQualified ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}
                         >
                            {isQualified && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                         </div>
                         <div>
                            <p className={`font-bold text-sm ${isQualified ? 'text-emerald-950' : 'text-slate-800'}`}>Jeg er færdiguddannet</p>
                            <p className={`text-xs ${isQualified ? 'text-emerald-700' : 'text-slate-400'}`}>Spring studie detaljer over</p>
                         </div>
                      </div>

                      <AnimatePresence>
                        {!isQualified && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3 overflow-hidden pt-1"
                          >
                             <div className="relative group bg-slate-50 rounded-2xl border border-slate-200/80 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-600 transition-all shadow-sm">
                                <School className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within:text-indigo-600 transition-colors" />
                                <select
                                    value={institution}
                                    onChange={(e) => setInstitution(e.target.value)}
                                    className="w-full appearance-none pl-11 pr-10 py-3.5 bg-transparent border-transparent rounded-2xl focus:outline-none text-sm h-12 font-bold text-slate-900 cursor-pointer"
                                >
                                    <option value="" disabled className="text-slate-400">Vælg institution (Valgfrit)</option>
                                    {INSTITUTIONS.map(inst => (
                                        <option key={inst} value={inst}>{inst}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                             </div>

                             <div className="relative group bg-slate-50 rounded-2xl border border-slate-200/80 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-600 transition-all shadow-sm">
                                <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within:text-indigo-600 transition-colors" />
                                <select
                                  value={semester}
                                  onChange={(e) => setSemester(e.target.value)}
                                  className="w-full appearance-none pl-11 pr-10 py-3.5 bg-transparent border-transparent rounded-2xl focus:outline-none text-sm h-12 font-bold text-slate-900 cursor-pointer"
                                  disabled={fetchingCurriculum}
                                >
                                  <option value="" disabled className="text-slate-400">
                                    {fetchingCurriculum ? 'Henter moduler...' : 'Vælg semester/modul'}
                                  </option>
                                  {availableModules.length > 0 ? (
                                    availableModules.map(mod => (
                                      <option key={mod.id} value={mod.id}>{mod.name}</option>
                                    ))
                                  ) : (
                                    SEMESTER_OPTIONS.map(sem => (
                                      <option key={sem} value={sem}>{sem}. semester</option>
                                    ))
                                  )}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
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
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                 <p className="text-xs text-rose-600 font-bold bg-rose-50 px-4 py-3 rounded-xl border border-rose-100 flex items-center justify-center gap-2">
                   {error}
                 </p>
               </motion.div>
            )}

            <div className="mt-8 pt-4 border-t border-slate-100 w-full flex items-center justify-center">
                {step < totalSteps ? (
                   <button 
                     onClick={handleNextStep}
                     className="w-full max-w-sm flex items-center justify-center h-13 py-3.5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.18em] text-[11px] hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98] group cursor-pointer"
                   >
                     Næste <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                   </button>
                ) : (
                   <button 
                     onClick={handleSubmit}
                     disabled={loading}
                     className="w-full max-w-sm flex items-center justify-center h-13 py-3.5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.18em] text-[11px] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-70 group cursor-pointer"
                   >
                     {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                     ) : (
                        <>
                           Færdiggør Profil <Send className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
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

export default OnboardingModal;
