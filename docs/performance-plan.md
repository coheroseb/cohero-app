# Performance- og Kapacitetstestplan for Cohéro (Version 2.0)

Dette dokument beskriver en revideret plan for at teste og validere performance, skalerbarhed og robusthed af Cohéro-platformen under forskellige belastningsscenarier. Denne plan er opdateret for at inkludere mere specifikke, målbare og tekniske metrics.

## Generelle Målepunkter (Metrics)

Følgende metrics skal indsamles og analyseres på tværs af alle testscenarier:

-   **P95 End-to-End Latency:** Total tid fra brugerens request afsendes, til svaret modtages. Dette er den primære indikator for brugeroplevet hastighed.
-   **P95 Function Execution Latency:** Den rene eksekveringstid for server-side funktioner (Genkit flows), isoleret fra netværksforsinkelse og cold starts.
-   **Fejlrate (HTTP 5xx):** Procentdelen af anmodninger, der resulterer i serverfejl. Måler systemets generelle stabilitet.
-   **Firestore Contention/Error Rate (429s):** Antallet af "Resource Exhausted" fejl. Måler database-belastning og indikerer potentielle hotspots eller for høj skrive/læse-rate.
-   **Firestore Operation Budgets pr. Brugerhandling:** Et fastsat budget for antallet af dokument-læsninger og -skrivninger for hver specifik handling (endpoint/flow).
-   **Gennemsnitlig Payload-størrelse:** Størrelsen på data sendt til og fra serveren, især for AI-svar, for at overvåge båndbreddeforbrug.
-   **Cloud Run Instanser & Cold Starts:** Antal aktive instanser og hyppigheden af cold starts under belastning.

---

## Scenarie 1: Baseline Load (500 samtidige brugere)

Dette scenarie simulerer en travl dag og fungerer som baseline for performance.
-   **Mål:** At sikre en stabil og hurtig brugeroplevelse under moderat, vedvarende belastning.
-   **Antaget RPS:** ~16 RPS (baseret på 500 brugere * 2 handlinger/minut / 60 sekunder).

### Testfokus og Operationer

1.  `getSocraticReflectionAction`: 1 function call, 1 AI-kald. Forventet payload: ~2-5 KB.
2.  `getBiasHeatmapAction`: 1 function call, 1 AI-kald. Forventet payload: ~1-4 KB pr. request.
3.  `generateNewCase`: 1 function call, 1 AI-kald, 1 Firestore write (batch). Læser fra 3+ lovtekst-filer. Forventet payload: ~5-10 KB.
4.  `getCaseFeedbackAction`: 1 function call, 1 AI-kald, 1 Firestore write (batch). Læser fra 3+ lovtekst-filer. Forventet payload: ~5-15 KB.
5.  **Firestore Document Read:** 1 Firestore read pr. brugerprofil/case-hentning. Forventet payload: < 5 KB.

### Succeskriterier

-   **P95 End-to-End Latency (AI Flows):** < 5 sekunder
-   **P95 Function Execution Latency (AI Flows):** < 4 sekunder
-   **P95 Latency (Firestore Reads):** < 400ms
-   **Server Fejlrate (5xx):** < 0.5%
-   **Firestore Fejlrate (429):** < 0.1%

---

## Scenarie 2: High Load (2.000 samtidige brugere)

Tester systemets evne til at skalere under høj belastning og afdækker potentielle flaskehalse.
-   **Mål:** At verificere, at systemet kan håndtere en firdobling af brugere uden markant forringelse af performance.
-   **Antaget RPS:** ~67 RPS (baseret på 2.000 brugere * 2 handlinger/minut / 60 sekunder).

### Testfokus og Operationer

-   Alle fra Scenarie 1.
-   `explainConceptAction` & `explainLawParagraphAction`: 1 function call, 1 Firestore read (cache check), potentielt 1 AI-kald + 1 Firestore write (cache miss). Forventet payload: ~5-20 KB.
-   `generateExamBlueprintAction`: 1 function call, 1 meget tungt AI-kald, 1 Firestore write. Forventet payload: ~10-25 KB.

