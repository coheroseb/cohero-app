import axios from 'axios';

let accessToken: string | null = null;
let tokenExpiry: number = 0;

export async function getIcdToken() {
    const clientId = process.env.ICD_CLIENT_ID;
    const clientSecret = process.env.ICD_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error('ICD credentials missing in environment variables.');
    }

    const now = Date.now();
    if (accessToken && now < tokenExpiry) {
        return accessToken;
    }

    console.log("[ICD-API] Fetching new access token...");
    const tokenUrl = 'https://icdaccessmanagement.who.int/connect/token';
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await axios.post(tokenUrl, 'grant_type=client_credentials&scope=icdapi_access', {
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    accessToken = response.data.access_token;
    tokenExpiry = now + (response.data.expires_in - 60) * 1000; // Buffering 60 seconds

    return accessToken;
}

export async function searchIcdEntities(query: string) {
    try {
        const token = await getIcdToken();
        const url = 'https://id.who.int/icd/entity/search';
        
        console.log(`[ICD-API] Searching for: "${query}"`);
        // We search the foundation to get the most comprehensive results
        const response = await axios.get(url, {
            params: {
                q: query,
                useFoundationModel: true,
                includeKeywords: true
            },
            headers: {
                'Authorization': `Bearer ${token}`,
                'API-Version': 'v2',
                'Accept': 'application/json',
                'Accept-Language': 'en'
            }
        });

        return response.data;
    } catch (error: any) {
        console.error("[ICD-API] Search Error:", error.response?.data || error.message);
        throw error;
    }
}

export async function getIcdEntityDetails(entityId: string) {
    const token = await getIcdToken();
    
    // Extract ID from full URL if provided
    let idValue = entityId;
    if (entityId.startsWith('http')) {
        const parts = entityId.split('/');
        idValue = parts[parts.length - 1];
    }

    // Use MMS linearization for richer metadata (including child titles)
    const url = `https://id.who.int/icd/release/11/2024-01/mms/${idValue}`;
    
    console.log(`[ICD-API] Fetching MMS details for: ${url}`);
    const response = await axios.get(url, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'API-Version': 'v2',
            'Accept': 'application/json',
            'Accept-Language': 'en'
        }
    });

    return response.data;
}
