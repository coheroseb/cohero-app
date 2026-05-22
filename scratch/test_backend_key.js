const fetch = require('node-fetch');

async function testKey() {
    const key = "AIzaSyCEay9Ekv3ARVUncB6H1EDP35ALRe5PswA";
    const prompt = "Hello, respond with a short sentence.";
    
    console.log(`Testing key: ${key}`);
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${key}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        console.log("Status:", response.status);
        console.log("Status text:", response.statusText);
        const text = await response.text();
        console.log("Response body:", text);
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

testKey();
