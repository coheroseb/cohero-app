
const fs = require('fs');
const content = fs.readFileSync('/Users/sebastianviste/Cohero-Version-4/src/components/lov-portal/LovPortalViewer.tsx', 'utf8');

let braceCount = 0;
let parenCount = 0;
let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    for (let char of line) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        if (char === '(') parenCount++;
        if (char === ')') parenCount--;
    }
    if (braceCount < 0 || parenCount < 0) {
        console.log(`Imbalance at line ${i + 1}: brace=${braceCount}, paren=${parenCount}`);
        // break; // Keep going to see if it recovers
    }
}

console.log(`Final: brace=${braceCount}, paren=${parenCount}`);
