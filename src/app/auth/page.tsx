'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/app/provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Check, AlertTriangle, Mail, Lock, User } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

type AuthMode = 'login' | 'signup';

const AuthPage = () => {
  const { user, handleLogin, handleSignup, handleGoogleLogin } = useApp();
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('login');
  
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
        // Let the user see the success message
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
        // On success, the useEffect hook will handle redirection. Keep loading.
      } catch (err: any) {
        setError('Ugyldig email eller adgangskode. Prøv igen.');
        setIsLoading(false); // Only stop loading on error
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
    loginSubtext: "Velkommen tilbage til din digitale kollega!",
    signupSubtext: "Bliv en del af fællesskabet og byg bro mellem teori og praksis.",
    noAccount: "Har du ikke en konto?",
    hasAccount: "Har du allerede en konto?",
    terms: (<>Ved at oprette en konto, accepterer du vores <Link href="/terms-of-service" className="font-bold underline hover:text-amber-800">betingelser</Link>.</>)
  };

  const FormFields = (
    <div className="space-y-4">
      {mode === 'signup' && (
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input 
            type="text" 
            placeholder={t.displayName}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required 
            className="h-12 rounded-lg pl-10"
          />
        </div>
      )}
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input 
          type="email" 
          placeholder={t.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required 
          className="h-12 rounded-lg pl-10"
        />
      </div>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input 
          type="password" 
          placeholder={t.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="h-12 rounded-lg pl-10"
        />
      </div>
      {mode === 'signup' && (
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input 
            type="password" 
            placeholder={t.confirmPassword}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="h-12 rounded-lg pl-10"
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2 font-sans">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link href="/" className="inline-block">
              <h1 className="text-5xl font-bold text-amber-900 serif">Cohéro</h1>
            </Link>
            <p className="mt-4 text-center text-md text-slate-600">
              {mode === 'login' ? t.loginSubtext : t.signupSubtext}
            </p>
          </div>

          <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-xl border border-slate-100">
            <div className="flex border-b-2 border-slate-100 mb-6">
              <button 
                onClick={() => setMode('login')} 
                className={`flex-1 pb-3 text-sm font-bold transition-all duration-300 ${mode === 'login' ? 'text-amber-800 border-b-2 border-amber-800' : 'text-slate-400 hover:text-slate-700'}`}
              >
                {t.login}
              </button>
              <button 
                onClick={() => setMode('signup')} 
                className={`flex-1 pb-3 text-sm font-bold transition-all duration-300 ${mode === 'signup' ? 'text-amber-800 border-b-2 border-amber-800' : 'text-slate-400 hover:text-slate-700'}`}
              >
                {t.signup}
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {FormFields}
              
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-50 text-red-700 p-3 rounded-lg text-xs flex items-center gap-2 border border-red-200"
                  >
                    <AlertTriangle className="w-4 h-4" /> <span>{error}</span>
                  </motion.div>
                )}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-green-50 text-green-700 p-3 rounded-lg text-xs flex items-center gap-2 border border-green-200"
                  >
                    <Check className="w-4 h-4" /> <span>{success}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {mode === 'signup' && <p className="text-xs text-slate-500 text-center pt-2 leading-relaxed">{t.terms}</p>}
              
              <Button type="submit" className="w-full h-12 rounded-lg text-base font-bold shadow-lg shadow-amber-800/20 hover:shadow-xl hover:shadow-amber-800/30 transition-shadow" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : (mode === 'login' ? t.login : t.signup)}
              </Button>
            </form>

            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500">Eller fortsæt med</span>
                </div>
              </div>
              <div className="mt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleGoogleSubmit}
                  disabled={isLoading}
                  className="w-full h-12 rounded-lg text-base font-medium flex items-center justify-center gap-2 hover:bg-slate-50 border-slate-200"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                  Google
                </Button>
              </div>
            </div>
          </div>

          <div className="text-center mt-6">
            <button 
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-sm text-slate-500 hover:text-amber-700"
            >
              {mode === 'login' ? t.noAccount : t.hasAccount}{' '} 
              <span className="font-bold underline">{mode === 'login' ? t.signup : t.login}</span>
            </button>
          </div>
        </div>
      </div>
      <div className="hidden lg:flex bg-amber-900 items-center justify-center p-12 text-white relative overflow-hidden">
        <div className="absolute bg-amber-800/50 rounded-full w-96 h-96 -top-20 -left-20"></div>
        <div className="absolute bg-amber-800/50 rounded-full w-[500px] h-[500px] -bottom-40 -right-20"></div>
        <div className="relative z-10 text-center">
            <h2 className="text-4xl font-bold serif mb-4 text-amber-50">Byg bro mellem teori og praksis</h2>
            <p className="text-amber-200 max-w-md mx-auto">
              Cohéro er din AI-drevne digitale kollega, skabt til at hjælpe dig med at træne og mestre de faglige færdigheder, du har brug for som socialrådgiverstuderende.
            </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
