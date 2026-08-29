/**
 * Cohéro AI Service
 * 
 * Kobler op til Cohéro's dedikerede AI server (https://ai.cohero.dk)
 * på samme måde som i Cohéro Pro (DanskGPT / Ollama arkitektur).
 */

export const DEFAULT_AI_SERVER_URL = 'https://ai.cohero.dk';
export const DEFAULT_AI_MODEL = 'danskgpt';

/**
 * Normalizes and upgrades server URLs to HTTPS if running on a secure domain.
 */
export const normalizeServerEndpointUrl = (serverUrl?: string): string => {
  if (!serverUrl || !serverUrl.trim()) return DEFAULT_AI_SERVER_URL;
  let clean = serverUrl.trim().replace(/\/+$/, '');
  
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    if (clean.includes('2.28.46.6') || clean.includes('ai.cohero.dk')) {
      clean = DEFAULT_AI_SERVER_URL;
    } else if (clean.startsWith('http://') && !clean.includes('localhost') && !clean.includes('127.0.0.1')) {
      clean = clean.replace(/^http:\/\//i, 'https://');
    }
  }
  return clean;
};

/**
 * Tests connection to the self-hosted Cohéro AI / DanskGPT server.
 */
export const testCoheroAiConnection = async (
  serverUrl: string = DEFAULT_AI_SERVER_URL
): Promise<{ success: boolean; message: string; models?: string[] }> => {
  const cleanUrl = normalizeServerEndpointUrl(serverUrl);
  if (!cleanUrl) {
    return { success: false, message: 'Ingen server-URL angivet' };
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${cleanUrl}/api/tags`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const modelNames = (data.models || []).map((m: any) => m.name || m.model);
      return { 
        success: true, 
        message: `Forbundet til ai.cohero.dk! Fandt ${modelNames.length} model(ler) på serveren.`,
        models: modelNames 
      };
    }
    return { success: false, message: `Server svarede med status ${res.status}` };
  } catch (err: any) {
    return { success: false, message: `Kunne ikke forbinde til AI-serveren (${err?.message || 'timeout/netværksfejl'})` };
  }
};

/**
 * Queries the Cohéro AI server (/api/generate).
 * Matches the Cohero Pro queryDanskGptServer implementation.
 */
export const queryCoheroAiServer = async (
  params: {
    prompt: string;
    systemPrompt?: string;
    serverUrl?: string;
    modelName?: string;
    temperature?: number;
    timeoutMs?: number;
  }
): Promise<string | null> => {
  const {
    prompt,
    systemPrompt,
    serverUrl = DEFAULT_AI_SERVER_URL,
    modelName = DEFAULT_AI_MODEL,
    temperature = 0.1,
    timeoutMs = 120000
  } = params;

  const cleanUrl = normalizeServerEndpointUrl(serverUrl);
  if (!cleanUrl) return null;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    let res: Response;
    try {
      res = await fetch(`${cleanUrl}/api/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelName,
          system: systemPrompt,
          prompt: prompt,
          options: {
            num_ctx: 8192,
            num_predict: 4096,
            temperature: temperature,
            top_p: 0.85
          },
          stream: false
        }),
        signal: controller.signal
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('Analysen tog for lang tid hos AI-serveren.');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }

    if (res.ok) {
      const data = await res.json();
      return data.response || data.message?.content || null;
    } else {
      const errBody = await res.text().catch(() => '');
      console.warn(`[Cohéro AI] Server status ${res.status}:`, errBody);
      return null;
    }
  } catch (err: any) {
    console.warn('[Cohéro AI] Server query error:', err?.message || err);
    return null;
  }
};

/**
 * Queries the Cohéro AI chat endpoint (/api/chat).
 */
export const queryCoheroAiChat = async (
  params: {
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    serverUrl?: string;
    modelName?: string;
    temperature?: number;
    timeoutMs?: number;
  }
): Promise<string | null> => {
  const {
    messages,
    serverUrl = DEFAULT_AI_SERVER_URL,
    modelName = DEFAULT_AI_MODEL,
    temperature = 0.2,
    timeoutMs = 120000
  } = params;

  const cleanUrl = normalizeServerEndpointUrl(serverUrl);
  if (!cleanUrl) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(`${cleanUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        messages: messages,
        options: {
          num_ctx: 8192,
          num_predict: 4096,
          temperature: temperature,
          top_p: 0.85
        },
        stream: false
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return data.message?.content || data.response || null;
    }
    return null;
  } catch (err: any) {
    console.warn('[Cohéro AI Chat] Error:', err?.message || err);
    return null;
  }
};
