async function listModels() {
  const key = "AIzaSyDYbKgVICpyAKc8XRZsi03FvIxEo_sOeSU";
  try {
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await resp.json();
    console.log("Available Models:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error:", e);
  }
}

listModels();
