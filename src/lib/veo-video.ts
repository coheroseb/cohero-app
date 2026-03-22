
export async function generateVeoVideo(prompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY mangler.");
    }

    console.log(`Veo Video: Starter generering for: "${prompt}"...`);

    try {
        // Initial request for a 3-second cinematic clip
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-fast-generate-preview:predictLongRunning?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                instances: [
                  { 
                    prompt: `A beautiful, cinematic, high-quality professional documentary-style video clip. Subject: ${prompt}. Minimalist, clean, slow camera move, professional lighting.` 
                  }
                ],
                parameters: {
                  // Some models require at least one parameter or a specific aspect ratio
                  // Removing outputMimeType and duration as they cause 400 errors for this specific model
                  videoAspectRatio: "1:1"
                }

            }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("Veo Initial Request Error:", err);
            throw new Error(`Veo API fejl: ${response.status}`);
        }

        const operation = await response.json();
        const opName = operation.name;
        console.log(`Veo Video: Operation startet: ${opName}. Poller for resultat...`);

        // Polling loop (max 40 seconds)
        let attempts = 0;
        const maxAttempts = 20; // 20 * 2s = 40s
        
        while (attempts < maxAttempts) {
            attempts++;
            await new Promise(r => setTimeout(r, 2000));
            
            const statusRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/${opName}?key=${apiKey}`);
            if (!statusRes.ok) continue;

            const statusData = await statusRes.json();
            if (statusData.done) {
                console.log(`Veo Video: Færdig! (Scene klargjort)`);
                const base64Video = statusData.response.predictions[0].bytesBase64Encoded;
                return `data:video/mp4;base64,${base64Video}`;
            }
            
            process.stdout.write("."); // Just a little dot in server console
        }
        
        throw new Error("Veo timeout: Generering tog for lang tid.");
    } catch (e: any) {
        console.error("Veo implementation failed:", e.message);
        throw e;
    }
}
