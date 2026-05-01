// @ts-ignore
import pdf from 'pdf-parse-fork';

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
    try {
        console.log('[PdfParser] Starting extraction with pdf-parse-fork...');
        
        // Use a promise with a timeout to prevent hanging
        const extractionPromise = pdf(buffer);
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('PDF extraction timed out after 30 seconds')), 30000)
        );

        const data = await Promise.race([extractionPromise, timeoutPromise]) as any;
        
        let text = data.text || '';
        
        // Safety: Truncate to ~800KB to avoid Firestore document limit (1MB)
        if (text.length > 800000) {
            console.warn(`[PdfParser] Text too long (${text.length} chars). Truncating to 800k.`);
            text = text.substring(0, 800000) + "\n\n[DOKUMENT TRUNKRET GRUNDET STØRRELSE]";
        }

        console.log(`[PdfParser] Extraction successful. Length: ${text.length} chars.`);
        return text.trim();
    } catch (error: any) {
        console.error('[PdfParser] Error extracting text:', error.message || error);
        throw new Error(`Kunne ikke udtrække tekst fra PDF: ${error.message || 'Ukendt fejl'}`);
    }
}
