'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { applyActionCode } from 'firebase/auth';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function HandleAction() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const auth = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Bekræfter din e-mail...');

  useEffect(() => {
    const mode = searchParams.get('mode');
    const actionCode = searchParams.get('oobCode');

    if (mode === 'verifyEmail' && actionCode && auth) {
      applyActionCode(auth, actionCode)
        .then(() => {
          setStatus('success');
          setMessage('Din e-mail er nu bekræftet! Du vil blive viderestillet til din portal om et øjeblik.');
          setTimeout(() => {
            router.push('/portal');
          }, 3000);
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
              break;
          }
        });
    } else {
        setStatus('error');
        setMessage('Ugyldigt link. Manglende eller forkert information.');
    }
  }, [searchParams, auth, router]);

  return (
    <div className="max-w-md w-full bg-white p-8 md:p-12 rounded-[2.5rem] text-center border border-amber-100/60 shadow-xl">
      {status === 'loading' && (
        <>
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mb-6 mx-auto animate-pulse">
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-amber-950 serif mb-3">Bekræfter...</h1>
        </>
      )}
      {status === 'success' && (
        <>
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mb-6 mx-auto">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-amber-950 serif mb-3">E-mail Bekræftet!</h1>
        </>
      )}
      {status === 'error' && (
         <>
          <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mb-6 mx-auto">
            <XCircle className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-amber-950 serif mb-3">Fejl</h1>
        </>
      )}
      <p className="text-slate-600 mb-8">{message}</p>
       {status !== 'loading' && (
        <Link href={status === 'success' ? '/portal' : '/'} passHref>
          <Button>
            {status === 'success' ? 'Gå til portal' : 'Tilbage til forsiden'}
          </Button>
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
