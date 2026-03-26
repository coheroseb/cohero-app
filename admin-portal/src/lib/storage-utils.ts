import { adminStorage } from '@/firebase/server-init';

/**
 * Uploader en base64-streng (data URI) til Firebase Storage og returnerer en offentlig URL.
 */
export async function uploadMediaToStorage(dataUri: string, path: string): Promise<string> {
    const bucket = adminStorage.bucket("studio-7870211338-fe921.firebasestorage.app");
    const file = bucket.file(path);


    // Udtræk bølge-formet base64 og mime-type fra data URI
    const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
        throw new Error("Ugyldigt data URI format.");
    }

    const contentType = match[1];
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');

    await file.save(buffer, {
        metadata: { contentType },
        public: true, // Gør filen offentlig tilgængelig så den kan afspilles direkte
    });

    // Firebase Storage offentlig URL format
    return `https://storage.googleapis.com/${bucket.name}/${file.name}`;
}
