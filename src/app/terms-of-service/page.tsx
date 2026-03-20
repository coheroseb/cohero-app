
import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Handelsbetingelser',
  description: 'Læs handelsbetingelserne for brug af Cohéro (Cohero)-platformen, herunder information om abonnementer, betaling, ansvar og databehandling.',
};

export default function TermsOfServicePage() {
  return (
    <div className="bg-[#FDFCF8] min-h-screen">
      <header className="bg-white border-b border-amber-100/50">
        <div className="max-w-7xl mx-auto py-8 px-4 md:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-amber-950 serif mb-3">
            Handelsbetingelser
          </h1>
          <p className="text-base text-slate-500 max-w-2xl">
            Senest opdateret: 17. juli 2024
          </p>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 md:p-8">
        <div className="prose prose-sm md:prose-base text-slate-700 leading-relaxed space-y-6">
          <h2>1. Generelt</h2>
          <p>
            Disse handelsbetingelser gælder for køb af tjenester på cohero.dk, som udbydes af Cohéro I/S (CVR: 46181425). Ved at oprette en konto og købe et abonnement accepterer du disse betingelser.
          </p>

          <h2>2. Tjenesten og brugsret</h2>
          <p>
            Cohéro er en digital lærings- og træningsplatform. Tjenesten giver adgang til en række digitale værktøjer som "Online Kollega", "Case-træner", "Journal-træner" og "Second Opinion", samt en vidensbank med studieteknikker og andet materiale. Adgangens omfang afhænger af dit valgte abonnement ("Kollega", "Kollega+", "Semesterpakken", "Kollega++").
          </p>
          <p>
            Din konto er personlig og må ikke deles med andre. Al brug af platformen skal ske i overensstemmelse med dansk lovgivning.
          </p>
          <p>
            Platformen indeholder sociale funktioner som et Leaderboard og et aktivitetsfeed, der har til formål at fremme et fagligt fællesskab. Ved at bruge tjenesten accepterer du, at dit brugernavn og din aktivitet (f.eks. optjente point) kan blive vist for andre brugere. Dit fulde navn og din email deles aldrig. Du kan til enhver tid ændre dit brugernavn under dine <Link href="/settings">Indstillinger</Link>.
          </p>

          <h2>3. Priser og betaling</h2>
          <p>
            Alle priser er angivet i danske kroner (DKK) og er inklusiv moms. Betaling for "Kollega+" og "Kollega++" er løbende månedlige abonnementer, der fornyes automatisk. "Semesterpakken" er et løbende abonnement, der forudbetales og fornyes automatisk for 5 måneder ad gangen. Betaling behandles sikkert via vores partner, Stripe, og vi gemmer ikke dine kortoplysninger.
          </p>
          
          <h2>4. Opsigelse og fortrydelsesret</h2>
          <p>
            Du kan til enhver tid opsige dit abonnement via din <Link href="/settings">profilside</Link>. Opsigelsen træder i kraft ved udgangen af den indeværende betalingsperiode (f.eks. ved udgangen af en måned for "Kollega+" eller ved udgangen af en 5-måneders periode for "Semesterpakken"). Du har fortsat adgang til tjenesten i den periode, du har betalt for. Da vores tjenester er digitale og leveres øjeblikkeligt, frafalder den 14-dages fortrydelsesret, så snart du tager tjenesten i brug (f.eks. ved at anvende et af vores digitale værktøjer).
          </p>
          
          <h2>5. Dit ansvar og forbud mod brug af personfølsomme data</h2>
           <p>
            Cohéro er et <strong>simulerings- og træningsværktøj</strong>. Det er strengt forbudt at indtaste, uploade eller på anden måde behandle personfølsomme oplysninger om virkelige, identificerbare personer (f.eks. borgere fra praktik, medstuderende eller andre). Dette gælder alle dele af platformen, herunder "Journal-træner", "Second Opinion" og "Refleksionslog".
          </p>
           <p>
            Al data, du indtaster, skal være fuldt anonymiseret og fiktionaliseret. Overtrædelse af dette vil medføre øjeblikkelig spærring af din konto. Du er eneansvarlig for at overholde databeskyttelseslovgivningen (GDPR).
          </p>

          <h2>6. Ansvarsfraskrivelse og Digitale Værktøjer</h2>
          <p>
            Råd, feedback og analyser fra vores digitale værktøjer er maskingenererede og skal udelukkende betragtes som <strong>vejledende og til inspiration i en uddannelseskontekst</strong>. De udgør ikke faglig supervision, juridisk rådgivning eller en erstatning for din egen faglige dømmekraft. Selvom Cohéros team arbejder for, at platformen leverer den bedst mulige faglige kvalitet, kan Cohéro I/S aldrig drages til ansvar for forkerte, vildledende eller på anden måde skadelige svar genereret af værktøjerne, eller for beslutninger, du træffer baseret på information fra platformen. Det er til enhver tid dit ansvar som bruger at validere informationen og anvende din faglige dømmekraft. Dette gælder i særlig grad etiske dilemmaer. Værktøjerne kan belyse faglige og juridiske aspekter, men kan og må aldrig anvendes til at træffe en etisk beslutning på en borgers vegne. Ansvaret for det faglige og etiske skøn påhviler til enhver tid brugeren.
          </p>

          <h2>7. Ændringer i betingelserne</h2>
          <p>
            Vi forbeholder os retten til at ændre disse betingelser. Væsentlige ændringer vil blive varslet via email eller på platformen.
          </p>
          
          <h2>8. Kontakt</h2>
          <p>
            Spørgsmål vedrørende disse betingelser kan rettes til <a href="mailto:kontakt@cohero.dk">kontakt@cohero.dk</a>.
          </p>
        </div>
      </main>
    </div>
  );
}
