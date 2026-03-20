import type { Metadata } from 'next';
import React from 'react';
import { Scale, BrainCircuit, Shield, UserCheck, CheckSquare, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Etik og Faglighed',
  description: 'Forstå de etiske principper bag Cohéro. Lær hvordan du bruger AI som et redskab til at styrke din egen faglige dømmekraft og dit ansvar som kommende socialrådgiver.',
};

export default function EthicsPage() {
  return (
    <div className="bg-[#FDFCF8] min-h-screen">
      <header className="bg-white border-b border-amber-100/50">
        <div className="max-w-7xl mx-auto py-8 px-4 md:px-8">
           <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <Scale className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-amber-950 serif mb-3">
            Etik & Faglighed: Brug AI med Omtanke
          </h1>
          <p className="text-base text-slate-500 max-w-3xl">
            Som kommende socialrådgiver er din dømmekraft dit vigtigste redskab. Cohéro er designet til at skærpe den – ikke erstatte den. Her er principperne for fagligt forsvarlig brug af vores platform.
          </p>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 md:p-8">
        <div className="prose prose-sm md:prose-base text-slate-700 leading-relaxed space-y-12">

          <div>
            <h2 className="flex items-center gap-3">
              <BrainCircuit className="w-6 h-6 text-amber-600" />
              AI er et Værktøj, ikke en Færdig Løsning
            </h2>
            <p>
              Betragt Cohéros AI-værktøjer som en avanceret lommeregner for socialfagligt arbejde. Den kan udføre komplekse analyser, finde mønstre i lovtekster og generere velformulerede forslag. Men den kan ikke udøve et <span className="font-bold">fagligt skøn</span>.
            </p>
            <p>
              Et fagligt skøn kræver empati, situationsfornemmelse, forståelse for nonverbal kommunikation og levet erfaring – alt det, der adskiller en professionel socialrådgiver fra en algoritme. AI'ens output er derfor altid et <span className="italic">forslag</span> eller en <span className="italic">hypotese</span>, aldrig et facit. Det er dit ansvar at vurdere, om forslaget er relevant, etisk forsvarligt og anvendeligt i den specifikke kontekst.
            </p>
            <blockquote>
              Brug AI-feedback til at se nye vinkler, opdage blinde pletter i din argumentation og få inspiration – men lad aldrig AI'en tænke for dig.
            </blockquote>
          </div>

          <div>
             <h2 className="flex items-center gap-3">
              <UserCheck className="w-6 h-6 text-amber-600" />
              Dit Ansvar som Fagperson
            </h2>
            <p>
              Ethvert ord, du afleverer i en opgave, og enhver beslutning, du træffer i en case, er dit ansvar. Når du anvender output fra Cohéro, er det din opgave at validere, redigere og fagligt begrunde det. Du er den kommende professionelle; AI'en er din fagligt oplyste assistent. At bruge platformen korrekt er en øvelse i kritisk kildevurdering og faglig autonomi.
            </p>
            <p>
              Stil altid dig selv disse spørgsmål, når du arbejder med AI'ens output:
            </p>
            <ul>
              <li>Hvordan ville jeg forsvare denne analyse eller handleplan over for en borger, en kollega, eller i Ankestyrelsen?</li>
              <li>Hvilke menneskelige, sociale eller kontekstuelle nuancer har AI'en overset?</li>
              <li>Er dette det mest etisk forsvarlige skridt, eller blot det mest teoretisk "korrekte"?</li>
              <li>Hvordan sikrer jeg, at jeg ikke blot kopierer en løsning, men forstår og kan begrunde den fra bunden med egne ord?</li>
            </ul>
          </div>
          
           <div>
             <h2 className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-amber-600" />
                Dataetik: Beskyt Borgeren – Altid
            </h2>
            <p>
              Dette er det vigtigste etiske princip på platformen: <strong>Du må ALDRIG indtaste personfølsomme oplysninger om virkelige, identificerbare personer.</strong> Dette gælder navne, adresser, CPR-numre, specifikke sagsdetaljer eller enhver anden information, der kan føre tilbage til en virkelig borger.
            </p>
             <p>
               Alle cases, journalnotater og eksempler, du indtaster, skal være 100% anonymiserede og fiktionaliserede. At bruge AI til at behandle rigtige borgerdata er ikke kun et brud på vores betingelser, men også et alvorligt brud på din lovpligtige <span className="font-bold">tavshedspligt</span> (Straffelovens § 152) og databeskyttelsesforordningen (GDPR). Det er en fundamental test af din professionelle etik, allerede inden du træder ind på arbejdsmarkedet. Cohéro er en træningsbane – ikke en arbejdsstation til rigtige sager.
           </p>
           </div>

          <div>
             <h2 className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600" />
                AI'en løser ikke etiske dilemmaer
            </h2>
            <p>
              Etisk refleksion er kernen i socialt arbejde. Cohéro kan give dig information om lovgivning og teori, der kan <strong>oplyse</strong> dit etiske dilemma, men platformen kan og må <strong>aldrig</strong> bruges til at løse det.
            </p>
            <p>
                Et etisk dilemma indebærer en afvejning af værdier, hensyn og mulige konsekvenser for virkelige mennesker. Dette kræver menneskelig empati, situationsfornemmelse og faglig dømmekraft. En AI kan analysere tekst, men den kan ikke føle, erfare eller tage et personligt, moralsk ansvar.
            </p>
            <blockquote>
              Brug platformen til at få overblik over de faglige og juridiske rammer, der er på spil. Brug derefter dette overblik som et input til din egen etiske refleksion, din sparring med medstuderende og din dialog med dine undervisere eller praktikvejleder. Den endelige beslutning – og ansvaret – er altid dit.
            </blockquote>
          </div>

            <div>
             <h2 className="flex items-center gap-3">
                <CheckSquare className="w-6 h-6 text-amber-600" />
                Formålet med Cohéro: At Bygge Refleksion
            </h2>
            <p>
               Formålet med Cohéro er ikke at give dig hurtige svar, men at udvikle din evne til at <span className="italic">finde</span> og <span className="italic">skabe</span> gode svar. Den sande læring sker i det refleksive mellemrum – i din kritiske bearbejdning af det materiale, AI'en præsenterer.
            </p>
            <p>
               Se AI'en som en, der leverer råmaterialerne (lovtekst, teoretiske perspektiver, strukturelle forslag). Du er håndværkeren, der udvælger, bearbejder og sammensætter materialerne til et færdigt, professionelt og fagligt velfunderet produkt. Det er i dén proces, din faglige dømmekraft udvikles.
           </p>
           </div>
           
           <div className="border-t border-amber-100 pt-8 text-center">
            <p className="font-bold">
                Brug Cohéro til at bygge selvtillid, ikke til at finde genveje. Den sande læring sker i din refleksion over det, AI'en præsenterer for dig.
            </p>
           </div>
        </div>
      </main>
    </div>
  );
}
