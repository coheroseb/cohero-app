import type { Metadata } from 'next';
import React from 'react';
import { BookCopy, BrainCircuit, Users, Target } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Vores Koncept: Kollegaskab over Tutoring',
  description: 'Lær om filosofien bag Cohéro (Cohero): Vi bygger bro mellem teori og praksis med et fokus på kollegaskab frem for tutoring.',
};

export default function ConceptPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Hvorfor Cohéro? Kollegaskab frem for Tutoring",
    "description": "Cohéro bygger bro mellem teori og praksis. Vi er ikke en tutor, men en digital kollega, der giver dig et trygt rum til at træne, reflektere og vokse.",
    "url": "https://cohero.dk/hvorfor"
  };

  return (
    <div className="bg-[#FDFCF8] min-h-screen">
       <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="bg-white border-b border-amber-100/50">
        <div className="max-w-7xl mx-auto py-8 px-4 md:px-8">
           <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
            <BrainCircuit className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-amber-950 serif mb-3">
            Hvorfor Cohéro? Kollegaskab frem for Tutoring
          </h1>
          <p className="text-base text-slate-500 max-w-2xl">
            Cohéro er ikke en tutor, der giver dig facit. Vi er en digital kollega, der giver dig et trygt rum til at træne, reflektere og opbygge faglig selvtillid.
          </p>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 md:p-8">
        <div className="prose prose-sm md:prose-base text-slate-700 leading-relaxed space-y-12">

          <div>
            <h2 className="flex items-center gap-3">
              <Users className="w-6 h-6 text-amber-600" />
              Hvilket Problem Løser Vi?
            </h2>
            <p>
              Mange socialrådgiverstuderende oplever en kløft mellem den tunge teori fra studiet og den komplekse virkelighed i praksis. Man mangler ofte et trygt sted at afprøve sin viden, begå fejl og få konstruktiv sparring, før man står over for sårbare borgere. Denne usikkerhed kan være en barriere for læring og faglig udvikling.
            </p>
          </div>

          <div>
             <h2 className="flex items-center gap-3">
              <BookCopy className="w-6 h-6 text-amber-600" />
              Hvordan er Cohéro Anderledes?
            </h2>
            <p>
              Cohéro forkaster den traditionelle tutor-model, hvor en ekspert giver de "rigtige" svar. I stedet bygger vores platform på princippet om <strong>kollegaskab</strong>. En god kollega respekterer din faglighed, stiller nysgerrige spørgsmål og hjælper dig med at finde frem til din egen velbegrundede konklusion.
            </p>
             <p>
              Vores AI-værktøjer er designet til at fungere som denne digitale kollega. De giver dig ikke et facit, men simulerer praksissituationer og giver struktureret feedback, så du selv kan reflektere og træne din faglige dømmekraft.
            </p>
          </div>
          
           <div>
             <h2 className="flex items-center gap-3">
                <Target className="w-6 h-6 text-amber-600" />
                Hvad er Formålet med Cohéro?
            </h2>
            <p>
              Vores formål er at styrke fremtidens socialrådgivere. Vi vil give dig de værktøjer, den selvtillid og det faglige fællesskab, der skal til for, at du kan blive den bedste socialrådgiver, du kan være. Gennem praksisnær træning og et stærkt fagligt fundament vil vi sikre, at du ikke kun består din eksamen, men er klar til arbejdslivet fra dag ét.
           </p>
           </div>
           
           <div className="border-t border-amber-100 pt-8 text-center">
            <p className="font-bold">
                Cohéro er din rygdækning – gennem hele studiet.
            </p>
           </div>
        </div>
      </main>
    </div>
  );
}
