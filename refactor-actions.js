const fs = require('fs');
const path = require('path');

const actionsFile = path.join(__dirname, 'src/app/actions.ts');
let content = fs.readFileSync(actionsFile, 'utf8');

// 1. Extract all imported flow names
const importRegex = /import\s+\{\s*([a-zA-Z0-9_]+)(?:\s+as\s+([a-zA-Z0-9_]+))?\s*\}\s+from\s+['"]@\/ai\/flows\/([^'"]+)['"];/g;
let match;
const importedFlows = new Map();

while ((match = importRegex.exec(content)) !== null) {
    const exportedName = match[1];
    const localName = match[2] || exportedName;
    importedFlows.set(localName, exportedName);
}

// Remove the flow imports from the file
content = content.replace(importRegex, '');

// The helper to insert
const helper = `
async function callFirebaseFlow(flowName, data) {
  const adminSecret = process.env.CRON_SECRET || "dev-secret-123";
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'coheroseb';
  const url = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL 
    ? (process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL + "/runAiFlow")
    : ("http://127.0.0.1:5001/" + projectId + "/us-central1/runAiFlow");

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + adminSecret
    },
    body: JSON.stringify({ flowName, data })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Firebase Flow call failed:", errorText);
    throw new Error('Firebase Flow API Error: ' + response.statusText);
  }

  return response.json();
}
`;

// Insert the helper after the Types import
content = content.replace(/(import type \* as Types from '@\/ai\/flows\/types';)/, "$1\n" + helper);

// 3. Replace usages
for (const [localName, exportedName] of importedFlows.entries()) {
    const flowNameString = exportedName + 'Flow';
    
    // Pattern A: export const xxxAction = localName;
    const patternA = new RegExp("export const ([a-zA-Z0-9_]+) = " + localName + ";", "g");
    content = content.replace(patternA, "export async function $1(input: any) { return callFirebaseFlow('" + flowNameString + "', input); }");

    // Pattern B & C: localName(
    const callPattern = new RegExp("(?<![a-zA-Z0-9_])" + localName + "\\(", "g");
    content = content.replace(callPattern, "callFirebaseFlow('" + flowNameString + "', ");
}

fs.writeFileSync(actionsFile, content);
console.log('actions.ts refactored successfully.');
