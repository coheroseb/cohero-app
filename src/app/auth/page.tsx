'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/app/provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Check, AlertTriangle, Mail, Lock, User, ArrowRight, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Suspense } from 'react';

type AuthMode = 'signin' | 'signup';

const AuthContent = () => {
  const { user, handleLogin, handleSignup, handleGoogleLogin } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams?.get('mode') === 'signup' ? 'signup' : 'signin';
  const [mode, setMode] = useState<AuthMode>(initialMode);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.push('/portal');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError("Adgangskoderne er ikke ens.");
        setIsLoading(false);
        return;
      }
      try {
        await handleSignup(email, password, displayName);
        setSuccess("Konto oprettet! Tjek din email for at verificere din konto.");
      } catch (err: any) {
        if (err.code === 'auth/email-already-in-use') {
          setError('Denne email er allerede i brug. Prøv at logge ind i stedet.');
        } else {
          setError('Der skete en ukendt fejl under oprettelse.');
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      try {
        await handleLogin(email, password);
      } catch (err: any) {
        setError('Ugyldig email eller adgangskode. Prøv igen.');
        setIsLoading(false); 
      }
    }
  };

  const handleGoogleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await handleGoogleLogin();
    } catch (err: any) {
      setError('Kunne ikke logge ind med Google. Prøv igen.');
      setIsLoading(false);
    }
  };

  const t = {
    signin: "Log ind",
    signup: "Opret konto",
    email: "Email adresse",
    password: "Adgangskode",
    confirmPassword: "Bekræft adgangskode",
    displayName: "Dit fulde navn",
    signinCTA: "Log ind på din konto",
    signupCTA: "Opret en ny konto",
    signinSubtext: "Velkommen tilbage til din digitale kollega.",
    signupSubtext: "Bliv en del af fællesskabet og byg bro mellem teori og praksis.",
    noAccount: "Har du ikke en konto?",
    hasAccount: "Allerede medlem?",
    terms: (<>Ved at oprette en konto, accepterer du vores <Link href="/terms-of-service" className="font-bold underline text-slate-700 hover:text-slate-900 transition-colors">betingelser</Link>.</>)
  };

  const FormFields = (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {mode === 'signup' && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="relative"
          >
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input 
              type="text" 
              placeholder={t.displayName}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required={mode === 'signup'} 
              className="h-14 rounded-[20px] pl-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-sm text-[15px] font-medium placeholder:text-slate-400"
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="relative">
        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input 
          type="email" 
          placeholder={t.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required 
          className="h-14 rounded-[20px] pl-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-sm text-[15px] font-medium placeholder:text-slate-400"
        />
      </div>
      
      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input 
          type="password" 
          placeholder={t.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="h-14 rounded-[20px] pl-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-sm text-[15px] font-medium placeholder:text-slate-400"
        />
      </div>
      
      <AnimatePresence mode="popLayout">
        {mode === 'signup' && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="relative"
          >
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input 
              type="password" 
              placeholder={t.confirmPassword}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required={mode === 'signup'}
              className="h-14 rounded-[20px] pl-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-sm text-[15px] font-medium placeholder:text-slate-400"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="min-h-[100dvh] w-full flex flex-col lg:flex-row font-sans bg-white selection:bg-indigo-100 selection:text-indigo-950">
      
      {/* LEFT SIDE - FORM */}
      <div className="w-full lg:w-5/12 flex items-center justify-center p-6 sm:p-12 lg:p-20 min-h-[100dvh] relative z-10">
        
        <div className="w-full max-w-md space-y-12 relative z-10">
          <div className="space-y-4">
             <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-none">
               {mode === 'signin' ? "Velkommen tilbage." : "Begynd din rejse."}
             </h1>
             <p className="text-lg text-slate-400 font-medium leading-relaxed">
               {mode === 'signin' ? t.signinSubtext : t.signupSubtext}
             </p>
          </div>

          <div className="bg-white p-2 rounded-[3rem] border border-slate-100 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.05)]">
            
            {/* Minimalist Toggle */}
            <div className="flex p-1 bg-slate-50 rounded-[2.5rem] mb-8 relative">
              <button 
                type="button"
                onClick={() => setMode('signin')} 
                className={`relative flex-1 py-4 text-[13px] font-black uppercase tracking-widest transition-all duration-300 z-10 rounded-[2rem] ${mode === 'signin' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {t.signin}
                {mode === 'signin' && (
                  <motion.div 
                    layoutId="activeTabMode"
                    className="absolute inset-0 bg-white rounded-[2rem] shadow-sm border border-slate-200/20 -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
              <button 
                type="button"
                onClick={() => setMode('signup')} 
                className={`relative flex-1 py-4 text-[13px] font-black uppercase tracking-widest transition-all duration-300 z-10 rounded-[2rem] ${mode === 'signup' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {t.signup}
                {mode === 'signup' && (
                  <motion.div 
                    layoutId="activeTabMode"
                    className="absolute inset-0 bg-white rounded-[2rem] shadow-sm border border-slate-200/20 -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="px-6 pb-8 space-y-6">
              <div className="space-y-4">
                 <AnimatePresence mode="popLayout">
                   {mode === 'signup' && (
                     <motion.div
                       initial={{ opacity: 0, height: 0 }}
                       animate={{ opacity: 1, height: 'auto' }}
                       exit={{ opacity: 0, height: 0 }}
                       className="relative"
                     >
                       <Input 
                         type="text" 
                         placeholder={t.displayName}
                         value={displayName}
                         onChange={(e) => setDisplayName(e.target.value)}
                         required={mode === 'signup'} 
                         className="h-16 rounded-[2rem] px-8 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-slate-950 transition-all text-[15px] font-medium"
                       />
                     </motion.div>
                   )}
                 </AnimatePresence>
                 
                 <Input 
                   type="email" 
                   placeholder={t.email}
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   required 
                   className="h-16 rounded-[2rem] px-8 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-slate-950 transition-all text-[15px] font-medium"
                 />
                 
                 <Input 
                   type="password" 
                   placeholder={t.password}
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   required
                   className="h-16 rounded-[2rem] px-8 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-slate-950 transition-all text-[15px] font-medium"
                 />
              </div>
              
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-rose-50 text-rose-600 p-5 rounded-[2rem] text-[13px] font-bold border border-rose-100">{error}</motion.div>
                )}
              </AnimatePresence>

              <Button 
                type="submit" 
                className="w-full h-16 rounded-[2rem] text-[15px] font-black uppercase tracking-widest bg-slate-950 text-white shadow-2xl shadow-slate-950/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3" 
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                  <>
                    {mode === 'signin' ? t.signin : t.signup}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
                <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.4em]"><span className="bg-white px-6 text-slate-300">Social Login</span></div>
              </div>

              <Button 
                type="button" 
                variant="outline" 
                onClick={handleGoogleSubmit}
                disabled={isLoading}
                className="w-full h-16 rounded-[2rem] text-[13px] font-black uppercase tracking-widest text-slate-600 flex items-center justify-center gap-4 bg-white border border-slate-100 hover:bg-slate-50 transition-all"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 grayscale opacity-70" />
                Fortsæt med Google
              </Button>
            </form>
          </div>

          <div className="text-center">
            <button 
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-[13px] text-slate-400 font-black uppercase tracking-widest hover:text-slate-950 transition-colors"
            >
              {mode === 'signin' ? t.noAccount : t.hasAccount}{' '} 
              <span className="text-indigo-600 ml-2">{mode === 'signin' ? t.signup : t.signin}</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* RIGHT SIDE - THE FLUID CANVAS UI */}
      <div className="hidden lg:flex w-7/12 relative overflow-hidden bg-slate-50 flex-col items-center justify-center p-20 border-l border-slate-100">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.4] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:40px_40px]" />
        
        <div className="relative z-10 w-full max-w-2xl space-y-24">
            <div className="grid grid-cols-2 gap-8">
               <motion.div 
                 initial={{ opacity: 0, y: 40 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.2 }}
                 className="bg-white/80 backdrop-blur-3xl border border-slate-100 p-12 rounded-[4rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)] space-y-8"
               >
                  <div className="w-16 h-16 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-600/30">
                      <Zap className="w-8 h-8" />
                  </div>
                  <h3 className="text-slate-950 font-black text-3xl tracking-tighter leading-none italic serif">Akademisk præcision.</h3>
                  <p className="text-slate-500 text-lg font-medium leading-relaxed">Få direkte adgang til lovgivning og begreber, der er skræddersyet til dit studie.</p>
               </motion.div>

               <motion.div 
                 initial={{ opacity: 0, y: 80 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.4 }}
                 className="bg-slate-950 p-12 rounded-[4rem] shadow-2xl space-y-8 mt-12"
               >
                  <div className="w-16 h-16 bg-white/10 text-white rounded-[2rem] flex items-center justify-center">
                      <ShieldCheck className="w-8 h-8 text-amber-400" />
                  </div>
                  <h3 className="text-white font-black text-3xl tracking-tighter leading-none italic serif">Faglig tryghed.</h3>
                  <p className="text-slate-400 text-lg font-medium leading-relaxed">Byg bro mellem teori og praksis med værktøjer, der giver dig professionel sikkerhed.</p>
               </motion.div>
            </div>
            
            <div className="flex flex-col items-center gap-8">
               <div className="h-px w-40 bg-slate-200" />
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">Cohéro 2.0 · Innovative Education</p>
            </div>
        </div>

        <style jsx>{`
          .serif { font-family: 'Playfair Display', serif; }
        `}</style>
      </div>

    </div>
  );
};

const AuthPage = () => {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-200" /></div>}>
      <AuthContent />
    </Suspense>
  );
};

export default AuthPage;
