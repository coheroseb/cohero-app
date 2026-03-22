// @ts-nocheck


/**
 * @fileOverview A robust flow to fetch publications from the VIVE API.
 * - Supports search, pagination, and validates output.
 * - Extracts pre-formatted APA citations from the 'details.apa' field.
 * - Uses the specific search URL requested by the user.
 */

import { 
    FetchVivePublicationsInputSchema, 
    FetchVivePublicationsOutputSchema, 
    type FetchVivePublicationsInput, 
    type FetchVivePublicationsOutput, 
    type VivePublication 
} from './types';

/**
 * Fetch VIVE publications with optional search and pagination.
 * @param input - Contains optional searchTerm, limit, and offset
 * @returns {Promise<FetchVivePublicationsOutput>} - Validated publications
 */
export async function fetchVivePublications(input: FetchVivePublicationsInput): Promise<FetchVivePublicationsOutput> {
    // Validate input schema
    const parsedInput = FetchVivePublicationsInputSchema.parse(input);

    const { searchTerm, limit = 24, offset = 0, areaId } = parsedInput;
    
    // Construct API URL using the requested structure: https://www.vive.dk/api/publications?text=(QUERY)&limit=24&offset=0
    // If no searchTerm is provided, we default to empty text to allow area filtering
    const queryText = searchTerm ? encodeURIComponent(searchTerm) : '';
    let VIVE_API_URL = `https://www.vive.dk/api/publications?text=${queryText}&limit=${limit}&offset=${offset}`;

    if (areaId) {
        VIVE_API_URL += `&areas=${areaId}`;
    }

    try {
        const response = await fetch(VIVE_API_URL, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`VIVE API error (${response.status}):`, errorText);
            throw new Error(`Kald til VIVEs API fejlede: ${response.statusText}`);
        }

        const data = await response.json();

        // Map publications with safe fallbacks and extract the APA citation from the API response
        const publications: VivePublication[] = (data.data || []).map((pub: any) => {
            const title = pub.name ?? 'Uden titel';
            const url = pub.url ? `https://www.vive.dk${pub.url}` : '';
            const year = pub.date8601 ? new Date(pub.date8601).getFullYear() : 'u.å.';
            
            // Use the pre-formatted APA string from the API if it exists, otherwise fall back to a generated one
            const apaCitation = pub.details?.apa ?? `VIVE. (${year}). <em>${title}</em>. Hentet fra ${url}`;
            
            return {
                id: pub.id?.toString() ?? 'unknown',
                title: title,
                description: pub.teaser ?? '',
                url: url,
                publicationDate: pub.date8601 ?? '',
                apa: apaCitation
            };
        });

        // Validate output schema
        return FetchVivePublicationsOutputSchema.parse({ publications });
    } catch (error) {
        console.error("Error fetching VIVE publications:", error);
        // Return empty list on error to avoid client crash
        return { publications: [] };
    }
}
