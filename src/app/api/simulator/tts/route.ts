
import { generateOpenAITTS } from "@/lib/openai-tts";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, voice } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    // Pass requested voice
    const audioDataUri = await generateOpenAITTS(text, voice || "alloy");

    return NextResponse.json({ audioDataUri });
  } catch (error: any) {
    console.error("TTS API Error:", error);
    return NextResponse.json({ 
      error: "TTS Error", 
      details: error.message 
    }, { status: 500 });
  }
}
