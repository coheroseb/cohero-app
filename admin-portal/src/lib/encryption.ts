/**
 * Simple encryption utility using the Web Crypto API (SubtleCrypto).
 * Note: For a production app, the ENCRYPTION_KEY should be managed securely,
 * ideally using a Key Management Service (KMS) or similar.
 */

// A fixed key for demonstration in the prototype. 
// In production, this should come from a secure environment variable.
const ENCRYPTION_KEY_RAW = "cohero-secure-payout-secret-2024";

/**
 * Encrypts a string using AES-GCM.
 */
export async function encryptData(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    // Generate a secure key from the raw string
    const cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(ENCRYPTION_KEY_RAW.padEnd(32, '0').slice(0, 32)),
        { name: "AES-GCM" },
        false,
        ["encrypt"]
    );

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        data
    );

    // Combine IV and Encrypted data for storage
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Convert to Base64 for Firestore storage
    return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts a string using AES-GCM.
 */
export async function decryptData(cipherText: string): Promise<string> {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const combined = new Uint8Array(
        atob(cipherText).split("").map(c => c.charCodeAt(0))
    );
    
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(ENCRYPTION_KEY_RAW.padEnd(32, '0').slice(0, 32)),
        { name: "AES-GCM" },
        false,
        ["decrypt"]
    );

    const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        data
    );

    return decoder.decode(decrypted);
}
