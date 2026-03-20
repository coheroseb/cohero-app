
'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  ChevronRight, 
  X, 
  BookOpen, 
  Sparkles, 
  Loader2, 
  Copy, 
  Check, 
  ChevronLeft, 
  Info, 
  Library, 
  Scale as ScaleIcon, 
  History, 
  LayoutDashboard, 
  Trash2, 
  List, 
  ChevronDown, 
  CheckCircle2,
  Lock, 
  Brain,
  Gavel,
  Target,
  Zap,
  Navigation,
  FileStack,
  Folders,
  FolderPlus,
  Bookmark, 
  BookmarkCheck, 
  Building,
  FileText,
  AlertTriangle,
  Highlighter,
  Users,
  ExternalLink as ExternalLinkIcon,
  Quote,
  ArrowRight,
  ArrowUpRight,
  PanelRight,
  BookMarked,
  Clock,
  TrendingUp,
  GraduationCap,
  Trophy,
  BarChart3,
  Activity,
  Maximize,
  Minimize,
  Save,
  RotateCcw,
  HelpCircle,
  Wand2,
  Stethoscope,
  Coins,
  ShieldAlert,
  Eye,
  Briefcase
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '@/app/provider';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  doc, 
  deleteDoc, 
  updateDoc, 
  getDoc, 
  onSnapshot, 
  DocumentData, 
  addDoc, 
  serverTimestamp, 
  setDoc, 
  increment, 
  where, 
  limit,
  writeBatch
} from 'firebase/firestore';
import { useDebounce } from 'use-debounce';
import { 
    getLawContentAction, 
    analyzeParagraphAction,
    fetchLawTimeline,
    fetchRelatedDocumentLinks,
    fetchRelatedDecisions,
    fetchOmbudsmandReports,
} from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { LiveStatusBadge } from './LiveStatusBadge';
import LawQuizModal from './LawQuizModal';
import ReadingGuideModal from './ReadingGuideModal';
import type { LawContentType, ParagraphAnalysisData, CollectionData, SavedParagraph, QuizResult, LawConfig } from '@/ai/flows/types';

// --- CONSTANTS ---

const SEARCH_SUGGESTIONS = [
  "Hvornår har man underretningspligt?",
  "Betingelser for anbringelse uden samtykke",
  "Hvad er mindsteindgrebets princip?",
  "Regler for støtte i hjemmet (§ 32)",
  "Hvordan fungerer partshøring?",
  "Socialpædagogisk bistand til voksne (§ 85)",
  "Regler for ledsageordning (§ 97)",
  "Hvornår må man videregive oplysninger?",
  "Borgerrådgiverens rolle",
  "Tvangsmæssig behandling af voksne",
  "Hjælp til stofmisbrugere",
  "Vejledningspligt efter forvaltningsloven § 7",
  "Aktindsigt for parter",
  "Hvad betyder barnets bedste?",
  "Merudgiftsydelse til voksne",
  "Regler for botilbud (§ 107/108)"
];

const SITUATIONS = [
  {
    id: 'barn-mistrives',
    title: 'Barn mistrives',
    description: 'Mistanke om omsorgssvigt eller overgreb.',
    icon: <AlertTriangle className="w-6 h-6" />,
    color: 'bg-rose-50 text-rose-700',
    initialNode: 'start',
    nodes: {
      'start': {
        question: 'Er du privatperson eller fagperson?',
        options: [
          { text: 'Privatperson', nextNodeId: 'privat-akut' },
          { text: 'Fagperson', nextNodeId: 'fag-akut' }
        ]
      },
      'privat-akut': {
        question: 'Er barnet i akut fare?',
        options: [
          { text: 'Ja', result: {
            title: 'Kontakt Politiet eller Døgnvagt',
            action: 'Ved akut fare skal du handle med det samme for at beskytte barnet.',
            contact: 'Ring 112 eller kontakt bopælskommunens sociale døgnvagt.',
            rules: [{ lawId: 'barnets-lov', paragraph: '§ 135', text: 'Underretningspligt for alle' }]
          }},
          { text: 'Nej', result: {
            title: 'Send en underretning',
            action: 'Du har pligt til at underrette kommunen, hvis du har kendskab til vanrøgt eller behandling, der bringer barnets sundhed i fare.',
            contact: 'Kontakt barnets bopælskommune via deres hjemmeside eller telefon.',
            rules: [{ lawId: 'barnets-lov', paragraph: '§ 135', text: 'Almindelig underretningspligt' }]
          }}
        ]
      },
      'fag-akut': {
        question: 'Er barnet i akut fare?',
        options: [
          { text: 'Ja', result: {
            title: 'Iværksæt akutte foranstaltninger',
            action: 'Som fagperson skal du sikre barnets sikkerhed promte.',
            contact: 'Kontakt din leder og den kommunale bagvagt straks.',
            rules: [
                { lawId: 'barnets-lov', paragraph: '§ 133', text: 'Skærpet underretningspligt' },
                { lawId: 'barnets-lov', paragraph: '§ 136', text: 'Akut vurdering (24 timer)' }
            ]
          }},
          { text: 'Nej', result: {
            title: 'Skærpet underretningspligt',
            action: 'Fagpersoner har en skærpet pligt til at underrette, når de i deres virke får kendskab til forhold, der giver anledning til bekymring.',
            contact: 'Underretningen skal ske digitalt via kommunens fagportal.',
            rules: [{ lawId: 'barnets-lov', paragraph: '§ 133', text: 'Skærpet underretningspligt for fagpersoner' }]
          }}
        ]
      }
    }
  },
  {
    id: 'sagsbehandling',
    title: 'Sagsbehandling',
    description: 'Vejledning, partshøring og afgørelser.',
    icon: <ScaleIcon className="w-6 h-6" />,
    color: 'bg-blue-50 text-blue-700',
    initialNode: 'start',
    nodes: {
      'start': {
        question: 'Hvad er din primære opgave lige nu?',
        options: [
          { text: 'Jeg skal vejlede en borger', result: {
            title: 'Vejledningspligt',
            action: 'En forvaltningsmyndighed skal i fornødent omfang yde vejledning og bistand til personer, der retter henvendelse.',
            contact: 'Din nærmeste leder for afklaring af kompetenceområde.',
            rules: [{ lawId: 'forvaltningsloven', paragraph: '§ 7', text: 'Vejledningspligt' }]
          }},
          { text: 'Jeg skal træffe en afgørelse', nextNodeId: 'afgorelse-check' }
        ]
      },
      'afgorelse-check': {
        question: 'Er der oplysninger til ugunst for borgeren, som de ikke kender til?',
        options: [
          { text: 'Ja, vi har fået nye oplysninger', result: {
            title: 'Pligt til partshøring',
            action: 'Du må ikke træffe afgørelse, før du har gjort parten bekendt med oplysningerne og givet dem lejlighed til at udtale sig.',
            contact: 'Borgeren/Parten i sagen.',
            rules: [{ lawId: 'forvaltningsloven', paragraph: '§ 19', text: 'Partshøringspligt' }]
          }},
          { text: 'Nej, alle oplysninger er kendte', result: {
            title: 'Krav til begrundelse',
            action: 'En skriftlig afgørelse skal altid ledsages af en begrundelse, medmindre den giver parten fuldt medhold.',
            contact: 'Juridisk afdeling for kvalitetssikring af skabeloner.',
            rules: [
                { lawId: 'forvaltningsloven', paragraph: '§ 22', text: 'Krav om begrundelse' },
                { lawId: 'forvaltningsloven', paragraph: '§ 24', text: 'Begrundelsens indhold' }
            ]
          }}
        ]
      }
    }
  },
  {
    id: 'offentlig-indsigt',
    title: 'Offentlig Indsigt',
    description: 'Aktindsigt for ikke-parter og notatpligt.',
    icon: <Eye className="w-6 h-6" />,
    color: 'bg-emerald-50 text-emerald-700',
    initialNode: 'start',
    nodes: {
      'start': {
        question: 'Hvad søges der indsigt i?',
        options: [
          { text: 'En journalist/borger ønsker aktindsigt', result: {
            title: 'Aktindsigt efter Offentlighedsloven',
            action: 'Enhver kan som udgangspunkt forlange at blive gjort bekendt med dokumenter indgået til eller oprettet af en myndighed.',
            contact: 'Kommunens aktindsigt-team eller juridiske konsulent.',
            rules: [{ lawId: 'offentlighedsloven', paragraph: '§ 7', text: 'Hovedreglen om aktindsigt' }]
          }},
          { text: 'Dokumentation af en mundtlig oplysning', result: {
            title: 'Notatpligt',
            action: 'Når myndigheden mundtligt bliver bekendt med oplysninger om en sags faktiske grundlag, skal der snarest gøres notat.',
            contact: 'Sagsbehandlerens egen journalføring.',
            rules: [{ lawId: 'offentlighedsloven', paragraph: '§ 13', text: 'Notatpligt i afgørelsessager' }]
          }}
        ]
      }
    }
  },
  {
    id: 'stotte-familie',
    title: 'Støtte til familie',
    description: 'Hjælp i hjemmet eller forebyggende indsatser.',
    icon: <Users className="w-6 h-6" />,
    color: 'bg-indigo-50 text-indigo-700',
    initialNode: 'start',
    nodes: {
      'start': {
        question: 'Hvad er det primære behov?',
        options: [
          { text: 'Rådgivning & Forebyggelse', result: {
            title: 'Tidlig forebyggende indsats',
            action: 'Kommunen skal tilbyde gratis rådgivning for at forebygge sociale problemer.',
            contact: 'Kommunens åbne rådgivning eller familieafdeling.',
            rules: [{ lawId: 'barnets-lov', paragraph: '§ 30', text: 'Forebyggende indsatser' }]
          }},
          { text: 'Konkret støtte i hjemmet', result: {
            title: 'Støttende indsatser',
            action: 'Kommunen kan træffe afgørelse om praktisk, pædagogisk eller anden støtte i hjemmet.',
            contact: 'Sagsbehandler i Børne- og Familieafdelingen.',
            rules: [{ lawId: 'barnets-lov', paragraph: '§ 32', text: 'Støttende indsatser' }]
          }}
        ]
      }
    }
  },
  {
    id: 'voksen-stotte',
    title: 'Voksen-støtte',
    description: 'Bistand til voksne med nedsat funktionsevne.',
    icon: <Stethoscope className="w-6 h-6" />,
    color: 'bg-emerald-50 text-emerald-700',
    initialNode: 'start',
    nodes: {
      'start': {
        question: 'Hvilken type støtte er der tale om?',
        options: [
          { text: 'Hjælp i hverdagen', result: {
            title: 'Socialpædagogisk bistand',
            action: 'Kommunen tilbyder hjælp, omsorg eller støtte samt optræning til voksne.',
            contact: 'Voksenafdelingen i kommunen.',
            rules: [{ lawId: 'serviceloven', paragraph: '§ 85', text: 'Socialpædagogisk støtte' }]
          }},
          { text: 'Ledsagelse', result: {
            title: 'Ledsageordning',
            action: 'Voksne med betydelig nedsat funktionsevne har ret til 15 timers ledsagelse om måneden.',
            contact: 'Visitator i kommunen.',
            rules: [{ lawId: 'serviceloven', paragraph: '§ 97', text: 'Ledsageordning' }]
          }}
        ]
      }
    }
  },
  {
    id: 'okonomi-stotte',
    title: 'Økonomisk støtte',
    description: 'Ydelser ved ledighed eller merudgifter.',
    icon: <Coins className="w-6 h-6" />,
    color: 'bg-amber-50 text-amber-700',
    initialNode: 'start',
    nodes: {
      'start': {
        question: 'Hvad søges der støtte til?',
        options: [
          { text: 'Forsørgelse (ledighed)', result: {
            title: 'Hjælp til forsørgelse',
            action: 'Personer der ikke kan forsørge sig selv pga. f.eks. arbejdsløshed.',
            contact: 'Jobcenteret eller ydelsesafdelingen.',
            rules: [{ lawId: 'aktivloven', paragraph: '§ 11', text: 'Ret til hjælp til forsørgelse' }]
          }},
          { text: 'Merudgifter pga. handicap', result: {
            title: 'Dækning af merudgifter',
            action: 'Dækning af nødvendige merudgifter ved forsørgelse i hjemmet.',
            contact: 'Voksenafdelingen eller Børne-handicap.',
            rules: [
                { lawId: 'barnets-lov', paragraph: '§ 86', text: 'Merudgifter (børn)' },
                { lawId: 'serviceloven', paragraph: '§ 100', text: 'Merudgifter (voksne)' }
            ]
          }}
        ]
      }
    }
  },
  {
    id: 'beskaeftigelse-indsats',
    title: 'Beskæftigelse',
    description: 'Tilbud, fleksjob og ressourceforløb.',
    icon: <Briefcase className="w-6 h-6" />,
    color: 'bg-emerald-50 text-emerald-700',
    initialNode: 'start',
    nodes: {
      'start': {
        question: 'Hvad er borgerens situation?',
        options: [
          { text: 'Ledig og klar til job/uddannelse', result: {
            title: 'Indsatser for ledige',
            action: 'Jobcenteret tilbyder en række indsatser for at hjælpe ledige i gang.',
            contact: 'Sagsbehandler i Jobcenteret.',
            rules: [
                { lawId: 'lab-loven', paragraph: '§ 6', text: 'Målgrupper for indsats' },
                { lawId: 'lab-loven', paragraph: '§ 52', text: 'Tilbudstyper (praktik, løntilskud m.m.)' }
            ]
          }},
          { text: 'Sygemeldt eller begrænset arbejdsevne', nextNodeId: 'syg-check' }
        ]
      },
      'syg-check': {
        question: 'Er arbejdsevnen varigt og væsentligt nedsat?',
        options: [
          { text: 'Ja, den er varigt nedsat', result: {
            title: 'Fleksjob-ordningen',
            action: 'Fleksjob er en ordning for personer med varige og væsentlige begrænsninger i arbejdsevnen.',
            contact: 'Rehabiliteringsteamet i Jobcenteret.',
            rules: [{ lawId: 'lab-loven', paragraph: '§ 116', text: 'Visitation til fleksjob' }]
          }},
          { text: 'Nej eller Uvist (behov for afklaring)', result: {
            title: 'Forløb til afklaring og udvikling',
            action: 'Ved komplekse problemer eller langvarig sygdom kan der iværksættes særlige forløb.',
            contact: 'Koordinerende sagsbehandler i Jobcenteret.',
            rules: [
                { lawId: 'lab-loven', paragraph: '§ 107', text: 'Jobafklaringsforløb' },
                { lawId: 'lab-loven', paragraph: '§ 112', text: 'Ressourceforløb' }
            ]
          }}
        ]
      }
    }
  },
  {
    id: 'sanktion-raadighed',
    title: 'Sanktion & Rådighed',
    description: 'Når borgeren ikke lever op til sine pligter.',
    icon: <ShieldAlert className="w-6 h-6" />,
    color: 'bg-rose-50 text-rose-700',
    initialNode: 'start',
    nodes: {
      'start': {
        question: 'Hvad er årsagen til den mulige sanktion?',
        options: [
          { text: 'Udeblevet eller afvist tilbud/samtale', result: {
            title: 'Sanktioner ved manglende medvirken',
            action: 'Kommunen skal foretage fradrag i eller nedsættelse af hjælpen, hvis borgeren udebliver uden rimelig grund.',
            contact: 'Ydelsesafdelingen i kommunen.',
            rules: [{ lawId: 'aktivloven', paragraph: '§ 36', text: 'Sanktioner' }]
          }},
          { text: 'Manglende aktiv jobsøgning', result: {
            title: 'Rådighedspligt',
            action: 'Det er en betingelse for hjælp, at man aktivt søger at udnytte sine arbejdsmuligheder.',
            contact: 'Jobcenterets rådighedsteam.',
            rules: [{ lawId: 'aktivloven', paragraph: '§ 13', text: 'Udnyttelse af arbejdsmuligheder' }]
          }}
        ]
      }
    }
  }
];

