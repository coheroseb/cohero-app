import { onRequest } from "firebase-functions/v2/https";
import axios from "axios";

const BASE_URL = "https://retsinformation-api.dk/v1/lovgivning";

const cache = new Map<string, { data: any, timestamp: number, contentType: string }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export const retsinformationProxy = onRequest({ 
  timeoutSeconds: 60, 
  memory: "512MiB",
  cors: true 
}, async (req, res) => {
  const q = req.query.q as string || "";
  const filterStr = req.query.filter as string || "";
  const idMatch = filterStr.match(/Id eq '(.*)'/)?.[1] || (q.match(/^\d+$/) ? q : null);
  const path = req.query.path as string;
  const query = q;

  try {
    let url = "";
    let response: any = null;

    if (path && (path.startsWith("Documents(") || path.startsWith("Documents?"))) {
      url = `https://api.retsinformation.dk/v1/${path}`;
    } else if (path === "documents") {
      // url will be constructed in the retry loop for documentsearch
    } else if (path && (path.includes("/timeline") || path.startsWith("eli/") || path.includes("document/xml") || path.includes("documentLinks"))) {
      const baseUrl = (path.startsWith("eli/") && !path.includes("document/xml") && !path.includes("documentLinks")) 
        ? "https://www.retsinformation.dk" 
        : "https://www.retsinformation.dk/api";
      url = `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
    } else {
      url = `https://api.retsinformation.dk/v1/${path}`;
    }

    // Check cache
    const cached = cache.get(url || `search:${filterStr}`);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log(`[RetsinformationProxy] Cache hit: ${url}`);
      res.set('Content-Type', cached.contentType);
      res.status(200).send(cached.data);
      return;
    }

    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        const isXml = path && (path.startsWith("eli/") || path.includes("xml"));
        const headers: any = {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'da,en-US;q=0.9,en;q=0.8',
          'Accept': isXml ? 'application/xml' : 'application/json, text/plain, */*',
          'Referer': 'https://www.retsinformation.dk/documents',
          'Origin': 'https://www.retsinformation.dk'
        };

        if (path === "documents") {
          const customDt = req.query.dt;
          const dtList = customDt 
            ? (Array.isArray(customDt) ? customDt : [customDt])
            : [10, 1480, 20, 30, 40, 50, 90, 120, 270, 60, 100, 80, 110, 130, 140, 150, 160, 170, 180, 200, 210, 220, 1510, 1490, -10];
          const tValue = query;

          if (idMatch) {
            // If searching by ID, use q= (search by ID/number)
            response = await axios.get(`https://www.retsinformation.dk/api/documentsearch`, { 
              headers,
              params: { q: idMatch },
              timeout: 15000 
            });
          } else {
            // If general search, use t= (terms) and dt= (document types)
            const searchParams: any = { 
              dt: dtList,
              o: req.query.o || '80',
              ps: req.query.ps || 20
            };
            
            // Only add 't' if it's not empty
            if (tValue) {
              searchParams.t = tValue;
            }

            response = await axios.get("https://www.retsinformation.dk/api/documentsearch", { 
              headers,
              params: searchParams,
              paramsSerializer: { indexes: null },
              timeout: 15000
            });
          }
        } else {
          response = await axios.get(url, { headers, timeout: 15000 });
        }
        
        if (response) {
          console.log(`[RetsinformationProxy] Success: ${url || 'search'} (Status: ${response.status})`);
          break; // Success
        }
      } catch (err: any) {
        if (err.response?.status === 429) {
          retries++;
          const waitTime = Math.pow(2, retries) * 1000;
          console.warn(`[RetsinformationProxy] 429 Rate Limit. Retrying in ${waitTime}ms... (${retries}/${maxRetries})`);
          await new Promise(r => setTimeout(r, waitTime));
        } else if (err.response?.status === 404 && idMatch) {
          console.log(`[RetsinformationProxy] 404 on OData, trying fallback to search API`);
          const fallbackUrl = `${BASE_URL}/?search=${idMatch}`;
          response = await axios.get(fallbackUrl, {
            headers: { 'Accept': 'application/json', 'User-Agent': 'CoheroLovPortal/1.0' }
          });
          if (response) break;
        } else {
          throw err;
        }
      }
    }

    if (!response) throw new Error("Failed to get response after retries");

    // Map the API response to a consistent format for the frontend
    if (path === "documents") {
      let data = [];
      if (response.data.documents) {
        // documentsearch API structure
        data = response.data.documents;
      } else if (response.data.items) {
        // Alternative search API structure
        data = response.data.items;
      } else if (response.data.value) {
        // OData API structure
        data = response.data.value;
      } else if (response.data.data) {
        // Search API structure
        data = response.data.data;
      } else if (response.data.id || response.data.Id) {
        // Single object structure
        data = [response.data];
      }
      
      const formatDate = (dateStr: string) => {
        if (!dateStr) return "";
        // If already ISO-like (YYYY-MM-DD), return as is
        if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr;
        
        // Handle DD/MM/YYYY or DD-MM-YYYY
        const dmy = dateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
        if (dmy) {
          return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
        }
        return dateStr;
      };

      let results = data.map((doc: any) => {
        const retsinfoLink = doc.retsinfoLink || doc.EliUri || "";
        const eliPath = retsinfoLink.startsWith("/") ? retsinfoLink.substring(1) : retsinfoLink;
        const rawDate = doc.offentliggoerelsesDato || doc.signatureDate || doc.PublishDate || doc.offentliggørelsesdato || "";
        
        return {
          Id: doc.id || doc.Id || eliPath || "",
          Title: doc.title || doc.Title || doc.shortName || "",
          DocumentNumber: doc.shortName || doc.documentNumber || doc.DocumentNumber || "",
          PublishDate: formatDate(rawDate),
          DocumentType: doc.documentType || doc.DocumentType || "",
          Year: doc.year || doc.Year || "",
          Number: doc.number || doc.Number || "",
          EliUri: retsinfoLink,
          DocumentId: doc.id || doc.documentId || doc.DocumentId,
          IsHistory: doc.isHistoryFlag || doc.IsHistory || false
        };
      });

      if (!idMatch) {
        // RELEVANCE SORTING LOGIC:
        const lowerQuery = query.toLowerCase().trim();
        
        results.sort((a: any, b: any) => {
          const aTitle = a.Title.toLowerCase();
          const bTitle = b.Title.toLowerCase();
          
          const cleanTitle = (t: string) => t.replace(/^(bekendtgørelse af|lov om|bekendtgørelse om|lovbekendtgørelse af|lovbekendtgørelse om)\s+/i, '').toLowerCase();
          const aClean = cleanTitle(a.Title);
          const bClean = cleanTitle(b.Title);

          const aExactClean = aClean === lowerQuery;
          const bExactClean = bClean === lowerQuery;
          if (aExactClean && !bExactClean) return -1;
          if (!aExactClean && bExactClean) return 1;

          const aExactFull = aTitle === lowerQuery;
          const bExactFull = bTitle === lowerQuery;
          if (aExactFull && !bExactFull) return -1;
          if (!aExactFull && bExactFull) return 1;

          const aStartsClean = aClean.startsWith(lowerQuery);
          const bStartsClean = bClean.startsWith(lowerQuery);
          if (aStartsClean && !bStartsClean) return -1;
          if (!aStartsClean && bStartsClean) return 1;

          const getPriority = (type: string) => {
            const t = type.toUpperCase();
            if (t === 'LOV' || t === 'LOVH') return 4;
            if (t === 'LBK' || t === 'LBKH') return 3;
            if (t === 'BEK') return 2;
            return 0;
          };
          
          const aPrio = getPriority(a.DocumentType);
          const bPrio = getPriority(b.DocumentType);
          
          if (aPrio !== bPrio) return bPrio - aPrio;
          
          return new Date(b.PublishDate).getTime() - new Date(a.PublishDate).getTime();
        });
      }

      // Limit back to top 20 for frontend
      res.status(200).send({ value: idMatch ? results : results.slice(0, 20) });
      return;
    } else {
      // Check if response is JSON or XML
      const contentType = response.headers['content-type'] || '';
      
      // Cache successful response
      cache.set(url, {
        data: response.data,
        timestamp: Date.now(),
        contentType: contentType
      });

      if (contentType.includes('application/json')) {
        res.status(200).send(response.data);
      } else if (contentType.includes('xml')) {
        res.set('Content-Type', 'text/xml');
        res.status(200).send(response.data);
      } else if (contentType.includes('text/html')) {
        res.status(200).send(response.data);
      } else {
        console.warn(`[RetsinformationProxy] Unexpected content type ${contentType} for path: ${path}`);
        res.status(200).send(response.data);
      }
      return;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`[RetsinformationProxy] Error fetching ${path}:`, error.message);
      if (error.response) {
        console.error(`[RetsinformationProxy] Response status: ${error.response.status}`);
        console.error(`[RetsinformationProxy] Response data:`, JSON.stringify(error.response.data).substring(0, 500));
      }
      res.status(error.response?.status || 500).send(error.response?.data || error.message);
    } else if (error instanceof Error) {
      console.error(`[RetsinformationProxy] Error:`, error.message);
      res.status(500).send(error.message);
    } else {
      res.status(500).send("An unknown error occurred");
    }
    return;
  }
});
