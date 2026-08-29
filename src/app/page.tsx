'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, Brain, ArrowRight, Scale, ChevronRight, ChevronDown, FileText,
  CheckCircle2, Building2, BookOpen, Check, ShieldCheck, Zap, Lock, Globe,
  Users, Bell, Search, Menu, X, Star, FileBox, Gavel, Briefcase, Award,
  Layers, ShieldAlert, Cpu, HeartHandshake, CheckCircle, GraduationCap,
  Play, Stethoscope, Baby, Activity, Dumbbell, Compass, HelpCircle,
  Clock, ArrowUpRight, GitMerge, Send, Calendar, AlertTriangle, Shield,
  CalendarDays, Bookmark, FolderKanban, LayoutDashboard
} from 'lucide-react';
import { useApp } from '@/app/provider';
import HeaderNavbar from '@/components/HeaderNavbar';
import Footer from '@/components/Footer';

const SafeItem: React.FC<{ text: string }> = ({ text }) => (
  <li className="flex items-center gap-3 text-sm text-emerald-900 font-bold">
    <div className="bg-emerald-100 text-emerald-700 rounded-full p-0.5 flex flex-shrink-0">
      <CheckCircle2 size={16} />
    </div>
    <span>{text}</span>
  </li>
);

const RiskItem: React.FC<{ text: string }> = ({ text }) => (
  <li className="flex items-center gap-3 text-sm text-rose-900 font-bold">
    <div className="bg-rose-100 text-rose-700 rounded-full p-0.5 flex flex-shrink-0">
      <X size={16} />
    </div>
    <span>{text}</span>
  </li>
);

