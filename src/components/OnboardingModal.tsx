'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, School, Sparkles, Send, ChevronDown, User, Loader2, Users, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { updateProfile } from 'firebase/auth';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

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
      
      onComplete(); // Refreshes app state
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
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col min-h-[500px]"
      >
        {/* Progress Bar Header */}
        <div className="h-1.5 w-full bg-slate-50 flex">
           {[...Array(totalSteps)].map((_, i) => (
              <motion.div 
                key={i} 
                className={`h-full flex-1 ${i === 0 ? 'rounded-tl-full' : ''} ${i === totalSteps - 1 ? 'rounded-tr-full' : ''}`}
                initial={false}
                animate={{ backgroundColor: step >= i + 1 ? '#78350f' : 'transparent' }} // amber-900
                transition={{ duration: 0.3 }}
              />
           ))}
        </div>

        <div className="p-8 sm:p-12 flex-grow flex flex-col">
            {/* Header Area */}
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
               <div className="w-9" /> {/* Spacer */}
            </div>

            <div className="flex-grow flex flex-col justify-center relative">
              <AnimatePresence mode="wait" custom={1}>
                
                {/* STEP 1: Name */}
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
                    <div className="w-20 h-20 bg-amber-100/50 text-amber-600 rounded-3xl flex items-center justify-center shadow-inner border border-amber-50">
                      {isGroupsSource ? <Users className="w-10 h-10" /> : <Sparkles className="w-10 h-10" />}
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900 serif mb-3">
                        {isGroupsSource ? 'Velkommen til Opret Gruppe!' : 'Velkommen til Cohéro!'}
                      </h2>
                      <p className="text-slate-500 font-medium max-w-sm mx-auto">
                        Før vi starter, vil vi gerne vide, hvad vi skal kalde dig.
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

                {/* STEP 2: Profession */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    custom={1}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="space-y-8 flex flex-col items-center text-center"
                  >
                    <div className="w-20 h-20 bg-slate-50 text-slate-600 rounded-3xl flex items-center justify-center shadow-inner border border-slate-100">
                      <School className="w-10 h-10" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900 serif mb-3">Din Baggrund</h2>
                      <p className="text-slate-500 font-medium max-w-sm mx-auto">
                        Hej {username.split(' ')[0]}, hvad studerer eller arbejder du med?
                      </p>
                    </div>
                    <div className="w-full max-w-sm grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                       {['Socialrådgiver', 'Pædagog', 'Lærer', 'Sygeplejerske', 'Andet'].map((prof) => (
                           <button
                              key={prof}
                              onClick={() => { 
                                setProfession(prof); 
                                setError(null);
                                setTimeout(() => setStep(3), 200); 
                              }}
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

                {/* STEP 3: Education Details */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    custom={1}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="space-y-6 flex flex-col items-center text-center"
                  >
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center shadow-inner border border-emerald-100/50">
                      <BookOpen className="w-10 h-10" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900 serif mb-3">Næsten I Mål</h2>
                      <p className="text-slate-500 font-medium max-w-sm mx-auto">
                        Fortæl os lidt om din studie status.
                      </p>
                    </div>

                    <div className="w-full max-w-sm space-y-4 text-left mt-2">
                      {/* Færdiguddannet Toggle */}
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
                             <div className="relative group">
                                <BookOpen className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-amber-950 transition-colors" />
                                <Input 
                                  type="text" 
                                  placeholder="Hvilket semester er du på? (f.eks. 3)"
                                  value={semester}
                                  onChange={(e) => setSemester(e.target.value)}
                                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent rounded-[1.25rem] focus:bg-white focus:ring-4 focus:ring-amber-950/5 focus:border-amber-950 transition-all text-sm h-14 font-bold text-slate-900"
                                />
                             </div>
                             
                             <div className="relative group bg-slate-50 rounded-[1.25rem] focus-within:bg-white focus-within:ring-4 focus-within:ring-amber-950/5 transition-all">
                                <School className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none group-focus-within:text-amber-950 transition-colors" />
                                <select
                                    value={institution}
                                    onChange={(e) => setInstitution(e.target.value)}
                                    className="w-full appearance-none pl-12 pr-10 py-4 bg-transparent border-transparent rounded-[1.25rem] focus:outline-none text-sm h-14 font-bold text-slate-900 cursor-pointer"
                                >
                                    <option value="" disabled className="text-slate-400">Vælg institution (Valgfrit)</option>
                                    <option value="Københavns Professionshøjskole">Københ. Professionshøjskole</option>
                                    <option value="VIA University College">VIA University College</option>
                                    <option value="UC SYD">UC SYD</option>
                                    <option value="UCL">UCL Erhvervsakademi</option>
                                    <option value="Absalon">Professionshøjskolen Absalon</option>
                                    <option value="UCN">UCN</option>
                                    <option value="Aalborg Universitet">Aalborg Universitet</option>
                                    <option value="Andet">Andet</option>
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

            {/* ERROR DISPLAY */}
            {error && (
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                 <p className="text-xs text-rose-600 font-bold bg-rose-50 px-4 py-3 rounded-xl border border-rose-100 flex items-center justify-center gap-2">
                   {error}
                 </p>
               </motion.div>
            )}

            {/* FOOTER ACTIONS */}
            <div className="mt-10 pt-6 border-t border-slate-100 w-full flex items-center justify-center">
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
                           Færdiggør Profil <Send className="w-4 h-4 ml-3" />
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

