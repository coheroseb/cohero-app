'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { applyActionCode, confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { Loader2, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function HandleAction() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const auth = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'reset_form'>('loading');
  const [message, setMessage] = useState('Bekræfter...');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionCode, setActionCode] = useState<string | null>(null);

  useEffect(() => {
    const mode = searchParams?.get('mode');
    const code = searchParams?.get('oobCode');

    if (!code || !auth) {
      setStatus('error');
      setMessage('Ugyldigt link. Manglende eller forkert information.');
      return;
    }

    setActionCode(code);

    if (mode === 'verifyEmail') {
      applyActionCode(auth, code)
        .then(() => {
          setStatus('success');
          setMessage('Din e-mail er nu bekræftet! Du vil blive viderestillet om et øjeblik.');
          setTimeout(() => router.push('/portal'), 3000);
        })
        .catch((error) => {
          setStatus('error');
          console.error(error);
          switch (error.code) {
            case 'auth/expired-action-code':
              setMessage('Bekræftelseslinket er udløbet. Anmod venligst om et nyt.');
              break;
            case 'auth/invalid-action-code':
              setMessage('Bekræftelseslinket er ugyldigt. Det kan allerede være blevet brugt.');
              break;
            default:
              setMessage('Der opstod en ukendt fejl. Prøv venligst igen.');
          }
        });

    } else if (mode === 'resetPassword') {
      // Verify the reset code is valid before showing the form
      verifyPasswordResetCode(auth, code)
        .then((email) => {
          setResetEmail(email);
          setStatus('reset_form');
        })
        .catch((error) => {
          setStatus('error');
          console.error(error);
          switch (error.code) {
            case 'auth/expired-action-code':
              setMessage('Nulstillingslinket er udløbet. Anmod venligst om et nyt.');
              break;
            case 'auth/invalid-action-code':
              setMessage('Nulstillingslinket er ugyldigt eller allerede brugt. Anmod om et nyt.');
              break;
            default:
              setMessage('Der opstod en fejl. Prøv at anmode om et nyt nulstillingslink.');
          }
        });

    } else {
      setStatus('error');
      setMessage('Ukendt handlingstype. Kontakt support hvis problemet fortsætter.');
    }
  }, [searchParams, auth, router]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionCode || !auth) return;

    if (newPassword.length < 6) {
      setMessage('Adgangskoden skal være på mindst 6 tegn.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('Adgangskoderne stemmer ikke overens.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    try {
      await confirmPasswordReset(auth, actionCode, newPassword);
      setStatus('success');
      setMessage('Din adgangskode er nu nulstillet. Du kan nu logge ind med din nye adgangskode.');
      setTimeout(() => router.push('/auth?mode=signin'), 3000);
    } catch (error: any) {
      console.error(error);
      setIsSubmitting(false);
      switch (error.code) {
        case 'auth/expired-action-code':
          setStatus('error');
          setMessage('Nulstillingslinket er udløbet. Anmod venligst om et nyt.');
          break;
        case 'auth/weak-password':
          setMessage('Adgangskoden er for svag. Vælg mindst 6 tegn.');
          break;
        default:
          setMessage('Der opstod en fejl. Prøv igen eller anmod om et nyt link.');
      }
    }
  };

  return (
    <div className="max-w-md w-full bg-white p-8 md:p-12 rounded-[2.5rem] text-center border border-amber-100/60 shadow-xl">
      
      {/* Loading */}
      {status === 'loading' && (
        <>
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mb-6 mx-auto animate-pulse">
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-amber-950 serif mb-3">Bekræfter...</h1>
        </>
      )}

      {/* Success */}
      {status === 'success' && (
        <>
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mb-6 mx-auto">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-amber-950 serif mb-3">Klaret!</h1>
          <p className="text-slate-600 mb-8">{message}</p>
        </>
      )}

      {/* Error */}
      {status === 'error' && (
        <>
          <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mb-6 mx-auto">
            <XCircle className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-amber-950 serif mb-3">Fejl</h1>
          <p className="text-slate-600 mb-8">{message}</p>
          <Link href="/auth?mode=signin" passHref>
            <Button>Tilbage til log ind</Button>
          </Link>
        </>
      )}

      {/* Password Reset Form */}
      {status === 'reset_form' && (
        <>
          <div className="w-20 h-20 bg-amber-100 text-amber-700 rounded-3xl flex items-center justify-center mb-6 mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-amber-950 mb-1">Vælg ny adgangskode</h1>
          <p className="text-slate-400 text-sm mb-8">{resetEmail}</p>

          <form onSubmit={handlePasswordReset} className="text-left space-y-4">
            <div className="relative">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1 mb-1.5 block">Ny adgangskode</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mindst 6 tegn"
                className="w-full h-14 px-5 pr-12 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 bottom-4 text-slate-400">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1 mb-1.5 block">Gentag adgangskode</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Gentag adgangskode"
                className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>

            {message && (
              <p className={`text-sm font-medium text-center pt-1 ${message.includes('nulstillet') ? 'text-emerald-600' : 'text-rose-500'}`}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 bg-amber-950 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-amber-900 active:scale-95 transition-all mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gem ny adgangskode'}
            </button>
          </form>
        </>
      )}

      {/* Success CTA */}
      {status === 'success' && (
        <Link href="/auth?mode=signin" passHref>
          <Button>Gå til log ind</Button>
        </Link>
      )}
    </div>
  );
}

export default function ActionPage() {
  return (
    <div className="bg-[#FDFCF8] min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="max-w-md w-full bg-white p-8 md:p-12 rounded-[2.5rem] text-center border border-amber-100/60 shadow-xl">
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mb-6 mx-auto animate-pulse">
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-amber-950 serif mb-3">Indlæser...</h1>
        </div>
      }>
        <HandleAction />
      </Suspense>
    </div>
  );
}