export default function LandingPage() {
  const { openAuthPage, isUserLoading, user } = useApp();
  const router = useRouter();

  // Interactive States
  const [heroActiveTab, setHeroActiveTab] = useState<'struktur' | 'planlaegning' | 'organisering' | 'viden'>('struktur');
  const [activePracticeTab, setActivePracticeTab] = useState<'social_work' | 'pedagogy' | 'nursing' | 'midwifery' | 'therapy' | 'institution'>('social_work');
  const [moduleCategory, setModuleCategory] = useState<'all' | 'struktur' | 'planlaegning' | 'organisering' | 'viden'>('all');
  const [selectedModule, setSelectedModule] = useState<any | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/portal');
    }
  }, [user, isUserLoading, router]);

  const onStart = () => {
    if (typeof openAuthPage === 'function') {
      openAuthPage('signup');
    } else {
      router.push('/auth?mode=signup');
    }
  };

  const onLogin = () => {
    if (typeof openAuthPage === 'function') {
      openAuthPage('signin');
    } else {
      router.push('/auth?mode=signin');
    }
  };

  // Modules Catalog Data (Grupperet efter de 4 søjler)
  const modulesList = [
    // 1. STRUKTURERING
    {
      id: 'mit_semester',
      title: 'Mit Semester & Studieordning',
      category: 'struktur',
      pillar: '1. Strukturering',
      badge: 'Struktur',
      badgeBg: '#eff6ff',
      badgeColor: '#1d4ed8',
      iconBg: '#dbeafe',
      iconColor: '#1d4ed8',
      icon: <GraduationCap size={24} />,
      targetAudience: 'Studerende på alle semestre',
      plainExplanation: 'Få krystalklart overblik over dit aktuelle modul, officielle læringsmål, ECTS-point og eksamensform ud fra din institutions godkendte studieordning.',
      benefits: [
        'Automatisk indlæsning af dit semesters specifikke modulkrav og læringsmål',
        'Upload af egen lokale modulbeskrivelse med automatisk AI-udtræk',
        'Direkte link til anbefalet litteratur til hvert enkelt læringsmål'
      ],
      whyItMatters: 'Du ved præcis, hvad censor vurderer dig på, så du læser målrettet efter læringsmålene fra dag 1.'
    },
    {
      id: 'sagsanalyse',
      title: 'Juridisk Sagsanalyse & Subsumption',
      category: 'struktur',
      pillar: '1. Strukturering',
      badge: 'Metode',
      badgeBg: '#fef2f2',
      badgeColor: '#dc2626',
      iconBg: '#fee2e2',
      iconColor: '#dc2626',
      icon: <Brain size={24} />,
      targetAudience: 'Socialrådgivere og sagsbehandler-studerende',
      plainExplanation: 'Et metodisk værktøj til at opbygge og strukturere juridisk sagsbehandling: adskil faktum fra retsregler, gennemfør korrekt subsumption og formuler en holdbar afgørelse.',
      benefits: [
        'Struktureret 4-trins juridisk metode (Faktum, Regel, Subsumption, Konklusion)',
        'Indbygget tjekliste for forvaltningsretlige grundsætninger og proportionalitet',
        'Øjeblikkelig sparring på dine faglige argumenter'
      ],
      whyItMatters: 'Giver dig den stringente metode og faglige argumentation, der belønnes med topkarakterer til eksamen.'
    },
    {
      id: 'begrebsguide',
      title: 'Faglig Begrebsguide & Videnskabsteori',
      category: 'struktur',
      pillar: '1. Strukturering',
      badge: 'Begreber',
      badgeBg: '#fdf2f8',
      badgeColor: '#be185d',
      iconBg: '#fce7f3',
      iconColor: '#be185d',
      icon: <HelpCircle size={24} />,
      targetAudience: 'Studerende på tværs af alle semestre',
      plainExplanation: 'Dybdegående forklaringer på over 1.000 centrale begreber inden for socialt arbejde, pædagogik, sundhed, jura og videnskabsteori.',
      benefits: [
        'Søg lynhurtigt på faglige begreber, teoretikere og paradigmer',
        'Se konkrete praksiseksempler og eksamensanvendelse',
        'Interaktiv opfølgende sparring til dine opgaver'
      ],
      whyItMatters: 'Sikrer at du har fuldstændig styr på det faglige ordforråd og kan anvende teorier korrekt i opgaver.'
    },

    // 2. PLANLÆGNING
    {
      id: 'semester_plan',
      title: 'Semesterplanlægger & Tidslinje',
      category: 'planlaegning',
      pillar: '2. Planlægning',
      badge: 'Planlægning',
      badgeBg: '#f0fdf4',
      badgeColor: '#15803d',
      iconBg: '#dcfce7',
      iconColor: '#15803d',
      icon: <CalendarDays size={24} />,
      targetAudience: 'Studerende der ønsker ro og overblik over semesteret',
      plainExplanation: 'Få en struktureret ugetidsplan for dit semester: opdel pensum i ugentlige bidder, hold styr på afleveringsdeadlines og eksaminer med iCal-synk.',
      benefits: [
        'Uge-for-uge intensitetsgraf over dit faglige arbejdspres',
        'Synkronisering direkte til din Google-, Apple- eller Outlook-kalender',
        'Overblik over deadlines for synopser, opgaver og mundtlige eksaminer'
      ],
      whyItMatters: 'Skaber ro i hverdagen og forhindrer, at du havner i overvældende tidspres op til eksamensperioden.'
    },
    {
      id: 'studieplanlaegger',
      title: 'Studie- & Læseplanlægger',
      category: 'planlaegning',
      pillar: '2. Planlægning',
      badge: 'Læseplan',
      badgeBg: '#ecfdf5',
      badgeColor: '#047857',
      iconBg: '#d1fae5',
      iconColor: '#047857',
      icon: <Clock size={24} />,
      targetAudience: 'Alle studerende med uoverskuelige læselister',
      plainExplanation: 'Omdan tunge pensumlister til konkrete, realistiske dags- og ugeplaner med tidsestimater baseret på din personlige læsehastighed.',
      benefits: [
        'Beregner automatisk estimeret læsetid pr. kapitel og modul',
        'Interaktiv tjekliste så du kan markere læste tekster',
        'Indbygget tidsbuffer til eksamensforberedelse og repetition'
      ],
      whyItMatters: 'Gør det nemt at overskue 500+ siders pensum uden at miste modet undervejs.'
    },
    {
      id: 'seminar_architect',
      title: 'Oplægsarkitekt & Fremlæggelse',
      category: 'planlaegning',
      pillar: '2. Planlægning',
      badge: 'Oplæg',
      badgeBg: '#fffbeb',
      badgeColor: '#b45309',
      iconBg: '#fef3c7',
      iconColor: '#b45309',
      icon: <Sparkles size={24} />,
      targetAudience: 'Studerende før seminarer, studiegruppemøder og mundtlige oplæg',
      plainExplanation: 'Strukturér og disponér mundtlige oplæg med en krystalklar rød tråd mellem teori, empiri og diskussionsspørgsmål.',
      benefits: [
        'Generér tidsstyrede dispositioner til 10-, 20- eller 45-minutters oplæg',
        'Foreslår faglige diskussionsspørgsmål til studiegruppen',
        'Træn mundtlig fremlæggelse og argumentation'
      ],
      whyItMatters: 'Giver dig selvtillid foran holdet og sikrer professionelle præsentationer.'
    },

    // 3. ORGANISERING
    {
      id: 'mit_pensum',
      title: 'Mit Pensum & Materialearkiv',
      category: 'organisering',
      pillar: '3. Organisering',
      badge: 'Arkiv',
      badgeBg: '#f0f9ff',
      badgeColor: '#0284c7',
      iconBg: '#e0f2fe',
      iconColor: '#0284c7',
      icon: <FileBox size={24} />,
      targetAudience: 'Studerende med mange PDF-filer, artikler og noter',
      plainExplanation: 'Saml alle dine noter, PDF-kompendier, eksamensdispositioner og bachelormaterialer i et struktureret og søgbart studiearkiv.',
      benefits: [
        'Upload og organisér noter og artikler direkte pr. modul',
        'AI-assisteret overblik og interaktiv vektor-søgning i dine egne dokumenter',
        'Generér visuelle faglige mindmaps ud fra dine materialer'
      ],
      whyItMatters: 'Slut med at lede i uoverskuelige mapper på computeren – alt dit faglige guld er samlet ét sted.'
    },
    {
      id: 'gemte_paragraffer',
      title: 'Gemte Paragraffer & Bogmærker',
      category: 'organisering',
      pillar: '3. Organisering',
      badge: 'Bogmærker',
      badgeBg: '#faf5ff',
      badgeColor: '#7e22ce',
      iconBg: '#f3e8ff',
      iconColor: '#7e22ce',
      icon: <Bookmark size={24} />,
      targetAudience: 'Studerende der skriver opgaver og forbereder eksamen',
      plainExplanation: 'Gem nøgleparagraffer, Ankestyrelsens principmeddelelser og boguddrag med personlige noter til lynhurtig genfinding under eksamen.',
      benefits: [
        'Opret tematiske mapper til dine eksamensopgaver (f.eks. Børn & Unge, Handicap, Forvaltningsret)',
        'Tilføj personlige noter og refleksioner til hver paragraf',
        'Eksportér bogmærker direkte som referencer til dit skriveprogram'
      ],
      whyItMatters: 'Gør det lynhurtigt at genfinde dine vigtigste retskilder, når uret tikker til eksamen.'
    },
    {
      id: 'apa_kildegenerator',
      title: 'APA 7th Kildegenerator',
      category: 'organisering',
      pillar: '3. Organisering',
      badge: 'Referencer',
      badgeBg: '#ecfdf5',
      badgeColor: '#047857',
      iconBg: '#d1fae5',
      iconColor: '#047857',
      icon: <Layers size={24} />,
      targetAudience: 'Alle studerende der skriver eksamensopgaver og bachelor',
      plainExplanation: 'Generér fejlfrie kildehenvisninger og færdige litteraturlister efter gældende APA 7th standard til bøger, lovbekendtgørelser, domme og rapporter.',
      benefits: [
        '100% korrekt formatering af både in-text henvisninger og kildelister',
        'Understøtter danske love, bekendtgørelser, vejledninger og forskningsrapporter',
        'Kopiér direkte til Word eller Google Docs med ét klik'
      ],
      whyItMatters: 'Du undgår dyre formfejl til eksamen og sparer mange timers manuelt tastearbejde.'
    },

    // 4. VIDENSSØGNING
    {
      id: 'pensumsøgning',
      title: 'Intelligent Pensumsøgning',
      category: 'viden',
      pillar: '4. Videnssøgning',
      badge: 'Pensumsøg',
      badgeBg: '#eff6ff',
      badgeColor: '#2563eb',
      iconBg: '#dbeafe',
      iconColor: '#2563eb',
      icon: <Search size={24} />,
      targetAudience: 'Studerende med tunge pensumlister og faglitteratur',
      plainExplanation: 'Søg på tværs af tusindvis af siders pensumlitteratur. Find præcise kapitler, sidetal og APA-referencer direkte på dine faglige spørgsmål.',
      benefits: [
        'Semantisk søgning der forstår faglige synonymer og problemstillinger',
        'Viser nøjagtige kapitel- og sidetalsreferencer klar til kildeangivelse',
        'Uddrager kernebegreber og faglige sammenhænge på få sekunder'
      ],
      whyItMatters: 'Du sparer timer på at bladre i tunge lærebøger og finder lynhurtigt præcis den teori, du skal bruge.'
    },
    {
      id: 'lovportal',
      title: 'Lovportal & Retsinformation',
      category: 'viden',
      pillar: '4. Videnssøgning',
      badge: 'Gældende Ret',
      badgeBg: '#eff6ff',
      badgeColor: '#1d4ed8',
      iconBg: '#dbeafe',
      iconColor: '#1d4ed8',
      icon: <Scale size={24} />,
      targetAudience: 'Socialrådgiver-, pædagog- og sundhedsstuderende',
      plainExplanation: 'Direkte adgang til gældende dansk lovstof, herunder Barnets Lov, Serviceloven, Forvaltningsloven og Retssikkerhedsloven, koblet med Ankestyrelsens principmeddelelser.',
      benefits: [
        'Slå paragraffer op lynhurtigt med automatisk lovhistorik og kommentarer',
        'Find relevante Ankestyrelsesafgørelser til brug i eksamensopgaver',
        'Få præcise kildehenvisninger direkte klar til din litteraturliste'
      ],
      whyItMatters: 'Du slipper for uoverskuelige PDF-filer og er altid 100% sikker på, at du citerer gældende ret.'
    },
    {
      id: 'second_opinion',
      title: 'Second Opinion Opgavesparring',
      category: 'viden',
      pillar: '4. Videnssøgning',
      badge: 'Sparring',
      badgeBg: '#fef2f2',
      badgeColor: '#e11d48',
      iconBg: '#ffe4e6',
      iconColor: '#e11d48',
      icon: <Sparkles size={24} />,
      targetAudience: 'Studerende under opgaveskrivning og bachelorforløb',
      plainExplanation: 'Uvildig AI-opgavesparring der vurderer dit opgaveudkast mod dit moduls specifikke læringsmål, akademisk stringens og kildebrug.',
      benefits: [
        'Tester om din besvarelse dækker alle modulets faglige læringsmål',
        'Identificerer manglende juridiske eller teoretiske perspektiver',
        'Giver konstruktive forslag til at styrke din argumentation'
      ],
      whyItMatters: 'Fungerer som en ekstra censor før aflevering, så du kan nå at finpudse dine pointer.'
    }
  ];

  const filteredModules = moduleCategory === 'all' 
    ? modulesList 
    : modulesList.filter(m => m.category === moduleCategory);

  // Education details mapping
  const practiceDetails = {
    social_work: {
      title: 'Socialrådgiver & Sagsbehandler',
      lead: 'Skabt specifikt til socialrådgiveruddannelsen med fokus på juridisk metode, forvaltningsret og helhedsorienteret sagsbehandling.',
      laws: ['Barnets Lov § 32 & § 35', 'Serviceloven § 85 & § 107', 'Forvaltningsloven & Retssikkerhedsloven', 'VUM 2.0 & ICS Metoden'],
      theories: ['Bourdieu (Habitus & Kapital)', 'Honneth (Anerkendelsesteori)', 'Michael Lipsky (Gadeplansbureaukrati)', 'Kari Martinsen & Antonovsky'],
      color: '#1d4ed8',
      bg: '#eff6ff'
    },
    pedagogy: {
      title: 'Pædagogik & Dagtilbud',
      lead: 'Designet til pædagogstuderende med fokus på relationsarbejde, udviklingspsykologi, inklusion og didaktiske modeller.',
      laws: ['Dagtilbudsloven', 'Folkeskoleloven', 'Barnets Lov (Tidlig indsats)', 'FNs Børnekonvention'],
      theories: ['Vygotsky (Nærmeste udviklingszone)', 'John Bowlby (Tilknytningsteori)', 'Schön (Reflekterende praktiker)', 'SMTTE-modellen'],
      color: '#b45309',
      bg: '#fffbeb'
    },
    nursing: {
      title: 'Sygepleje & Klinisk Praksis',
      lead: 'Målrettet sygeplejestuderende med fokus på klinisk beslutningstagen, farmakologi, anatomi og sygeplejeprocessen.',
      laws: ['Sundhedsloven (Informeret samtykke & tavshedspligt)', 'Autorisationsloven', 'Psykiatriloven', 'Patientrettigheder'],
      theories: ['Virginia Henderson (Behovsteori)', 'Katie Eriksson (Det lidende menneske)', 'ABCDE-princippet & ISBAR', 'Klinisk ræsonnering'],
      color: '#0284c7',
      bg: '#f0f9ff'
    },
    midwifery: {
      title: 'Jordemoderstudiet',
      lead: 'Tilpasset jordemoderstuderende med graviditets-, fødsels- og barselsforløb, obstetrik og etiske overvejelser.',
      laws: ['Sundhedsloven (Fødselsomsorg)', 'Bekendtgørelse om jordemodergerning', 'Fosterdiagnostik & Etik', 'Børneloven'],
      theories: ['Salutogenese i fødsel', 'Obstetriske triage-redskaber', 'Ammeetablering & Bonding', 'Traumeinformeret omsorg'],
      color: '#be185d',
      bg: '#fdf2f8'
    },
    therapy: {
      title: 'Ergoterapi & Fysioterapi',
      lead: 'Udviklet til ergo- og fysioterapistuderende med fokus på funktionsevnevurdering, rehabilitering og aktivitetsanalyse.',
      laws: ['Sundhedsloven § 140 (Genoptræning)', 'Serviceloven § 112 (Hjælpemidler)', 'Arbejdsmiljøloven', 'ICF Klassifikation'],
      theories: ['CMOP-E & MOHO Modellerne', 'Biomekanik & Bevægelsesanalyse', 'Smerteteorier (Gate Control)', 'Barthel Indeks & VAS'],
      color: '#047857',
      bg: '#ecfdf5'
    },
    institution: {
      title: 'Socialpædagogik & Bosteder',
      lead: 'Skræddersyet til døgninstitutioner, botilbud og socialpsykiatri med fokus på magtanvendelsesregler og pædagogisk dokumentation.',
      laws: ['Serviceloven Kap. 24 (Magtanvendelse)', 'Socialtilsynsloven', 'Lov om voksenansvar', 'Kvalitetsmodellen'],
      theories: ['KRAP (Kognitiv Ressourceorienteret Pædagogik)', 'Low Arousal (Afmagt og konflikthåndtering)', 'Recovery & Empowerment', 'Neuropædagogik'],
      color: '#7e22ce',
      bg: '#faf5ff'
    }
  };

  const activeDetails = practiceDetails[activePracticeTab];

  return (
    <div className="brand-font bg-[#fcfcfd] min-h-screen text-slate-900 overflow-x-hidden selection:bg-blue-500/20 selection:text-blue-900">
      
      {/* 1. TOP FLOATING NAVBAR */}
      <HeaderNavbar />

      {/* 2. HERO SECTION */}
      <header className="relative overflow-hidden pt-28 sm:pt-36 pb-20 border-b border-slate-200/80 bg-white">
        
        {/* Ambient Glows */}
        <div className="ambient-glow-hero" />
        <div className="ambient-glow-purple top-10 -right-20" />
        <div className="ambient-glow-emerald -bottom-20 -left-20" />
        
        {/* Subtle Architectural Dot Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{ 
            backgroundImage: `radial-gradient(rgba(15, 23, 42, 0.7) 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />

        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            
            {/* Left Column: Heading & CTAs */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              
              {/* Shimmer Pill Badge */}
              <div className="inline-flex items-center gap-2 bg-white/95 text-indigo-900 border border-indigo-200 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider mb-5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block shadow-[0_0_0_3px_rgba(79,70,229,0.2)]"></span>
                <span>STUDIEPARTNER FOR SUNDHEDS- & VELFÆRDSSTUDERENDE · 100% GRATIS</span>
              </div>

              {/* H1 Main Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-[62px] font-black text-slate-900 leading-[1.08] tracking-tight mb-4">
                Mindre pensumstress. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-800 via-blue-600 to-emerald-600 inline-block">
                  Mere struktur & faglig ro.
                </span>
              </h1>

              {/* Badges Glass Row */}
              <div className="flex gap-2 items-center mb-5 flex-wrap">
                <div className="bg-indigo-50 border border-indigo-200 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-xs">
                  <span className="text-xs text-indigo-900 font-extrabold">📐 1. Strukturering</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-xs">
                  <span className="text-xs text-emerald-900 font-extrabold">🗓️ 2. Planlægning</span>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-xs">
                  <span className="text-xs text-amber-900 font-extrabold">📁 3. Organisering</span>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-xs">
                  <span className="text-xs text-purple-900 font-extrabold">🔎 4. Videnssøgning</span>
                </div>
              </div>

              {/* Lead Paragraph */}
              <p className="text-base sm:text-lg text-slate-600 max-w-xl mb-7 leading-relaxed font-normal">
                Cohéro Student er bygget til at støtte dig gennem hele din professionsbachelor med strukturering af moduler og læringsmål, realistisk semester- og læseplanlægning, organisering af pensumnoter samt lynhurtig videns- og lovsøgning.
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3.5 items-center flex-wrap mb-4">
                <button
                  onClick={onStart}
                  className="btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #18223c 0%, #2563eb 100%)',
                    color: 'white',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.85rem 1.95rem',
                    borderRadius: '13px',
                    fontSize: '1rem',
                    fontWeight: 800,
                    boxShadow: '0 12px 28px -6px rgba(37, 99, 235, 0.35)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Opret gratis profil
                  <ArrowRight size={18} />
                </button>
                <a
                  href="#soejler"
                  className="inline-flex items-center gap-2.5 text-slate-900 font-extrabold text-base bg-white border border-slate-300 px-6 py-3 rounded-xl shadow-xs hover:bg-slate-50 transition-all no-underline"
                >
                  <Play size={14} className="fill-slate-900 text-slate-900" />
                  Udforsk de 4 søjler
                </a>
              </div>

              {/* Free Trial Reassurance Line */}
              <div className="flex items-center gap-4 text-xs text-slate-500 font-bold mb-7 flex-wrap">
                <span className="text-emerald-700 font-extrabold">✓ 100% gratis for studerende</span>
                <span>✓ 0 kr. i opstart</span>
                <span>✓ Tilpasset alle semestre</span>
              </div>

              {/* Profession Quick Switcher Bar */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider mr-1">
                  Uddannelse:
                </span>
                {[
                  { id: 'social_work', label: 'Socialrådgiver', color: '#1d4ed8', bg: '#eff6ff' },
                  { id: 'pedagogy', label: 'Pædagog', color: '#b45309', bg: '#fffbeb' },
                  { id: 'nursing', label: 'Sygeplejerske', color: '#0284c7', bg: '#f0f9ff' },
                  { id: 'midwifery', label: 'Jordemoder', color: '#be185d', bg: '#fdf2f8' },
                  { id: 'therapy', label: 'Ergo & Fysio', color: '#047857', bg: '#ecfdf5' },
                  { id: 'institution', label: 'Døgn & Bosted', color: '#7e22ce', bg: '#faf5ff' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActivePracticeTab(p.id as any);
                      const el = document.getElementById('uddannelser');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      color: p.color,
                      background: p.bg,
                      padding: '0.35rem 0.8rem',
                      borderRadius: '10px',
                      border: '1px solid rgba(0,0,0,0.06)'
                    }}
                    className="hover:scale-105 transition-transform"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Interactive macOS Workspace Window */}
            <div className="lg:col-span-5 relative w-full">
              
              {/* Floating Badge 1: Faglig Præcision */}
              <div 
                className="float-smooth absolute -top-5 -left-4 sm:-left-6 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-3 shadow-xl flex items-center gap-3 z-20"
              >
                <div className="bg-indigo-50 text-indigo-700 p-2 rounded-full flex flex-shrink-0">
                  <GraduationCap size={18} />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-black text-slate-900 leading-tight">4 Faglige Kernesøjler</span>
                  <span className="text-[10px] text-slate-500 font-semibold">Struktur, Plan, Arkiv & Viden</span>
                </div>
              </div>

              {/* Floating Badge 2: Efficiency Stats */}
              <div 
                className="float-smooth-delayed absolute -bottom-5 -right-3 sm:-right-5 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-3 shadow-xl flex items-center gap-3 z-20"
              >
                <div className="bg-emerald-50 text-emerald-700 p-2 rounded-full flex flex-shrink-0">
                  <CalendarDays size={18} />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-black text-slate-900 leading-tight">Realistisk Læseplan</span>
                  <span className="text-[10px] text-slate-500 font-semibold">Overblik & eksamensro</span>
                </div>
              </div>

              {/* macOS Window Frame */}
              <div className="bg-white border border-slate-300 rounded-[26px] shadow-2xl overflow-hidden relative">
                
                {/* macOS Title Bar */}
                <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                    <span className="ml-2 text-xs font-bold text-slate-500">Cohéro Student Workspace</span>
                  </div>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                    Kerneplatform
                  </span>
                </div>

                {/* Hero Interactive Tabs Bar */}
                <div className="flex bg-slate-100/60 px-2 py-1.5 gap-1 border-b border-slate-200 overflow-x-auto">
                  {[
                    { id: 'struktur', label: '📐 1. Struktur' },
                    { id: 'planlaegning', label: '🗓️ 2. Plan' },
                    { id: 'organisering', label: '📁 3. Arkiv' },
                    { id: 'viden', label: '🔎 4. Viden' }
                  ].map(tab => {
                    const isActive = heroActiveTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setHeroActiveTab(tab.id as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                          isActive 
                            ? 'bg-white text-slate-900 shadow-xs' 
                            : 'text-slate-500 hover:text-slate-900 bg-transparent'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Simulated Interactive Tab Content */}
                <div className="p-6 min-h-[300px] flex flex-col justify-center text-left">
                  
                  {heroActiveTab === 'struktur' && (
                    <div className="scale-in flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-[11px] text-slate-500 font-bold">4. Semester · Børn & Familier</div>
                          <div className="text-sm font-black text-slate-900">Modul: Myndighed & Børneundersøgelse</div>
                        </div>
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-extrabold">
                          1. Strukturering
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
                          <span className="w-5 h-5 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-[10px] font-black shrink-0">1</span>
                          <p className="text-xs text-slate-700 font-medium m-0">
                            <strong>Læringsmål:</strong> Redegør for handlepligt og anbringelseskriterier efter Barnets Lov § 32 & § 47.
                          </p>
                        </div>
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5">
                          <span className="w-5 h-5 bg-emerald-600 text-white rounded-lg flex items-center justify-center text-[10px] font-black shrink-0">2</span>
                          <p className="text-xs text-emerald-900 font-medium m-0">
                            <strong>Metode:</strong> Gennemfør 4-trins subsumption (Faktum, Retsregel, Vurdering, Afgørelse).
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                        <span>Studieordning indlæst</span>
                        <span className="text-indigo-700 font-bold">✓ 12 læringsmål kortlagt</span>
                      </div>
                    </div>
                  )}

                  {heroActiveTab === 'planlaegning' && (
                    <div className="scale-in flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-[11px] text-slate-500 font-bold">Semesterplan & Læsehastighed</div>
                          <div className="text-sm font-black text-slate-900">Uge 42: Pensummål 118 sider</div>
                        </div>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-extrabold">
                          2. Planlægning
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-700">
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                          <span><strong>Mandag:</strong> Järvinen kap. 4 (24 s.)</span>
                          <span className="text-slate-500 font-bold">45 min</span>
                        </div>
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                          <span><strong>Tirsdag:</strong> Serviceloven vejledning (18 s.)</span>
                          <span className="text-slate-500 font-bold">35 min</span>
                        </div>
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-900">
                          <span><strong>Torsdag:</strong> VUM 2.0 sagsøvelse</span>
                          <span className="text-emerald-700 font-bold">✓ Fuldført</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                        <span>iCal kalendersynkronisering aktiv</span>
                        <span className="text-emerald-700 font-bold">Eksamensdeadline: 18. dec</span>
                      </div>
                    </div>
                  )}

                  {heroActiveTab === 'organisering' && (
                    <div className="scale-in flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-[11px] text-slate-500 font-bold">Mit Pensum & Materialearkiv</div>
                          <div className="text-sm font-black text-slate-900">Bachelor: 'Tidlig indsats og underretninger'</div>
                        </div>
                        <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-extrabold">
                          3. Organisering
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          <div className="text-[11px] font-black text-slate-900 mb-1">📁 Modulnoter & PDF</div>
                          <p className="text-[10px] text-slate-500 m-0">14 uploadede artikler & 6 kompendier</p>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          <div className="text-[11px] font-black text-slate-900 mb-1">🔖 Gemte Paragraffer</div>
                          <p className="text-[10px] text-slate-500 m-0">Barnets Lov §§ 19, 32, 47 m. noter</p>
                        </div>
                      </div>

                      <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                        <strong>APA 7th Kilde:</strong> Hansen, L. (2023). <em>Socialret i praksis</em> (4. udg.). Hans Reitzels Forlag.
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-slate-500">
                        <span>Fuldtekstsøgning aktiv</span>
                        <span className="text-blue-700 font-bold">✓ Alt samlet ét sted</span>
                      </div>
                    </div>
                  )}

                  {heroActiveTab === 'viden' && (
                    <div className="scale-in flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-[11px] text-slate-500 font-bold">Semantisk Pensumsøgning & Jura</div>
                          <div className="text-sm font-black text-slate-900">Søgning: "Lipsky street-level bureaucracy"</div>
                        </div>
                        <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-extrabold">
                          4. Videnssøgning
                        </span>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 leading-relaxed">
                        <strong className="text-slate-900">Fundet i pensumbog:</strong> <em>Socialt Arbejde</em> af M. Järvinen, <strong>Kapitel 4, side 114-122</strong>. Beskriver frontlinjemedarbejderens skønsudøvelse under ressourcepres.
                      </div>

                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-2.5 text-xs text-purple-900">
                        <strong>Principmeddelelse:</strong> Ankestyrelsen 85-15 (Konkret og individuel vurdering af behov).
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-slate-500">
                        <span>Præcise sidetal lokaliseret</span>
                        <span className="text-purple-700 font-bold">✓ APA-kilde kopieret</span>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* 3. TRUST & SOCIAL PROOF BAR */}
      <section id="trust" className="py-12 border-b border-slate-200 bg-white">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8">
          <div className="text-center mb-8">
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">
              Udviklet i tæt dialog med studerende fra Danmarks professionshøjskoler
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 items-center justify-center opacity-70 hover:opacity-100 transition-opacity">
            {['KP', 'VIA', 'UCL', 'UCN', 'Absalon', 'SDU', 'AAU', 'KU'].map(inst => (
              <div key={inst} className="text-center p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 font-black text-sm">
                {inst}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10 pt-8 border-t border-slate-100 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">50.000+</div>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">Paragrafopslag</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">100%</div>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">Gældende Dansk Ret</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">6</div>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">Velfærdsfag</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">4.9 / 5</div>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">Studievurdering</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3.5 DE 4 FAGLIGE SØJLER */}
      <section id="soejler" className="py-24 bg-[#F8FAFC] border-b border-slate-200 relative">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-700 bg-indigo-50 border border-indigo-200 px-3.5 py-1 rounded-full inline-block mb-3">
              Platformens 4 Faglige Kernesøjler
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Designet til at støtte dig gennem hele din uddannelse
            </h2>
            <p className="text-base text-slate-600 mt-3">
              Fra semesterstart og pensumlæsning til skriftlige eksamensprojekter og mundtlige oplæg – alt er bygget op omkring 4 sammenhængende søjler.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Søjle 1 */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <GraduationCap size={28} />
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-indigo-600 mb-2 block">
                  Søjle 1
                </span>
                <h3 className="text-xl font-black text-slate-900 mb-3">
                  Strukturering
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-normal mb-6">
                  Få fuld kontrol over dit semester. Få kortlagt studieordningens modulkrav, specifikke læringsmål, faglige begreber og 4-trins juridisk sagsanalyse.
                </p>
              </div>

              <ul className="space-y-2.5 border-t border-slate-100 pt-5 text-xs text-slate-700 font-bold">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-indigo-600" />
                  <span>Mit Semester & Læringsmål</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-indigo-600" />
                  <span>Juridisk Sagsanalyse</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-indigo-600" />
                  <span>Faglig Begrebsguide</span>
                </li>
              </ul>
            </div>

            {/* Søjle 2 */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <CalendarDays size={28} />
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600 mb-2 block">
                  Søjle 2
                </span>
                <h3 className="text-xl font-black text-slate-900 mb-3">
                  Planlægning
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-normal mb-6">
                  Omdan uoverskuelige pensumlister til konkrete uge- og dagsplaner. Få tidsestimater tilpasset din læsehastighed, eksamensdeadlines og iCal-synkronisering.
                </p>
              </div>

              <ul className="space-y-2.5 border-t border-slate-100 pt-5 text-xs text-slate-700 font-bold">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600" />
                  <span>Semesterplan & Tidslinje</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600" />
                  <span>Ugentlig Læseplan & Buffer</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600" />
                  <span>Seminar- & Oplægsarkitekt</span>
                </li>
              </ul>
            </div>

            {/* Søjle 3 */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FileBox size={28} />
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-amber-600 mb-2 block">
                  Søjle 3
                </span>
                <h3 className="text-xl font-black text-slate-900 mb-3">
                  Organisering
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-normal mb-6">
                  Saml alle dine noter, PDF-kompendier, eksamensdispositioner og gemte paragraffer i ét overskueligt studiearkiv med fuldtekstsøgning og mindmaps.
                </p>
              </div>

              <ul className="space-y-2.5 border-t border-slate-100 pt-5 text-xs text-slate-700 font-bold">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-amber-600" />
                  <span>Mit Pensum & Materialearkiv</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-amber-600" />
                  <span>Gemte Paragraffer & Bogmærker</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-amber-600" />
                  <span>APA 7th Kildegenerator</span>
                </li>
              </ul>
            </div>

            {/* Søjle 4 */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Search size={28} />
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-purple-600 mb-2 block">
                  Søjle 4
                </span>
                <h3 className="text-xl font-black text-slate-900 mb-3">
                  Videnssøgning
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-normal mb-6">
                  Søg semantisk i pensum med sidetal og APA-kilder, slå op i gældende lovgivning og få uvildig Second Opinion sparring på dine opgaveudkast.
                </p>
              </div>

              <ul className="space-y-2.5 border-t border-slate-100 pt-5 text-xs text-slate-700 font-bold">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-purple-600" />
                  <span>Semantisk Pensumsøgning</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-purple-600" />
                  <span>Lovportal & Ankestyrelsen</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-purple-600" />
                  <span>Second Opinion Opgavesparring</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* 4. DE 6 PRAKSISTYPER & UDDANNELSER */}
      <section id="uddannelser" className="py-24 bg-white border-b border-slate-200 relative">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full inline-block mb-3">
              Målrettet din studieordning
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Skræddersyet til Danmarks 6 centrale velfærdsuddannelser
            </h2>
            <p className="text-base text-slate-600 mt-3">
              Vælg din uddannelse for at se, hvordan Cohéro Student tilpasser lovstof, teorier og metoderedskaber præcis til dine fag og eksaminer.
            </p>
          </div>

          {/* Practice Tabs Header */}
          <div className="flex justify-center gap-2 flex-wrap mb-10">
            {[
              { id: 'social_work', label: 'Socialrådgiver', icon: <Users size={16} /> },
              { id: 'pedagogy', label: 'Pædagogik', icon: <GraduationCap size={16} /> },
              { id: 'nursing', label: 'Sygeplejerske', icon: <Stethoscope size={16} /> },
              { id: 'midwifery', label: 'Jordemoder', icon: <Baby size={16} /> },
              { id: 'therapy', label: 'Ergo- & Fysioterapi', icon: <Activity size={16} /> },
              { id: 'institution', label: 'Bosteder & Døgn', icon: <Building2 size={16} /> }
            ].map(tab => {
              const isActive = activePracticeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActivePracticeTab(tab.id as any)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
                    isActive 
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-105' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Practice Tab Active Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 lg:p-12 shadow-sm scale-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              
              <div className="lg:col-span-6 flex flex-col gap-4">
                <div className="inline-flex items-center gap-2 w-fit px-3 py-1 rounded-full text-xs font-black" style={{ background: activeDetails.bg, color: activeDetails.color }}>
                  {activeDetails.title}
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                  {activeDetails.title}
                </h3>
                <p className="text-base text-slate-600 leading-relaxed font-normal">
                  {activeDetails.lead}
                </p>

                <div className="mt-2 flex flex-col gap-3">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                    Integrerede Love & Metoder:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeDetails.laws.map((l, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                        <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
                        <span>{l}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    onClick={onStart}
                    className="btn-primary"
                    style={{
                      background: 'linear-gradient(135deg, #18223c 0%, #2563eb 100%)',
                      color: 'white',
                      padding: '0.75rem 1.6rem',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    Opret gratis profil til {activeDetails.title}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              {/* Right Side: Theory & Exam Matrix */}
              <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">
                    Kerne-teorier & Begrebsrammer
                  </h4>
                  <div className="flex flex-col gap-2">
                    {activeDetails.theories.map((t, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
                        <span>{t}</span>
                        <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-black">PENSUMKLAR</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-900 mb-1">
                    <Sparkles size={16} className="text-emerald-600" />
                    <span>Automatisk pensum-kobling</span>
                  </div>
                  <p className="text-xs text-emerald-800 m-0 leading-relaxed">
                    Cohéro Student forbinder automatisk de faglige teorier med relevante lovparagraffer og eksamensspørgsmål for dit semester.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 5. TVÆRFAGLIGT SAMARBEJDE */}
      <section id="tvaerfagligt" className="py-24 bg-[#fcfcfd] border-b border-slate-200 relative">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 flex flex-col gap-5">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full w-fit">
                Tværfagligt Samarbejde
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Forbind velfærdens faggrupper omkring borgeren
              </h2>
              <p className="text-base text-slate-600 leading-relaxed font-normal">
                I det virkelige velfærdssamfund arbejder socialrådgivere, pædagoger, sygeplejersker og terapeuter tæt sammen om borgerens liv og forløb. Cohéro Student træner dig i det tværprofessionelle samarbejde og fælles faglige sprog.
              </p>

              <div className="space-y-3 mt-2">
                {[
                  { title: 'Fælles helhedsforståelse', desc: 'Lær at integrere socialfaglige, pædagogiske og sundhedsfaglige data i samme sag.' },
                  { title: 'Tværsektoriel jura', desc: 'Overblik over snitfladerne mellem Serviceloven, Barnets Lov og Sundhedsloven.' },
                  { title: 'Styrket bachelorniveau', desc: 'Tværfaglighed vægtes højt i de nationale studieordninger og bedømmelseskriterier.' }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3.5 bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
                    <div className="bg-blue-50 text-blue-700 p-2 rounded-xl flex-shrink-0 mt-0.5">
                      <GitMerge size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900">{item.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side Visual Hub */}
            <div className="lg:col-span-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-6 shadow-sm">
                  <GitMerge size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Det Fælles Velfærds-Økosystem</h3>
                <p className="text-xs text-slate-500 max-w-md mb-8">
                  Et samlet fagsystem der sikrer sammenhæng mellem myndighed, praksis, botilbud og sundhedssektor.
                </p>

                <div className="grid grid-cols-2 gap-3 w-full">
                  <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl text-left">
                    <div className="text-xs font-black text-blue-900">Socialforvaltning</div>
                    <div className="text-[11px] text-blue-700">Myndighed & VUM 2.0</div>
                  </div>
                  <div className="p-3.5 bg-amber-50/60 border border-amber-100 rounded-xl text-left">
                    <div className="text-xs font-black text-amber-900">Dag- & Døgntilbud</div>
                    <div className="text-[11px] text-amber-700">Pædagogik & KRAP</div>
                  </div>
                  <div className="p-3.5 bg-sky-50/60 border border-sky-100 rounded-xl text-left">
                    <div className="text-xs font-black text-sky-900">Sundhed & Hospital</div>
                    <div className="text-[11px] text-sky-700">Klinik & Sygepleje</div>
                  </div>
                  <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl text-left">
                    <div className="text-xs font-black text-emerald-900">Rehabilitering</div>
                    <div className="text-[11px] text-emerald-700">Ergo- & Fysioterapi</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. PROBLEM VS. LØSNING (FØR & EFTER) */}
      <section id="problem" className="py-24 bg-white border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block">
              Før vs. Efter
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Læs smartere, spar tid og opnå fuld eksamensro
            </h2>
            <p className="text-base text-slate-600 mt-3">
              Se forskellen på traditionel, fragmenteret studielæsning og et professionelt, samlet studiesystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Uden Cohéro */}
            <div className="bg-rose-50/40 border border-rose-200 rounded-3xl p-8 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-800 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-6">
                  Traditionel Studielæsning
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-6">
                  Uden Cohéro Student
                </h3>

                <ul className="space-y-4">
                  <RiskItem text="500+ siders uoverskueligt pensum uden hurtigt overblik" />
                  <RiskItem text="Usikkerhed om du citerer gældende eller forældede lovparagraffer" />
                  <RiskItem text="Tvivl om korrekt juridisk metode og argumentation i sagsanalyser" />
                  <RiskItem text="Timer spildt på manuel APA-kildestyring og manglende referencer" />
                  <RiskItem text="Eksamensstress, fragmenterede noter og frygt for mundtlig censur" />
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-rose-200 text-xs text-rose-800 font-bold">
                ✕ Resulterer i unødvendigt pensumstress og usikkerhed til eksamen
              </div>
            </div>

            {/* Med Cohéro Student */}
            <div className="bg-emerald-50/40 border border-emerald-300 rounded-3xl p-8 flex flex-col justify-between shadow-lg shadow-emerald-500/5">
              <div>
                <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-6">
                  Den Nye Standard
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-6">
                  Med Cohéro Student
                </h3>

                <ul className="space-y-4">
                  <SafeItem text="Struktureret pensumoverblik og kernebegreber på sekunder" />
                  <SafeItem text="100% opdateret lovportal direkte synkroniseret med Retsinformation" />
                  <SafeItem text="Klar metodisk subsumptions-guide og SOAP-journaliseringsstøtte" />
                  <SafeItem text="Fejlfri, automatiske APA 7th kildehenvisninger med ét klik" />
                  <SafeItem text="Fuld eksamensro med dispositioner og simulerede censorspørgsmål" />
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-emerald-200 text-xs text-emerald-800 font-bold">
                ✓ Sikrer dig overskud, høj faglig kvalitet og bedre karakterer
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 7. COHÉRO AI & AUTONOME AGENTER */}
      <section id="ai-agenter" className="py-24 bg-gradient-to-b from-emerald-50/40 via-white to-[#fcfcfd] border-b border-slate-200 relative overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full inline-flex items-center gap-1.5 mb-3">
              <Sparkles size={14} />
              Intelligent Studiestøtte
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Cohéro AI · Autonome Agenter til Eksamensforberedelse
            </h2>
            <p className="text-base text-slate-600 mt-3">
              Vores specialtrænede faglige agenter scanner pensum, analyserer sagsakter og hjælper dig med at formulere skarpe akademiske argumenter uden nogensinde at overtræde universiteternes etiske retningslinjer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6">
                <FileBox size={24} />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Sagsakt- & PDF-Scanner</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Upload store sagsakter eller artikler og få øjeblikkeligt identificeret centrale retsfaktum, tidslinjer og relevante lovparagraffer.
              </p>
              <div className="text-xs font-black text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                ✓ Sikker lokal behandling
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-6">
                <Brain size={24} />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Eksamensarkitekten</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Opbyg stærke problemformuleringer og krystalklare dispositioner. Arkitekten tjekker om din teori og empiri hænger stringent sammen.
              </p>
              <div className="text-xs font-black text-blue-700 bg-blue-50 p-2.5 rounded-xl border border-blue-100">
                ✓ Rød tråd garanti
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-6">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Etisk & Eksamenssikker</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Cohéro skriver ikke opgaven for dig, men agerer faglig sparringspartner og metodisk vejleder i fuld overensstemmelse med eksamensreglerne.
              </p>
              <div className="text-xs font-black text-purple-700 bg-purple-50 p-2.5 rounded-xl border border-purple-100">
                ✓ 100% lovlig til eksamen
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 8. ALLE FAGLIGE MODULER & VÆRKTØJER */}
      <section id="moduler" className="py-24 bg-white border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full inline-block mb-3">
              Komplet Modulkatalog
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Alle værktøjer samlet i ét professionelt studiesystem
            </h2>
            <p className="text-base text-slate-600 mt-3">
              Klik på et modul for at se dets faglige formål, fordele og anvendelse i din studiehverdag.
            </p>
          </div>

          {/* Module Category Filter */}
          <div className="flex justify-center gap-2 flex-wrap mb-10">
            {[
              { id: 'all', label: 'Alle Værktøjer (12)' },
              { id: 'struktur', label: '1. Strukturering' },
              { id: 'planlaegning', label: '2. Planlægning' },
              { id: 'organisering', label: '3. Organisering' },
              { id: 'viden', label: '4. Videnssøgning' }
            ].map(cat => {
              const isActive = moduleCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setModuleCategory(cat.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    isActive 
                      ? 'bg-slate-900 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map(mod => (
              <div 
                key={mod.id}
                onClick={() => setSelectedModule(mod)}
                className="bg-slate-50/50 hover:bg-white border border-slate-200 hover:border-blue-300 rounded-3xl p-6 shadow-xs hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ background: mod.iconBg, color: mod.iconColor }}
                    >
                      {mod.icon}
                    </div>
                    <span 
                      className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full"
                      style={{ background: mod.badgeBg, color: mod.badgeColor }}
                    >
                      {mod.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900 group-hover:text-blue-700 transition-colors mb-2">
                    {mod.title}
                  </h3>

                  <p className="text-xs text-slate-500 leading-relaxed font-normal line-clamp-3 mb-4">
                    {mod.plainExplanation}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200/60 text-xs font-bold text-slate-700">
                  <span className="text-blue-700 group-hover:underline">Se detaljer & fordele</span>
                  <ChevronRight size={16} className="text-blue-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 9. DARK SHOWCASE SECTION: INTELLIGENT PLANLÆGNING & LÆSEPLAN */}
      <section id="planlaegning" className="py-24 bg-gradient-to-b from-[#070a13] to-[#0f172a] text-white relative overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 relative z-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 flex flex-col gap-5 text-left">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400 bg-emerald-950/80 border border-emerald-700 px-3 py-1 rounded-full w-fit">
                2. Planlægning & Læseflow
              </span>
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Fra 500+ siders pensumstress til overskuelig ugeplan
              </h2>

              <p className="text-base text-slate-300 leading-relaxed font-normal">
                Cohéro Student beregner automatisk din ugentlige læsebelastning ud fra din personlige læsehastighed, dine modulkrav og dine eksamensdeadlines. Du får realistiske dagsmål, indbyggede buffere og direkte kalendersynkronisering.
              </p>

              <div className="space-y-3 mt-2">
                <div className="flex items-center gap-3 text-xs font-bold text-slate-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">✓</div>
                  <span>Automatisk opdeling af pensumbøger og artikler i daglige etaper</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">✓</div>
                  <span>Tidsestimater så du ved præcis, hvor mange minutter du skal bruge</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">✓</div>
                  <span>1-klik eksport og live synk til Google, Apple & Outlook kalender</span>
                </div>
              </div>

              <div className="mt-4">
                <button
                  onClick={onStart}
                  className="px-6 py-3 rounded-xl bg-white text-slate-900 font-extrabold text-sm hover:bg-slate-100 transition-all shadow-lg inline-flex items-center gap-2"
                >
                  Prøv semesterplanlæggeren gratis
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

            {/* Right Side Study Planner UI Mockup */}
            <div className="lg:col-span-6">
              <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={16} className="text-emerald-400" />
                    <span className="font-bold text-white">Ugeplanlægger · Uge 43</span>
                  </div>
                  <span className="text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                    112 SIDER I ALT
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-black text-emerald-400 uppercase tracking-wider">Mandag (24 sider)</div>
                      <div className="text-xs font-bold text-white mt-0.5">Järvinen: Socialt Arbejde (Kapitel 3)</div>
                    </div>
                    <span className="text-xs font-extrabold text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
                      45 min
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-black text-blue-400 uppercase tracking-wider">Tirsdag (18 sider)</div>
                      <div className="text-xs font-bold text-white mt-0.5">Vejledning om Barnets Lov (Sagsgange)</div>
                    </div>
                    <span className="text-xs font-extrabold text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
                      35 min
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-600/40 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-black text-emerald-400 uppercase tracking-wider">Onsdag (16 sider)</div>
                      <div className="text-xs font-bold text-white mt-0.5">Lipsky: Street-Level Bureaucracy uddrag</div>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-300 bg-emerald-900/60 px-2.5 py-1 rounded-lg border border-emerald-700/50">
                      ✓ Læst
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
                  <span>Synkroniseret: <strong className="text-emerald-400">Apple & Google Cal</strong></span>
                  <span className="text-slate-300 font-bold">Eksamensbuffer: +4 dage</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 10. INTERAKTIV LOVPORTAL & RETSINFORMATION */}
      <section id="lovportal" className="py-24 bg-white border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full inline-block mb-3">
              Danmarks Første Specialiserede Lovportal
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              100% Verificeret Lovgivning & Ankestyrelsespraksis
            </h2>
            <p className="text-base text-slate-600 mt-3">
              Slut med at rode i Retsinformations tunge PDF-filer. Få gældende lovtekst, officielle vejledninger og principmeddelelser præsenteret lynhurtigt og overskueligt.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                §
              </div>
              <h3 className="text-base font-black text-slate-900">Barnets Lov & Serviceloven</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Komplet overblik over foranstaltninger, støtteophold, handleplaner og anbringelser jf. Barnets Lov §§ 32-46.
              </p>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                ⚖️
              </div>
              <h3 className="text-base font-black text-slate-900">Ankestyrelsens Principmeddelelser</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Find præcis den retspraksis og fortolkning, du skal bruge til at underbygge dine juridiske eksamensopgaver.
              </p>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
                🔍
              </div>
              <h3 className="text-base font-black text-slate-900">Forvaltningsretlige Garantier</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tjeklister til partshøring, aktindsigt, begrundelse og klagevejledning i enhver socialfaglig sag.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 12. PRISER & PAKKER */}
      <section id="pricing" className="py-24 bg-[#fcfcfd] border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-700 bg-indigo-50 border border-indigo-200 px-3.5 py-1 rounded-full inline-block mb-3">
              Gennemskuelige Studiepriser
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Enkle studiepriser – tilpasset dit semester
            </h2>
            <p className="text-base text-slate-600 mt-3">
              Vælg månedlig fleksibilitet eller få den populære Semesterpakke og spar 33% på et helt semesters adgang.
            </p>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            
            {/* 1. Gratis Studerende */}
            <div className="pricing-card-hover bg-white border border-slate-200 rounded-3xl p-8 flex flex-col justify-between shadow-xs">
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Basis</div>
                <h3 className="text-2xl font-black text-slate-900 mb-1">Gratis Studerende</h3>
                <p className="text-xs text-slate-500 mb-6">Det essentielle grundlag til alle velfærdsfag.</p>

                <div className="mb-6">
                  <span className="text-4xl font-black text-slate-900">0 kr.</span>
                  <span className="text-xs text-slate-500 ml-1">/ for altid</span>
                </div>

                <ul className="space-y-3 text-xs text-slate-700 font-semibold mb-8">
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-600 flex-shrink-0" />
                    <span>Fuld adgang til Lovportalen</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-600 flex-shrink-0" />
                    <span>Faglig begrebsordbog</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-600 flex-shrink-0" />
                    <span>Grundlæggende pensumoverblik</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-600 flex-shrink-0" />
                    <span>Dansk support via e-mail</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={onStart}
                className="w-full py-3 rounded-xl border border-slate-300 text-slate-900 font-extrabold text-sm hover:bg-slate-50 transition-all"
              >
                Opret gratis profil
              </button>
            </div>

            {/* 2. Cohéro Student (Månedlig) */}
            <div className="pricing-card-hover bg-white border border-slate-200 rounded-3xl p-8 flex flex-col justify-between shadow-xs">
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-indigo-700 mb-2">Månedlig Fleksibilitet</div>
                <h3 className="text-2xl font-black text-slate-900 mb-1">Cohéro Student</h3>
                <p className="text-xs text-slate-500 mb-6">Fuld adgang til alle 4 søjler måned for måned.</p>

                <div className="mb-6">
                  <span className="text-4xl font-black text-slate-900">89 kr.</span>
                  <span className="text-xs text-slate-500 ml-1">/ måned</span>
                </div>

                <ul className="space-y-3 text-xs text-slate-800 font-bold mb-8">
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-indigo-600 flex-shrink-0" />
                    <span>Alt i Gratis-pakken</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-indigo-600 flex-shrink-0" />
                    <span>Mit Semester & Læringsmål</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-indigo-600 flex-shrink-0" />
                    <span>Semesterplan & Ugentlig Læseplan</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-indigo-600 flex-shrink-0" />
                    <span>Juridisk Sagsanalyse & Subsumption</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-indigo-600 flex-shrink-0" />
                    <span>Pensumsøgning med sidetal & APA 7th</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-indigo-600 flex-shrink-0" />
                    <span>Second Opinion Opgavesparring</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-500 font-medium">
                    <span>Ingen binding – opsig når du vil</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={onStart}
                className="w-full py-3.5 rounded-xl border border-slate-300 text-slate-900 font-extrabold text-sm hover:bg-slate-50 transition-all shadow-xs"
              >
                Vælg Månedsabonnement (89 kr./md.)
              </button>
            </div>

            {/* 3. Semesterpakken (5 Måneder) - MEST POPULÆRE */}
            <div className="pricing-card-hover bg-white border-2 border-indigo-600 rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative scale-105">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full shadow-md whitespace-nowrap">
                ⭐ MEST POPULÆRE · 5 MÅNEDER
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    SPAR 146 KR. (33% RABAT)
                  </span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-1">Semesterpakken</h3>
                <p className="text-xs text-slate-500 mb-4">Dækker et helt fuldt semester fra semesterstart til eksamen.</p>

                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-slate-900">299 kr.</span>
                    <span className="text-xs text-slate-500 font-bold">/ 5 måneder</span>
                  </div>
                  <div className="text-xs font-extrabold text-emerald-700 mt-1 flex items-center gap-1.5">
                    <span>Svarer til kun <strong>59,80 kr. / md.</strong></span>
                  </div>
                  <div className="text-[11px] text-slate-400 line-through mt-0.5">
                    Normalpris: 445 kr. (5 x 89 kr.)
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl mb-6">
                  <div className="text-xs font-black text-indigo-950 mb-0.5">🎓 Komplet Eksamensro</div>
                  <div className="text-[11px] text-indigo-700 leading-snug">
                    Ét engangsbeløb for 5 måneders fuld adgang. Udløber automatisk – ingen uventede træk.
                  </div>
                </div>

                <ul className="space-y-3 text-xs text-slate-800 font-bold mb-8">
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-indigo-600 flex-shrink-0" />
                    <span>Alt i Cohéro Student i 5 fulde måneder</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-indigo-600 flex-shrink-0" />
                    <span>Ubegrænset adgang til alle 4 faglige søjler</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-indigo-600 flex-shrink-0" />
                    <span>Fuldt semester- og eksamensoverblik</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-indigo-600 flex-shrink-0" />
                    <span>Prioriteret support i eksamensperioder</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={onStart}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-extrabold text-sm shadow-md hover:from-indigo-700 hover:to-blue-700 transition-all"
              >
                Vælg Semesterpakken (299 kr.)
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* 13. FAQ ACCORDION */}
      <section id="faq" className="py-24 bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 sm:px-8">
          
          <div className="text-center mb-12">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block">
              Spørgsmål & Svar
            </span>
            <h2 className="text-3xl font-black text-slate-900">
              Ofte Stillede Spørgsmål
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'Er det gratis at bruge Cohéro Student?',
                a: 'Ja! Du kan oprette en gratis profil og få adgang til Lovportalen, den faglige begrebsordbog og basale funktioner uden tidsbegrænsning og uden kreditkort.'
              },
              {
                q: 'Hvad indeholder Semesterpakken?',
                a: 'Med Semesterpakken får du 5 måneders fuld adgang til alle platformens værktøjer for kun 299 kr. (svarende til 59,80 kr./md.). Du sparer 146 kr. (33% rabat) sammenlignet med månedsbetaling (5 x 89 kr. = 445 kr.). Pakken udløber automatisk efter 5 måneder uden binding.'
              },
              {
                q: 'Må jeg bruge Cohéro Student til mine eksamensopgaver?',
                a: 'Ja, 100%. Cohéro Student er designet som et fagligt støtteværktøj (som en digital kollega og ordbog), der hjælper dig med at strukturere dispositioner, finde gældende lovgivning og generere korrekte APA-kildehenvisninger. Værktøjet overholder de danske professionshøjskolers retningslinjer for etisk AI-anvendelse.'
              },
              {
                q: 'Hvordan sikres det, at lovstoffet er opdateret?',
                a: 'Vores Lovportal er direkte synkroniseret med Retsinformation.dk og Ankestyrelsen. Når en lov eller bekendtgørelse opdateres af Folketinget eller ministeriet, afspejles ændringen automatisk i vores system.'
              },
              {
                q: 'Hvilke uddannelser dækkes af platformen?',
                a: 'Cohéro Student dækker socialrådgiver-, pædagog-, sygepleje-, jordemoder-, ergoterapi- og fysioterapiuddannelserne samt relaterede velfærdsfaglige overbygninger.'
              },
              {
                q: 'Hvordan behandles mine opgavedata og noter?',
                a: 'Dine data og opgaveudkast er 100% private og deles aldrig med andre studerende eller tredjeparter. Alt data hostes i sikre ISO 27001-certificerede datacentre inden for EU i fuld overensstemmelse med GDPR.'
              }
            ].map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div 
                  key={index}
                  className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full p-5 text-left flex items-center justify-between font-black text-slate-900 text-sm hover:bg-slate-100/60 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : 'text-slate-400'}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed font-normal">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 14. CALL TO ACTION & DIRECT CONTACT */}
      <section id="kontakt" className="py-20 bg-white">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8">
          <div className="bg-gradient-to-r from-slate-900 via-[#18223c] to-blue-950 rounded-[36px] p-10 sm:p-16 text-center text-white relative overflow-hidden shadow-2xl">
            
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500 filter blur-[140px] opacity-20 pointer-events-none" />
            
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">
              Klar til at få professionel rygdækning på studiet?
            </h2>
            <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto mb-8 font-normal">
              Opret din gratis profil i dag og oplev hvordan Danmarks førende fagsystem til studerende giver dig ro og overblik.
            </p>

            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={onStart}
                className="px-8 py-4 rounded-xl bg-white text-slate-900 font-extrabold text-base hover:bg-slate-100 transition-all shadow-xl inline-flex items-center gap-2"
              >
                Kom i gang gratis
                <ArrowRight size={18} />
              </button>
              <a
                href="mailto:kontakt@cohero.dk"
                className="px-8 py-4 rounded-xl bg-slate-800/80 border border-slate-700 text-white font-extrabold text-base hover:bg-slate-800 transition-all no-underline"
              >
                Kontakt os
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 15. FOOTER */}
      <Footer />

      {/* Module Detail Modal */}
      {selectedModule && (
        <div 
          onClick={() => setSelectedModule(null)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[10003] flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="scale-in bg-white rounded-3xl p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative text-left"
          >
            <button 
              onClick={() => setSelectedModule(null)}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-900"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-5">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: selectedModule.iconBg, color: selectedModule.iconColor }}
              >
                {selectedModule.icon}
              </div>
              <div>
                <span 
                  className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full"
                  style={{ background: selectedModule.badgeBg, color: selectedModule.badgeColor }}
                >
                  {selectedModule.badge}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  {selectedModule.title}
                </h3>
              </div>
            </div>

            {/* Target Audience */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 mb-4">
              <strong className="text-slate-900">Målgruppe:</strong> {selectedModule.targetAudience}
            </div>

            {/* Explanation */}
            <div className="mb-4">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">
                Hvad er modulet?
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed font-normal">
                {selectedModule.plainExplanation}
              </p>
            </div>

            {/* Benefits */}
            <div className="mb-4">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">
                Fordele i praksis:
              </h4>
              <div className="space-y-2">
                {selectedModule.benefits.map((b: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-800 font-medium">
                    <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Why It Matters */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900 mb-6">
              <strong>💡 Værdien for dig:</strong> {selectedModule.whyItMatters}
            </div>

            {/* Action */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedModule(null);
                  onStart();
                }}
                className="btn-primary flex-1"
                style={{
                  background: 'linear-gradient(135deg, #18223c 0%, #2563eb 100%)',
                  color: 'white',
                  padding: '0.8rem',
                  borderRadius: '12px',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Prøv {selectedModule.title} gratis
              </button>
              <button
                onClick={() => setSelectedModule(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
              >
                Luk
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
