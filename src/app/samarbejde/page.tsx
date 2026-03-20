import type { Metadata } from 'next';
import React from 'react';
import { Building, Users, Mail, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Samarbejde & Partnerskaber',
  description: 'Styrk jeres studerende eller praktikanter med Cohéro. Vi tilbyder skræddersyede løsninger til uddannelsesinstitutioner, kommuner og praktiksteder.',
};

export default function SamarbejdePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Samarbejde & Partnerskaber for Uddannelsesinstitutioner & Kommuner",
    "description": "Cohéro tilbyder skræddersyede løsninger til professionshøjskoler og kommuner for at styrke socialrådgiverstuderendes og praktikanters faglige udvikling med praksisnære AI-værktøjer.",
    "url": "https://cohero.dk/samarbejde"
  };

  return (
    <div className="bg-[#FDFCF8] min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="bg-white border-b border-amber-100/50">
        <div className="max-w-7xl mx-auto py-8 px-4 md:px-8">
           <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <Building className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-amber-950 serif mb-3">
            Samarbejde & Partnerskaber
          </h1>
          <p className="text-base text-slate-500 max-w-3xl">
            For uddannelsesinstitutioner, kommuner og praktiksteder, der vil investere i fremtidens socialrådgivere.
          </p>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 md:p-8">
        <div className="prose prose-sm md:prose-base text-slate-700 leading-relaxed space-y-12">

          <div>
            <h2 className="flex items-center gap-3">
              <Users className="w-6 h-6 text-amber-600" />
              For Uddannelsesinstitutioner og Kommuner
            </h2>
            <p>
              Socialrådgiveruddannelsen kræver mere end blot teoretisk viden. Den kræver praksisnær træning, etisk refleksion og faglig selvtillid. Cohéro tilbyder en digital træningsplatform, hvor jeres studerende eller praktikanter trygt kan udvikle de kompetencer, der er afgørende for deres fremtidige virke.
            </p>
            <p>
              Vores platform er et ideelt supplement til den undervisning og vejledning, I allerede tilbyder. Den giver de studerende mulighed for at:
            </p>
            <ul>
              <li><strong>Træne i realistiske cases:</strong> Udforske komplekse scenarier baseret på dansk lovgivning.</li>
              <li><strong>Forbedre deres dokumentationspraksis:</strong> Få AI-drevet feedback på journalnotater.</li>
              <li><strong>Opnå dybere lovforståelse:</strong> Få pædagogiske forklaringer på centrale paragraffer i sociallovgivningen.</li>
              <li><strong>Strukturere deres eksamensopgaver:</strong> Bruge Eksamens-Arkitekten til at bygge et solidt fundament for deres skriftlige arbejde.</li>
            </ul>
          </div>

          <div>
             <h2 className="flex items-center gap-3">
                <Mail className="w-6 h-6 text-amber-600" />
                Skræddersyede Løsninger
            </h2>
            <p>
              Vi tilbyder fleksible abonnementsløsninger til grupper, uanset om I er en uddannelsesinstitution, en kommune med praktikanter eller et privat praktiksted. Ved at indgå en partneraftale kan I give jeres studerende eller medarbejdere fuld adgang til <strong>Kollega+</strong> eller en af vores andre pakker. Vi håndterer alt det praktiske med oprettelse og adgang via jeres organisations e-maildomæne (f.eks. @via.dk eller @kp.dk).
           </p>
           <p>
             Er I interesserede i at høre mere om, hvordan Cohéro kan understøtte jeres uddannelses- eller praktikforløb?
           </p>
            <div className="not-prose mt-10 text-center">
                <a href="mailto:kontakt@cohero.dk" className="group inline-flex items-center justify-center px-8 py-4 bg-amber-950 text-white rounded-2xl text-base font-bold transition-all hover:scale-[1.02] shadow-2xl shadow-amber-950/20">
                    Kontakt os for et tilbud
                    <ArrowUpRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
            </div>
           </div>
        </div>
      </main>
    </div>
  );
}
