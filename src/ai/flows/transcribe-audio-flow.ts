

/**
 * @fileOverview An AI flow to transcribe audio. This flow is currently disabled
 * due to server-side configuration issues and will be replaced.
 * - transcribeAudio - Transcribes audio to text.
 */
import { z } from 'zod';
import { TranscribeAudioInputSchema, TranscribeAudioOutputSchema, type TranscribeAudioInput, type TranscribeAudioOutput } from './types';


export async function transcribeAudio(input: TranscribeAudioInput): Promise<TranscribeAudioOutput> {
    // This function is temporarily disabled.
    console.error("Transcription service is currently disabled due to server configuration issues.");
    throw new Error("Transcription service is currently disabled.");
}

// The original flow is kept here but commented out for reference.
/*
import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';

const transcribeAudioFlow = ai.defineFlow(
  {
    name: 'transcribeAudioFlow',
    inputSchema: TranscribeAudioInputSchema,
    outputSchema: TranscribeAudioOutputSchema,
  },
  async ({ audio }) => {
    // This part is problematic and has been disabled.
    const { text, usage } = await ai.generate({
        model: googleAI.model('gemini-1.5-pro-latest'),
        prompt: [{ media: { url: audio, contentType: 'audio/webm' }}, { text: 'Transskriber lyden til tekst. Ret eventuelle grammatiske fejl, men bevar den originale ordlyd så meget som muligt. Svar kun med den transskriberede tekst.'}],
    });
    
    return {
        data: { text },
        usage: {
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens
        }
    }
  }
);
*/
