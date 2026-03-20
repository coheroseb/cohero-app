'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { BookOpen, School, Sparkles, Send, ChevronDown, User, Loader2, Users } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { updateProfile } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/app/provider';

const DANISH_INSTITUTIONS = [
    "Københavns Professionshøjskole",
    "VIA University College",
    "UC SYD",
    "UCL Erhvervsakademi og Professionshøjskole",
    "Professionshøjskolen Absalon",
    "UCN",
    "SOSU Nord",
    "SOSU Østjylland",
    "SOSU H",
    "SOSU Fyn",
    "SOSU Syd",
    "SOSU Esbjerg",
    "SOSU Nykøbing Falster",
    "SOSU Silkeborg",
    "Aalborg Universitet",
    "Aarhus Universitet",
    "Københavns Universitet",
    "Syddansk Universitet",
    "Roskilde Universitet",
    "Andet"
].sort();

const OnboardingContent = () => {
  const [username, setUsername] = useState('');
  const [semester, setSemester] = useState('');
  const [institution, setInstitution] = useState('');
  const [profession, setProfession] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user, isUserLoading } = useUser();
  const { refetchUserProfile, userProfile } = useApp();
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push(`/rum/groups/auth${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`);
    }
  }, [user, isUserLoading, router, callbackUrl]);

  useEffect(() => {
    if (user?.displayName && !username) {
      setUsername(user.displayName);
    }
  }, [user, username]);

  // If already onboarded, redirect
  useEffect(() => {
    if (userProfile && (userProfile.isQualified || (userProfile.institution && userProfile.semester))) {
        if (callbackUrl) {
            router.push(callbackUrl);
        } else {
            router.push('/rum/groups');
        }
    }
  }, [userProfile, router, callbackUrl]);

  const capitalize = (s: string) => {
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Indtast venligst dit navn eller brugernavn.');
      return;
    }
    if (!profession.trim()) {
      setError('Vælg venligst din profession (eller hvad du studerer).');
      return;
    }
    if (!institution.trim()) {
      setError('Vælg venligst din uddannelsesinstitution.');
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
        semester: semester,
        institution: institution,
        profession: profession,
        isQualified: false,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      
      await batch.commit();
      
      await updateProfile(user, { displayName: capitalizedUsername });
      
      await refetchUserProfile();
      
      if (callbackUrl) {
          router.push(callbackUrl);
      } else {
          router.push('/rum/groups');
      }
    } catch (err) {
      console.error(err);
      setError('Der skete en fejl. Prøv venligst igen.');
    } finally {
      setLoading(false);
    }
  };

  if (isUserLoading || !user) {
    return (
        <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
            <Loader2 className="animate-spin text-amber-900 w-10 h-10" />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col items-center justify-center p-6 sm:p-12">
      <div className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden p-8 sm:p-16 border border-amber-100/50">
        <div className="mb-12 text-center">
          <div className="w-20 h-20 bg-amber-50 text-amber-700 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-inner">
            <Users className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold text-amber-950 serif mb-4 leading-tight">
            Velkommen til Project Group!
          </h1>
          <p className="text-slate-500 italic text-lg max-w-md mx-auto leading-relaxed">
            Indstil din profil for at komme i gang med dine fælles rum og værktøjer.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
          <div className="space-y-4">
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-amber-700 transition-colors" />
                <Input
                  type="text"
                  placeholder="Dit fulde navn"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border-slate-100 rounded-2xl focus:ring-4 focus:ring-amber-900/5 focus:border-amber-900 focus:outline-none transition-all text-sm h-14 font-bold shadow-sm"
                  required
                />
              </div>

              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none group-focus-within:text-amber-700 transition-colors" />
                <select
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className="w-full appearance-none pl-12 pr-10 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-amber-900/5 focus:border-amber-900 focus:outline-none transition-all text-sm h-14 font-bold cursor-pointer shadow-sm"
                    required
                >
                    <option value="" disabled>Hvad læser du?</option>
                    <option value="Socialrådgiver">Socialrådgiver</option>
                    <option value="Pædagog">Pædagog</option>
                    <option value="Lærer">Lærer</option>
                    <option value="Sygeplejerske">Sygeplejerske</option>
                    <option value="Andet">Andet</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-amber-950 transition-colors" />
              </div>
              
              <div className="relative group">
                <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-amber-700 transition-colors" />
                <Input 
                  type="text" 
                  placeholder="Hvilket semester er du på?"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border-slate-100 rounded-2xl focus:ring-4 focus:ring-amber-900/5 focus:border-amber-900 focus:outline-none transition-all text-sm h-14 font-bold shadow-sm"
                  required
                />
              </div>
              
              <div className="relative group">
                <School className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none group-focus-within:text-amber-700 transition-colors" />
                <select
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full appearance-none pl-12 pr-10 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-amber-900/5 focus:border-amber-900 focus:outline-none transition-all text-sm h-14 font-bold cursor-pointer shadow-sm"
                    required
                >
                    <option value="" disabled>Vælg uddannelsesinstitution</option>
                    {DANISH_INSTITUTIONS.map(inst => (
                        <option key={inst} value={inst}>{inst}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-amber-950 transition-colors" />
              </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-xs flex items-center gap-3 border border-red-100 font-bold">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" /> <span>{error}</span>
            </div>
          )}

          <Button 
            type="submit"
            disabled={loading}
            className="w-full h-16 rounded-2xl shadow-xl bg-amber-950 text-white hover:bg-black transition-all active:scale-95 border-none"
          >
            {loading ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <>
                <span className="font-black uppercase tracking-widest text-xs">Gem og fortsæt til grupper</span>
                <Send className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>
        
        <p className="mt-12 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Cohéro • Project Group</p>
      </div>
    </div>
  );
};

const GroupsOnboardingPage = () => {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center"><Loader2 className="animate-spin text-amber-900" /></div>}>
            <OnboardingContent />
        </Suspense>
    )
}

// Simple AlertTriangle icon since we don't import it from lucide above
const AlertTriangle = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
);

export default GroupsOnboardingPage;
