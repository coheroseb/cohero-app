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
        const finalVoice = voice && voice !== 'alloy' ? voice : "pNInz6obpgDQGcFmaJgB"; // Use Adam as default if invalid
        console.log(`TTS REQUEST: Voice=${finalVoice}, Provider=ElevenLabs`);
        
        audioDataUri = await generateElevenLabsTTS(text, finalVoice);
    } catch (e: any) {
        console.error("CRITICAL ELEVENLABS FAILURE:", e.message);
        return NextResponse.json({ 
            error: "ElevenLabs failed", 
            details: e.message,
            attemptedVoice: voice
        }, { status: 500 });
    }

    return NextResponse.json({ audioDataUri, provider: 'elevenlabs' });
  } catch (error: any) {
    console.error("TTS API Error:", error);
    return NextResponse.json({ 
      error: "TTS Error", 
      details: error.message 
    }, { status: 500 });
  }
}
