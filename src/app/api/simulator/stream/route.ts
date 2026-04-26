
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { message, chatHistory, citizenPersona, scenarioContext } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("SIMULATOR ERROR: GEMINI_API_KEY is not defined");
      return new Response(JSON.stringify({ error: "API Key missing" }), { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Using gemini-1.5-flash which is the current stable flash model
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash", 
        generationConfig: {
            temperature: 0.9,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 2048,
        }
    });

    const prompt = `
Du er en AI, der simulerer en borger i en intensiv samtale med en socialrådgiver (brugeren).
DIT MÅL: At lyde 100% som et menneske, der taler (ikke skriver).

**DIN PERSONA:** ${citizenPersona.name}, ${citizenPersona.age} år. ${citizenPersona.background}
**SITUATION:** ${citizenPersona.currentSituation}
**DIT HUMØR:** ${citizenPersona.emotionalState}

**TALE-REGLER (MANDATORY):**
1. **Mundtlighed:** Brug talesprog. Brug fyldord som "øh", "det ved jeg sgu ikke helt", "altså", "hmm", "tjaa".
2. **Korte sætninger:** Skriv korte, naturlige sætninger. Ingen komplekse forklaringer.
3. **Pauser:** Brug kommaer og punktummer for at skabe naturlige pauser i oplæsningen.
4. **Karakter-stil:**
   - Er du **Karen**? Vær skeptisk, direkte, og lyde lidt træt af systemet. Brug ord som "igen", "altså", "systemet her".
   - Er du **Morten**? Vær usikker, hold små pauser, brug ord som "agtigt", "måske", "jeg ved det ikke". Lyde som en 19-årig.
   - Er du **Lene**? Vær høflig, bekymret, lyde som en flittig SOSU-assistent der er bange for fremtiden.

Svaret SKAL være på dansk.

**FORMAT:**
Du SKAL starte dit svar med præcis dette metadata format:
[EMOTION: <ét ord>]
[THOUGHTS: <dine korte indre tanker>]
---
<Din tale her - skriv kun det man ville sige højt>

**SAMTALEHISTORIK:**
${chatHistory.map((h: any) => `${h.role === 'user' ? 'Sagsbehandler' : 'Borger'}: ${h.content}`).join('\n')}

**NY BESKED FRA SAGSBEHANDLER:**
${message}
`;

    const result = await model.generateContentStream(prompt);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
            for await (const chunk of result.stream) {
                const text = chunk.text();
                if (text) {
                    controller.enqueue(encoder.encode(text));
                }
            }
        } catch (e) {
            console.error("STREAM ERROR:", e);
        } finally {
            controller.close();
        }
      },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            'X-Content-Type-Options': 'nosniff',
        },
    });
  } catch (error: any) {
    console.error("SIMULATOR API CRASH:", error);
    return new Response(JSON.stringify({ 
        error: "Internal Server Error", 
        details: error?.message || "Unknown error" 
    }), { 
        status: 500
    });
  }
}
