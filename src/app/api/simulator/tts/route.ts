import { generateElevenLabsTTS } from "@/lib/eleven-labs";
import { generateOpenAITITTS } from "@/lib/openai-tts"; // Fallback
import { NextRequest, NextResponse } from "next/server";

// Fallback import fix (check filename)
import { generateOpenAITTS } from "@/lib/openai-tts";

export async function POST(req: NextRequest) {
  try {
    const { text, voice, provider = 'elevenlabs' } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    let audioDataUri;

    try {
        // Try ElevenLabs first
        audioDataUri = await generateElevenLabsTTS(text, voice);
    } catch (e: any) {
        console.warn("ElevenLabs failed, falling back to OpenAI:", e.message);
        try {
            audioDataUri = await generateOpenAITTS(text, "shimmer");
        } catch (e2: any) {
            throw new Error("All cloud TTS providers failed");
        }
    }

    return NextResponse.json({ audioDataUri });
  } catch (error: any) {
    console.error("TTS API Error:", error);
    return NextResponse.json({ 
      error: "TTS Error", 
      details: error.message 
    }, { status: 500 });
  }
}
