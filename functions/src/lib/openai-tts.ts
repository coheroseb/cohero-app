// @ts-nocheck


import { adminFirestore } from '@/firebase/server-init';

export async function generateOpenAITTS(text: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error("OPENAI_API_KEY mangler.");
    }

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "tts-1",
            input: text,
            voice: "shimmer", 
            speed: 1.1,
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        console.error("OpenAI TTS Error:", err);
        throw new Error("Fejl ved generering af tale.");
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:audio/mp3;base64,${base64}`;
}