// --- HELPER COMPONENTS ---

function InteractiveParagraphBody({ 
    text, 
    highlight, 
    userHighlights = [], 
    onRemoveHighlight,
    onSubElementClick,
    selectedSubElement
}: { 
    text: string, 
    highlight: string, 
    userHighlights?: any[], 
    onRemoveHighlight?: (id: string) => void,
    onSubElementClick: (sub: string, parentStk: string | null, parentNr: string | null) => void,
    selectedSubElement: string | null
}) {
  const regex = /(Stk\.\s\d+\.\s?|Nr\.\s\d+\.\s?|\d+\)\s?|[a-z]\)\s?)/g;
  const rawParts = text.split(regex);
  
  if (rawParts.length === 1 && !highlight.trim() && (userHighlights?.length || 0) === 0) {
      return <div className="leading-relaxed whitespace-pre-wrap">{text}</div>;
  }

  const lines: { identifier: string | null; content: string }[] = [];
  let currentLineIdentifier: string | null = null;
  let currentLineContent = "";

  rawParts.forEach((part) => {
      if (regex.test(part)) {
          if (currentLineIdentifier || currentLineContent.trim()) {
              lines.push({ identifier: currentLineIdentifier, content: currentLineContent });
          }
          currentLineIdentifier = part.trim();
          currentLineContent = "";
      } else {
          currentLineContent += part;
      }
  });
  if (currentLineIdentifier || currentLineContent.trim()) {
      lines.push({ identifier: currentLineIdentifier, content: currentLineContent });
  }

  let lastStk: string | null = null;
  let lastNr: string | null = null;

  return (
    <div className="space-y-4">
      {lines.map((line, i) => {
          if (line.identifier?.startsWith('Stk.')) {
              lastStk = line.identifier;
              lastNr = null;
          } else if (line.identifier?.startsWith('Nr.') || line.identifier?.match(/^\d+\)/)) {
              lastNr = line.identifier;
          }
          
          const currentParentStk = lastStk;
          const currentParentNr = lastNr;
          const isSelected = selectedSubElement === line.identifier;
          
          let indentClass = "";
          if (line.identifier) {
              if (/^\d+\)/.test(line.identifier) || /^Nr\./.test(line.identifier)) {
                  indentClass = "pl-8 sm:pl-12";
              } else if (/^[a-z]\)/.test(line.identifier)) {
                  indentClass = "pl-16 sm:pl-24";
              }
          }

          return (
              <div key={i} className={`flex gap-3 group/line ${indentClass}`}>
                  {line.identifier && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onSubElementClick(line.identifier!, currentParentStk, currentParentNr); }}
                        className={`mt-0.5 shrink-0 h-fit px-2 py-0.5 rounded-md font-black serif text-[11px] sm:text-xs tracking-tighter transition-all shadow-sm border ${isSelected ? 'bg-amber-950 text-amber-400 border-amber-950 scale-110 ring-4 ring-amber-400/10' : 'bg-amber-50 text-amber-900 border-amber-100 hover:bg-amber-100 hover:border-amber-300'}`}
                      >
                          {line.identifier}
                      </button>
                  )}
                  <div className={`flex-1 leading-relaxed whitespace-pre-wrap ${isSelected ? 'text-amber-950 font-bold' : ''}`}>
                      <HighlightText 
                        text={line.content} 
                        highlight={highlight} 
                        userHighlights={userHighlights} 
                        onRemoveHighlight={onRemoveHighlight} 
                      />
                  </div>
              </div>
          );
      })}
    </div>
  );
}

function HighlightText({ text, highlight, userHighlights = [], onRemoveHighlight }: { 
    text: string, 
    highlight: string, 
    userHighlights?: any[], 
    onRemoveHighlight?: (id: string) => void 
}) {
  if (!highlight.trim() && (userHighlights?.length || 0) === 0) return <>{text}</>;
  
  const markers: { start: number; end: number; type: 'search' | 'user'; id?: string }[] = [];

  if (highlight.trim()) {
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      markers.push({ start: match.index, end: match.index + match[0].length, type: 'search' });
    }
  }

  userHighlights?.forEach(uh => {
    const textToFind = uh.text;
    if (!textToFind) return;
    let searchIdx = 0;
    while ((searchIdx = text.indexOf(textToFind, searchIdx)) !== -1) {
      markers.push({ start: searchIdx, end: searchIdx + textToFind.length, type: 'user', id: uh.id });
      searchIdx += textToFind.length;
    }
  });

  markers.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

  const merged: typeof markers = [];
  for (const marker of markers) {
    if (!merged.length || marker.start >= merged[merged.length - 1].end) {
      merged.push(marker);
    } else {
      const last = merged[merged.length - 1];
      last.end = Math.max(last.end, marker.end);
      if (marker.type === 'search') last.type = 'search';
    }
  }

  const result: React.ReactNode[] = [];
  let lastIdx = 0;

  merged.forEach((marker, i) => {
    if (marker.start > lastIdx) {
      result.push(text.substring(lastIdx, marker.start));
    }

    const markedContent = text.substring(marker.start, marker.end);
    if (marker.type === 'search') {
      result.push(
        <mark key={`m-${i}`} className="bg-amber-100 text-amber-950 px-0.5 rounded shadow-sm">
          {markedContent}
        </mark>
      );
    } else {
      result.push(
        <mark key={`u-${i}`} className="bg-yellow-200 text-amber-950 px-0.5 rounded relative group/marker">
          {markedContent}
          {onRemoveHighlight && marker.id && (
            <button 
                onClick={(e) => { e.stopPropagation(); onRemoveHighlight(marker.id!); }}
                className="absolute -top-6 left-1/2 -translate-x-1/2 bg-rose-600 text-white p-1 rounded shadow-lg opacity-0 group-hover/marker:opacity-100 transition-opacity z-10"
            >
                <Trash2 className="w-3 h-3" />
            </button>
          )}
        </mark>
      );
    }
    lastIdx = marker.end;
  });

  if (lastIdx < text.length) {
    result.push(text.substring(lastIdx));
  }

  return <>{result}</>;
}

