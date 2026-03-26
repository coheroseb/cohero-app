'use client';

import React, { useMemo } from 'react';
import { X, BookOpen, Scale, FileText, Info, List, Search, Pencil, Lightbulb, ChevronRight, HelpCircle, Target, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReadingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  lawTitle?: string;
}

const GuideSection = ({ icon: Icon, title, children, color }: { icon: any, title: string, children: React.ReactNode, color: string }) => (
    <div className="space-y-4">
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} shadow-inner`}>
                <Icon className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-amber-950 serif">{title}</h3>
        </div>
        <div className="pl-13 ml-3 border-l-2 border-amber-100/50 py-1">
            <div className="text-sm text-slate-600 leading-relaxed space-y-4 ml-10">
                {children}
            </div>
        </div>
    </div>
);

const ReadingGuideModal: React.FC<ReadingGuideModalProps> = ({ isOpen, onClose, lawTitle = "Loven" }) => {
  

  const isVejledning = lawTitle.toLowerCase().includes('vejledning');
  const isBekendtgoerelse = lawTitle.toLowerCase().includes('bekendtgørelse');

  const lawContext = useMemo(() => {
    const title = lawTitle.toLowerCase();
    if (title.includes('barnet')) return 'barnets-lov';
    if (title.includes('social service') || title.includes('servicelov')) return 'serviceloven';
    if (title.includes('forvaltning')) return 'forvaltningsloven';
    if (title.includes('aktiv socialpolitik')) return 'aktivloven';
    if (title.includes('beskæftigelse')) return 'lab-loven';
    return 'generic';
  }, [lawTitle]);

  const examples = {
    'barnets-lov': {
        area: 'Dette område omhandler indsatser til børn, unge og deres familier.',
        hierarchy: '§ 32, stk. 1, nr. 2',
        analysis: {
            text: 'Kommunalbestyrelsen skal træffe afgørelse om praktisk, pædagogisk eller anden støtte i hjemmet.',
            who: 'Kommunalbestyrelsen',
            what: 'skal træffe afgørelse om støtte',
            conditions: 'Når det er af væsentlig betydning af hensyn til barnets særlige behov.'
        },
        situation: 'Hvis du er bekymret for et barn, skal du starte med at kigge på underretningspligten (§ 133) og derefter på, hvordan en børnefaglig undersøgelse igangsættes (§ 20).'
    },
    'serviceloven': {
        area: 'Dette område rammesætter støtte til voksne med handicap eller særlige sociale problemer.',
        hierarchy: '§ 85, stk. 1',
        analysis: {
            text: 'Kommunalbestyrelsen skal tilbyde hjælp, omsorg eller støtte samt optræning til personer, der har behov herfor.',
            who: 'Kommunalbestyrelsen',
            what: 'skal tilbyde hjælp og optræning',
            conditions: 'På grund af betydelig nedsat fysisk eller psykisk funktionsevne.'
        },
        situation: 'Når du vurderer en voksens behov for støtte i hverdagen, skal du kigge på formålet i § 81 og derefter på de specifikke ydelser som socialpædagogisk bistand (§ 85) eller ledsagelse (§ 97).'
    },
    'forvaltningsloven': {
        area: 'Dette område fastlægger spillereglerne for sagsbehandling i den offentlige forvaltning.',
        hierarchy: '§ 19, stk. 1',
        analysis: {
            text: 'Kan en part ikke antages at være bekendt med bestemte oplysninger, må der ikke træffes afgørelse, før parten er gjort bekendt hermed.',
            who: 'Myndigheden',
            what: 'må ikke træffe afgørelse (uden partshøring)',
            conditions: 'Hvis oplysningerne er til ugunst og af væsentlig betydning.'
        },
        situation: 'Før du træffer en afgørelse, der er til ugunst for borgeren, skal du sikre dig, at du har overholdt partshøringspligten (§ 19) og vejledningspligten (§ 7).'
    },
    'generic': {
        area: 'Denne kilde definerer de juridiske rammer for et specifikt socialfagligt område.',
        hierarchy: '§ [nr], stk. [nr], nr. [nr]',
        analysis: {
            text: 'Myndigheden skal yde hjælp til borgeren under visse betingelser.',
            who: 'Myndigheden',
            what: 'skal yde hjælp',
            conditions: 'Når de lovbestemte krav er opfyldt.'
        },
        situation: 'Start med at identificere borgerens problemstilling, find den relevante hovedlov, og brug derefter vejledningen til at se, hvordan reglerne skal fortolkes i praksis.'
    }
  }[lawContext === 'aktivloven' || lawContext === 'lab-loven' ? 'generic' : (lawContext as keyof typeof examples)] || {
    area: 'Denne kilde definerer de juridiske rammer for et specifikt socialfagligt område.',
    hierarchy: '§ [nr], stk. [nr], nr. [nr]',
    analysis: {
        text: 'Myndigheden skal yde hjælp til borgeren under visse betingelser.',
        who: 'Myndigheden',
        what: 'skal yde hjælp',
        conditions: 'Når de lovbestemte krav er opfyldt.'
    },
    situation: 'Start med at identificere borgerens problemstilling, find den relevante hovedlov, og brug derefter vejledningen til at se, hvordan reglerne skal fortolkes i praksis.'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-amber-950/60 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative bg-[#FDFCF8] w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up border border-white/10">
        <div className="p-8 border-b border-amber-100 bg-white flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center shadow-inner">
                    <HelpCircle className="w-7 h-7" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-amber-950 serif">Guide til {lawTitle}</h2>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Juridisk læseteknik</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-amber-50 rounded-xl transition-colors shrink-0">
                <X className="w-6 h-6 text-amber-900" />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
            
            <GuideSection icon={Search} title="1. Hvad kigger jeg på?" color="text-blue-700 bg-blue-50">
                <div className="bg-white border border-blue-100 p-5 rounded-2xl mb-4 shadow-sm">
                    <p className="font-bold text-blue-900 mb-1">
                        {isVejledning ? 'Dette er en VEJLEDNING' : isBekendtgoerelse ? 'Dette er en BEKENDTGØRELSE' : 'Dette er en LOV'}
                    </p>
                    <p className="text-xs text-slate-500 italic">
                        {isVejledning 
                            ? 'Vejledninger uddyber reglerne med forklaringer og eksempler fra praksis. De er ikke juridisk bindende, men vejleder om hvordan paragrafferne kan bruges.' 
                            : isBekendtgoerelse 
                                ? 'Bekendtgørelser er juridisk bindende regler udstedt af ministeriet, der forklarer hvordan loven skal bruges i detaljer.' 
                                : 'Dette er selve hovedloven (retsakten), der er vedtaget af Folketinget og fastlægger de overordnede rammer.'}
                    </p>
                    <p className="text-xs text-slate-400 mt-2 font-medium">
                        {examples.area}
                    </p>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-2xl border ${!isVejledning && !isBekendtgoerelse ? 'bg-amber-50 border-amber-200 ring-2 ring-amber-500/20 shadow-sm' : 'bg-white border-amber-100 opacity-60'}`}>
                        <p className="font-bold text-amber-950 mb-1">Lov</p>
                        <p className="text-[11px] text-slate-500 leading-snug">Hovedreglerne. Vedtaget i Folketinget.</p>
                    </div>
                    <div className={`p-4 rounded-2xl border ${isBekendtgoerelse ? 'bg-amber-50 border-amber-200 ring-2 ring-amber-500/20 shadow-sm' : 'bg-white border-amber-100 opacity-60'}`}>
                        <p className="font-bold text-amber-950 mb-1">Bekendtgørelse</p>
                        <p className="text-[11px] text-slate-500 leading-snug">Detaljerne. Udstedt af ministeriet.</p>
                    </div>
                    <div className={`p-4 rounded-2xl border ${isVejledning ? 'bg-amber-50 border-amber-200 ring-2 ring-amber-500/20 shadow-sm' : 'bg-white border-amber-100 opacity-60'}`}>
                        <p className="font-bold text-amber-950 mb-1">Vejledning</p>
                        <p className="text-[11px] text-slate-500 leading-snug">Forklaringer. Praktiske eksempler.</p>
                    </div>
                </div>
            </GuideSection>

            <GuideSection icon={Target} title="2. Start med formålet (§ 1)" color="text-rose-700 bg-rose-50">
                <p>Start altid med at læse <strong>formålsbestemmelsen</strong>. Den giver dig retningen for hele loven og forklarer, hvad man ønsker at opnå for borgeren.</p>
                <div className="p-6 bg-rose-50/50 border border-rose-100 rounded-2xl italic text-rose-900 font-medium leading-relaxed">
                    <span className="font-black uppercase text-[10px] block mb-2 opacity-50 tracking-widest">Din tjekliste:</span>
                    "Hvilket område handler det om? Hvem gælder reglerne for? Hvad er myndighedens kerneopgave her?"
                </div>
            </GuideSection>

            <GuideSection icon={List} title="3. Navigér i kapitlerne" color="text-indigo-700 bg-indigo-50">
                <p>Brug indholdsfortegnelsen til at finde din specifikke situation. Lovgivning er opdelt hierarkisk:</p>
                <div className="p-6 bg-white border border-amber-100 rounded-2xl font-mono text-xs shadow-inner">
                    <p className="text-amber-900 font-black mb-3 text-[10px] uppercase tracking-widest opacity-50">Eksempel på henvisning:</p>
                    <p className="text-base font-bold mb-4">{examples.hierarchy}</p>
                    <ul className="space-y-1.5">
                        <li className="flex justify-between border-b border-amber-50 pb-1"><span>Paragraf (§):</span> <span className="font-bold">Hovedreglen</span></li>
                        <li className="flex justify-between border-b border-amber-50 pb-1"><span>Stykke (stk.):</span> <span className="font-bold">Underopdeling</span></li>
                        <li className="flex justify-between"><span>Nummer (nr.):</span> <span className="font-bold">Specifik liste</span></li>
                    </ul>
                </div>
            </GuideSection>

            <GuideSection icon={Zap} title="4. Hvad skal jeg gøre her?" color="text-amber-700 bg-amber-50">
                <p>Her er en konkret guide til en typisk socialfaglig proces i denne lov:</p>
                <div className="p-6 bg-amber-950 text-white rounded-3xl shadow-xl space-y-4">
                    <p className="text-sm font-bold leading-relaxed">
                        <Sparkles className="w-4 h-4 inline mr-2 text-amber-400" />
                        {examples.situation}
                    </p>
                </div>
            </GuideSection>

            <GuideSection icon={Scale} title="5. Dekonstruér paragraffen" color="text-emerald-700 bg-emerald-50">
                <p>Brug denne 3-trins model for at forstå en regel helt præcist:</p>
                
                <div className="p-6 bg-white border border-amber-100 rounded-2xl space-y-4 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase italic">Analyse af eksempel:</p>
                    <p className="text-sm font-bold text-amber-900 leading-relaxed">"{examples.analysis.text}"</p>
                    
                    <div className="grid gap-3 pt-4 border-t border-amber-50">
                        <div className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-black text-emerald-700 shadow-sm shrink-0">1</div>
                            <p><span className="font-bold text-emerald-900">Hvem (Subjekt):</span> {examples.analysis.who}</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-black text-emerald-700 shadow-sm shrink-0">2</div>
                            <p><span className="font-bold text-emerald-900">Hvad (Handling):</span> {examples.analysis.what}</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-black text-emerald-700 shadow-sm shrink-0">3</div>
                            <p><span className="font-bold text-emerald-900">Hvornår (Betingelser):</span> {examples.analysis.conditions}</p>
                        </div>
                    </div>
                </div>
            </GuideSection>

            <GuideSection icon={Lightbulb} title="6. Nøgleord du skal holde øje med" color="text-amber-700 bg-amber-50">
                <p>Visse ord i teksten definerer, hvor meget <strong>fagligt skøn</strong> du har som rådgiver:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white border border-amber-100 rounded-2xl shadow-sm hover:border-amber-950 transition-colors">
                        <p className="font-black text-amber-950 mb-1 uppercase tracking-tighter">Skal</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-tighter font-bold">En pligt (bundet regel)</p>
                    </div>
                    <div className="text-center p-4 bg-white border border-amber-100 rounded-2xl shadow-sm hover:border-amber-950 transition-colors">
                        <p className="font-black text-amber-950 mb-1 uppercase tracking-tighter">Kan</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-tighter font-bold">Mulighed / Skøn</p>
                    </div>
                    <div className="text-center p-4 bg-white border border-amber-100 rounded-2xl shadow-sm hover:border-amber-950 transition-colors">
                        <p className="font-black text-amber-950 mb-1 uppercase tracking-tighter">Bør</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-tighter font-bold">Faglig anbefaling</p>
                    </div>
                </div>
            </GuideSection>

            <GuideSection icon={BookOpen} title="7. Find intentionen i forarbejderne" color="text-cyan-700 bg-cyan-50">
                <p>Hvis du vil vide, <strong>hvorfor</strong> Folketinget har vedtaget en regel, skal du kigge i <strong>forarbejderne</strong> (bemærkningerne til lovforslaget). Du finder dem under fanen 'Politisk Puls' eller på FT.dk.</p>
                <div className="bg-cyan-50 text-cyan-800 text-[10px] p-4 rounded-xl border border-cyan-100 italic">
                    Vejledninger forklarer hvordan man bruger loven, men forarbejderne forklarer tanken bag den.
                </div>
            </GuideSection>

        </div>

        <div className="p-8 bg-white border-t border-amber-100 flex justify-end">
            <Button onClick={onClose} size="lg" className="rounded-2xl px-10 h-14 shadow-xl shadow-amber-950/10 active:scale-95 transition-all font-bold">
                Jeg er klar til at læse loven
            </Button>
        </div>
      </div>
    </div>
  );
};

export default ReadingGuideModal;