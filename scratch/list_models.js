const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!key) {
    console.error("No API key found.");
    process.exit(1);
}

async function listModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    const res = await fetch(url);
    if (!res.ok) {
        console.error("Failed to list models:", res.statusText, await res.text());
        return;
    }
    const data = await res.json();
    console.log("Available models:");
    for (const m of data.models) {
        console.log(`- ${m.name} (supports: ${m.supportedGenerationMethods.join(', ')})`);
    }
}

listModels().catch(console.error);
