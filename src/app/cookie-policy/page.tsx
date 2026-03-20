import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Cookiepolitik',
  description: 'Læs vores cookiepolitik for at forstå, hvordan Cohéro (Cohero) bruger cookies til at forbedre din oplevelse på platformen.',
};

export default function CookiePolicyPage() {
  return (
    <div className="bg-[#FDFCF8] min-h-screen">
      <header className="bg-white border-b border-amber-100/50">
        <div className="max-w-7xl mx-auto py-8 px-4 md:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-amber-950 serif mb-3">
            Cookiepolitik
          </h1>
          <p className="text-base text-slate-500 max-w-2xl">
            Senest opdateret: 17. juli 2024
          </p>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 md:p-8">
        <div className="prose prose-sm md:prose-base text-slate-700 leading-relaxed space-y-6">
          <h2>1. Introduktion</h2>
          <p>
            Denne cookiepolitik forklarer, hvordan Cohéro I/S ("vi", "os" eller "vores") bruger cookies og lignende teknologier på vores hjemmeside. Ved at bruge vores tjenester accepterer du brugen af cookies som beskrevet i denne politik.
          </p>

          <h2>2. Hvad er cookies?</h2>
          <p>
            Cookies er små tekstfiler, der gemmes på din computer eller mobile enhed, når du besøger en hjemmeside. De bruges til at huske dine præferencer, forbedre din brugeroplevelse og indsamle statistik.
          </p>

          <h2>3. Hvordan vi bruger cookies</h2>
          <p>Vi bruger cookies til følgende formål:</p>
          <ul>
            <li>
              <strong>Strengt nødvendige cookies:</strong> Disse er essentielle for, at du kan navigere på hjemmesiden og bruge dens funktioner, såsom at logge ind. Uden disse cookies kan de tjenester, du har anmodet om, ikke leveres.
            </li>
            <li>
              <strong>Funktionelle cookies:</strong> Disse cookies giver hjemmesiden mulighed for at huske valg, du træffer (såsom dit brugernavn eller sprog), og levere forbedrede, mere personlige funktioner.
            </li>
            <li>
              <strong>Præstations- og analysecookies:</strong> Disse cookies indsamler information om, hvordan besøgende bruger vores hjemmeside. Vi bruger disse anonymiserede data til at forstå, hvilke funktioner der er mest populære, og hvordan vi kan forbedre platformen. Til dette formål anvender vi <strong>Google Analytics</strong>.
            </li>
          </ul>

          <h2>4. Administration af cookies</h2>
          <p>
            Du kan til enhver tid ændre eller trække dit samtykke tilbage. De fleste browsere giver dig mulighed for at administrere dine cookie-indstillinger. Du kan indstille din browser til at afvise cookies eller slette visse cookies. Bemærk, at hvis du vælger at blokere cookies, kan det påvirke din oplevelse på vores hjemmeside.
          </p>

          <h2>5. Kontakt</h2>
          <p>
            Hvis du har spørgsmål om vores brug af cookies, er du velkommen til at kontakte os på <a href="mailto:kontakt@cohero.dk">kontakt@cohero.dk</a>.
          </p>
        </div>
      </main>
    </div>
  );
}
