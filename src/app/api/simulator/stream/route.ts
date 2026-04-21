
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
    
    // We use gemini-1.5-flash but ensure we have more robust error handling
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
Du SKAL starte dit svar med præcis dette metadata format (vigtigt):
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
            console.error("Stream generation error:", e);
        } finally {
            controller.close();
        }
      },
    });

    // Use text/plain for maximum compatibility with proxy/buffering
    return new Response(stream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            'X-Content-Type-Options': 'nosniff',
        },
    });
  } catch (error) {
    console.error("Simulator API Error:", error);
    return new Response(JSON.stringify({ error: "Fail" }), { status: 500 });
  }
}
