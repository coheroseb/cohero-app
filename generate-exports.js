const fs = require('fs');
const path = require('path');

const flowsDir = path.join(__dirname, 'functions/src/ai/flows');
const files = fs.readdirSync(flowsDir).filter(f => f.endsWith('.ts') && f !== 'types.ts' && f !== 'dev.ts' && f !== 'helpers.ts' && f !== 'book-cache.ts');

let imports = '';
let exportsMap = 'export const allFlows: Record<string, any> = {\n';

for (const file of files) {
    const content = fs.readFileSync(path.join(flowsDir, file), 'utf-8');
    // find matching export const flowName = ai.defineFlow( or export async function flowName(
    let match = content.match(/export const ([a-zA-Z0-9_]+)\s*=\s*(?:ai\.defineFlow|ai\.definePrompt)/);
    if (!match) {
        match = content.match(/export async function ([a-zA-Z0-9_]+)\s*\(/);
    }
    if (match) {
        const flowName = match[1];
        const baseName = file.replace('.ts', '');
        imports += `import { ${flowName} } from './flows/${baseName}';\n`;
        exportsMap += `  '${flowName}Flow': ${flowName},\n`;
        exportsMap += `  '${flowName}': ${flowName},\n`;
    }
}

// Special case for sokratisk-refleksion/flow.ts
const devPath = path.join(flowsDir, 'sokratisk-refleksion/flow.ts');
if (fs.existsSync(devPath)) {
    const sokratiskContent = fs.readFileSync(devPath, 'utf-8');
    let sokMatch = sokratiskContent.match(/export async function ([a-zA-Z0-9_]+)\s*\(/);
    if(sokMatch) {
        imports += `import { ${sokMatch[1]} } from './flows/sokratisk-refleksion/flow';\n`;
        exportsMap += `  '${sokMatch[1]}Flow': ${sokMatch[1]},\n`;
        exportsMap += `  '${sokMatch[1]}': ${sokMatch[1]},\n`;
    }
}

exportsMap += '};\n';

fs.writeFileSync(path.join(__dirname, 'functions/src/ai/flows-export.ts'), imports + '\n' + exportsMap);
console.log('Done!');
