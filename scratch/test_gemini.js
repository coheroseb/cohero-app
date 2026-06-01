const geminiKey = process.env.GEMINI_API_KEY || "AIzaSyD93vIEVXUu9qv5o9GrMIbKJ-wJ1qUKtz4";
const fetch = require('node-fetch');

async function test() {
    const prompt = `DU SKAL ANALYSERE TEKSTEN MED ET EKSTREMT STÆRKT OG EKSKLUSIVT FOKUS PÅ: "Lovgivning". 
Alt i dit mindmap SKAL være direkte relateret to "Lovgivning". Du må IKKE inkludere andre teoretikere eller begreber fra teksten, medmindre de bruges til at forklare eller perspektivere "Lovgivning". 
Hvis teksten handler om andre emner (f.eks. andre forskere), skal du ignorere dem og kun udtrække det, der vedrører "Lovgivning".

Du er en højt kvalificeret akademisk analytiker og pædagogisk arkitekt. 
Din opgave er at gennemføre en dybdegående analyse af det vedhæftede pensum-materiale og skabe et struktureret, hierarkisk mindmap.

FORMÅL:
At identificere de mest centrale elementer, begreber, metoder og teorier, så den studerende får et knivskarpt overblik til eksamen.

DU SKAL IDENTIFICERE OG ORGANISERE FØLGENDE KATEGORIER:
1. **Centrale Begreber**: Kernebegreber og definitioner der er fundamentale for emnet.
2. **Metoder & Værktøjer**: Specifikke fremgangsmåder, analysemodeller eller praktiske metoder beskrevet i teksten.
3. **Teorier & Modeller**: De teoretiske rammeværk eller videnskabelige modeller der understøtter emnet.
4. **Væsentlig Praksis/Regler**: Hvordan viden anvendes i praksis (f.eks. lovgivning, cases eller kliniske retningslinjer).
5. **Tværgående Sammenhænge**: Hvordan elementer fra forskellige kategorier relaterer sig til hinanden.

DU SKAL RETURNERE ET JSON OBJEKT MED DENNE STRUKTUR:
{
  "root": {
    "id": "root",
    "text": "Overordnet Emne",
    "children": [
      {
        "id": "theme_1",
        "text": "Tema Navn (f.eks. Centrale Begreber / Metoder / Teorier)",
        "color": "indigo | emerald | rose | amber | sky",
        "children": [
          {
            "id": "sub_1",
            "text": "Navn på elementet (f.eks. 'Strafudmåling' eller 'PARETO-modellen')",
            "description": "En præcis, akademisk forklaring på 1-2 sætninger, der opsummerer essensen.",
            "type": "concept | method | theory | law | case",
            "children": []
          }
        ]
      }
    ]
  },
  "connections": [
    { "from": "id_a", "to": "id_b", "label": "Beskriv sammenhængen kort (f.eks. 'Anvendes til at analysere...')" }
  ]
}

REGLER:
1. **Unikke ID'er**: Giv alle noder et unikt, beskrivende ID (f.eks. 'begreb_retskraft').
2. **Kategorisering (VIGTIGT)**: Du SKAL inkludere mindst 4-5 hovedgrene (f.eks. Begreber, Teorier, Metoder, Praksis). Skab et BREDT mindmap.
3. **Dybde & Koncision**: Maks 4-5 underpunkter pr. gren. Beskrivelserne SKAL være ekstremt korte (maks 15 ord). Dette er vigtigt for at nå at dække alle kategorier.
4. **Connections**: Identificer 5-10 meningsfulde forbindelser på tværs af forskellige grene.
5. **Sprog**: Al tekst skal være på dansk og i en akademisk, men letforståelig tone.
6. **Output**: Returner KUN JSON-objektet. Intet andet tekst.
7. **Kildetrohed (ULTRA VIGTIGT)**: Du må KUN bruge information fra de vedhæftede materialer. Du må UNDER INGEN OMSTÆNDIGHEDER bruge din generelle viden eller eksterne kilder. Hvis noget ikke står i teksten, må det ikke komme med i dit mindmap.

Teksten der skal analyseres:

Dette er en prøve på lovgivning tekst.`;

    const body = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
            temperature: 0.1,
            maxOutputTokens: 8192,
            response_mime_type: "application/json"
        }
    });

    console.log("Calling Gemini API...");
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: body
        });

        console.log("Status:", response.status);
        console.log("Status text:", response.statusText);
        const text = await response.text();
        console.log("Response body:", text);
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

test();
