async function listModelsV1() {
  const key = "AIzaSyDYbKgVICpyAKc8XRZsi03FvIxEo_sOeSU";
  try {
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${key}`);
    const data = await resp.json();
    console.log("Available Models V1:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error:", e);
  }
}

listModelsV1();
