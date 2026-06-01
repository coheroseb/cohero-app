const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const fetch = require('node-fetch');

// 1. Manually parse .env.local
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            const key = match[1];
            let value = match[2] || '';
            if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
            else if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            process.env[key] = value;
        }
    });
}

const serviceAccountVar = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
let sanitizedJson = serviceAccountVar.trim();
const serviceAccount = JSON.parse(sanitizedJson);
if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
});

const adminFirestore = getFirestore(app, 'cohero-database');

async function testMindmap() {
    const userId = "GEyA853LNTde2oX134uHagrBLIF2";
    const semesterId = "2. semester";
    const focus = "Lovgivning";
    const geminiKey = process.env.GEMINI_API_KEY;

    try {
        console.log(`[Mindmap] Starting test for user ${userId}, semester ${semesterId}, focus ${focus}`);
        
        // Fetch materials for this semester to get their IDs
        const materialsSnapshot = await adminFirestore.collection('users')
            .doc(userId)
            .collection('materials')
            .where('semester', '==', semesterId)
            .get();
        
        const materialIds = materialsSnapshot.docs.map(doc => doc.id);
        console.log(`[Mindmap] Found ${materialIds.length} materials.`);
        
        let textToAnalyze = "";
        if (materialIds.length > 0) {
            console.log(`[Mindmap] Fetching balanced chunks for ${materialIds.length} materials`);
            const chunksPerMaterial = Math.max(2, Math.floor(80 / materialIds.length));
            console.log(`[Mindmap] Chunks per material: ${chunksPerMaterial}`);
            
            const materialPromises = materialIds.map(id => 
                adminFirestore.collection('users')
                    .doc(userId)
                    .collection('materialChunks')
                    .where('materialId', '==', id)
                    .limit(chunksPerMaterial)
                    .get()
            );
            
            const snapshots = await Promise.all(materialPromises);
            let allChunks = [];
            snapshots.forEach((snap, idx) => {
                console.log(`  - Mat ${materialIds[idx]}: fetched ${snap.docs.length} chunks`);
                allChunks.push(...snap.docs.map(doc => doc.data()));
            });
            
            console.log(`[Mindmap] Total balanced chunks collected: ${allChunks.length}`);
            
            textToAnalyze = allChunks
                .map(c => c.text || "")
                .join('\n')
                .substring(0, 80000);
            
            console.log(`[Mindmap] Final balanced text length: ${textToAnalyze.length}`);
        }

        const prompt = `${focus ? `DU SKAL ANALYSERE TEKSTEN MED ET EKSTREMT STÆRKT OG EKSKLUSIVT FOKUS PÅ: "${focus}". 
Alt i dit mindmap SKAL være direkte relateret til "${focus}". Du må IKKE inkludere andre teoretikere eller begreber fra teksten, medmindre de bruges til at forklare eller perspektivere "${focus}". 
Hvis teksten handler om andre emner (f.eks. andre forskere), skal du ignorere dem og kun udtrække det, der vedrører "${focus}".` : 'Identificer det absolutte hovedtema i teksten som din "root" node.'}

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

Teksten der skal analyseres:\n\n${textToAnalyze}`;

        const body = JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { 
                temperature: 0.1,
                maxOutputTokens: 8192,
                response_mime_type: "application/json"
            }
        });

        console.log("Calling Gemini API...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: body
        });

        console.log("Status:", response.status);
        console.log("Status text:", response.statusText);
        const text = await response.text();
        console.log("Response body:", text.substring(0, 1000));
        if (text.length > 1000) {
            console.log("... response truncated");
        }
    } catch (e) {
        console.error("Test failed:", e);
    }
}

testMindmap();
