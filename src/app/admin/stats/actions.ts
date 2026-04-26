'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateAdminInsights(stats: any) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Missing GEMINI_API_KEY');
    }

    // Use gemini-1.5-flash which is the current stable flash model.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 

    const prompt = `
      Du er en erfaren forretningsanalytiker for platformen Cohéro (en platform for socialrådgiverstuderende).
      Analyser følgende platform-statistikker og giv en kort, skarpt formuleret ugentlig statusrapport.
      Rapporten skal være på dansk og henvendt til administratoren (Sebastian).
      
      Statistikker:
      - Total brugere: ${stats.totalUsers} (Vækst: ${stats.growth}%)
      - Aktive i dag (DAU): ${stats.dau}
      - Aktive månedligt (MAU): ${stats.mau}
      - Engagement (Stickiness): ${stats.stickiness}%
      - Månedlig Churn Rate: ${stats.churnRate30d}%
      - AI Omkostninger (denne mdr): ${stats.monthlyTokenCost} kr.
      - Brugere i høj Churn-risiko: ${stats.riskUsersCount}
      - Potentielt MRR tab: ${stats.totalRiskMRR} kr.
      - Facebook Konverteringer: ${stats.fbConversions}
      - TikTok Konverteringer: ${stats.tiktokConversions}
      - Flest oprettelser ugedag: ${stats.peakDay}
      - Flest oprettelser tidspunkt: ${stats.peakHour}

      Struktur:
      1. Overskrift: En motiverende eller advarende status (f.eks. "Stærk vækst, men fokus på fastholdelse påkrævet").
      2. Status: De 3 vigtigste pointer fra dataen.
      3. Anbefaling: Hvad bør Sebastian gøre i den kommende uge for at optimere forretningen?
      
      Hold tonen professionel, men personlig og "to-the-point". Brug markdown formatering.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error('Error generating AI insights:', error);
    return `Kunne ikke generere AI indsigt: ${error.message}`;
  }
}

export async function generateTikTokScripts(topic: string = "", goal: string = "Mere vækst", tone: string = "Energisk") {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Missing GEMINI_API_KEY');
    }

    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
        }
    }); 

    const prompt = `
      Du er en kreativ TikTok marketing-ekspert for Cohéro (en platform for socialrådgiverstuderende).
      Din mission er at skrive 3 virale TikTok-scripts baseret på emnet: "${topic}" (eller dagens vigtigste socialrådgiver-emne hvis intet er angivet).
      Målet: ${goal}
      Tonen: ${tone}

      Hvert script skal følge TikTok's "Winning Formula":
      1. The Hook (0-3 sek): Skal stoppe folk i at scrolle.
      2. The Body (15-40 sek): Giv lynhurtig værdi (socialrådgiver-relevant).
      3. The CTA: Hvad skal de gøre nu?
      4. Caption: Forslag til TikTok caption inkl. hashtags.

      Returner et JSON objekt med en nøgle "scripts", som er en liste af 3 objekter med:
      id, title, hook, body, cta, caption.
      
      Skriv alt indhold på dansk.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const data = JSON.parse(response.text());
    return data.scripts || [];
  } catch (error: any) {
    console.error('Error generating TikTok scripts:', error);
    return [];
  }
}

export async function generateBlogPost(topic: string = "", keywords: string = "") {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Missing GEMINI_API_KEY');
    }

    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
        }
    }); 

    const prompt = `
      Du er en ekspert i SEO og socialrådgiver-fagligt indhold for Cohéro.
      Skriv et knivskarpt, SEO-optimeret blogindlæg eller en LinkedIn-artikel om emnet: "${topic}".
      Søgeord der skal fokus på: "${keywords}".

      Din struktur SKAL være:
      1. En fængende SEO-titel (H1).
      2. En kort teaser/meta-beskrivelse.
      3. Selve indholdet i formateret Markdown (brug H2, H3, lister).
      4. Inkluder juridisk præcision (henvisning til lovgivning).
      5. En liste af 5 SEO-tags.

      Returner et JSON objekt med nøglerne: title, excerpt, content, seoKeywords.
      Skriv alt på dansk.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error: any) {
    console.error('Error generating Blog post:', error);
    return null;
  }
}
