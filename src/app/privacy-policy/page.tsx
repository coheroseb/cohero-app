import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privatlivspolitik',
  description: 'Gennemgå vores privatlivspolitik for at forstå, hvordan Cohéro (Cohero) indsamler, bruger og beskytter dine personoplysninger.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-[#FDFCF8] min-h-screen">
      <header className="bg-white border-b border-amber-100/50">
        <div className="max-w-7xl mx-auto py-8 px-4 md:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-amber-950 serif mb-3">
            Privatlivspolitik
          </h1>
          <p className="text-base text-slate-500 max-w-2xl">
            Senest opdateret: 17. juli 2024
          </p>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 md:p-8">
        <div className="prose prose-sm md:prose-base text-slate-700 leading-relaxed space-y-6">
          <h2>1. Dataansvarlig</h2>
          <p>
            Cohéro I/S er dataansvarlig for behandlingen af de personoplysninger, vi modtager fra dig. Vores kontaktoplysninger er:
            <br />
            Cohéro I/S
            <br />
            CVR: 46181425
            <br />
            Email: <a href="mailto:kontakt@cohero.dk">kontakt@cohero.dk</a>
          </p>

          <h2>2. Indsamling af oplysninger</h2>
          <p>
            Vi indsamler oplysninger, du giver os direkte, når du opretter en konto, opdaterer din profil, bruger vores tjenester eller kommunikerer med os. Dette inkluderer:
          </p>
          <ul>
            <li>Kontaktoplysninger (fulde navn, email)</li>
            <li>Profiloplysninger (brugernavn, semester, uddannelsesinstitution)</li>
            <li>Indhold, du genererer (noter, case-besvarelser osv., som altid skal være anonymiserede)</li>
            <li>Betalingsoplysninger (behandles sikkert af vores tredjepartsudbyder, Stripe)</li>
            <li>Aktivitetsdata (f.eks. optjente point, løste opgaver) til brug for sociale funktioner.</li>
            <li>Tekniske data (IP-adresse, browsertype)</li>
          </ul>

          <h2>3. Formål med databehandling</h2>
          <p>Vi bruger dine oplysninger til at:</p>
          <ul>
            <li>Levere, vedligeholde og forbedre vores tjenester.</li>
            <li>Administrere din konto og dit abonnement.</li>
            <li>Personliggøre din oplevelse.</li>
            <li>Fremme et fagligt fællesskab via funktioner som Leaderboard og et aktivitetsfeed, hvor dit brugernavn og aktivitet kan være synligt.</li>
            <li>Kommunikere med dig om din konto og vores tjenester.</li>
            <li>Overholde juridiske forpligtelser.</li>
          </ul>
          
          <h2>4. Deling af oplysninger</h2>
          <p>Vi deler ikke dine personlige oplysninger med tredjeparter, undtagen i følgende tilfælde:</p>
          <ul>
            <li><strong>Tjenesteudbydere:</strong> Vi bruger betroede tjenesteudbydere som Firebase (Google) til hosting og database, og Stripe til betalingsbehandling.</li>
            <li><strong>Andre brugere på platformen:</strong> For at skabe et fællesskab er dit <strong>brugernavn</strong> og visse aktiviteter (f.eks. optjente point) synlige for andre brugere på funktioner som Leaderboardet og aktivitetsfeedet. Dit fulde navn og din email deles aldrig.</li>
            <li><strong>Juridiske krav:</strong> Hvis det kræves ved lov eller for at beskytte vores rettigheder.</li>
          </ul>

          <h2>5. Dine rettigheder og kontrol</h2>
          <p>
            Du har ret til at anmode om adgang til, rettelse af eller sletning af dine personoplysninger. Du kan til enhver tid ændre dit brugernavn, som vises offentligt, via dine <Link href="/settings">Indstillinger</Link>. Du kan også gøre indsigelse mod behandlingen af dine data ved at kontakte os på ovenstående email.
          </p>

          <h2>6. Datalagring</h2>
          <p>
            Vi opbevarer dine oplysninger, så længe du har en aktiv konto, eller så længe det er nødvendigt for at opfylde de formål, der er beskrevet i denne politik.
          </p>

           <h2>7. Ændringer i politikken</h2>
          <p>
            Vi kan opdatere denne privatlivspolitik fra tid til anden. Væsentlige ændringer vil blive kommunikeret til dig. Den seneste version vil altid være tilgængelig på vores hjemmeside.
          </p>
        </div>
      </main>
    </div>
  );
}
