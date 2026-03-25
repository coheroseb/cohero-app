'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Search, 
  MapPin, 
  Building2, 
  Phone, 
  Mail, 
  Globe, 
  ChevronRight,
  Filter,
  Users,
  Briefcase,
  Layers,
  Sparkles,
  Loader2,
  X,
  Star,
  MessageCircle,
  ThumbsUp,
  Download,
  FileSpreadsheet,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, orderBy, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { useDebounce } from 'use-debounce';
import { useApp } from '@/app/provider';
import { useRouter } from 'next/navigation';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';

const AdminExportButton = ({ userProfile }: { userProfile: any }) => {
  const firestore = useFirestore();
  const [isExporting, setIsExporting] = useState(false);

  if (userProfile?.role !== 'admin') return null;

  const handleExport = async () => {
    if (!firestore) return;
    setIsExporting(true);
    
    try {
      const q = query(collection(firestore, 'institutions'));
      const snapshot = await getDocs(q);
      
      const rows = [['Institution', 'Email', 'Telefon', 'Region']];
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.E_MAIL) {
          rows.push([
            `"${(data.INST_NAVN || '').replace(/"/g, '""')}"`,
            data.E_MAIL,
            data.TLF_NR || '',
            data.BEL_REGION_TEKST || ''
          ]);
        }
      });

      const csvContent = rows.map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `mailliste-institutioner-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export fejl:", error);
      alert("Der opstod en fejl under eksporten.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button 
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-slate-800 shadow-xl shadow-slate-950/20 disabled:opacity-50"
    >
      {isExporting ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <FileSpreadsheet className="w-3 h-3" />
      )}
      {isExporting ? 'Eksporterer...' : 'Eksporter Mailliste (Admin)'}
    </button>
  );
};

const ReviewSection = ({ institutionId, user, autoScroll }: { institutionId: string, user: any, autoScroll?: boolean }) => {
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const sectionRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && sectionRef.current) {
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
    }
  }, [autoScroll]);

  const reviewsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'institution_reviews'),
      where('institutionId', '==', institutionId),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, institutionId]);

  const { data: reviews, isLoading } = useCollection<any>(reviewsQuery);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !reviewText.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, 'institution_reviews'), {
        institutionId,
        userId: user.uid,
        userName: user.displayName || 'Anonym Studerende',
        userPhoto: user.photoURL || '',
        rating,
        reviewText,
        createdAt: serverTimestamp()
      });
      setReviewText('');
      setRating(5);
    } catch (error) {
      console.error("Fejl ved afsendelse af anmeldelse:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div ref={sectionRef} className="mt-12 pt-12 border-t border-slate-100">
      <div className="flex items-center justify-between mb-8">
        <div>
           <p className="text-[10px] font-black uppercase text-rose-600 tracking-[0.2em] mb-1">Feedback</p>
           <h3 className="text-2xl font-black text-slate-900 serif">Studerende har været her</h3>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 rounded-2xl text-rose-700 text-xs font-bold">
           <Star className="w-4 h-4 fill-rose-500" />
           {reviews?.length || 0} vurderinger
        </div>
      </div>

      {/* Write a Review */}
      <form onSubmit={handleSubmit} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200/50 mb-12">
         <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4">Skriv en vurdering</p>
         <div className="flex gap-1 mb-6">
            {[1, 2, 3, 4, 5].map((s) => (
               <button 
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className="transition-transform hover:scale-110"
               >
                  <Star className={`w-6 h-6 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
               </button>
            ))}
         </div>
         <textarea 
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Del din oplevelse i praktik..."
            className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-rose-500 outline-none transition-all resize-none h-32 mb-4"
         />
         <button 
            disabled={isSubmitting || !reviewText.trim()}
            className="w-full py-4 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-700 disabled:opacity-50 transition-all shadow-lg shadow-rose-900/20"
         >
            {isSubmitting ? 'Sender...' : 'Indsend vurdering'}
         </button>
      </form>

      {/* Reviews List */}
      <div className="space-y-6">
         {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-rose-300" /></div>
         ) : reviews?.map((review) => (
            <div key={review.id} className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        {review.userPhoto ? <img src={review.userPhoto} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400"><Users className="w-5 h-5" /></div>}
                     </div>
                     <div>
                        <p className="text-xs font-bold text-slate-900">{review.userName}</p>
                        <div className="flex gap-0.5">
                           {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                           ))}
                        </div>
                     </div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400">{review.createdAt?.toDate().toLocaleDateString('da-DK')}</p>
               </div>
               <p className="text-xs text-slate-600 leading-relaxed font-medium">{review.reviewText}</p>
            </div>
         ))}
         {reviews?.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-[2rem]">
               <MessageCircle className="w-8 h-8 text-slate-200 mx-auto mb-3" />
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ingen vurderinger endnu</p>
               <p className="text-[10px] text-slate-300 mt-1">Vær den første til at dele din oplevelse!</p>
            </div>
         )}
      </div>
    </div>
  );
};

