import { extractTextFromPdf } from './src/lib/pdf-parser';
import fs from 'fs';

async function test() {
    try {
        console.log('Testing PDF extraction...');
        const buffer = fs.readFileSync(process.argv[2]);
        console.log('File read into buffer. Starting extraction...');
        const text = await extractTextFromPdf(buffer);
        console.log('Extraction complete!');
        console.log('Text length:', text.length);
        console.log('First 100 chars:', text.substring(0, 100));
    } catch (e) {
        console.error('Test failed:', e);
    }
}

test();
