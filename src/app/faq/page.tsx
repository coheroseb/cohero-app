import type { Metadata } from 'next';
import React from 'react';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Ofte Stillede Spørgsmål (FAQ)',
  description: 'Find svar på de mest almindelige spørgsmål om Cohéro (Cohero), herunder vores abonnementer, databeskyttelse og funktioner.',
};

const FaqItem = ({ question, children }: { question: string, children: React.ReactNode }) => (
  <details className="group border-b border-amber-100/80 pb-6">
    <summary className="flex justify-between items-center cursor-pointer list-none py-4">
      <h3 className="text-lg font-bold text-amber-950 serif">{question}</h3>
      <ChevronDown className="w-5 h-5 text-amber-600 group-open:rotate-180 transition-transform" />
    </summary>
    <div className="prose prose-sm text-slate-600 max-w-none pt-2">
      {children}
    </div>
  </details>
);

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Hvad er Cohéro?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Cohéro er en AI-drevet digital læringsplatform for socialrådgiverstuderende i Danmark. Vores mission er at bygge bro mellem teori og praksis ved at tilbyde et trygt rum, hvor studerende kan træne faglige færdigheder. Vi fokuserer på kollegial sparring frem for traditionel tutoring."
        }
      },
      {
        "@type": "Question",
        "name": "Er 'Kollega'-abonnementet virkelig gratis?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Ja, 'Kollega'-planen er 100% gratis og uforpligtende. Den giver dig begrænset, men regelmæssig adgang til vores kerneværktøjer, så du kan opleve værdien. Vi mener, at alle studerende skal have adgang til grundlæggende faglig støtte."
        }
      },
      {
        "@type": "Question",
        "name": "Hvordan fungerer 'Kollega+' og 'Semesterpakken'?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "'Kollega+' er vores premium abonnement, som giver ubegrænset adgang til de fleste værktøjer (dog med en daglig grænse på Case- og Journal-træneren), samt fuld adgang til alt premium indhold. Det er et månedligt abonnement, der fornyes automatisk. 'Semesterpakken' giver dig de samme fordele som Kollega+, men betales forud for 5 måneder ad gangen til en reduceret pris og fornyes automatisk."
        }
      },
      {
        "@type": "Question",
        "name": "Hvordan beskytter I mine data?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Vi tager din datasikkerhed meget alvorligt. Al kommunikation er krypteret, og vi bruger anerkendte partnere som Google Firebase til hosting og Stripe til betaling. Dine noter og opgaver er private og tilgås kun af vores AI for at give dig feedback. Det er dog dit eget ansvar aldrig at indtaste personfølsomme oplysninger om virkelige personer. Læs mere i vores Privatlivspolitik."
        }
      },
      {
        "@type": "Question",
        "name": "Kan jeg opsige mit abonnement når som helst?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Ja, du kan til enhver tid opsige alle vores abonnementer. Opsigelsen træder i kraft ved udgangen af den indeværende betalingsperiode (en måned for Kollega+ og 5 måneder for Semesterpakken). Du har adgang i hele den periode, du har betalt for."
        }
      },
      {
        "@type": "Question",
        "name": "Hvem står bag Cohéro?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Cohéro er grundlagt og drevet af socialrådgivere og pædagogiske udviklere med erfaring fra praksis. Vi er ikke blot en teknologivirksomhed; vi er dine kollegaer, der forstår de faglige udfordringer, du står overfor."
        }
      }
    ]
  };

  return (
    <div className="bg-[#FDFCF8] min-h-screen">
       <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="bg-white border-b border-amber-100/50">
        <div className="max-w-7xl mx-auto py-8 px-4 md:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-amber-950 serif mb-3">
            Ofte Stillede Spørgsmål
          </h1>
          <p className="text-base text-slate-500 max-w-2xl">
            Find svar på de mest almindelige spørgsmål om Cohéro.
          </p>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 md:p-8">
        <div className="space-y-6">
          <FaqItem question="Hvad er Cohéro?">
            <p>Cohéro er en AI-drevet digital læringsplatform for socialrådgiverstuderende i Danmark. Vores mission er at bygge bro mellem teori og praksis ved at tilbyde et trygt rum, hvor studerende kan træne faglige færdigheder. Vi fokuserer på kollegial sparring frem for traditionel tutoring.</p>
          </FaqItem>

          <FaqItem question="Er 'Kollega'-abonnementet virkelig gratis?">
            <p>Ja, 'Kollega'-planen er 100% gratis og uforpligtende. Den giver dig begrænset, men regelmæssig adgang til vores kerneværktøjer, så du kan opleve værdien. Se en detaljeret oversigt over begrænsningerne på vores <Link href="/#priser">prisside</Link>.</p>
          </FaqItem>

          <FaqItem question="Hvordan fungerer 'Kollega+' og 'Semesterpakken'?">
            <p>'Kollega+' er vores premium abonnement, som giver ubegrænset adgang til de fleste værktøjer (dog med en daglig grænse på Case- og Journal-træneren), samt fuld adgang til alt premium indhold. Det er et månedligt abonnement, der fornyes automatisk.</p>
            <p>'Semesterpakken' giver dig de samme fordele som Kollega+, men betales forud for 5 måneder ad gangen til en reduceret pris og fornyes automatisk.</p>
          </FaqItem>
          
          <FaqItem question="Hvordan beskytter I mine data?">
            <p>Vi tager din datasikkerhed meget alvorligt. Al kommunikation er krypteret, og vi bruger anerkendte partnere som Google Firebase til hosting og Stripe til betaling. Dine noter og opgaver er private og tilgås kun af vores AI for at give dig feedback. Det er dog dit eget ansvar aldrig at indtaste personfølsomme oplysninger om virkelige personer. Læs mere i vores <Link href="/privacy-policy">Privatlivspolitik</Link>.</p>
          </FaqItem>

          <FaqItem question="Kan jeg opsige mit abonnement når som helst?">
            <p>Ja, du kan til enhver tid opsige alle vores abonnementer. Opsigelsen træder i kraft ved udgangen af den indeværende betalingsperiode (en måned for Kollega+ og 5 måneder for Semesterpakken). Du har adgang i hele den periode, du har betalt for.</p>
          </FaqItem>
          
           <FaqItem question="Hvem står bag Cohéro?">
            <p>Cohéro er grundlagt og drevet af socialrådgivere og pædagogiske udviklere med erfaring fra praksis. Vi er ikke blot en teknologivirksomhed; vi er dine kollegaer, der forstår de faglige udfordringer, du står overfor. Læs mere på vores <Link href="/om-os">'Om os'-side</Link>.</p>
          </FaqItem>
        </div>
      </main>
    </div>
  );
}
