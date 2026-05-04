import { GoogleGenerativeAI } from "@google/generative-ai";

async function checkEmbeddingDimension() {
  const key = "AIzaSyDYbKgVICpyAKc8XRZsi03FvIxEo_sOeSU";
  try {
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: { parts: [{ text: "Hello" }] } })
    });
    const data = await resp.json();
    if (data.embedding) {
      console.log("Dimension:", data.embedding.values.length);
    } else {
      console.log("Error:", JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.error("Error:", e);
  }
}

checkEmbeddingDimension();