const DetailOverlay = ({ inst, user, onClose }: { inst: any, user: any, onClose: () => void }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
  >
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
    <motion.div 
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 20 }}
      className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl relative z-10 scrollbar-hide"
    >
       {/* Hero Header */}
       <div className="relative h-64 bg-amber-950 rounded-t-[3rem] overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-amber-950/80" />
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white transition-all z-20"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="absolute bottom-8 left-12 right-12">
             <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-amber-400 text-amber-950 text-[10px] font-black uppercase tracking-widest rounded-full">
                   {inst.EJER_KODE_TEKST}
                </span>
                <span className="px-3 py-1 bg-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-full backdrop-blur-md">
                   {inst.BEL_REGION_TEKST}
                </span>
             </div>
             <h2 className="text-4xl font-black text-white serif leading-tight">{inst.INST_NAVN}</h2>
          </div>
       </div>

       {/* Info Grid */}
       <div className="p-12 lg:p-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
             <div className="space-y-8">
                <section>
                   <p className="text-[10px] font-black uppercase text-amber-600 tracking-[0.2em] mb-4">Kontakt Information</p>
                   <div className="space-y-4">
                      <div className="flex items-center gap-4 group">
                         <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-600 transition-all">
                            <MapPin className="w-5 h-5" />
                         </div>
                         <div>
                            <p className="text-[10px] font-black uppercase text-slate-400">Adresse</p>
                            <p className="text-sm font-bold text-slate-900">{inst.INST_ADR}, {inst.POSTNR} {inst.POSTDISTRIKT}</p>
                         </div>
                      </div>
                      
                      {inst.TLF_NR && (
                         <div className="flex items-center gap-4 group">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-600 transition-all">
                               <Phone className="w-5 h-5" />
                            </div>
                            <div>
                               <p className="text-[10px] font-black uppercase text-slate-400">Telefon</p>
                               <p className="text-sm font-bold text-slate-900">{inst.TLF_NR}</p>
                            </div>
                         </div>
                      )}

                      {inst.E_MAIL && (
                         <div className="flex items-center gap-4 group">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-600 transition-all">
                               <Mail className="w-5 h-5" />
                            </div>
                            <div>
                               <p className="text-[10px] font-black uppercase text-slate-400">E-mail</p>
                               <p className="text-sm font-bold text-slate-900">{inst.E_MAIL}</p>
                            </div>
                         </div>
                      )}
                   </div>
                </section>

                <section>
                   <p className="text-[10px] font-black uppercase text-amber-600 tracking-[0.2em] mb-4">Organisatoriske Detaljer</p>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                         <p className="text-[9px] font-black uppercase text-slate-400 mb-1">CVR Nummer</p>
                         <p className="text-xs font-bold text-slate-900">{inst.CVR_NR}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                         <p className="text-[9px] font-black uppercase text-slate-400 mb-1">P-Nummer</p>
                         <p className="text-xs font-bold text-slate-900">{inst.P_NR}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 col-span-2">
                         <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Ansvarligt Ministerium</p>
                         <p className="text-xs font-bold text-slate-900">{inst.min_KODE_TEKST}</p>
                      </div>
                   </div>
                </section>
             </div>

             <div className="space-y-8">
                <div className="aspect-square bg-slate-100 rounded-[2.5rem] border border-slate-200 overflow-hidden relative shadow-inner">
                   {inst.GEO_BREDDE_GRAD && inst.GEO_LAENGDE_GRAD ? (
                      <iframe 
                        width="100%" 
                        height="100%" 
                        frameBorder="0" 
                        scrolling="no" 
                        marginHeight={0} 
                        marginWidth={0} 
                        src={`https://maps.google.com/maps?q=${inst.GEO_BREDDE_GRAD.replace(',', '.')},${inst.GEO_LAENGDE_GRAD.replace(',', '.')}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                        className="grayscale-[20%] contrast-[110%] opacity-90"
                      />
                   ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 text-center p-8">
                         <MapPin className="w-12 h-12 mb-4 opacity-50" />
                         <p className="text-xs font-black uppercase tracking-widest mb-1">Kort ikke tilgængeligt</p>
                      </div>
                   )}
                   {inst.WEB_ADR && (
                      <a 
                        href={inst.WEB_ADR.startsWith('http') ? inst.WEB_ADR : `https://${inst.WEB_ADR}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute bottom-6 left-6 right-6 py-4 bg-white/90 backdrop-blur-md text-slate-900 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-white transition-all shadow-xl shadow-slate-950/10"
                      >
                         Besøg Hjemmeside
                      </a>
                   )}
                </div>
             </div>
          </div>

          {/* Student Reviews Section */}
          <ReviewSection institutionId={inst.id} user={user} autoScroll={inst.autoScroll} />
       </div>
    </motion.div>
  </motion.div>
);