const LawOverviewCard = ({ law, isLocked, router, idx }: { law: LawConfig, isLocked: boolean, router: any, idx: number }) => {
    const [metadata, setMetadata] = useState<LawContentType | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isLocked) return;
        setLoading(true);
        getLawContentAction({
            documentId: law.id,
            xmlUrl: law.xmlUrl,
            name: law.name,
            abbreviation: law.abbreviation,
            lbk: law.lbk
        }).then(res => {
            if (res?.data) setMetadata(res.data);
        }).finally(() => setLoading(false));
    }, [law, isLocked]);

    const href = isLocked ? '/upgrade' : `/lov-portal/view/${law.id}`;
    
    const paraCount = useMemo(() => {
        if (!metadata) return 0;
        return metadata.kapitler.reduce((acc, kap) => acc + kap.paragraffer.length, 0);
    }, [metadata]);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
            onClick={() => { if (!isLocked) router.push(href); }}
            className={`bg-white p-8 rounded-[3rem] border border-amber-100 shadow-sm hover:shadow-2xl hover:border-amber-950 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between min-h-[320px] ${isLocked ? 'opacity-60 border-slate-200 grayscale cursor-not-allowed' : 'border-amber-100 hover:border-amber-950 shadow-sm'}`}
        >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform group-hover:opacity-10">
                <BookOpen className="w-24 h-24" />
            </div>
            
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border transition-colors ${isLocked ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-amber-50 text-amber-900 border-amber-100 group-hover:bg-amber-950 group-hover:text-white'}`}>
                        {law.abbreviation}
                    </span>
                    {isLocked ? (
                        <div className="bg-amber-950/90 text-white px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg"><Lock className="w-3.5 h-3.5 text-amber-400" /><span className="text-[9px] font-black uppercase tracking-widest">Premium</span></div>
                    ) : (
                        <LiveStatusBadge xmlUrl={law.xmlUrl} />
                    )}
                </div>
                <h4 className="text-2xl font-bold text-amber-950 serif leading-tight mb-4 group-hover:text-amber-700 transition-colors">
                    {metadata?.titel || law.name}
                </h4>
                {loading ? (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300">
                        <Loader2 className="w-3 h-3 animate-spin" /> Henter live data...
                    </div>
                ) : metadata ? (
                    <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">
                        <span className="flex items-center gap-1"><List className="w-3 h-3"/> {metadata.kapitler.length} Kapitler</span>
                        <span className="flex items-center gap-1"><FileText className="w-3 h-3"/> {paraCount} Paragraffer</span>
                    </div>
                ) : (
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.1em]">{law.lbk}</p>
                )}
            </div>

            <div className="relative z-10 pt-6 mt-6 border-t border-amber-50 flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-widest text-slate-300 group-hover:text-amber-950 transition-colors`}>
                    {isLocked ? 'Kun for Kollega+' : 'Åbn lovtekst'}
                </span>
                {!isLocked && <ArrowRight className="w-4 h-4 text-slate-200 group-hover:text-amber-950 transition-all group-hover:translate-x-1" />}
            </div>
        </motion.div>
    );
};

// --- DECISION TREE COMPONENTS ---

