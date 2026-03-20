'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/app/provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Check, AlertTriangle, Mail, Lock, User, UserPlus, LogIn } from 'lucide-react';
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
    email: "Email",
    password: "Adgangskode",
    confirmPassword: "Bekræft adgangskode",
    displayName: "Fulde navn",
    loginCTA: "Log ind på din konto",
    signupCTA: "Opret en ny konto",
    loginSubtext: "Velkommen tilbage til Cohéro Project Group!",
    signupSubtext: "Professionalisér jeres studiegruppe med jeres fælles rum.",
    noAccount: "Har du ikke en konto?",
    hasAccount: "Har du allerede en konto?",
    terms: (<>Ved at oprette en konto, accepterer du vores <Link href="/terms-of-service" className="font-bold underline hover:text-amber-800">betingelser</Link>.</>)
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/rum/groups" className="inline-block mb-4">
             <div className="w-16 h-16 bg-amber-50 rounded-[1.5rem] flex items-center justify-center mx-auto shadow-inner text-amber-700">
                {mode === 'signup' ? <UserPlus className="w-8 h-8" /> : <LogIn className="w-8 h-8" />}
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-amber-950 serif">Cohéro Project Group</h1>
          <p className="mt-2 text-slate-500 italic">
            {mode === 'login' ? t.loginSubtext : t.signupSubtext}
          </p>
        </div>

        <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-xl border border-amber-100/50">
          <div className="flex border-b border-slate-100 mb-8">
            <button 
              onClick={() => setMode('login')} 
              className={`flex-1 pb-4 text-xs font-black uppercase tracking-widest transition-all duration-300 ${mode === 'login' ? 'text-amber-950 border-b-2 border-amber-950' : 'text-slate-300 hover:text-slate-500'}`}
            >
              {t.login}
            </button>
            <button 
              onClick={() => setMode('signup')} 
              className={`flex-1 pb-4 text-xs font-black uppercase tracking-widest transition-all duration-300 ${mode === 'signup' ? 'text-amber-950 border-b-2 border-amber-950' : 'text-slate-300 hover:text-slate-500'}`}
            >
              {t.signup}
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              {mode === 'signup' && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input 
                    type="text" 
                    placeholder={t.displayName}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required 
                    className="h-14 rounded-2xl pl-12 border-slate-100 focus:border-amber-900 focus:ring-amber-900 bg-slate-50/50"
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input 
                  type="email" 
                  placeholder={t.email}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  className="h-14 rounded-2xl pl-12 border-slate-100 focus:border-amber-900 focus:ring-amber-900 bg-slate-50/50"
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
                  className="h-14 rounded-2xl pl-12 border-slate-100 focus:border-amber-900 focus:ring-amber-900 bg-slate-50/50"
                />
              </div>
              {mode === 'signup' && (
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input 
                    type="password" 
                    placeholder={t.confirmPassword}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-14 rounded-2xl pl-12 border-slate-100 focus:border-amber-900 focus:ring-amber-900 bg-slate-50/50"
                  />
                </div>
              )}
            </div>
            
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 text-red-700 p-4 rounded-2xl text-xs flex items-center gap-3 border border-red-100"
                >
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" /> <span>{error}</span>
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-green-50 text-green-700 p-4 rounded-2xl text-xs flex items-center gap-3 border border-green-100"
                >
                  <Check className="w-4 h-4 flex-shrink-0" /> <span>{success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {mode === 'signup' && <p className="text-[10px] text-slate-400 text-center pt-2 leading-relaxed uppercase font-black tracking-widest">{t.terms}</p>}
            
            <Button 
                type="submit" 
                className="w-full h-14 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl bg-amber-950 hover:bg-black transition-all" 
                disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : (mode === 'login' ? t.login : t.signup)}
            </Button>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                <span className="bg-white px-3 text-slate-300">Eller fortsæt med</span>
              </div>
            </div>
            <div className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleGoogleSubmit}
                disabled={isLoading}
                className="w-full h-14 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 border-slate-200 text-slate-600 transition-colors"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Google
              </Button>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button 
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-amber-950 transition-colors"
          >
            {mode === 'login' ? t.noAccount : t.hasAccount}{' '} 
            <span className="text-amber-950 underline decoration-2 underline-offset-4">{mode === 'login' ? t.signup : t.login}</span>
          </button>
        </div>

        <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 pt-8">En del af Cohéro-universet</p>
      </div>
    </div>
  );
};

const AuthPage = () => {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center"><Loader2 className="animate-spin text-amber-900" /></div>}>
      <AuthContent />
    </Suspense>
  );
};

export default AuthPage;