const InstitutionCard = ({ inst, onSelect }: { inst: any, onSelect: (data: any) => void }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="bg-white p-6 rounded-[2rem] border border-amber-100/50 shadow-xl shadow-amber-900/5 hover:-translate-y-1 transition-all group relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-125 transition-transform duration-700">
      <Building2 className="w-24 h-24 -rotate-12" />
    </div>

    <div className="relative z-10 flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
             <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-100">
                {inst.EJER_KODE_TEKST || 'Institution'}
             </span>
             {inst.min_KODE_TEKST && (
                <span className="px-2 py-0.5 bg-sky-50 text-sky-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-sky-100">
                  {inst.min_KODE_TEKST}
                </span>
             )}
             {inst.inst_type_2_tekst && (
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-100">
                  {inst.inst_type_2_tekst}
                </span>
             )}
          </div>
          <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-amber-700 transition-colors">
            {inst.INST_NAVN}
          </h3>
        </div>
      </div>

      <div className="space-y-3 mb-6 flex-1">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-amber-600 transition-colors">
            <MapPin className="w-4 h-4" />
          </div>
          <p className="text-xs font-medium truncate">
            {inst.INST_ADR}, {inst.POSTNR} {inst.POSTDISTRIKT}
          </p>
        </div>

        {inst.TLF_NR && (
          <div className="flex items-center gap-3 text-slate-500">
            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
              <Phone className="w-4 h-4" />
            </div>
            <p className="text-xs font-medium">{inst.TLF_NR}</p>
          </div>
        )}

        {inst.E_MAIL && (
          <div className="flex items-center gap-3 text-slate-500">
            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <p className="text-xs font-medium truncate">{inst.E_MAIL}</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
        <button 
          onClick={() => onSelect({ ...inst, autoScroll: true })}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-200/50"
        >
          <Star className="w-3 h-3 fill-rose-500" />
          Vurder
        </button>
        <button 
          onClick={() => onSelect(inst)}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
        >
          Detaljer
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  </motion.div>
);

const InstitutionsPage = () => {
  const { user, userProfile, isUserLoading } = useApp();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [regionFilter, setRegionFilter] = useState('Alle');
  const [ejerFilter, setEjerFilter] = useState('Alle');
  const [typeFilter, setTypeFilter] = useState('Alle');
  const [isLocating, setIsLocating] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<any>(null);
  const firestore = useFirestore();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/portal');
    }
  }, [user, isUserLoading, router]);

  // Automatisk lokation tæt på brugeren
  useEffect(() => {
    if ("geolocation" in navigator && regionFilter === 'Alle' && !searchTerm) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`https://api.dataforsyningen.dk/adgangsadresser/reverse?x=${longitude}&y=${latitude}&format=json`);
          const data = await response.json();
          if (data && data.region && data.region.navn) {
            setRegionFilter(data.region.navn);
          }
        } catch (error) {
          console.error("Kunne ikke finde lokation:", error);
        } finally {
          setIsLocating(false);
        }
      }, (error) => {
        setIsLocating(false);
      });
    }
  }, []);

  const regions = ['Alle', 'Region Hovedstaden', 'Region Sjælland', 'Region Syddanmark', 'Region Midtjylland', 'Region Nordjylland'];
  const ejerformer = ['Alle', 'Kommunale', 'Selvejende', 'Statslige', 'Private'];

  const institutionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    
    let q = collection(firestore, 'institutions');
    let constraints: any[] = [];

    // Prioriter søgning hvis den findes (prefix søgning kan ikke kombineres med filter uden index)
    if (debouncedSearch && debouncedSearch.length >= 2) {
      const searchStr = debouncedSearch.toLowerCase();
      const endStr = searchStr.replace(/.$/, c => String.fromCharCode(c.charCodeAt(0) + 1));
      return query(q, where('search_name', '>=', searchStr), where('search_name', '<', endStr), limit(40));
    }

    if (regionFilter !== 'Alle') {
      constraints.push(where('BEL_REGION_TEKST', '==', regionFilter));
    }
    if (ejerFilter !== 'Alle') {
        constraints.push(where('EJER_KODE_TEKST', '==', ejerFilter));
    }

    // Default sorting
    return query(q, ...constraints, orderBy('search_name'), limit(40));
  }, [firestore, user, debouncedSearch, regionFilter, ejerFilter, typeFilter]);

  const { data: institutions, isLoading: isQueryLoading, error } = useCollection<any>(institutionsQuery);

  if (isUserLoading || !user) {
    return <AuthLoadingScreen />;
  }

  const isLoading = isQueryLoading || isUserLoading;

  return (
    <div className="bg-[#FDFCF8] min-h-screen text-slate-900 overflow-x-hidden">
      {/* Header & Hero Section */}
      <header className="relative pt-24 pb-44 overflow-hidden">
        <div className="absolute inset-0 bg-amber-950">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-950/50 to-amber-950" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto px-6 relative z-10 text-center"
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-amber-400/10 border border-amber-400/20 rounded-full text-amber-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8">
            <Sparkles className="w-4 h-4" />
            Søg i institutionsregistret
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white serif tracking-tight mb-6">
            Find <span className="text-amber-500">Institutionen</span>
          </h1>
          <p className="max-w-2xl mx-auto text-amber-100/60 text-lg md:text-xl font-medium leading-relaxed">
            Søg på tværs af tusindvis af offentlige og private institutioner i Danmark.
          </p>
        </motion.div>
      </header>

      {/* Search & Filter Center */}
      <div className="relative z-30 -mt-16 md:-mt-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[3.5rem] shadow-[0_32px_64px_-16px_rgba(45,21,0,0.15)] border border-amber-100/50 p-2 overflow-hidden"
          >
            <div className="flex flex-col lg:flex-row gap-2">
              {/* Main Search */}
              <div className="flex-[1.5] relative group p-6 border-b lg:border-b-0 lg:border-r border-slate-50">
                <div className="flex items-center gap-4 mb-2 px-2">
                   <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                      <Search className="w-4 h-4" />
                   </div>
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Søg i registeret</p>
                </div>
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Søg på navn..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-transparent border-none py-2 px-2 text-lg font-bold text-slate-900 placeholder:text-slate-200 focus:ring-0 outline-none"
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Advanced Filters */}
              <div className="flex-1 p-4 bg-slate-50/50">
                 <div className="flex items-center gap-4 mb-2 px-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                       <Filter className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Filtrér søgningen</p>
                 </div>
                 
                 <div className="flex gap-3">
                    <div className="flex-1 relative group">
                      <select 
                        value={regionFilter}
                        onChange={(e) => setRegionFilter(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-4 pr-10 text-[11px] font-black uppercase tracking-wider text-slate-900 focus:ring-2 focus:ring-amber-500 appearance-none transition-all outline-none shadow-sm member-select"
                      >
                        {regions.map(r => (
                          <option key={r} value={r}>{r === 'Alle' ? 'Alle Regioner' : r}</option>
                        ))}
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 rotate-90 pointer-events-none" />
                    </div>

                    <div className="flex-1 relative group">
                      <select 
                        value={ejerFilter}
                        onChange={(e) => setEjerFilter(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-4 pr-10 text-[11px] font-black uppercase tracking-wider text-slate-900 focus:ring-2 focus:ring-amber-500 appearance-none transition-all outline-none shadow-sm member-select"
                      >
                        {ejerformer.map(e => (
                          <option key={e} value={e}>{e === 'Alle' ? 'Alle Ejerformer' : e}</option>
                        ))}
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 rotate-90 pointer-events-none" />
                    </div>
                 </div>
              </div>
            </div>

            {(searchTerm || regionFilter !== 'Alle' || ejerFilter !== 'Alle') && (
              <div className="bg-slate-50 border-t border-slate-100 px-8 py-4 flex items-center justify-end">
                  <button 
                    onClick={() => {
                       setSearchTerm('');
                       setRegionFilter('Alle');
                       setEjerFilter('Alle');
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-rose-100"
                  >
                     <X className="w-3 h-3" />
                     Nulstil filtre
                  </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pt-24 pb-24">
        {error && (
            <div className="mb-12 p-6 bg-rose-50 border border-rose-200 rounded-[2rem] text-rose-700">
                <p className="font-black uppercase tracking-widest text-[10px] mb-1">System Fejl</p>
                <p className="text-sm font-bold">Der opstod en fejl ved hentning af institutioner: {error.message}</p>
                <p className="text-xs mt-2 opacity-70">Dette skyldes typisk manglende databaseindekser eller rettigheder.</p>
            </div>
        )}
        <div className="flex items-center justify-between mb-12">
           <div>
              <p className="text-[10px] font-black uppercase text-amber-600 tracking-[0.2em] mb-1">Resultater</p>
              <h2 className="text-3xl font-black text-slate-900 serif flex items-center gap-3">
                {isLoading ? 'Henter...' : `${institutions?.length || 0} institutioner fundet`}
                {isLocating && (
                   <span className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase rounded-full animate-pulse border border-amber-100">
                      <MapPin className="w-3 h-3" />
                      Finder din lokation...
                   </span>
                )}
              </h2>
           </div>

           <div className="flex items-center gap-4">
              <AdminExportButton userProfile={userProfile} />
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500">
                 <Layers className="w-3 h-3" />
                 Alle typer
              </div>
           </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
             <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
             </div>
             <p className="text-sm font-black uppercase tracking-widest text-slate-400">Opdaterer dashboard...</p>
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {institutions?.map((inst) => (
                <InstitutionCard 
                  key={inst.id} 
                  inst={inst} 
                  onSelect={() => setSelectedInstitution(inst)} 
                />
              ))}
            </AnimatePresence>

            {institutions?.length === 0 && (
                <div className="col-span-full py-32 text-center space-y-4">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 serif">Ingen match fundet</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                        Vi kunne ikke finde nogen institutioner der matcher din søgning eller filtre.
                    </p>
                    <button 
                        onClick={() => {
                            setSearchTerm('');
                            setRegionFilter('Alle');
                            setEjerFilter('Alle');
                        }}
                        className="py-3 px-8 bg-amber-950 text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] hover:bg-rose-950 transition-all shadow-xl shadow-amber-950/20"
                    >
                        Nulstil filtre
                    </button>
                </div>
            )}
          </motion.div>
        )}
      </main>

      <AnimatePresence>
        {selectedInstitution && (
           <DetailOverlay 
              inst={selectedInstitution} 
              user={user} 
              onClose={() => setSelectedInstitution(null)} 
           />
        )}
      </AnimatePresence>
    </div>
  );
};

export default InstitutionsPage;
