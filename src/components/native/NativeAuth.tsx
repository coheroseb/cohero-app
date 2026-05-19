'use client';

import React, { useState } from 'react';
import { useApp } from '@/app/provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Loader2, 
  ArrowRight, 
  Mail, 
  Lock, 
  User, 
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Zap,
  Github
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHapticFeedback } from '@/lib/haptics';
import { ImpactStyle } from '@capacitor/haptics';

export const NativeAuth = () => {
  const { handleLogin, handleSignup, handleGoogleLogin, handleResetPassword } = useApp();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    triggerHapticFeedback(ImpactStyle.Medium);

    try {
      if (mode === 'signup') {
        await handleSignup(email, password, displayName);
      } else if (mode === 'forgot') {
        await handleResetPassword(email);
        setSuccess("Vi har sendt en e-mail til dig med instruktioner om, hvordan du nulstiller din adgangskode.");
      } else {
        await handleLogin(email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (mode === 'forgot') {
        if (err.code === 'auth/user-not-found') {
          setError('Ingen bruger fundet med denne email.');
        } else if (err.code === 'auth/invalid-email') {
          setError('Ugyldig email adresse.');
        } else {
          setError('Der skete en fejl. Prøv igen.');
        }
      } else {
        setError(err.message || 'Der skete en fejl. Prøv igen.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    triggerHapticFeedback(ImpactStyle.Light);
    try {
      await handleGoogleLogin();
    } catch (err: any) {
      setError('Google login fejlede.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col px-8 pt-20 pb-12 font-sans selection:bg-rose-100">
      {/* Decorative Background */}
      <div className="fixed top-0 left-0 right-0 h-96 bg-gradient-to-b from-rose-50/50 to-transparent -z-10" />
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 mb-12"
      >
        <div className="w-20 h-20 bg-white rounded-[2.5rem] shadow-2xl shadow-rose-200/50 flex items-center justify-center border border-rose-50">
           <img src="/App_Icon.png" alt="Logo" className="w-14 h-14 object-contain rounded-2xl" />
        </div>
        <div className="space-y-2">
           <h1 className="text-4xl font-black text-slate-950 tracking-tight leading-tight whitespace-pre-line">
             {mode === 'signin' ? 'Velkommen\ntilbage.' : mode === 'signup' ? 'Bliv en del\naf holdet.' : 'Glemt\nadgangskode?'}
           </h1>
           <p className="text-slate-400 font-medium text-lg leading-relaxed">
             {mode === 'signin' ? 'Log ind på din Cohéro Student konto.' : mode === 'signup' ? 'Få din egen intelligente kollega i lommen.' : 'Indtast din email for at modtage et link til at nulstille din adgangskode.'}
           </p>
        </div>
      </motion.div>

      {/* Mode Toggle */}
      {mode !== 'forgot' && (
        <div className="flex bg-slate-50 p-1.5 rounded-[2.5rem] mb-10 relative">
          <button 
            type="button"
            onClick={() => { setMode('signin'); triggerHapticFeedback(ImpactStyle.Light); setError(null); setSuccess(null); }}
            className={`relative flex-1 py-4 text-[11px] font-black uppercase tracking-widest transition-all z-10 ${mode === 'signin' ? 'text-slate-900' : 'text-slate-400'}`}
          >
            Log Ind
            {mode === 'signin' && (
              <motion.div layoutId="auth-pill" className="absolute inset-0 bg-white rounded-[2rem] shadow-sm border border-slate-100 -z-10" />
            )}
          </button>
          <button 
            type="button"
            onClick={() => { setMode('signup'); triggerHapticFeedback(ImpactStyle.Light); setError(null); setSuccess(null); }}
            className={`relative flex-1 py-4 text-[11px] font-black uppercase tracking-widest transition-all z-10 ${mode === 'signup' ? 'text-slate-900' : 'text-slate-400'}`}
          >
            Opret Konto
            {mode === 'signup' && (
              <motion.div layoutId="auth-pill" className="absolute inset-0 bg-white rounded-[2rem] shadow-sm border border-slate-100 -z-10" />
            )}
          </button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 space-y-5">
        <AnimatePresence mode="popLayout">
          {mode === 'signup' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="relative">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                <Input 
                  placeholder="Dit fulde navn"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-16 rounded-3xl pl-14 pr-6 bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-rose-500/5 focus:border-rose-100 transition-all text-base font-bold"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative">
          <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
          <Input 
            type="email"
            placeholder="Email adresse"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-16 rounded-3xl pl-14 pr-6 bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-rose-500/5 focus:border-rose-100 transition-all text-base font-bold"
          />
        </div>

        <AnimatePresence mode="popLayout">
          {mode !== 'forgot' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="relative space-y-4"
            >
              <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                <Input 
                  type="password"
                  placeholder="Adgangskode"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-16 rounded-3xl pl-14 pr-6 bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-rose-500/5 focus:border-rose-100 transition-all text-base font-bold"
                />
              </div>
              {mode === 'signin' && (
                <div className="flex justify-end px-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                      setSuccess(null);
                      triggerHapticFeedback(ImpactStyle.Light);
                    }}
                    className="text-[12px] font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Glemt adgangskode?
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 bg-rose-50 border border-rose-100 rounded-3xl text-xs font-bold text-rose-600"
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 bg-emerald-50 border border-emerald-100 rounded-3xl text-xs font-bold text-emerald-600"
          >
            {success}
          </motion.div>
        )}

        <Button 
          disabled={isLoading}
          className="w-full h-16 rounded-3xl bg-slate-950 text-white shadow-2xl shadow-slate-950/20 active:scale-95 transition-all flex items-center justify-center gap-3 mt-4"
        >
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <span className="text-[13px] font-black uppercase tracking-widest">{mode === 'signin' ? 'Log Ind' : mode === 'signup' ? 'Opret Konto' : 'Send nulstillingslink'}</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>

        {mode === 'forgot' && (
          <div className="text-center pt-2">
            <button 
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setSuccess(null);
                triggerHapticFeedback(ImpactStyle.Light);
              }}
              className="text-[11px] text-slate-400 font-black uppercase tracking-widest hover:text-slate-950 transition-colors"
            >
              Tilbage til <span className="text-rose-600 ml-2">Log ind</span>
            </button>
          </div>
        )}

        {mode !== 'forgot' && (
          <>
            <div className="relative py-8">
               <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
               <div className="relative flex justify-center text-[9px] font-black uppercase tracking-[0.4em] text-slate-300">
                 <span className="bg-white px-4">Eller fortsæt med</span>
               </div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleSubmit}
              className="w-full h-16 bg-white border border-slate-100 rounded-3xl flex items-center justify-center gap-4 shadow-sm active:bg-slate-50 active:scale-95 transition-all"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6 grayscale opacity-60" alt="Google" />
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Google</span>
            </button>
          </>
        )}
      </form>

      {/* Footer */}
      <footer className="mt-12 space-y-8">
        <div className="grid grid-cols-3 gap-4">
           <div className="flex flex-col items-center gap-2 text-center opacity-40">
              <Zap className="w-5 h-5 text-rose-600" />
              <span className="text-[8px] font-black uppercase tracking-widest">Lyn hurtig</span>
           </div>
           <div className="flex flex-col items-center gap-2 text-center opacity-40">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <span className="text-[8px] font-black uppercase tracking-widest">Sikker</span>
           </div>
           <div className="flex flex-col items-center gap-2 text-center opacity-40">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span className="text-[8px] font-black uppercase tracking-widest">Premium</span>
           </div>
        </div>
        
        <p className="text-center text-[10px] text-slate-300 font-bold leading-relaxed px-8">
          Ved brug accepterer du vores <span className="text-slate-400 underline">vilkår</span> og <span className="text-slate-400 underline">privatlivspolitik</span>.
        </p>
      </footer>
    </div>
  );
};
