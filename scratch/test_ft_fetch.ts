import { fetchSagDokumenter, fetchFolketingetPdfAction } from '../src/app/actions';

async function testFetch() {
    const sagId = 103502;
    console.log(`Testing fetch for Sag ID: ${sagId}...`);
    
    try {
        const docs = await fetchSagDokumenter(sagId);
        console.log(`Found ${docs.length} documents.`);
        
        const pdfDocs = docs.filter(d => d.Dokument?.Fil?.some(f => f.format === 'PDF' || f.filurl.toLowerCase().endsWith('.pdf')));
        console.log(`Found ${pdfDocs.length} PDF documents.`);
        
        if (pdfDocs.length > 0) {
            const firstPdf = pdfDocs[0].Dokument.Fil.find(f => f.format === 'PDF' || f.filurl.toLowerCase().endsWith('.pdf'));
            console.log(`Attempting to fetch PDF: ${firstPdf.filurl}`);
            
            const result = await fetchFolketingetPdfAction(firstPdf.filurl);
            console.log(`Fetch successful! Base64 length: ${result.base64.length}`);
        } else {
            console.log("No PDFs found for this case.");
        }
    } catch (e) {
        console.error("Test failed:", e);
    }
}

testFetch();
