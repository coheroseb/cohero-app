const fs = require('fs');
const path = require('path');

const flowsDir = path.join(__dirname, 'src/ai/flows');
const exportFile = path.join(__dirname, 'src/ai/flows-export.ts');

const files = fs.readdirSync(flowsDir);
let imports = [];
let exportsMap = [];

function processFile(filePath, importPath) {
    const basename = path.basename(filePath, '.ts');
    if (basename === 'types' || basename === 'book-cache' || basename === 'flows-export') return;
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Find all exports
    // 1. export async function xxx
    let matches = [...content.matchAll(/export\s+async\s+function\s+([a-zA-Z0-9_]+)/g)];
    for (const match of matches) {
        let name = match[1];
        imports.push(`import { ${name} } from '${importPath}';`);
        exportsMap.push(`  "${name}Flow": ${name},`);
        exportsMap.push(`  "${name}": ${name},`); // just in case
    }
    
    // 2. export const xxx = 
    // Wait, let's just make sure it's a function or flow, not a type or schema.
    matches = [...content.matchAll(/export\s+const\s+([a-zA-Z0-9_]+)\s*=/g)];
    for (const match of matches) {
        let name = match[1];
        // avoid schemas
        if (name.includes('Schema') || name.toUpperCase() === name) continue;
        imports.push(`import { ${name} } from '${importPath}';`);
        exportsMap.push(`  "${name}Flow": ${name},`);
        exportsMap.push(`  "${name}": ${name},`);
    }
}

for (const file of files) {
    const fullPath = path.join(flowsDir, file);
    if (fs.statSync(fullPath).isDirectory()) {
         const subFiles = fs.readdirSync(fullPath);
         for(const subFile of subFiles) {
            if (subFile.endsWith('.ts')) {
                const subBasename = path.basename(subFile, '.ts');
                processFile(path.join(fullPath, subFile), `./flows/${file}/${subBasename}`);
            }
         }
    } else if (file.endsWith('.ts')) {
        const basename = path.basename(file, '.ts');
        processFile(fullPath, `./flows/${basename}`);
    }
}

const content = `// @ts-nocheck
${imports.join('\n')}

export const allFlows: Record<string, any> = {
${exportsMap.join('\n')}
};
`;

fs.writeFileSync(exportFile, content);
console.log('flows-export.ts generated.');
