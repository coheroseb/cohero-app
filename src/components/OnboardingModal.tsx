'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, School, Sparkles, Send, ChevronDown, User, Loader2, Users } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { updateProfile } from 'firebase/auth';
import { usePathname } from 'next/navigation';

interface OnboardingModalProps {
  onComplete: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
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

  useEffect(() => {
    if (user?.displayName) {
      setUsername(user.displayName);
    }
  }, [user]);

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
    if (!isQualified && !institution.trim()) {
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
        semester: isQualified ? '' : semester,
        institution: isQualified ? '' : institution,
        profession: profession,
        isQualified,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      
      await batch.commit();
      
      await updateProfile(user, { displayName: capitalizedUsername });
      
      onComplete(); // This should refetch the user profile in the AppProvider
    } catch (err) {
      console.error(err);
      setError('Der skete en fejl. Prøv venligst igen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="absolute inset-0 bg-amber-950/85 backdrop-blur-xl"></div>
      
      <div className="relative bg-[#FDFCF8] w-full max-w-lg rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl overflow-hidden p-8 sm:p-12 md:p-16 text-center max-h-[95vh] overflow-y-auto animate-fade-in-up border border-white/10">
        <div className="mb-10 sm:mb-12">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-inner ring-8 ring-amber-50/50">
            {isGroupsSource ? <Users className="w-8 h-8 sm:w-10 sm:h-10" /> : <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-amber-950 serif mb-3 leading-tight tracking-tight">
            {isGroupsSource ? 'Velkommen til Project Group!' : 'Velkommen til Cohéro!'}
          </h2>
          <p className="text-slate-500 text-sm sm:text-lg italic font-medium max-w-xs mx-auto leading-relaxed">
            {isGroupsSource 
              ? 'Indstil din profil for at komme i gang med dine studiegrupper.' 
              : 'Fortæl os lidt om dig selv, så vi kan skræddersy din oplevelse.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 max-w-sm mx-auto">
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-amber-700 transition-colors" />
            <Input
              type="text"
              placeholder="Dit fulde navn"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-11 pr-4 py-4 bg-white border-amber-100 rounded-2xl focus:ring-4 focus:ring-amber-950/5 focus:border-amber-950 focus:outline-none transition-all text-sm h-14 font-bold shadow-sm"
              required
            />
          </div>

          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within:text-amber-700 transition-colors" />
            <select
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                className="w-full appearance-none pl-11 pr-10 py-4 bg-white border border-amber-100 rounded-2xl focus:ring-4 focus:ring-amber-950/5 focus:border-amber-950 focus:outline-none transition-all text-sm h-14 font-bold cursor-pointer shadow-sm"
                required
            >
                <option value="" disabled>Hvad læser/er du?</option>
                <option value="Socialrådgiver">Socialrådgiver</option>
                <option value="Pædagog">Pædagog</option>
                <option value="Lærer">Lærer</option>
                <option value="Sygeplejerske">Sygeplejerske</option>
                <option value="Andet">Andet</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-amber-950 transition-colors" />
          </div>
          
          {!isQualified && (
            <>
              <div className="relative group">
                <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-amber-700 transition-colors" />
                <Input 
                  type="text" 
                  placeholder="Hvilket semester er du på?"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 bg-white border-amber-100 rounded-2xl focus:ring-4 focus:ring-amber-950/5 focus:border-amber-950 focus:outline-none transition-all text-sm h-14 font-bold shadow-sm"
                />
              </div>
              
              <div className="relative group">
                <School className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within:text-amber-700 transition-colors" />
                <select
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full appearance-none pl-11 pr-10 py-4 bg-white border border-amber-100 rounded-2xl focus:ring-4 focus:ring-amber-950/5 focus:border-amber-950 focus:outline-none transition-all text-sm h-14 font-bold cursor-pointer shadow-sm"
                    required={!isQualified}
                >
                    <option value="" disabled>Vælg uddannelsesinstitution</option>
                    <option value="Københavns Professionshøjskole">Københavns Professionshøjskole</option>
                    <option value="VIA University College">VIA University College</option>
                    <option value="UC SYD">UC SYD</option>
                    <option value="UCL Erhvervsakademi og Professionshøjskole">UCL Erhvervsakademi og Professionshøjskole</option>
                    <option value="Professionshøjskolen Absalon">Professionshøjskolen Absalon</option>
                    <option value="UCN">UCN</option>
                    <option value="Aalborg Universitet">Aalborg Universitet</option>
                    <option value="Andet">Andet</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-amber-950 transition-colors" />
              </div>
            </>
          )}

           <div className="flex items-center justify-center gap-3 !mt-10 py-2 border-y border-amber-100/50">
                <input
                    id="isQualified"
                    type="checkbox"
                    checked={isQualified}
                    onChange={(e) => setIsQualified(e.target.checked)}
                    className="h-5 w-5 rounded-lg border-amber-300 bg-white text-amber-600 focus:ring-amber-500 cursor-pointer shadow-sm"
                />
                <label htmlFor="isQualified" className={`text-sm font-bold text-amber-950 cursor-pointer select-none`}>
                    Jeg er færdiguddannet
                </label>
            </div>

          {error && <p className="text-xs text-rose-600 font-bold bg-rose-50 p-3 rounded-xl border border-rose-100 animate-shake">{error}</p>}

          <Button 
            type="submit"
            disabled={loading}
            size="lg"
            className="w-full group !mt-8 h-16 rounded-2xl shadow-2xl shadow-amber-950/20 active:scale-95 transition-all bg-amber-950 text-white hover:bg-amber-900 border-none"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span className="font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs">{isGroupsSource ? 'Gem og fortsæt til grupper' : 'Opret min profil'}</span>
                <Send className="w-4 h-4 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </>
            )}
          </Button>
        </form>
        
        <p className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-amber-900/20">Cohéro • Din digitale kollega</p>
      </div>
    </div>
  );
};

export default OnboardingModal;
