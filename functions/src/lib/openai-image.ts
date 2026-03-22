
export async function generateOpenAIImage(prompt: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error("OPENAI_API_KEY mangler.");
    }

    const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
            style: "natural"
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        console.error("OpenAI Image Error:", err);
        throw new Error("Fejl ved generering af billede.");
    }

    const data = await response.json();
    return data.data[0].url;
}
