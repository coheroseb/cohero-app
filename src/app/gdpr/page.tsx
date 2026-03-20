
import type { Metadata } from 'next';
import React from 'react';
import { Database, FileLock, UserCheck, Shield } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'GDPR & Databehandling',
  description: 'Læs om Cohéros forpligtelse til databeskyttelse i henhold til GDPR, og forstå dine rettigheder som bruger af vores platform.',
};

export default function GdprPage() {
  return (
    <div className="bg-[#FDFCF8] min-h-screen">
      <header className="bg-white border-b border-amber-100/50">
        <div className="max-w-7xl mx-auto py-8 px-4 md:px-8">
           <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <FileLock className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-amber-950 serif mb-3">
            GDPR & Databehandling
          </h1>
          <p className="text-base text-slate-500 max-w-3xl">
            Din datasikkerhed og overholdelse af GDPR er fundamentalt for os. Her kan du læse, hvordan vi behandler dine oplysninger.
          </p>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 md:p-8">
        <div className="prose prose-sm md:prose-base text-slate-700 leading-relaxed space-y-12">

          <div>
            <h2 className="flex items-center gap-3">
              <Database className="w-6 h-6 text-amber-600" />
              Dataansvar og Databehandling
            </h2>
            <p>
              Cohéro I/S fungerer som <strong>databehandler</strong> for det indhold, du opretter på platformen (f.eks. noter og case-besvarelser). Det betyder, at du er <strong>dataansvarlig</strong> for dette indhold. Det er dit ansvar aldrig at indtaste personfølsomme oplysninger om virkelige personer. Vores <Link href="/etik">etiske retningslinjer</Link> forbyder dette strengt.
            </p>
            <p>
              For oplysninger, der er nødvendige for at administrere din konto (som din e-mail og abonnementsstatus), fungerer Cohéro I/S som dataansvarlig.
            </p>
          </div>

          <div>
             <h2 className="flex items-center gap-3">
              <UserCheck className="w-6 h-6 text-amber-600" />
              Dine Rettigheder
            </h2>
            <p>
              I overensstemmelse med GDPR har du følgende rettigheder som bruger af Cohéro:
            </p>
            <ul>
              <li><strong>Ret til indsigt:</strong> Du kan til enhver tid se de data, vi har registreret om dig, via din <Link href="/settings">profilside</Link>.</li>
              <li><strong>Ret til berigtigelse:</strong> Du kan rette ukorrekte oplysninger på din profilside.</li>
              <li><strong>Ret til sletning ('retten til at blive glemt'):</strong> Du kan anmode om at få slettet din konto og alle dine data. Dette vil permanent fjerne din profil, noter, cases og andre data fra vores system.</li>
              <li><strong>Ret til dataportabilitet:</strong> Du har ret til at modtage de data, du har leveret til os, i et struktureret, almindeligt anvendt og maskinlæsbart format.</li>
            </ul>
             <p>
              Ønsker du at gøre brug af dine rettigheder, kan du kontakte os på <a href="mailto:kontakt@cohero.dk">kontakt@cohero.dk</a>.
            </p>
          </div>
          
           <div>
             <h2 className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-amber-600" />
                Sikkerhed og Underdatabehandlere
            </h2>
            <p>
               Vi har truffet tekniske og organisatoriske foranstaltninger for at beskytte dine data. Al datatrafik er krypteret. Vi anvender anerkendte og GDPR-kompatible underdatabehandlere:
           </p>
           <ul>
                <li><strong>Google Firebase:</strong> Til sikker hosting af vores database, brugergodkendelse og applikation.</li>
                <li><strong>Stripe:</strong> Til sikker behandling af alle betalinger. Vi opbevarer aldrig dine kortoplysninger på vores egne servere.</li>
                 <li><strong>Google Generative AI:</strong> Til at drive vores digitale værktøjer. Data, der sendes til sprogmodellen, bruges udelukkende til at generere et svar til dig og bliver ikke brugt til at træne Googles modeller.</li>
           </ul>
           <p>
            Du kan læse mere om, hvordan vi håndterer dine oplysninger i vores <Link href="/privacy-policy">Privatlivspolitik</Link>.
           </p>
           </div>
           
        </div>
      </main>
    </div>
  );
}
