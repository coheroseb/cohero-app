'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/app/provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Check, AlertTriangle, Mail, Lock, User, UserPlus, LogIn, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

type AuthMode = 'login' | 'signup';

const AuthContent = () => {
  const { user, handleLogin, handleSignup, handleGoogleLogin } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') as AuthMode || 'login';
  const callbackUrl = searchParams.get('callbackUrl');
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
      if (callbackUrl) {
        router.push(callbackUrl);
      } else {
        router.push('/rum/groups');
      }
    }
  }, [user, router, callbackUrl]);

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
    login: "Log ind",
    signup: "Opret konto",
    email: "Email adresse",
    password: "Adgangskode",
    confirmPassword: "Bekræft adgangskode",
    displayName: "Fulde navn",
    loginCTA: "Log ind på din konto",
    signupCTA: "Opret en ny konto",
    loginSubtext: "Velkommen tilbage til Cohéro Project Group.",
    signupSubtext: "Professionalisér din studiegruppe med jeres eget rum.",
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
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center font-sans bg-[#FDFBF7] selection:bg-slate-200 selection:text-slate-900 p-5 sm:p-8">
      
      {/* Dynamic Background */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-[#F3E5AB]/40 to-transparent pointer-events-none -z-10"></div>
      
      <div className="w-full max-w-md space-y-8 relative z-10 my-auto">
        
        <div className="text-center flex flex-col items-center">
          <Link href="/rum/groups" className="inline-block mb-6 active:scale-95 transition-transform">
            <div className="w-16 h-16 bg-amber-50 rounded-[20px] flex items-center justify-center mx-auto shadow-sm border border-amber-200/50 text-amber-600">
                {mode === 'signup' ? <UserPlus className="w-8 h-8" /> : <LogIn className="w-8 h-8" />}
            </div>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Cohéro <span className="text-amber-500">Groups</span>
          </h1>
          <p className="mt-3 text-slate-500 font-medium text-[15px] sm:text-[16px] leading-relaxed max-w-[280px]">
            {mode === 'login' ? t.loginSubtext : t.signupSubtext}
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100">
          
          {/* iOS-Style Pill Toggle */}
          <div className="flex p-1 bg-slate-100 rounded-[20px] mb-8 relative">
            <button 
              type="button"
              onClick={() => setMode('login')} 
              className={`relative flex-1 py-3 text-[14px] font-bold transition-all duration-300 z-10 rounded-[16px] ${mode === 'login' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t.login}
              {mode === 'login' && (
                <motion.div 
                  layoutId="activeTabModeGrp"
                  className="absolute inset-0 bg-white rounded-[16px] shadow-sm border border-slate-200/50 -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
            <button 
              type="button"
              onClick={() => setMode('signup')} 
              className={`relative flex-1 py-3 text-[14px] font-bold transition-all duration-300 z-10 rounded-[16px] ${mode === 'signup' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t.signup}
              {mode === 'signup' && (
                <motion.div 
                  layoutId="activeTabModeGrp"
                  className="absolute inset-0 bg-white rounded-[16px] shadow-sm border border-slate-200/50 -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {FormFields}
            
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-rose-50 text-rose-600 p-4 rounded-[16px] text-[13px] font-bold flex items-start gap-3 border border-rose-100 mt-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> 
                      <span className="leading-tight">{error}</span>
                  </div>
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                   <div className="bg-emerald-50 text-emerald-700 p-4 rounded-[16px] text-[13px] font-bold flex items-start gap-3 border border-emerald-100 mt-2">
                      <Check className="w-4 h-4 mt-0.5 shrink-0" /> 
                      <span className="leading-tight">{success}</span>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>

            {mode === 'signup' && (
              <p className="text-[12px] text-slate-400 text-center pt-2 leading-relaxed px-4">
                  {t.terms}
              </p>
            )}
            
            <Button 
              type="submit" 
              className="w-full h-14 rounded-[20px] text-[16px] font-black tracking-wide bg-slate-900 text-white shadow-[0_10px_20px_-10px_rgba(15,23,42,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-2" 
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                <>
                  {mode === 'login' ? t.login : t.signup}
                  <ArrowRight className="w-5 h-5 opacity-70" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                <span className="bg-white px-4 text-slate-300">Eller via Google</span>
              </div>
            </div>
            <div className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleGoogleSubmit}
                disabled={isLoading}
                className="w-full h-14 rounded-[20px] text-[15px] font-bold text-slate-700 flex items-center justify-center gap-3 bg-white border-2 border-slate-100 hover:bg-slate-50 active:scale-[0.98] transition-all shadow-sm"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Fortsæt med Google
              </Button>
            </div>
          </div>
        </div>

        <div className="text-center pt-4">
          <button 
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-[14px] text-slate-500 font-medium active:scale-95 transition-transform"
          >
            {mode === 'login' ? t.noAccount : t.hasAccount}{' '} 
            <span className="font-extrabold text-slate-900 underline decoration-slate-300 underline-offset-4">{mode === 'login' ? t.signup : t.login}</span>
          </button>
        </div>
      </div>
      
      <div className="mt-12 opacity-50 text-center pb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">En del af Cohéro-universet</p>
      </div>
    </div>
  );
};

const AuthPage = () => {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="animate-spin text-slate-900 w-8 h-8" /></div>}>
      <AuthContent />
    </Suspense>
  );
};

export default AuthPage;
