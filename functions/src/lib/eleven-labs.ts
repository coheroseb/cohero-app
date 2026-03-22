
export async function generateElevenLabsTTS(text: string): Promise<string> {
    const apiKey = process.env.ELEVEN_LABS_API_KEY;
    if (!apiKey) {
        console.warn("ELEVEN_LABS_API_KEY mangler. Springer over high-quality TTS.");
        throw new Error("ELEVEN_LABS_API_KEY missing.");
    }

    // Use the specific high-quality voice requested by the user: V34B5u5UbLdNJVEkcgXp
    const voiceId = process.env.ELEVEN_LABS_VOICE_ID || "V34B5u5UbLdNJVEkcgXp"; 

    console.log(`ElevenLabs: Genererer tale for tekst (${text.length} tegn)...`);

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
            "accept": "audio/mpeg",
        },
        body: JSON.stringify({
            text: text,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.8,
                style: 0.1,
                use_speaker_boost: true
            }

        }),
    });

    if (!response.ok) {
        const err = await response.text();
        console.error("ElevenLabs TTS Fejl fra API:", err);
        throw new Error(`ElevenLabs API fejl: ${response.status} - ${err}`);
    }

    console.log("ElevenLabs: Modtog lydbuffer. Omdanner til base64...");
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:audio/mp3;base64,${base64}`;
}

