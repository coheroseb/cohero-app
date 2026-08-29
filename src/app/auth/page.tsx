'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/app/provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Loader2, 
  Check, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  GraduationCap, 
  CalendarDays, 
  FileBox, 
  Search,
  BookOpen,
  ArrowLeft
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import HeaderNavbar from '@/components/HeaderNavbar';

type AuthMode = 'signin' | 'signup' | 'forgot';

const AuthContent = () => {
  const { user, handleLogin, handleSignup, handleGoogleLogin, handleAppleLogin, handleResetPassword } = useApp();
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
        setSuccess("Konto oprettet! Tjek din email for at bekræfte din konto.");
      } catch (err: any) {
        if (err.code === 'auth/email-already-in-use') {
          setError('Denne email er allerede i brug. Prøv at logge ind i stedet.');
        } else {
          setError('Der skete en fejl under oprettelse. Tjek venligst dine oplysninger.');
        }
      } finally {
        setIsLoading(false);
      }
    } else if (mode === 'forgot') {
      try {
        await handleResetPassword(email);
        setSuccess("Vi har sendt en e-mail til dig med instruktioner om, hvordan du nulstiller din adgangskode.");
      } catch (err: any) {
        setError(err.message || 'Der skete en fejl. Prøv igen.');
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

  const handleAppleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await handleAppleLogin();
    } catch (err: any) {
      setError('Kunne ikke logge ind med Apple. Prøv igen.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col font-sans bg-[#F8FAFC] selection:bg-indigo-100 selection:text-indigo-950">
      <HeaderNavbar />
      
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-28 sm:py-32">
        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          
          {/* LEFT SIDE: FORM CARD */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-xl relative">
              
              {/* Header inside card */}
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-black uppercase tracking-wider mb-3">
                  <Sparkles size={13} className="text-indigo-600" />
                  <span>100% Gratis Studiestart</span>
                </div>
                
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {mode === 'signin' 
                    ? "Log ind på Cohéro" 
                    : mode === 'signup' 
                    ? "Opret din studieprofil" 
                    : "Nulstil adgangskode"}
                </h1>
                
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed font-medium">
                  {mode === 'signin' 
                    ? "Få adgang til dit semester, dine læseplaner og dit pensumarkiv." 
                    : mode === 'signup' 
                    ? "Få fuld kontrol over dit semester med Danmarks førende studieplatform." 
                    : "Indtast din e-mail, så sender vi et link til at nulstille din adgangskode."}
                </p>
              </div>

              {/* Mode Switcher Tabs */}
              {mode !== 'forgot' && (
                <div className="flex p-1 bg-slate-100 rounded-2xl mb-6 relative">
                  <button 
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setError(null);
                      setSuccess(null);
                    }} 
                    className={`relative flex-1 py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-200 z-10 rounded-xl ${
                      mode === 'signin' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Log ind
                    {mode === 'signin' && (
                      <motion.div 
                        layoutId="authActiveTab"
                        className="absolute inset-0 bg-white rounded-xl shadow-xs border border-slate-200/50 -z-10"
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      />
                    )}
                  </button>
                  
                  <button 
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError(null);
                      setSuccess(null);
                    }} 
                    className={`relative flex-1 py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-200 z-10 rounded-xl ${
                      mode === 'signup' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Opret profil
                    {mode === 'signup' && (
                      <motion.div 
                        layoutId="authActiveTab"
                        className="absolute inset-0 bg-white rounded-xl shadow-xs border border-slate-200/50 -z-10"
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      />
                    )}
                  </button>
                </div>
              )}

              {/* Auth Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Full name on signup */}
                <AnimatePresence mode="popLayout">
                  {mode === 'signup' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1.5"
                    >
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
                        Fulde Navn
                      </label>
                      <div className="relative">
                        <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input 
                          type="text" 
                          placeholder="F.eks. Sara Vestergaard"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          required={mode === 'signup'} 
                          className="h-11 pl-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs font-medium"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
                    Studie- eller privat e-mail
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input 
                      type="email" 
                      placeholder="din-email@stud.kp.dk"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                      className="h-11 pl-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs font-medium"
                    />
                  </div>
                </div>

                {/* Password */}
                {mode !== 'forgot' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
                        Adgangskode
                      </label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => {
                            setMode('forgot');
                            setError(null);
                            setSuccess(null);
                          }}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          Glemt kode?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input 
                        type="password" 
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11 pl-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs font-medium"
                      />
                    </div>
                  </div>
                )}

                {/* Confirm Password on signup */}
                <AnimatePresence mode="popLayout">
                  {mode === 'signup' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1.5"
                    >
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
                        Gentag Adgangskode
                      </label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input 
                          type="password" 
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required={mode === 'signup'}
                          className="h-11 pl-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs font-medium"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Status Messages */}
                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -6 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-xs font-bold leading-relaxed"
                    >
                      {error}
                    </motion.div>
                  )}
                  {success && (
                    <motion.div 
                      initial={{ opacity: 0, y: -6 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs font-bold leading-relaxed"
                    >
                      {success}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-indigo-700 to-blue-600 hover:from-indigo-800 hover:to-blue-700 text-white shadow-md transition-all flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    <>
                      <span>
                        {mode === 'signin' 
                          ? "Log ind på portalen" 
                          : mode === 'signup' 
                          ? "Opret gratis studieprofil" 
                          : "Send nulstillingslink"}
                      </span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </Button>

                {/* Social Login Options */}
                {mode !== 'forgot' && (
                  <>
                    <div className="relative py-2 text-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                      </div>
                      <span className="relative bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        eller
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button" 
                        onClick={handleGoogleSubmit}
                        disabled={isLoading}
                        className="h-11 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-2xs"
                      >
                        <img 
                          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                          alt="Google" 
                          className="w-4 h-4" 
                        />
                        <span>Google</span>
                      </button>

                      <button 
                        type="button" 
                        onClick={handleAppleSubmit}
                        disabled={isLoading}
                        className="h-11 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 bg-slate-900 hover:bg-black transition-all shadow-2xs"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M17.05 20.28c-.98.95-2.05 1.88-3.08 1.88-1.04 0-1.37-.62-2.52-.62-1.15 0-1.52.6-2.52.64-1.04.04-2.23-1-3.23-1.95-2.03-1.93-3.58-5.46-3.58-8.77 0-5.26 3.42-8.04 6.78-8.04 1.06 0 2.06.66 2.72.66.65 0 1.9-.8 3.19-.8 1.34 0 2.58.48 3.38 1.4-2.82 1.7-2.38 5.68.83 6.98-1.08 2.65-2.55 5.25-3.57 6.62zM12.03 5.07c1.38-1.68 2.3-4.02 2.05-6.07-2.05.08-4.53 1.36-6 3.08-1.27 1.48-2.38 3.86-2.09 5.87 2.27.17 4.67-1.2 6.04-2.88z"/>
                        </svg>
                        <span>Apple</span>
                      </button>
                    </div>
                  </>
                )}
              </form>

              {/* Bottom footer links */}
              <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                {mode === 'forgot' ? (
                  <button 
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setError(null);
                      setSuccess(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-700 font-bold hover:underline"
                  >
                    <ArrowLeft size={13} />
                    <span>Tilbage til log ind</span>
                  </button>
                ) : (
                  <p className="text-xs text-slate-500 font-medium">
                    {mode === 'signin' ? 'Har du ikke en profil endnu?' : 'Har du allerede en profil?'}
                    <button 
                      type="button"
                      onClick={() => {
                        setMode(mode === 'signin' ? 'signup' : 'signin');
                        setError(null);
                        setSuccess(null);
                      }}
                      className="text-indigo-700 font-black ml-1.5 hover:underline"
                    >
                      {mode === 'signin' ? 'Opret profil gratis' : 'Log ind her'}
                    </button>
                  </p>
                )}
              </div>

            </div>
          </div>
          
          {/* RIGHT SIDE: 4 PILLARS FEATURE SHOWCASE */}
          <div className="lg:col-span-6 hidden lg:flex flex-col justify-between bg-gradient-to-br from-[#070a13] via-[#0f172a] to-[#1e1b4b] rounded-3xl p-8 lg:p-10 text-white shadow-2xl border border-slate-800 relative overflow-hidden">
            
            {/* Background ambient accents */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-[10px] font-black uppercase tracking-widest mb-4">
                <BookOpen size={12} className="text-indigo-400" />
                <span>4 Faglige Kernesøjler</span>
              </div>
              
              <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight mb-3">
                Mindre pensumstress.<br />Mere struktur & faglig ro.
              </h2>
              
              <p className="text-xs text-slate-300 leading-relaxed font-normal mb-8">
                Cohéro Student samler alle dine studieredskaber, lovparagraffer og pensumkilder i ét professionelt overblik skabt til velfærdsstuderende.
              </p>

              {/* 4 Pillars Mini Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-4 backdrop-blur-md">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-2.5">
                    <GraduationCap size={18} />
                  </div>
                  <div className="text-[11px] font-black text-white">1. Strukturering</div>
                  <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                    Modulkrav, læringsmål & 4-trins juridisk sagsanalyse.
                  </p>
                </div>

                <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-4 backdrop-blur-md">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2.5">
                    <CalendarDays size={18} />
                  </div>
                  <div className="text-[11px] font-black text-white">2. Planlægning</div>
                  <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                    Ugentlige læseplaner med tidsberegning & iCal-synk.
                  </p>
                </div>

                <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-4 backdrop-blur-md">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2.5">
                    <FileBox size={18} />
                  </div>
                  <div className="text-[11px] font-black text-white">3. Organisering</div>
                  <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                    Saml pensum, gemte paragraffer & APA 7th kilder.
                  </p>
                </div>

                <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-4 backdrop-blur-md">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-2.5">
                    <Search size={18} />
                  </div>
                  <div className="text-[11px] font-black text-white">4. Videnssøgning</div>
                  <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                    Semantisk litteratursøgning & officiel Lovportal.
                  </p>
                </div>

              </div>
            </div>

            {/* Bottom trust bar */}
            <div className="relative z-10 pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>100% GDPR-sikret i EU</span>
              </span>
              <span>Gældende Dansk Ret</span>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
};

const AuthPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
};

export default AuthPage;
