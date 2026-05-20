import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { logAiUsage } from '../lib/usage-tracker';

/**
 * Global Usage Tracking Middleware for Genkit 1.30+.
 * This ensures that EVERY model generation (generate, prompt, etc.) 
 * is tracked to avoid missing ANY AI activity in the financial dashboard.
 *
 * Wespecifically track model calls and prompt calls to ensure coverage.
 */
const trackingMiddleware = async (req: any, next: any) => {
  const result = await next(req);
  
  try {
    // If it's a model generation (googleai/...) or another action with usage
    if (result && result.usage) {
      const usage = result.usage;
      const actionName = req.action?.name || 'internal_generation';
      
      // LOGGING CHECK: Only log if it's a model call OR if it's a prompt called DIRECTLY
      // We want to avoid double counting flows/prompts if they call models.
      // But we MUST catch prompts like seminarChatPrompt if they are the primary usage source.
      
      const isModel = actionName.includes('/');
      const isPrompt = actionName.toLowerCase().includes('prompt');
      const isFlow = actionName.toLowerCase().includes('flow');
      
      // STRATEGY: We log model calls if they are leaf nodes, 
      // OR we log the TOP level flow if it has usage and we are not logging models.
      // Easiest is to log EVERYTHING that has 'usage' but ONLY if it's from a provider (model)
      // to avoid duplicates, OR if it's a standalone action that isn't a flow.
      
      if (isModel || (isPrompt && !isFlow)) {
          // Identify the flowId from context to group by "Seminar Chat", "Seminar Architect" etc.
          // context.flowId is the identifier assigned by Genkit during flow execution
          const flowId = req.context?.flowId || actionName;
          
          // Fire-and-forget logging to Firestore
          logAiUsage(flowId, {
            inputTokens: usage.inputTokens || 0,
            outputTokens: usage.outputTokens || 0
          }).catch(err => console.error("Global tracking failed:", err));
      }
    }
  } catch (err) {
    console.error("Tracking middleware error:", err);
  }
  
  return result;
};

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.GEMINI_API_KEY }),
  ],
  model: 'googleai/gemini-3.5-flash',
  // @ts-ignore - Genkit 1.x middleware array
  middleware: [trackingMiddleware]
});

