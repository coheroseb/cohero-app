
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

// Remove edge runtime to ensure environment variables are correctly loaded and for better debugging
// export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { message, chatHistory, citizenPersona, scenarioContext } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("SIMULATOR ERROR: GEMINI_API_KEY is not defined in environment variables");
      return new Response(JSON.stringify({ error: "API Key missing" }), { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // We use gemini-1.5-flash which is widely available and fast
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
REGEL: Du skal REAGERE som borgeren. Brug et naturligt sprog.

**DIN PERSONA:** ${citizenPersona.name}, ${citizenPersona.age} år. ${citizenPersona.background}
**SITUATION:** ${citizenPersona.currentSituation}
**DIT HUMØR:** ${citizenPersona.emotionalState}

**INSTRUKSER:**
Du SKAL starte dit svar med præcis dette metadata format:
[EMOTION: <ét ord>]
[THOUGHTS: <dine korte indre tanker>]
---
<Din tale direkte til sagsbehandleren her>

Svaret skal være på dansk.

**SAMTALEHISTORIK:**
${chatHistory.map((h: any) => `${h.role === 'user' ? 'Sagsbehandler' : 'Borger'}: ${h.content}`).join('\n')}

**NY BESKED FRA SAGSBEHANDLER:**
${message}
`;

    // Initialize the stream
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
            controller.enqueue(encoder.encode("\n[ERROR: Stream interrupted]"));
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
        status: 500,
        headers: { 'Content-Type': 'application/json' }
    });
  }
}
