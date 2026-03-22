
export async function generateBananaImage(prompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.warn("GEMINI_API_KEY mangler for Banana (Imagen).");
        throw new Error("GEMINI_API_KEY missing.");
    }

    console.log(`Banana (Imagen): Genererer illustration for: "${prompt}"...`);

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                instances: [
                    { prompt: `A simple, professional, clean flat vector illustration for a educational social work platform. Subject: ${prompt}. Style: Minimalist, soft colors, professional.` }
                ],
                parameters: {
                    sampleCount: 1,
                    aspectRatio: "1:1",
                    outputMimeType: "image/png"
                }
            }),
        });



        if (!response.ok) {
            const err = await response.text();
            console.error("Banana Image Error:", err);
            throw new Error(`Banana API fejl: ${response.status}`);
        }

        const data = await response.json();
        const base64Image = data.predictions[0].bytesBase64Encoded;
        return `data:image/png;base64,${base64Image}`;
    } catch (e) {
        console.error("Banana Image implementation failed:", e);
        // Fallback to a placeholder or throw
        throw e;
    }
}