const DecisionTreeFlow = ({ situation, onCancel }: { situation: any, onCancel: () => void }) => {
    const [currentNodeId, setCurrentNodeId] = useState(situation.initialNode);
    const currentNode = situation.nodes[currentNodeId];
    const [history, setHistory] = useState<string[]>([]);

    const handleOptionSelect = (opt: any) => {
        if (opt.result) {
            setCurrentNodeId('result-' + JSON.stringify(opt.result));
        } else {
            setHistory([...history, currentNodeId]);
            setCurrentNodeId(opt.nextNodeId);
        }
    };

    const handleBack = () => {
        if (history.length > 0) {
            const newHistory = [...history];
            const prev = newHistory.pop();
            setHistory(newHistory);
            setCurrentNodeId(prev!);
        } else {
            onCancel();
        }
    };

    if (currentNodeId.startsWith('result-')) {
        const result = JSON.parse(currentNodeId.replace('result-', ''));
        return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 animate-ink">
                <div className="flex items-center gap-4 border-b border-amber-100 pb-6">
                    <button onClick={handleBack} className="p-2 hover:bg-amber-50 rounded-xl transition-all"><ChevronLeft className="w-6 h-6"/></button>
                    <h3 className="text-2xl font-bold text-amber-950 serif">{result.title}</h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="p-6 bg-white rounded-3xl border border-amber-100 shadow-sm">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-2">Hvad skal du gøre?</h4>
                            <p className="text-sm text-slate-700 leading-relaxed font-medium">{result.action}</p>
                        </div>
                        <div className="p-6 bg-amber-950 text-white rounded-3xl shadow-xl shadow-amber-900/20">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-2">Hvem skal du kontakte?</h4>
                            <p className="text-sm font-bold leading-relaxed">{result.contact}</p>
                        </div>
                    </div>
                    
                    <div className="bg-white p-8 rounded-[2.5rem] border border-amber-100 shadow-sm h-fit">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2"><ScaleIcon className="w-4 h-4"/> Relevante Regler</h4>
                        <div className="space-y-3">
                            {result.rules.map((rule: any, i: number) => (
                                <div 
                                    key={i} 
                                    className="p-4 bg-slate-50 rounded-2xl border border-slate-100"
                                >
                                    <div>
                                        <p className="font-bold text-amber-950 text-sm">{rule.paragraph}</p>
                                        <p className="text-[10px] text-slate-400 uppercase font-black">{rule.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex justify-center pt-8">
                    <Button variant="ghost" onClick={onCancel} className="rounded-xl px-10 h-14">Færdig</Button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10 animate-ink">
            <div className="flex items-center gap-4">
                <button onClick={handleBack} className="p-2 hover:bg-amber-50 rounded-xl transition-all"><ChevronLeft className="w-6 h-6"/></button>
                <h3 className="text-2xl font-bold text-amber-950 serif">{currentNode.question}</h3>
            </div>
            <div className="grid gap-4">
                {currentNode.options.map((opt: any, i: number) => (
                    <button 
                        key={i} 
                        onClick={() => handleOptionSelect(opt)}
                        className="w-full text-left p-6 bg-white border border-amber-100 rounded-[2rem] hover:border-amber-950 hover:shadow-xl transition-all flex items-center justify-between group active:scale-[0.98]"
                    >
                        <span className="font-bold text-lg text-amber-950">{opt.text}</span>
                        <ChevronRight className="w-6 h-6 text-slate-200 group-hover:translate-x-1 group-hover:text-amber-950 transition-all" />
                    </button>
                ))}
            </div>
        </motion.div>
    );
};

// --- MAIN PAGE COMPONENT ---

export function LovPortalViewer() {
  const { user, userProfile, refetchUserProfile, isUserLoading } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const { toast } = useToast();
  const firestore = useFirestore();

  // Basic States
  const [lawsConfigs, setLawsConfigs] = useState<LawConfig[]>([]);
  const [lawsLoading, setLawsLoading] = useState(true);
  const [docsData, setDocsData] = useState<Record<string, LawContentType>>({});
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  const [viewMode, setViewMode] = useState<'laws' | 'decisions' | 'saved' | 'training'>('laws');
  const [isContextSidebarOpen, setIsContextSidebarOpen] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeSituationId, setActiveSituationId] = useState<string | null>(null);
  
  const [expandedParaKey, setExpandedParaKey] = useState<string | null>(null);
  const [activeParagraphNumber, setActiveParagraphNumber] = useState<string | null>(null);
  const [selectedSubElement, setSelectedSubElement] = useState<string | null>(null);
  const [selectedParentStk, setSelectedParentStk] = useState<string | null>(null);
  const [selectedParentNr, setSelectedParentNr] = useState<string | null>(null);
  const [selectionRange, setSelectionRange] = useState<{ text: string; paraKey: string; rect: DOMRect } | null>(null);
  const [paraAnalysis, setParaAnalysis] = useState<Record<string, ParagraphAnalysisData>>({});
  const [isAnalysingPara, setIsAnalysingPara] = useState<Record<string, boolean>>({});

  // Sagsindsigt States
  const [timeline, setTimeline] = useState<any[]>([]);
  const [relatedDocs, setRelatedDocs] = useState<any[]>([]);
  const [relatedDecisions, setRelatedDecisions] = useState<any[]>([]);
  const [ombudsmandReports, setOmbudsmandReports] = useState<any[]>([]);
  const [isSagsindsigtLoading, setIsSagsindsigtLoading] = useState(false);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);
  const [isRetsakterExpanded, setIsRetsakterExpanded] = useState(false);
  const [isAfgørelserExpanded, setIsAfgørelserExpanded] = useState(false);
  const [isOmbudsmandExpanded, setIsOmbudsmandExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Quiz & Training State
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isReadingGuideOpen, setIsReadingGuideOpen] = useState(false);

  // Bibliography & Collection State
  const [activeCollectionId, setActiveCollectionId] = useState<string | 'all'>('all');
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isMovingParaId, setIsMovingParaId] = useState<string | null>(null);
  const [showBibliography, setShowBibliography] = useState(false);
  const [bibMetadata, setBibMetadata] = useState<Record<string, LawContentType>>({});
  const [isFetchingBibMetadata, setIsFetchingBibMetadata] = useState(false);
  
  const mainScrollRef = useRef<HTMLElement>(null);
  const activeLawId = useMemo(() => params?.lawId as string || searchParams.get('lawId'), [params, searchParams]);
  const activeGuidelineId = useMemo(() => searchParams.get('guidelineId'), [searchParams]);
  const activeReferenceId = useMemo(() => searchParams.get('refId')?.toString(), [searchParams]);
  const currentDocId = activeReferenceId || (activeGuidelineId ? `${activeLawId}-${activeGuidelineId}` : activeLawId);
  const currentDocData = currentDocId ? docsData[currentDocId] : null;

  const isPremium = useMemo(() => !!userProfile?.membership && ['Kollega+', 'Semesterpakken', 'Kollega++'].includes(userProfile.membership), [userProfile]);
  const isFreeTier = userProfile?.membership === 'Kollega';

  const filteredSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return SEARCH_SUGGESTIONS.slice(0, 5);
    return SEARCH_SUGGESTIONS.filter(q => 
      q.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5);
  }, [searchQuery]);

  const loadDocumentContent = useCallback(async (lawId: string, docIdentifier: string, forceXmlUrl?: string) => {
    if (docsData[docIdentifier]) return;
    const config = (lawsConfigs || []).find(l => l.id === lawId);
    const xmlUrl = forceXmlUrl || config?.xmlUrl;
    if (!xmlUrl) return;
    setIsLoadingDoc(true);
    try {
        const result = await getLawContentAction({ 
            documentId: docIdentifier,
            xmlUrl,
            name: config?.name || 'Dokument',
            abbreviation: config?.abbreviation || 'DOK',
            lbk: config?.lbk || ''
        });
        if (result?.data) setDocsData(prev => ({ ...prev, [docIdentifier]: result.data }));
    } catch (e) {
        console.error(e);
    } finally {
        setIsLoadingDoc(false);
    }
  }, [lawsConfigs, docsData]);

  const handleSubElementClick = (sub: string, parentStk: string | null, parentNr: string | null) => {
      if (selectedSubElement === sub) {
          setSelectedSubElement(null);
          setSelectedParentStk(null);
          setSelectedParentNr(null);
      } else {
          setSelectedSubElement(sub);
          setSelectedParentStk(parentStk !== sub ? parentStk : null);
          setSelectedParentNr((parentNr !== sub && parentNr !== parentStk) ? parentNr : null);
      }
  };

  // Handle URL Parameter Sync
  useEffect(() => {
    if (lawsLoading) return;
    if (activeReferenceId) {
        const forceXmlUrl = searchParams.get('xmlUrl');
        if (forceXmlUrl) loadDocumentContent('reference', activeReferenceId, forceXmlUrl);
    } else if (activeLawId) {
        loadDocumentContent(activeLawId, activeLawId);
    }
  }, [activeLawId, activeReferenceId, lawsLoading, searchParams, loadDocumentContent]);

  // Handle Sagsindsigt Loading
  useEffect(() => {
    if (!currentDocData?.uniqueDocumentId) return;
    const id = currentDocData.uniqueDocumentId;
    setIsSagsindsigtLoading(true);
    Promise.all([
        fetchLawTimeline(id),
        fetchRelatedDocumentLinks(id),
        fetchRelatedDecisions(id),
        fetchOmbudsmandReports(id)
    ]).then(([t, r, d, o]) => {
        setTimeline(t);
        setRelatedDocs(r);
        setRelatedDecisions(d);
        setOmbudsmandReports(o);
    }).finally(() => setIsSagsindsigtLoading(false));
  }, [currentDocData?.uniqueDocumentId]);

  // Sync activeParagraphNumber from URL
  useEffect(() => {
    const paraFromUrl = searchParams.get('para');
    if (paraFromUrl) {
        setActiveParagraphNumber(decodeURIComponent(paraFromUrl));
    }
  }, [searchParams]);

  // Handle Auto-Expand and Scroll when activeParagraphNumber is set (from URL or navigation)
  useEffect(() => {
    if (activeParagraphNumber && currentDocData && !isLoadingDoc && currentDocId) {
        let foundKey = null;
        for (let cIdx = 0; cIdx < currentDocData.kapitler.length; cIdx++) {
            const chapter = currentDocData.kapitler[cIdx];
            const pIdx = chapter.paragraffer.findIndex(p => p.nummer === activeParagraphNumber);
            if (pIdx !== -1) {
                foundKey = `${currentDocId}-${cIdx}-${pIdx}`;
                break;
            }
        }

        if (foundKey) {
            setExpandedParaKey(foundKey);
            // Wait for render, then scroll
            setTimeout(() => {
                const element = document.getElementById(`para-${foundKey}`);
                if (element && mainScrollRef.current) {
                    const rect = element.getBoundingClientRect();
                    const containerRect = mainScrollRef.current.getBoundingClientRect();
                    const offset = rect.top + mainScrollRef.current.scrollTop - containerRect.top - 150;
                    mainScrollRef.current.scrollTo({ top: offset, behavior: 'smooth' });
                }
            }, 500);
        }
    }
  }, [activeParagraphNumber, currentDocData, isLoadingDoc, currentDocId]);

  const quizResultsQuery = useMemoFirebase(() => (
      user && firestore ? query(collection(firestore, 'users', user.uid, 'quizResults'), orderBy('createdAt', 'desc')) : null
  ), [user, firestore]);
  const { data: quizResults, isLoading: quizResultsLoading } = useCollection<QuizResult>(quizResultsQuery);

  // Training Stats Calculation
  const trainingStats = useMemo(() => {
      if (!quizResults || quizResults.length === 0) return null;
      
      const totalTests = quizResults.length;
      const totalCorrect = quizResults.reduce((acc, r) => acc + (r.score || 0), 0);
      const totalQuestions = quizResults.reduce((acc, r) => acc + (r.totalQuestions || 5), 0);
      const avgAccuracy = Math.round((totalCorrect / totalQuestions) * 100);
      
      const lawStats: Record<string, { title: string, score: number, questions: number, count: number }> = {};
      quizResults.forEach(r => {
          const lId = r.lawId || 'unknown';
          if (!lawStats[lId]) lawStats[lId] = { title: r.lawTitle || 'Ukendt Lov', score: 0, questions: 0, count: 0 };
          lawStats[lId].score += (r.score || 0);
          lawStats[lId].questions += (r.totalQuestions || 5);
          lawStats[lId].count += 1;
      });
      
      const mastery = Object.entries(lawStats).map(([id, stats]) => ({
          id,
          title: stats.title,
          accuracy: Math.round((stats.score / stats.questions) * 100),
          count: stats.count
      })).sort((a, b) => b.accuracy - a.accuracy);

      return { totalTests, avgAccuracy, mastery };
  }, [quizResults]);

  // Firestore Subscriptions
  const collectionsQuery = useMemoFirebase(() => (
      user && firestore ? query(collection(firestore, 'users', user.uid, 'collections'), orderBy('createdAt', 'desc')) : null
  ), [user, firestore]);
  const { data: collections } = useCollection<CollectionData>(collectionsQuery);

  const savedParagraphsQuery = useMemoFirebase(() => (
      user && firestore ? query(collection(firestore, 'users', user.uid, 'savedParagraphs'), orderBy('savedAt', 'desc')) : null
  ), [user, firestore]);
  const { data: savedParagraphs = [] } = useCollection<SavedParagraph>(savedParagraphsQuery);

  const highlightsQuery = useMemoFirebase(() => (
      user && firestore ? query(collection(firestore, 'users', user.uid, 'highlights')) : null
  ), [user, firestore]);
  const { data: userHighlights = [] } = useCollection<any>(highlightsQuery);

  // Load Main Configuration
  useEffect(() => {
    if (!firestore) return;
    const q = query(collection(firestore, 'laws'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LawConfig[];
        setLawsConfigs(data);
        setLawsLoading(false);
    });
    return () => unsubscribe();
  }, [firestore]);

  // BIBLIOGRAPHY METADATA FETCHING
  useEffect(() => {
      if (!showBibliography || !savedParagraphs || savedParagraphs.length === 0 || lawsLoading) return;

      const fetchMissingMetadata = async () => {
          setIsFetchingBibMetadata(true);
          const sourceList = activeCollectionId === 'all' ? savedParagraphs : savedParagraphs.filter(p => p.collectionId === activeCollectionId);
          const uniqueLawIds = Array.from(new Set(sourceList.map(p => p.lawId || 'reference')));
          
          const missingIds = uniqueLawIds.filter(id => !docsData[id] && !bibMetadata[id]);
          
          if (missingIds.length === 0) {
              setIsFetchingBibMetadata(false);
              return;
          }

          const results: Record<string, LawContentType> = { ...bibMetadata };
          let changed = false;
          
          for (const id of missingIds) {
              const paraWithUrl = sourceList.find(p => (p.lawId || 'reference') === id && p.externalUrl);
              const config = lawsConfigs.find(l => l.id === id);
              
              const xmlUrl = paraWithUrl ? paraWithUrl.externalUrl + '/xml' : config?.xmlUrl;
              
              if (xmlUrl) {
                  try {
                      const res = await getLawContentAction({
                          documentId: id,
                          xmlUrl,
                          name: config?.name || paraWithUrl?.lawTitle || 'Dokument',
                          abbreviation: config?.abbreviation || paraWithUrl?.lawAbbreviation || 'DOK',
                          lbk: config?.lbk || ''
                      });
                      if (res?.data) {
                          results[id] = res.data;
                          changed = true;
                      }
                  } catch (e) {
                      console.error(`Failed to fetch bibliography metadata for ${id}`, e);
                  }
              }
          }
          
          if (changed) setBibMetadata(results);
          setIsFetchingBibMetadata(false);
      };

      fetchMissingMetadata();
  }, [showBibliography, savedParagraphs, activeCollectionId, lawsLoading, lawsConfigs, docsData, bibMetadata]);

  const handleCreateCollection = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !newCollectionName.trim()) return;
      await addDoc(collection(firestore!, 'users', user.uid, 'collections'), { name: newCollectionName.trim(), createdAt: serverTimestamp() });
      setNewCollectionName('');
      setIsCreatingCollection(false);
      toast({ title: "Samling oprettet" });
  };

  const handleDeleteCollection = async (id: string, name: string) => {
      if (!user || !window.confirm(`Slet samlingen "${name}"?`)) return;
      const batch = writeBatch(firestore!);
      (savedParagraphs || []).filter(p => p.collectionId === id).forEach(p => {
          batch.update(doc(firestore!, 'users', user.uid, 'savedParagraphs', p.id), { collectionId: null });
      });
      batch.delete(doc(firestore!, 'users', user.uid, 'collections', id));
      await batch.commit();
      if (activeCollectionId === id) setActiveCollectionId('all');
  };

  const handleMoveToCollection = async (paraId: string, colId: string | null) => {
      if (!user) return;
      await updateDoc(doc(firestore!, 'users', user.uid, 'savedParagraphs', paraId), { collectionId: colId });
      setIsMovingParaId(null);
  };

  const handleToggleSave = async (para: any, lawData: LawContentType, lawId: string) => {
    if (!user || !isPremium) return;
    const savedId = `${lawId}-${para.nummer.replace(/[§\s\.]/g, '-')}`;
    const docRef = doc(firestore!, 'users', user.uid, 'savedParagraphs', savedId);
    if ((savedParagraphs || []).some(p => p.id === savedId)) {
        await deleteDoc(docRef);
    } else {
         const saveData: any = { paragraphNumber: para.nummer, fullText: para.tekst, lawId, lawTitle: lawData.titel, lawAbbreviation: lawData.forkortelse, savedAt: serverTimestamp() };
         const extUrl = searchParams.get('xmlUrl');
         if (extUrl) saveData.externalUrl = extUrl.replace(/\/xml$/, '');
         await setDoc(docRef, saveData);
    }
  };

  const handleAnalyzeParagraph = async (para: any, lawData: LawContentType, paraKey: string) => {
    if (!isPremium) return;
    setIsAnalysingPara(prev => ({ ...prev, [paraKey]: true }));
    try {
        const response = await analyzeParagraphAction({ 
            lovTitel: lawData.titel, 
            paragrafNummer: para.nummer, 
            paragrafTekst: para.tekst, 
            fuldLovtekst: lawData.rawText,
            uniqueDocumentId: lawData.uniqueDocumentId
        });
        setParaAnalysis(prev => ({ ...prev, [paraKey]: response.data }));
    } finally {
        setIsAnalysingPara(prev => ({ ...prev, [paraKey]: false }));
    }
  };

  const handleOpenReference = (ref: any) => {
    const path = ref.eliPath || ref.href || '';
    if (!path) {
        toast({ variant: 'destructive', title: "Fejl", description: "Dette dokument har ingen gyldig sti." });
        return;
    }
    const xmlUrl = path.startsWith('http') ? `${path}/xml` : `https://www.retsinformation.dk${path}/xml`;
    router.push(`/lov-portal/view/reference?refId=${ref.id}&xmlUrl=${encodeURIComponent(xmlUrl)}&title=${encodeURIComponent(ref.shortName || ref.title)}`);
  };

  const scrollToChapter = (chapterIndex: number) => {
    const element = document.getElementById(`chapter-${chapterIndex}`);
    if (mainScrollRef.current && element) {
        const top = element.getBoundingClientRect().top + mainScrollRef.current.scrollTop - 100;
        mainScrollRef.current.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({ title: "Kopieret til udklipsholder" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleMouseUp = (paraKey: string) => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 3) {
        const range = selection.getRangeAt(0);
        setSelectionRange({ text: selection.toString(), paraKey, rect: range.getBoundingClientRect() });
    } else {
        setSelectionRange(null);
    }
  };

  const handleSaveHighlight = async () => {
    if (!user || !selectionRange || !firestore) return;
    const id = `${selectionRange.paraKey}-${Date.now()}`;
    await setDoc(doc(firestore, 'users', user.uid, 'highlights', id), {
        paragraphKey: selectionRange.paraKey,
        text: selectionRange.text,
        createdAt: serverTimestamp()
    });
    setSelectionRange(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleRemoveHighlight = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(firestore!, 'users', user.uid, 'highlights', id));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const citations = useMemo(() => {
    if (!currentDocData) return { inText: '', bibliography: '' };
    const nr = currentDocData.number || "XX";
    let date = currentDocData.date || "XX.XX.XXXX";
    if (date.includes('-')) {
        const parts = date.split('-');
        if (parts[0].length === 4) date = `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    date = date.replace(/\//g, '.');
    const lowerTitle = currentDocData.titel.toLowerCase();
    let typeCode = lowerTitle.includes("bekendtgørelse") ? "bkg." : lowerTitle.includes("vejledning") ? "vejl." : "lbk.";
    
    let paraNum = activeParagraphNumber ? activeParagraphNumber.trim().replace(/\.$/, '') : "§ [nr]";
    if (selectedSubElement) {
        const sub = selectedSubElement.toLowerCase().replace(/\s+/g, ' ').replace(/\.$/, '');
        const parentStk = selectedParentStk?.toLowerCase().replace(/\s+/g, ' ').replace(/\.$/, '');
        const parentNr = selectedParentNr?.toLowerCase().replace(/\s+/g, ' ').replace(/\.$/, '');
        
        paraNum += '.';

        if (sub.startsWith('stk')) {
            paraNum += ` stk. ${sub.replace('stk', '').replace('.', '').trim()}`;
        } else {
            if (parentStk) {
                paraNum += ` stk. ${parentStk.replace('stk', '').replace('.', '').trim()},`;
            }
            
            if (sub.startsWith('nr') || sub.match(/^\d+\)/)) {
                const cleanSub = sub.replace('nr', '').replace(')', '').replace('.', '').trim();
                paraNum += ` nr. ${cleanSub}`;
            } else if (sub.match(/^[a-z]\)/)) {
                if (parentNr) {
                    const cleanNr = parentNr.replace('nr', '').replace(')', '').replace('.', '').trim();
                    paraNum += ` nr. ${cleanNr},`;
                }
                const cleanLitra = sub.replace(')', '').trim();
                paraNum += ` litra ${cleanLitra}`;
            } else {
                paraNum += ` ${sub}`;
            }
        }
    }

    if (lowerTitle.includes("principmeddelelse")) {
        const match = currentDocData.titel.match(/\d+-\d{2}/);
        const extractedNr = match ? match[0] : nr;
        return { inText: `Ankestyrelsens principmeddelelse ${extractedNr}`, bibliography: `Ankestyrelsens principmeddelelse ${extractedNr}.` };
    }
    return { inText: `jf. ${paraNum} i ${typeCode} nr. ${nr} af ${date}`, bibliography: `${currentDocData.titel}, jf. ${typeCode} nr. ${nr} af ${date}.` };
  }, [currentDocData, activeParagraphNumber, selectedSubElement, selectedParentStk, selectedParentNr]);

  const filteredParagraphsData = useMemo(() => {
      let list = savedParagraphs || [];
      if (activeCollectionId !== 'all') list = list.filter(p => p.collectionId === activeCollectionId);
      if (debouncedSearchQuery.trim()) {
          const q = debouncedSearchQuery.toLowerCase();
          list = list.filter(p => p.paragraphNumber.toLowerCase().includes(q) || p.fullText.toLowerCase().includes(q) || p.lawTitle.toLowerCase().includes(q));
      }
      return list;
  }, [savedParagraphs, activeCollectionId, debouncedSearchQuery]);

  const filteredDocData = useMemo(() => {
      if (!currentDocData || !debouncedSearchQuery.trim()) return currentDocData;
      const q = debouncedSearchQuery.toLowerCase();
      const filteredChapters = currentDocData.kapitler.map(chapter => {
          const matchingParas = chapter.paragraffer.filter(p => p.nummer.toLowerCase().includes(q) || p.tekst.toLowerCase().includes(q));
          if (matchingParas.length > 0 || chapter.titel.toLowerCase().includes(q) || chapter.nummer.toLowerCase().includes(q)) return { ...chapter, paragraffer: matchingParas };
          return null;
      }).filter((c): c is any => c !== null);
      return { ...currentDocData, kapitler: filteredChapters };
  }, [currentDocData, debouncedSearchQuery]);

  const groupedLaws = useMemo(() => {
    const groups: Record<string, LawConfig[]> = {
      "Børn, Unge & Familie": [],
      "Generel Forvaltning": [],
      "Beskæftigelse": [],
      "Social Støtte & Handicap": [],
      "Sundhed & Andet": []
    };
    (lawsConfigs || []).forEach(law => {
      const name = law.name.toLowerCase();
      if (name.includes('barn') || name.includes('forældreansvar') || name.includes('skole')) groups["Børn, Unge & Familie"].push(law);
      else if (name.includes('forvaltningslov') || name.includes('offentlighed')) groups["Generel Forvaltning"].push(law);
      else if (name.includes('aktiv') || name.includes('beskæftigelse')) groups["Beskæftigelse"].push(law);
      else if (name.includes('social service')) groups["Social Støtte & Handicap"].push(law);
      else groups["Sundhed & Andet"].push(law);
    });
    return groups;
  }, [lawsConfigs]);

  const bibliographyTextResult = useMemo(() => {
      if (!filteredParagraphsData || filteredParagraphsData.length === 0) return "";
      const lawGroups = new Map<string, SavedParagraph>();
      filteredParagraphsData.forEach(p => {
          if (!lawGroups.has(p.lawTitle)) {
              lawGroups.set(p.lawTitle, p);
          }
      });
      const sortedEntries = Array.from(lawGroups.values()).sort((a, b) => a.lawTitle.localeCompare(b.lawTitle, 'da'));
      
      return sortedEntries.map(entry => {
          const meta = bibMetadata[entry.lawId || 'reference'] || docsData[entry.lawId || 'reference'];
          if (meta) {
              const nr = meta.number || "XX";
              let date = meta.date || "XX.XX.XXXX";
              if (date.includes('-')) {
                  const parts = date.split('-');
                  if (parts[0].length === 4) date = `${parts[2]}.${parts[1]}.${parts[0]}`;
              }
              date = date.replace(/\//g, '.');
              const lowerTitle = meta.titel.toLowerCase();
              let typeCode = lowerTitle.includes("bekendtgørelse") ? "bkg." : lowerTitle.includes("vejledning") ? "vejl." : "lbk.";
              return `${meta.titel}, jf. ${typeCode} nr. ${nr} af ${date}.`;
          }
          return `${entry.lawTitle}. (u.å.).`;
      }).join('\n\n');
  }, [filteredParagraphsData, bibMetadata, docsData]);

  useEffect(() => {
    const scrollContainer = mainScrollRef.current;
    const handleScroll = () => {
      if (scrollContainer) {
        setIsScrolled(scrollContainer.scrollTop > 100);
      }
    };
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }
    return () => scrollContainer?.removeEventListener('scroll', handleScroll);
  }, [isLoadingDoc, viewMode, activeLawId]);

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col lg:flex-row text-slate-900 font-sans selection:bg-amber-100 overflow-x-hidden">
      {/* SIDEBAR NAVIGATION */}
      <aside className={`w-72 bg-white border-r border-amber-100 flex flex-col sticky top-0 h-screen z-30 shadow-sm ${isFocusMode ? 'hidden' : 'hidden lg:flex'}`}>
        <div className="p-8 flex items-center gap-4 border-b border-amber-50">
            <div className="w-10 h-10 bg-amber-950 rounded-xl flex items-center justify-center text-amber-400 shadow-lg"><ScaleIcon className="w-6 h-6" /></div>
            <div><h1 className="text-xl font-bold text-amber-950 serif tracking-tight">Lovportalen</h1><p className="text-[10px] font-black uppercase tracking-widest text-amber-900/40">Cohéro Legal</p></div>
        </div>
        <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto custom-scrollbar">
            <button onClick={() => { setViewMode('laws'); router.push('/lov-portal'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${viewMode === 'laws' && !activeLawId && !activeReferenceId ? 'bg-amber-950 text-white shadow-xl' : 'text-slate-500 hover:bg-amber-50'}`}><LayoutDashboard className="w-4 h-4" /> Oversigt</button>
            <button onClick={() => setViewMode('saved')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${viewMode === 'saved' ? 'bg-amber-950 text-white shadow-xl' : 'text-slate-500 hover:bg-amber-50'}`}><Bookmark className="w-4 h-4" /> Gemte</button>
            <button onClick={() => setViewMode('training')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${viewMode === 'training' ? 'bg-amber-950 text-white shadow-xl' : 'text-slate-500 hover:bg-amber-50'}`}><TrendingUp className="w-4 h-4" /> Træning</button>
            <div className="pt-8 pb-4 px-4"><h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Hurtig-vælger</h3></div>
            {(lawsConfigs || []).map((law, idx) => {
                const isLocked = isFreeTier && idx > 0;
                return (
                    <button key={law.id} disabled={isLocked} onClick={() => { setViewMode('laws'); router.push(`/lov-portal/view/${law.id}`); }} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${activeLawId === law.id ? 'bg-amber-100 text-amber-950' : 'text-slate-500 hover:bg-amber-50'} ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <span className="truncate">{law.name}</span>{isLocked && <Lock className="w-3 h-3 text-amber-500" />}
                    </button>
                )
            })}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main ref={mainScrollRef} className="flex-1 min-w-0 h-screen overflow-y-auto relative pt-0 custom-scrollbar">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-amber-100 px-8 flex items-center justify-between sticky top-0 z-20">
            <form onSubmit={handleSearch} className="flex items-center gap-6 flex-1 max-w-2xl">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-amber-950 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Søg i lovportalen..."
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-amber-950 focus:bg-white transition-all shadow-inner" 
                    />
                    
                    <AnimatePresence>
                        {isSearchFocused && filteredSuggestions.length > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-white border border-amber-100 rounded-2xl shadow-2xl z-50 p-2 overflow-hidden"
                            >
                                {filteredSuggestions.map((suggestion, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery(suggestion);
                                            setIsSearchFocused(false);
                                        }}
                                        className="w-full text-left px-4 py-3 hover:bg-amber-50 rounded-xl transition-colors flex items-center gap-3 group/item"
                                    >
                                        <Sparkles className="w-3.5 h-3.5 text-amber-200 group-hover/item:text-amber-500 transition-colors" />
                                        <span className="text-xs sm:text-sm font-medium text-slate-600 group-hover/item:text-amber-950">{suggestion}</span>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </form>
            <div className="flex items-center gap-4 ml-8">
                <button 
                    onClick={() => setIsReadingGuideOpen(true)}
                    className="p-3 bg-amber-50 text-amber-900 rounded-xl hover:bg-amber-100 transition-all border border-amber-100 flex items-center gap-2 font-bold text-xs shadow-sm active:scale-95"
                >
                    <HelpCircle className="w-5 h-5" />
                    <span className="hidden sm:inline">Læseguide</span>
                </button>
                <button 
                    onClick={() => setIsFocusMode(!isFocusMode)}
                    className={`p-3 rounded-xl transition-all border shadow-sm active:scale-95 ${isFocusMode ? 'bg-amber-950 text-white border-amber-950' : 'bg-white text-slate-400 border-amber-100 hover:bg-amber-50'}`}
                    title={isFocusMode ? "Afslut fokustilstand" : "Aktiver fokustilstand"}
                >
                    {isFocusMode ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
                {!isFocusMode && (
                    <button onClick={() => setIsContextSidebarOpen(!isContextSidebarOpen)} className={`p-3 rounded-xl transition-all border shadow-sm active:scale-95 ${isContextSidebarOpen ? 'bg-amber-950 text-white border-amber-950' : 'bg-white text-slate-400 border-amber-100 hover:bg-amber-50'}`}>
                        <PanelRight className="w-5 h-5" />
                    </button>
                )}
            </div>
        </header>

        <div className={`p-8 md:p-12 mx-auto pt-8 md:pt-12 transition-all duration-500 ${isFocusMode ? 'max-w-full' : 'max-w-6xl'}`}>
            <AnimatePresence mode="wait">
                {lawsLoading || isLoadingDoc ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-96 flex flex-col items-center justify-center space-y-6"><Loader2 className="w-10 h-10 animate-spin text-amber-200" /><p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Indlæser indhold</p></motion.div>
                ) : viewMode === 'training' ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div><h2 className="text-4xl font-bold text-amber-950 serif tracking-tight">Træning & Fremskridt</h2><p className="text-slate-500 mt-2 font-medium italic">Se din udvikling i de faglige test.</p></div>
                        </div>

                        {quizResultsLoading ? (
                            <div className="h-64 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-amber-200"/></div>
                        ) : !trainingStats ? (
                            <div className="py-24 text-center bg-white rounded-[3rem] border border-dashed border-amber-200 shadow-inner">
                                <Trophy className="w-12 h-12 text-amber-100 mx-auto mb-4" />
                                <p className="text-slate-500 font-bold text-lg">Ingen test-data endnu</p>
                                <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">Tag din første lov-quiz for at se dine fremskridt her.</p>
                                <Button onClick={() => setViewMode('laws')} className="mt-8">Gå til Lovsamling</Button>
                            </div>
                        ) : (
                            <div className="space-y-16">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <div className="bg-white p-8 rounded-[2rem] border border-amber-100 shadow-sm text-center">
                                        <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner"><Activity className="w-6 h-6"/></div>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Gennemførte test</p>
                                        <p className="text-4xl font-black text-amber-950 serif">{trainingStats.totalTests}</p>
                                    </div>
                                    <div className="bg-white p-8 rounded-[2rem] border border-amber-100 shadow-sm text-center">
                                        <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner"><Target className="w-6 h-6"/></div>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Gns. Præcision</p>
                                        <p className="text-4xl font-black text-amber-950 serif">{trainingStats.avgAccuracy}%</p>
                                    </div>
                                    <div className="bg-white p-8 rounded-[2rem] border border-amber-100 shadow-sm text-center">
                                        <div className="w-12 h-12 bg-indigo-50 text-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner"><Trophy className="w-6 h-6"/></div>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Bedste Disciplin</p>
                                        <p className="text-xl font-bold text-amber-950 serif line-clamp-1">{trainingStats.mastery[0]?.title || 'Ingen'}</p>
                                    </div>
                                </div>

                                <section className="space-y-8">
                                    <h3 className="text-xl font-bold text-amber-950 serif flex items-center gap-3"><BarChart3 className="w-6 h-6 text-amber-700"/> Mestring pr. Lovområde</h3>
                                    <div className="bg-white rounded-[3rem] border border-amber-100 shadow-sm p-10 space-y-8">
                                        {trainingStats.mastery.map(law => (
                                            <div key={law.id} className="space-y-3">
                                                <div className="flex justify-between items-end">
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-bold text-amber-950">{law.title}</p>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{law.count} test gennemført</p>
                                                    </div>
                                                    <span className="text-lg font-black text-amber-900 serif">{law.accuracy}%</span>
                                                </div>
                                                <div className="w-full h-3 bg-amber-50 rounded-full overflow-hidden border border-amber-100 shadow-inner">
                                                    <motion.div 
                                                        initial={{ width: 0 }} animate={{ width: `${law.accuracy}%` }} transition={{ duration: 1, duration: 1, ease: 'easeOut' }}
                                                        className={`h-full rounded-full ${law.accuracy > 80 ? 'bg-emerald-500' : law.accuracy > 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section className="space-y-8">
                                    <h3 className="text-xl font-bold text-amber-950 serif flex items-center gap-3"><History className="w-6 h-6 text-amber-700"/> Seneste Resultater</h3>
                                    <div className="bg-white rounded-[2rem] border border-amber-100 shadow-xl overflow-hidden">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50 border-b border-amber-50">
                                                <tr>
                                                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Lovområde</th>
                                                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Resultat</th>
                                                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 text-center">Præcision</th>
                                                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Dato</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-amber-50">
                                                {(quizResults || []).slice(0, 10).map(res => {
                                                    const scoreVal = res.score || 0;
                                                    const totalVal = res.totalQuestions || 5;
                                                    const accuracy = Math.round((scoreVal / totalVal) * 100);
                                                    return (
                                                        <tr key={res.id} className="hover:bg-amber-50/30 transition-colors">
                                                            <td className="px-8 py-6 font-bold text-amber-950">{res.lawTitle}</td>
                                                            <td className="px-8 py-6 font-black serif text-amber-900">{scoreVal} / {totalVal}</td>
                                                            <td className="px-8 py-6 text-center">
                                                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${accuracy > 80 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{accuracy}%</span>
                                                            </td>
                                                            <td className="px-8 py-6 text-slate-400 text-xs">{res.createdAt?.toDate ? res.createdAt.toDate().toLocaleDateString('da-DK') : 'N/A'}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            </div>
                        )}
                    </motion.div>
                ) : viewMode === 'saved' ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row gap-12">
                        <aside className="w-full lg:w-72 shrink-0 space-y-8">
                            <section className="bg-white p-6 rounded-[2rem] border border-amber-100 shadow-sm">
                                <div className="flex items-center justify-between mb-6"><h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mine Samlinger</h3><button onClick={() => setIsCreatingCollection(true)} className="p-2 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-950 hover:text-white transition-all shadow-sm"><FolderPlus className="w-5 h-5" /></button></div>
                                {isCreatingCollection && (
                                    <form onSubmit={handleCreateCollection} className="mb-6 space-y-3"><Input autoFocus value={newCollectionName} onChange={e => setNewCollectionName(e.target.value)} placeholder="Navn..." className="h-12 rounded-xl" /><div className="flex gap-2"><Button type="submit" size="sm" className="flex-1">Opret</Button><Button type="button" variant="ghost" size="sm" onClick={() => setIsCreatingCollection(false)}>Annuller</Button></div></form>
                                )}
                                <nav className="space-y-1">
                                    <button onClick={() => setActiveCollectionId('all')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between ${activeCollectionId === 'all' ? 'bg-amber-950 text-white shadow-xl' : 'text-slate-500 hover:bg-amber-50'}`}><div className="flex items-center gap-3"><Folders className="w-4 h-4" />Alle</div><span>{savedParagraphs?.length || 0}</span></button>
                                    {collections?.map(col => (
                                        <div key={col.id} className="relative group/col">
                                            <button onClick={() => setActiveCollectionId(col.id)} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold truncate pr-10 ${activeCollectionId === col.id ? 'bg-amber-50 text-amber-950 border border-amber-200' : 'text-slate-500 hover:bg-amber-50'}`}>{col.name}</button>
                                            <button onClick={() => handleDeleteCollection(col.id, col.name)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-300 hover:text-rose-600 opacity-0 group-hover/col:opacity-100 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    ))}
                                </nav>
                            </section>
                        </aside>
                        <div className="flex-1 space-y-12">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                <div><h2 className="text-4xl font-bold text-amber-950 serif tracking-tight">Gemte kilder</h2><p className="text-slate-500 mt-2 font-medium italic">Dine bogmærkede lovtekster.</p></div>
                                {activeCollectionId !== 'all' && (<Button onClick={() => setShowBibliography(true)} className="rounded-xl bg-amber-950 shadow-xl"><FileStack className="w-4 h-4 mr-2" /> Litteraturliste</Button>)}
                            </div>
                            <div className="bg-white rounded-[2rem] border border-amber-100 shadow-xl overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 border-b border-amber-50"><tr><th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Kilde</th><th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Paragraf</th><th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Status</th><th className="px-8 py-5 text-right"></th></tr></thead>
                                    <tbody className="divide-y divide-amber-50">
                                        {filteredParagraphsData.map(para => {
                                            const targetXmlUrl = para.externalUrl ? para.externalUrl + '/xml' : (lawsConfigs || []).find(l => l.id === para.lawId)?.xmlUrl;
                                            return (
                                                <tr key={para.id} className="group hover:bg-amber-50/30 transition-colors">
                                                    <td className="px-8 py-6 font-bold text-amber-950">{para.lawAbbreviation}</td>
                                                    <td className="px-8 py-6 font-black serif text-amber-900">{para.paragraphNumber}</td>
                                                    <td className="px-8 py-6"><LiveStatusBadge xmlUrl={targetXmlUrl} /></td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex items-center gap-2 justify-end">
                                                            <button onClick={() => setIsMovingParaId(para.id)} className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-amber-900"><Folders className="w-4 h-4" /></button>
                                                            <button onClick={(e) => handleUnsave(e, para.id)} className="p-2.5 text-slate-300 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                ) : viewMode === 'laws' && !activeLawId && !activeReferenceId ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-16">
                        
                        {/* 1. SITUATIONAL NAVIGATION - THE "LEGEY LET" UX */}
                        {!activeSituationId ? (
                            <section className="space-y-10 animate-fade-in-up">
                                <div className="text-center space-y-4 mb-12">
                                    <h2 className="text-3xl sm:text-5xl font-bold text-amber-950 serif tracking-tight">Hvad handler din sag om?</h2>
                                    <p className="text-slate-500 max-w-xl mx-auto italic font-medium">Navigér direkte til de rette paragraffer baseret på din situation.</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {SITUATIONS.map((sit, i) => (
                                        <button 
                                            key={sit.id} 
                                            onClick={() => setActiveSituationId(sit.id)}
                                            className="group bg-white p-8 rounded-[3rem] border border-amber-100 shadow-sm hover:shadow-2xl hover:border-amber-950 transition-all text-center flex flex-col items-center justify-between min-h-[280px]"
                                        >
                                            <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform ${sit.color}`}>
                                                {sit.icon}
                                            </div>
                                            <div className="mt-6 flex-grow">
                                                <h3 className="text-xl font-bold text-amber-950 serif mb-2 group-hover:text-amber-700 transition-colors">{sit.title}</h3>
                                                <p className="text-xs text-slate-400 leading-relaxed italic">{sit.description}</p>
                                            </div>
                                            <div className="mt-8 pt-6 border-t border-amber-50 w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-900/40 group-hover:text-amber-950 transition-colors">
                                                Gå til flow <ChevronRight className="w-3 h-3"/>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </section>
                        ) : (
                            <section className="bg-white p-8 md:p-16 rounded-[4rem] border border-amber-100 shadow-2xl relative overflow-hidden animate-ink">
                                <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
                                    <Sparkles className="w-96 h-96 -rotate-12" />
                                </div>
                                <div className="relative z-10">
                                    <DecisionTreeFlow 
                                        situation={SITUATIONS.find(s => s.id === activeSituationId)} 
                                        onCancel={() => setActiveSituationId(null)} 
                                    />
                                </div>
                            </section>
                        )}

                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-16 border-t border-amber-100/50">
                            <div>
                                <h2 className="text-3xl font-bold text-amber-950 serif tracking-tight">Gå direkte til lovtekst</h2>
                                <p className="text-slate-500 mt-2 font-medium italic">Navigér i de fulde retsakter og kapitler.</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-black text-amber-900/40 uppercase tracking-widest">
                                <Library className="w-4 h-4" /> {(lawsConfigs || []).length} Love
                            </div>
                        </div>

                        {Object.entries(groupedLaws).map(([category, laws], groupIdx) => (
                          laws.length > 0 && (
                            <section key={category} className="space-y-8">
                              <div className="flex items-center gap-4">
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-amber-900/30 whitespace-nowrap">{category}</h3>
                                <div className="h-px w-full bg-amber-100/50" />
                              </div>
                              <div className="grid md:grid-cols-2 gap-8">
                                {laws.map((law, idx) => (
                                    <LawOverviewCard 
                                        key={law.id} 
                                        law={law} 
                                        isLocked={isFreeTier && lawsConfigs.indexOf(law) > 0} 
                                        router={router} 
                                        idx={idx} 
                                    />
                                ))}
                              </div>
                            </section>
                          )
                        ))}
                    </motion.div>
                ) : (activeLawId || activeReferenceId) && currentDocData ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                        <div className={`bg-white rounded-[2.5rem] border border-amber-100 shadow-xl relative overflow-hidden transition-all duration-500 ${isScrolled ? 'fixed top-[108px] left-8 lg:left-80 right-8 lg:right-[352px] z-40 p-4 rounded-2xl shadow-lg md:block hidden animate-ink' : 'p-8 md:p-12'}`}>
                            <div className={`absolute top-0 right-0 p-12 opacity-5 ${isScrolled ? 'hidden' : ''}`}><ScaleIcon className="w-32 h-32" /></div>
                            <div className="relative z-10 flex items-center gap-6">
                                {!isScrolled && (<button onClick={() => router.back()} className="w-14 h-14 border border-amber-100 rounded-2xl flex items-center justify-center hover:bg-amber-950 hover:text-white transition-all group shadow-sm"><ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" /></button>)}
                                <div className="flex-1">
                                    {!isScrolled && (
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border border-amber-200 text-amber-700 bg-amber-50">{activeReferenceId ? 'Reference' : 'Lovtekst'}</span>
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${currentDocData?.status === 'Valid' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-rose-200 text-rose-700 bg-rose-50'}`}>{currentDocData?.status === 'Valid' ? 'Gældende' : currentDocData?.status}</span>
                                        </div>
                                    )}
                                    <h2 className={`font-bold text-amber-950 serif tracking-tight ${isScrolled ? 'text-lg' : 'text-3xl'}`}>{currentDocData?.titel}</h2>
                                </div>
                            </div>
                        </div>
                        {isScrolled && <div className="h-24 hidden md:block" />}

                        <div className={`space-y-16 pb-32 transition-all duration-500 ${isFocusMode ? 'max-w-full' : 'max-w-4xl mx-auto'}`}>
                            {filteredDocData?.kapitler.map((chapter, cIdx) => (
                                <div key={cIdx} id={`chapter-${cIdx}`} className="space-y-10 scroll-mt-48">
                                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-amber-900/30 whitespace-nowrap">{chapter.nummer} {chapter.titel}</h3>
                                    <div className="grid gap-8">
                                        {chapter.paragraffer.map((para, pIdx) => {
                                            const paraKey = `${currentDocId}-${cIdx}-${pIdx}`;
                                            const isExpanded = expandedParaKey === paraKey;
                                            const isSaved = (savedParagraphs || []).some(p => p.id === `${currentDocId}-${para.nummer.replace(/[§\s\.]/g, '-')}`);
                                            return (
                                                <div key={pIdx} id={`para-${paraKey}`} className={`bg-white border transition-all overflow-hidden ${isExpanded ? 'rounded-[3rem] border-amber-950 shadow-2xl' : 'rounded-[2.5rem] border-amber-100 hover:border-amber-400 shadow-sm'}`}>
                                                    <div onClick={() => { setExpandedParaKey(isExpanded ? null : paraKey); setActiveParagraphNumber(isExpanded ? null : para.nummer); if(isExpanded) setSelectedSubElement(null); }} onMouseUp={() => handleMouseUp(paraKey)} className="p-8 md:p-12 flex items-start gap-6 cursor-pointer group">
                                                        <div className={`w-12 h-12 md:w-16 md:h-16 rounded-[2rem] flex items-center justify-center font-black serif text-xl md:text-3xl shrink-0 ${isExpanded ? 'bg-amber-950 text-white' : 'bg-amber-50 text-amber-900'}`}>{para.nummer}</div>
                                                        <div className="flex-1 min-w-0 text-base leading-relaxed font-medium text-slate-600">
                                                            <InteractiveParagraphBody 
                                                                text={para.tekst} 
                                                                highlight={debouncedSearchQuery} 
                                                                userHighlights={(userHighlights || []).filter(h => h.paragraphKey === paraKey)} 
                                                                onRemoveHighlight={handleRemoveHighlight}
                                                                onSubElementClick={handleSubElementClick}
                                                                selectedSubElement={isExpanded ? selectedSubElement : null}
                                                            />
                                                        </div>
                                                        <ChevronDown className={`w-10 h-10 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                    </div>
                                                    {isExpanded && (
                                                        <div className="bg-amber-50/30 border-t border-amber-50 p-8 md:p-12 space-y-8 animate-ink">
                                                            <div className="flex gap-4">
                                                                <Button onClick={() => handleAnalyzeParagraph(para, currentDocData, paraKey)} disabled={isAnalysingPara[paraKey]} className="flex-1 h-16 rounded-2xl bg-amber-950 shadow-xl shadow-amber-900/20">{isAnalysingPara[paraKey] ? <Loader2 className="animate-spin" /> : <Brain className="mr-2 text-amber-400" />} AI Analyse</Button>
                                                                <Button onClick={() => handleToggleSave(para, currentDocData, currentDocId!)} variant="outline" className={`flex-1 h-16 rounded-2xl ${isSaved ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold' : ''}`}>{isSaved ? <BookmarkCheck className="fill-current mr-2" /> : <Bookmark className="mr-2" />} {isSaved ? 'Gemt' : 'Gem'}</Button>
                                                            </div>
                                                            <div className="bg-white p-8 rounded-[2rem] border border-amber-100 shadow-sm space-y-6">
                                                                <div className="flex items-center gap-3 text-amber-900/40"><Library className="w-5 h-5" /><span className="text-[10px] font-black uppercase tracking-widest">Kildehenvisning</span></div>
                                                                <div className="grid md:grid-cols-2 gap-8">
                                                                    <div><p className="text-[9px] font-black uppercase text-slate-400 mb-2">Reference</p><p className="text-xs font-bold text-amber-950 leading-relaxed pr-8 select-all">{citations.inText}</p></div>
                                                                    <div><p className="text-[9px] font-black uppercase text-slate-400 mb-2">Litteraturliste</p><p className="text-xs font-bold text-amber-950 italic pr-8 select-all">{citations.bibliography}</p></div>
                                                                </div>
                                                                <div className="flex justify-end gap-2 pt-4 border-t border-amber-50">
                                                                    <Button variant="ghost" size="sm" onClick={() => handleCopy(citations.inText, 'intext')} className="text-[10px] font-black uppercase">Kopier Reference</Button>
                                                                    <Button variant="ghost" size="sm" onClick={() => handleCopy(citations.bibliography, 'bib')} className="text-[10px] font-black uppercase">Kopier Liste-format</Button>
                                                                </div>
                                                            </div>
                                                            {paraAnalysis[paraKey] && (
                                                                <div className="grid md:grid-cols-3 gap-6 p-6 bg-white rounded-3xl border border-amber-100 shadow-inner">
                                                                    <div><p className="text-[10px] font-black uppercase text-amber-900/40 mb-1">Subjekt</p><p className="text-xs font-bold text-amber-950">{paraAnalysis[paraKey].subjekt}</p></div>
                                                                    <div><p className="text-[10px] font-black uppercase text-rose-900/40 mb-1">Handling</p><p className="text-xs font-bold text-amber-950">{paraAnalysis[paraKey].handling}</p></div>
                                                                    <div><p className="text-[10px] font-black uppercase text-indigo-900/40 mb-1">Betingelser</p><p className="text-sm font-bold text-amber-950">{paraAnalysis[paraKey].betingelser}</p></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
      </main>

      {/* CONTEXT SIDEBAR */}
      <AnimatePresence>
          {isContextSidebarOpen && !isFocusMode && (activeLawId || activeReferenceId) && (
              <motion.aside initial={{ opacity: 0, x: 300 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 300 }} className="w-80 bg-white border-l border-amber-100 hidden lg:flex flex-col sticky top-0 h-screen z-30 shadow-2xl">
                  <div className="p-8 space-y-10 overflow-y-auto flex-1 custom-scrollbar">
                      <div className="flex items-center justify-between"><h3 className="text-xs font-black uppercase tracking-[0.3em] text-amber-900/40">Sagsindsigt</h3><button onClick={() => setIsContextSidebarOpen(false)} className="p-2 text-slate-300 hover:text-amber-950"><X className="w-4 h-4" /></button></div>
                      
                      {/* LAW INFO CARD */}
                      {currentDocData && (
                          <section className="bg-amber-50/50 p-6 rounded-[2rem] border border-amber-100 shadow-inner space-y-4">
                              <div className="flex items-center gap-3 text-amber-950/40">
                                  <span className="text-[10px] font-black uppercase tracking-widest">Kildedetaljer</span>
                              </div>
                              
                              <div className="space-y-3">
                                  {currentDocData.popularTitle && (
                                      <div>
                                          <p className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Populærtitel</p>
                                          <p className="text-sm font-bold text-amber-900 leading-tight">{currentDocData.popularTitle}</p>
                                      </div>
                                  )}
                                  <div>
                                      <p className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Officiel Titel</p>
                                      <p className="text-xs font-medium text-slate-600 leading-snug line-clamp-3">{currentDocData.titel}</p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-amber-100/50">
                                      <div>
                                          <p className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Nummer</p>
                                          <p className="text-xs font-bold text-amber-950">{currentDocData.number || 'N/A'}</p>
                                      </div>
                                      <div>
                                          <p className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Dato</p>
                                          <p className="text-xs font-bold text-amber-950">{currentDocData.date || 'N/A'}</p>
                                      </div>
                                  </div>
                              </div>
                          </section>
                      )}

                      {/* QUIZ CALLOUT */}
                      {activeLawId && (
                        <section className="bg-amber-950 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden group">
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center text-amber-950 shadow-lg">
                                        <GraduationCap className="w-6 h-6" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Træn din viden</span>
                                </div>
                                <p className="text-xs text-amber-100/60 leading-relaxed mb-6 italic">Test din forståelse af denne lov med en AI-genereret quiz.</p>
                                <Button 
                                    onClick={() => setIsQuizModalOpen(true)}
                                    className="w-full bg-amber-400 text-amber-950 hover:bg-white text-[10px] font-black uppercase h-12 rounded-xl"
                                >
                                    Start Lov-Quiz
                                </Button>
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16"></div>
                        </section>
                      )}

                      {currentDocData && (
                          <section className="space-y-6">
                              <div className="flex items-center gap-3 font-bold text-sm serif"><Navigation className="w-5 h-5 text-amber-700" /> Navigation</div>
                              <select onChange={(e) => scrollToChapter(parseInt(e.target.value))} className="w-full appearance-none pl-4 pr-8 py-3 bg-slate-50 border border-amber-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-950/20 shadow-sm cursor-pointer">
                                  <option value="" disabled selected>Gå til kapitel...</option>
                                  {currentDocData.kapitler.map((c, i) => <option key={i} value={i}>{c.nummer} {c.titel}</option>)}
                              </select>
                          </section>
                      )}
                      
                      {isSagsindsigtLoading ? (
                          <div className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-200" /></div>
                      ) : (
                          <div className="space-y-6">
                              <div className="flex items-center justify-between cursor-pointer group/header" onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}>
                                  <div className="flex items-center gap-3 font-bold text-sm serif"><Clock className="w-5 h-5 text-amber-700" /> Tidslinje</div>
                                  <ChevronDown className={`transition-transform ${isTimelineExpanded ? 'rotate-180 text-amber-950' : 'text-slate-300'}`} />
                              </div>
                              <AnimatePresence>{isTimelineExpanded && (
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="relative pl-6 space-y-6 overflow-hidden border-l border-amber-100 ml-5">
                                      {(timeline || []).map((v, i) => (
                                          <div key={i} className="relative">
                                              <div className={`absolute -left-[25px] top-1.5 w-2 h-2 rounded-full border-2 border-white ${v.isHistoric ? 'bg-slate-300' : v.isMainLaw ? 'bg-amber-950 shadow-sm' : 'bg-amber-200'}`}></div>
                                              <p className="text-[9px] font-black uppercase text-amber-700 mb-1">{v.signatureDate || 'Ukendt dato'}</p>
                                              <button onClick={() => handleOpenReference(v)} className={`text-xs text-left font-bold leading-snug block hover:text-amber-700 transition-colors ${v.isCurrentDocument ? 'text-amber-950 underline underline-offset-2' : 'text-slate-600'}`}>{v.shortName}</button>
                                          </div>
                                      ))}
                                  </motion.div>
                              )}</AnimatePresence>
                              
                              <div className="flex items-center justify-between cursor-pointer group/header" onClick={() => setIsRetsakterExpanded(!isRetsakterExpanded)}>
                                  <div className="flex items-center gap-3 font-bold text-sm serif"><BookMarked className="w-5 h-5 text-emerald-700" /> Retsakter</div>
                                  <ChevronDown className={`transition-transform ${isRetsakterExpanded ? 'rotate-180 text-amber-950' : 'text-slate-300'}`} />
                              </div>
                              <AnimatePresence>{isRetsakterExpanded && (
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-3 overflow-hidden">
                                      {(relatedDocs || []).length > 0 ? relatedDocs.map((doc, i) => (
                                          <button key={i} onClick={() => handleOpenReference(doc)} className="w-full text-left p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-amber-950 transition-all group/item"><div className="flex items-center justify-between mb-1"><p className="text-[10px] font-black uppercase text-amber-700 group-hover/item:text-amber-900 transition-colors">{doc.shortName}</p>{doc.isHistorical && <span className="text-[7px] font-black uppercase text-rose-600 bg-rose-50 px-1 rounded border border-rose-100">Hist.</span>}</div><p className="text-xs font-bold text-amber-950 line-clamp-2">{doc.title}</p></button>
                                      )) : <p className="text-xs text-slate-400 italic">Ingen fundet.</p>}
                                  </motion.div>
                              )}</AnimatePresence>

                              <div className="flex items-center justify-between cursor-pointer group/header" onClick={() => setIsAfgørelserExpanded(!isAfgørelserExpanded)}>
                                  <div className="flex items-center gap-3 font-bold text-sm serif"><Gavel className="w-5 h-5 text-blue-700" /> Afgørelser</div>
                                  <ChevronDown className={`transition-transform ${isAfgørelserExpanded ? 'rotate-180' : 'text-slate-300'}`} />
                              </div>
                              <AnimatePresence>{isAfgørelserExpanded && (
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-3 overflow-hidden">
                                      {(relatedDecisions || []).length > 0 ? relatedDecisions.map((dec, i) => (
                                          <button key={i} onClick={() => handleOpenReference(dec)} className="w-full text-left p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-amber-950 transition-all group/item"><div className="flex items-center justify-between mb-1"><p className="text-[10px] font-black uppercase text-blue-700 group-hover/item:text-blue-900 transition-colors">{dec.shortName}</p>{dec.isHistoryFlag && <span className="text-[7px] font-black uppercase text-rose-600 bg-rose-50 px-1 rounded border border-rose-100">Hist.</span>}</div><p className="text-xs font-bold text-amber-950 line-clamp-2">{dec.title}</p></button>
                                      )) : <p className="text-xs text-slate-400 italic">Ingen fundet.</p>}
                                  </motion.div>
                              )}</AnimatePresence>

                              <div className="flex items-center justify-between cursor-pointer group/header" onClick={() => setIsOmbudsmandExpanded(!isOmbudsmandExpanded)}>
                                  <div className="flex items-center gap-3 font-bold text-sm serif"><ScaleIcon className="w-5 h-5 text-amber-700" /> Ombudsmanden</div>
                                  <ChevronDown className={`transition-transform ${isOmbudsmandExpanded ? 'rotate-180' : 'text-slate-300'}`} />
                              </div>
                              <AnimatePresence>{isOmbudsmandExpanded && (
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-3 overflow-hidden">
                                      {(ombudsmandReports || []).length > 0 ? ombudsmandReports.map((report, i) => (
                                          <button key={i} onClick={() => handleOpenReference(report)} className="w-full text-left p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-amber-950 transition-all group/item"><p className="text-[10px] font-black uppercase text-amber-700 mb-1">{report.shortName}</p><p className="text-xs font-bold text-amber-950 line-clamp-2">{report.title}</p></button>
                                      )) : <p className="text-xs text-slate-400 italic">Ingen fundet.</p>}
                                  </motion.div>
                              )}</AnimatePresence>
                          </div>
                      )}
                  </div>
              </motion.aside>
          )}
      </AnimatePresence>

      {/* SELECTION POPUP */}
      <AnimatePresence>
          {selectionRange && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                style={{ position: 'fixed', top: selectionRange.rect.top - 60, left: selectionRange.rect.left, zIndex: 150 }}
                className="bg-amber-950 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2"
              >
                  <button onClick={handleSaveHighlight} className="flex items-center gap-2 text-xs font-bold px-2 h-8 hover:text-amber-400 transition-colors">
                      <Highlighter className="w-4 h-4" /> Marker tekst
                  </button>
                  <div className="w-px h-4 bg-white/20 mx-1"></div>
                  <button onClick={() => setSelectionRange(null)} className="p-2 hover:text-amber-400 transition-colors"><X className="w-4 h-4" /></button>
              </motion.div>
          )}
      </AnimatePresence>

      {/* BIBLIOGRAPHY MODAL */}
      <AnimatePresence>{showBibliography && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-amber-950/70 backdrop-blur-md" onClick={() => setShowBibliography(false)}></div>
              <div className="relative bg-[#FDFCF8] w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col p-8 space-y-8 animate-ink">
                  <div className="flex items-center justify-between border-b border-amber-100 pb-6">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center shadow-inner">
                              <FileStack className="w-6 h-6" />
                          </div>
                          <div>
                              <h2 className="text-xl font-bold serif text-amber-950">Din Litteraturliste (APA 7)</h2>
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                  {activeCollectionId === 'all' ? 'Alle gemte kilder' : 'Valgt samling'}
                              </p>
                          </div>
                      </div>
                      <button onClick={() => setShowBibliography(false)} className="p-2 text-slate-400 hover:text-amber-950"><X className="w-6 h-6"/></button>
                  </div>
                  
                  <div className="p-6 bg-white border border-amber-100 rounded-2xl min-h-[250px] overflow-y-auto shadow-inner relative group custom-scrollbar">
                      {isFetchingBibMetadata ? (
                          <div className="flex flex-col items-center justify-center py-12 gap-4">
                              <Loader2 className="w-8 h-8 animate-spin text-amber-300"/>
                              <p className="text-xs text-slate-400 italic">Indlæser kildedata fra Retsinformation...</p>
                          </div>
                      ) : (
                          <>
                            <pre className="text-sm whitespace-pre-wrap italic font-sans leading-relaxed text-slate-700 select-all">
                                {bibliographyTextResult || "Ingen kilder tilgængelige for generering."}
                            </pre>
                            {bibliographyTextResult && (
                                <button onClick={() => { navigator.clipboard.writeText(bibliographyTextResult); toast({ title: "Kopieret!" }); }} className="absolute top-4 right-4 p-2 bg-amber-50 text-amber-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Copy className="w-4 h-4" />
                                </button>
                            )}
                          </>
                      )}
                  </div>
                  
                  <div className="bg-blue-50 text-blue-800 text-[10px] p-4 rounded-xl border border-blue-100 flex items-start gap-4 italic">
                      <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                      <span>Listen er genereret efter APA 7 og juridisk standard. Tjek altid for korrekte årstal og ændringslove i den endelige lovtekst.</span>
                  </div>

                  <div className="flex justify-end gap-4">
                      <Button variant="ghost" onClick={() => setShowBibliography(false)}>Luk</Button>
                      <Button onClick={() => { navigator.clipboard.writeText(bibliographyTextResult); toast({ title: "Kopieret til udklipsholder" }); }} className="rounded-xl px-8 h-12 shadow-xl shadow-amber-950/10">
                          Kopier alle
                      </Button>
                  </div>
              </div>
          </div>
      )}</AnimatePresence>

      {/* LAW QUIZ MODAL */}
      <LawQuizModal 
        isOpen={isQuizModalOpen} 
        onClose={() => setIsQuizModalOpen(false)} 
        lawId={activeLawId || ''} 
        lawTitle={currentDocData?.titel || 'Loven'}
        chapters={currentDocData?.kapitler || []}
      />

      {/* READING GUIDE MODAL */}
      <ReadingGuideModal 
        isOpen={isReadingGuideOpen} 
        onClose={() => setIsReadingGuideOpen(false)}
        lawTitle={currentDocData?.titel || 'Loven'}
      />
    </div>
  );
}