### Succeskriterier

-   **P95 End-to-End Latency (AI Flows):** < 8 sekunder
-   **P95 Function Execution Latency (AI Flows):** < 7 sekunder
-   **P95 Latency (Firestore Reads):** < 600ms
-   **Server Fejlrate (5xx):** < 1%
-   **Firestore Fejlrate (429):** < 0.2%
-   **Firestore Budgets:** Ingen stigning i operationer pr. brugerhandling.

---

## Scenarie 3: Stress Test (10.000 samtidige brugere)

En stresstest designet til at finde systemets bristepunkt og vurdere dets robusthed.
-   **Mål:** At sikre, at systemet forbliver tilgængeligt og nedbrydes gradvist (graceful degradation) frem for at fejle katastrofalt.
-   **Antaget RPS:** ~333 RPS (baseret på 10.000 brugere * 2 handlinger/minut / 60 sekunder).

### Testfokus og Operationer

1.  `getSocraticReflectionAction` (Høj-volumen AI)
2.  `getBiasHeatmapAction` (Høj-volumen AI)
3.  **Login & Profilhentning:** 1 Firestore read (`/users/{userId}`).
4.  **Gem Handling:** 1 Firestore write (f.eks. opdatering af et felt i en case).

### Succeskriterier

-   Systemet forbliver online og tilgængeligt.
-   **Server Fejlrate (5xx):** < 5%
-   **Firestore Fejlrate (429):** < 1% (klient-side retry med exponential backoff skal være aktiv).
-   **P95 End-to-End Latency (AI Flows):** < 15 sekunder.
-   **P95 Latency (Firestore Reads):** < 1 sekund.
-   **Funktions-latency:** Vækst i eksekveringstid skal være sub-lineær, hvilket indikerer effektiv horisontal skalering.

---

## Scenarie 4: Spike & Recovery Test

Tester systemets evne til at håndtere pludselige stigninger i trafik.
-   **Mål:** At verificere auto-scaling og vurdere systemets evne til at vende tilbage til normal drift efter en trafik-spike.

### Testprocedure

1.  **Spike:** Øg belastningen fra 0 til 2.000 samtidige brugere over 30-60 sekunder. Fasthold i 5 minutter.
2.  **Recovery:** Stop al trafik brat. Overvåg systemet i de efterfølgende 10 minutter.

### Succeskriterier

-   **Under Spike:**
    -   Systemet forbliver tilgængeligt (HTTP 2xx/3xx svar).
    -   **Server Fejlrate (5xx):** < 2%.
    -   Latencies må stige, men skal forblive inden for acceptable rammer (fx P95 < 12 sekunder).
-   **Efter Spike (Recovery):**
    -   Latencies for enkeltstående requests vender tilbage til baseline-niveau (Scenarie 1) inden for 2-5 minutter.
    -   Antallet af aktive Cloud Run instanser skalerer ned som forventet.

---

## Testforudsætninger og Konfiguration

-   **Cloud Run Konfiguration:** Alle tests skal udføres med en specificeret konfiguration for den underliggende App Hosting/Cloud Run service. Følgende skal dokumenteres:
    -   **Concurrency:** Antal samtidige requests pr. instans (f.eks. test med 80).
    -   **Min/Max Instances:** Minimum og maksimum antal instanser (f.eks. min: 1, max: 100).
-   **Genkit Flows:** Alle flows kaldes som klienten ville gøre, typisk via Firebase Callable Functions, der inkluderer autentificeringskontekst.
-   **Firestore Budgets:** Hver handling har et fastsat budget, som ikke må overskrides.
    -   Eksempel: `getBiasHeatmapAction` må maksimalt lave 1 `get()`-kald til brugerens profil (for rate limiting check) og 0 writes.
    -   Eksempel: `generateNewCase` må maksimalt lave 1 `writeBatch` operation, der inkluderer oprettelse af case-dokument og opdatering af bruger-stats.
-   **Klient-side Retry:** Testplanen forudsætter, at klient-applikationen har implementeret en strategi for retry med exponential backoff for fejlende requests (særligt ved 429 og 5xx fejl).