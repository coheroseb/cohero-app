
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { message, chatHistory, citizenPersona, scenarioContext } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
        return new Response("Missing GEMINI_API_KEY", { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use gemini-1.5-flash for maximum speed and stability in streaming
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
Du er en AI, der simulerer en borger i en samtale med en socialrådgiver (brugeren).
Din opgave er at reagere naturtro, følelsesladet og autentisk baseret på din persona.

**DIN PERSONA:**
- Navn: ${citizenPersona.name}
- Alder: ${citizenPersona.age}
- Baggrund: ${citizenPersona.background}
- Nuværende situation: ${citizenPersona.currentSituation}
- Udgangspunkt for følelsesmæssig tilstand: ${citizenPersona.emotionalState}
- Personlighedstræk: ${citizenPersona.personalityTraits.join(', ')}
${citizenPersona.secretInfo ? `- HEMMELIGHED (Hold dette skjult indtil det føles naturligt): ${citizenPersona.secretInfo}` : ''}

**SAMTALEKONTEKST:**
${scenarioContext}

**DINE INSTRUKSER:**
1. REAGER som borgeren. Brug et sprog, der passer til din alder og baggrund. Lad være med at tale som en AI.
2. FØLELSER: Din tilstand skal ændre sig baseret på sagsbehandlerens (brugerens) tilgang.
3. FORMAT: Du SKAL starte dit svar med metadata i præcis dette format:
   [EMOTION: <ét ord>]
   [THOUGHTS: <dine korte indre tanker om sagsbehandleren>]
   ---
   <Din tale direkte til sagsbehandleren her>

Svaret SKAL være på dansk.

**SAMTALEHISTORIK:**
${chatHistory.map((h: any) => `${h.role === 'user' ? 'Sagsbehandler' : 'Borger'}: ${h.content}`).join('\n')}

**BRUGERENS (SAGSBEHANDLERENS) BESKED:**
${message}
`;

    const result = await model.generateContentStream(prompt);

    const stream = new ReadableStream({
      async start(controller) {
        try {
            for await (const chunk of result.stream) {
                const text = chunk.text();
                controller.enqueue(new TextEncoder().encode(text));
            }
        } catch (e) {
            console.error("Stream error:", e);
        } finally {
            controller.close();
        }
      },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
  } catch (error) {
    console.error("Simulator Stream Error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate stream" }), { status: 500 });
  }
}
