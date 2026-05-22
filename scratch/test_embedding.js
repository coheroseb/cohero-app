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

async function testEmbedding() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:batchEmbedContents?key=${key}`;
    const requests = [
        {
            model: 'models/gemini-embedding-2',
            content: { parts: [{ text: "Hej verden" }] },
            outputDimensionality: 768
        },
        {
            model: 'models/gemini-embedding-2',
            content: { parts: [{ text: "Dette er en test" }] },
            outputDimensionality: 768
        }
    ];

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests })
    });

    console.log("Status:", response.status, response.statusText);
    const data = await response.json();
    if (!response.ok) {
        console.error("Error response:", JSON.stringify(data));
        return;
    }
    console.log("Embeddings received successfully!");
    console.log("Number of embeddings:", data.embeddings ? data.embeddings.length : 0);
    if (data.embeddings && data.embeddings[0]) {
        console.log("Dimensions of first embedding:", data.embeddings[0].values.length);
    }
}

testEmbedding().catch(console.error);
