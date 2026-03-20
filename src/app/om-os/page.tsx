'use client';
import React from 'react';
import { Sparkles, Users, Target } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const TeamSection = () => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 not-prose">
            <div className="text-center">
                <Image src="/team/seb.png" alt="Sebastian Viste Hansen" width={120} height={120} className="rounded-full mx-auto mb-4 border-4 border-white shadow-lg" />
                <h4 className="font-bold text-lg text-amber-950 serif">Sebastian Viste Hansen</h4>
                <p className="text-sm text-amber-800 font-semibold">Socialrådgiver & medstifter</p>
                <p className="text-xs text-slate-500 mt-2">Erfaring fra børne- og ungeområdet. Brænder for at styrke den faglige selvtillid hos studerende.</p>
            </div>
            <div className="text-center">
                <Image src="/team/nan.png" alt="Nanna Hougaard Ungermand" width={120} height={120} className="rounded-full mx-auto mb-4 border-4 border-white shadow-lg" />
                <h4 className="font-bold text-lg text-amber-950 serif">Nanna Hougaard Ungermand</h4>
                <p className="text-sm text-amber-800 font-semibold">Socialrådgiver & medstifter</p>
                <p className="text-xs text-slate-500 mt-2">Erfaring fra borgerrådgivningen. Fokuserer på retssikkerhed og den gode, etiske praksis.</p>
            </div>
            <div className="text-center">
                <Image src="/team/jul.png" alt="Julie Lee Hansen" width={120} height={120} className="rounded-full mx-auto mb-4 border-4 border-white shadow-lg" />
                <h4 className="font-bold text-lg text-amber-950 serif">Julie Lee Hansen</h4>
                <p className="text-sm text-amber-800 font-semibold">Uddannelseskonsulent & medstifter</p>
                <p className="text-xs text-slate-500 mt-2">Uddannelsesvidenskabelig baggrund. Sikrer, at alt vores indhold er pædagogisk funderet og læringsoptimeret.</p>
            </div>
        </div>
    );
};

export default function AboutUsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "Om Cohéro",
    "description": "Cohéro er grundlagt af socialrådgivere og pædagogiske udviklere med en mission om at styrke fagligheden hos socialrådgiverstuderende i Danmark.",
    "url": "https://cohero.dk/om-os"
  };

  return (
    <div className="bg-[#FDFCF8] min-h-screen">
       <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="bg-white border-b border-amber-100/50">
        <div className="max-w-7xl mx-auto py-8 px-4 md:px-8">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-amber-950 serif mb-3">
            Hvem er Cohéro?
          </h1>
          <p className="text-base text-slate-500 max-w-2xl">
            Vi er din digitale kollega – skabt af socialrådgivere, for socialrådgiverstuderende.
          </p>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="prose prose-sm md:prose-base text-slate-700 leading-relaxed space-y-8">
          <p className="lead text-xl">
            Cohéro er grundlagt ud fra en simpel, men kraftfuld idé: At ingen socialrådgiverstuderende skal føle sig alene på rejsen fra studiebænk til praksis. Vi er et team af socialrådgivere og pædagogiske udviklere, der selv har oplevet, hvordan overgangen kan være fyldt med tvivl, usikkerhed og et ønske om en erfaren kollega at læne sig op ad.
          </p>
          
          <div>
            <h2 className="flex items-center gap-3">
              <Target className="w-6 h-6 text-amber-600" />
              Vores Mission
            </h2>
            <p>
              Cohéros mission er at bygge bro mellem teori og praksis for socialrådgiverstuderende. Vi giver dig AI-drevne værktøjer, praksisnær træning og et fagligt fællesskab, der styrker din selvtillid og faglige dømmekraft, så du er klar til at gøre en forskel fra dag ét i dit arbejdsliv. Vi tror på, at kollegial sparring er fundamentet for et stærkt arbejdsliv.
            </p>
          </div>

          <div>
             <h2 className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-amber-600" />
              Hvem er vi? Menneskelig Erfaring i en Digital Verden
            </h2>
            <p>
              Selvom vores platform er AI-drevet, er den gennemsyret af ægte, menneskelig erfaring. Vores team består af socialrådgivere og akademikere, som har stået med de komplekse sager, de svære samtaler og de tunge lovtekster. Vores erfaringer er fundamentet for de AI-værktøjer, du møder her.
            </p>
            <p>
              Vi sørger for, at den faglige virkelighed altid er i centrum:
            </p>
            <ul>
              <li><strong>Refleksioner fra Praksis:</strong> I vores Case-træner vil du opleve, at udvalgte cases indeholder refleksioner fra erfarne, praktiserende socialrådgivere. Det giver dig et unikt indblik i de etiske og faglige dilemmaer, der ikke kan læses i en bog.</li>
              <li><strong>Direkte Sparring:</strong> Med et Kollega++ medlemskab får du adgang til personlig 1:1 sparring med en rigtig socialrådgiver fra vores team. Her kan du drøfte dine udfordringer og få konkret vejledning.</li>
            </ul>
            <TeamSection />
          </div>
          
           <div>
            <p>
              Vi er dedikerede til at skabe et trygt og udviklende rum, hvor du kan træne, reflektere og vokse – altid med en digital kollega ved din side.
            </p>
           </div>
        </div>
      </main>
    </div>
  );
}
